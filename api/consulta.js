const fetch = require('node-fetch');
const cheerio = require('cheerio');

const TARGET_URL = 'https://eldni.com/pe/buscar-datos-por-dni';

module.exports = async (req, res) => {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { dni } = req.body || {};

    // Validate DNI
    if (!dni || !/^\d{8}$/.test(dni)) {
        return res.status(400).json({ error: 'DNI inválido. Debe contener exactamente 8 dígitos numéricos.' });
    }

    try {
        // Step 1: GET the page to extract CSRF token and cookies
        const pageResponse = await fetch(TARGET_URL, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'es-PE,es;q=0.9',
            },
            timeout: 8000
        });

        if (!pageResponse.ok) {
            return res.status(502).json({ error: 'No se pudo conectar con el servicio. Intenta más tarde.' });
        }

        const pageHtml = await pageResponse.text();

        // Extract cookies from response
        const rawCookies = pageResponse.headers.raw()['set-cookie'] || [];
        const cookies = rawCookies.map(c => c.split(';')[0]).join('; ');

        // Parse CSRF token
        const $page = cheerio.load(pageHtml);
        const token = $page('input[name="_token"]').val();

        if (!token) {
            return res.status(502).json({ error: 'No se pudo obtener el token de seguridad. Intenta más tarde.' });
        }

        // Step 2: POST the form with DNI + token
        const formBody = new URLSearchParams();
        formBody.append('dni', dni);
        formBody.append('_token', token);

        const searchResponse = await fetch(TARGET_URL, {
            method: 'POST',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'es-PE,es;q=0.9',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': cookies,
                'Referer': TARGET_URL,
                'Origin': 'https://eldni.com'
            },
            body: formBody.toString(),
            timeout: 8000
        });

        if (!searchResponse.ok) {
            return res.status(502).json({ error: 'Error en el servidor de consulta. Intenta más tarde.' });
        }

        const resultHtml = await searchResponse.text();

        // Step 3: Parse the result HTML
        const $result = cheerio.load(resultHtml);

        // The name is inside <samp class="inline-block">
        const nombre = $result('samp.inline-block').first().text().trim();

        if (!nombre) {
            return res.status(404).json({ error: 'No se encontraron datos para este DNI.' });
        }

        return res.status(200).json({
            dni,
            nombre,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error('Error en consulta DNI:', err.message);

        if (err.type === 'request-timeout' || err.code === 'ECONNABORTED') {
            return res.status(504).json({ error: 'Tiempo de espera agotado. Intenta más tarde.' });
        }

        return res.status(500).json({ error: 'Error interno del servidor. Intenta más tarde.' });
    }
};
