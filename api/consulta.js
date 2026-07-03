const cheerio = require('cheerio');

const TARGET_URL = 'https://eldni.com/pe/buscar-datos-por-dni';

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metodo no permitido' });
    }

    const { dni } = req.body || {};

    if (!dni || !/^\d{8}$/.test(dni)) {
        return res.status(400).json({ error: 'DNI invalido' });
    }

    try {
        const pageResponse = await fetch(TARGET_URL, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html',
            }
        });

        if (!pageResponse.ok) {
            return res.status(502).json({ error: 'No se pudo conectar con el servicio' });
        }

        const pageHtml = await pageResponse.text();

        let cookies = '';
        try {
            if (pageResponse.headers.getSetCookie) {
                cookies = pageResponse.headers.getSetCookie().map(function(c) { return c.split(';')[0]; }).join('; ');
            } else {
                const raw = pageResponse.headers.get('set-cookie') || '';
                cookies = raw.split(',').map(function(c) { return c.split(';')[0].trim(); }).filter(Boolean).join('; ');
            }
        } catch(e) {
            cookies = '';
        }

        const $page = cheerio.load(pageHtml);
        const token = $page('input[name="_token"]').val();

        if (!token) {
            return res.status(502).json({ error: 'No se pudo obtener el token' });
        }

        const formBody = new URLSearchParams();
        formBody.append('dni', dni);
        formBody.append('_token', token);

        const searchResponse = await fetch(TARGET_URL, {
            method: 'POST',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': cookies,
                'Referer': TARGET_URL,
                'Origin': 'https://eldni.com'
            },
            body: formBody.toString()
        });

        if (!searchResponse.ok) {
            return res.status(502).json({ error: 'Error en el servidor de consulta' });
        }

        const resultHtml = await searchResponse.text();
        const $result = cheerio.load(resultHtml);
        const nombre = $result('samp.inline-block').first().text().trim();

        if (!nombre) {
            return res.status(404).json({ error: 'No se encontraron datos para este DNI' });
        }

        return res.status(200).json({ dni: dni, nombre: nombre });

    } catch (err) {
        console.error('Error:', err.message);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};
