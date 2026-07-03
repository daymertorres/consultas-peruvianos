const cheerio = require('cheerio');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { dni } = req.body || {};

    if (!dni || !/^\d{8}$/.test(dni)) {
        return res.status(400).json({ error: 'DNI inválido. Debe contener exactamente 8 dígitos numéricos.' });
    }

    try {
        // Intento 1: API Pública rápida (sin bloqueo de servidores cloud como Vercel/AWS)
        try {
            const apiRes = await fetch(`https://api.apis.net.pe/v1/dni?numero=${dni}`, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            });

            if (apiRes.ok) {
                const data = await apiRes.json();
                if (data && (data.nombre || data.nombres)) {
                    const nombre = data.nombre || `${data.apellidoPaterno} ${data.apellidoMaterno} ${data.nombres}`.trim();
                    return res.status(200).json({ dni, nombre, timestamp: new Date().toISOString() });
                }
            }
        } catch (e) {
            console.warn('API primaria falló, intentando fallback...', e.message);
        }

        // Intento 2: Fallback scraping eldni.com
        const TARGET_URL = 'https://eldni.com/pe/buscar-datos-por-dni';
        const pageResponse = await fetch(TARGET_URL, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
        });

        if (!pageResponse.ok) {
            return res.status(502).json({ error: 'No se pudo conectar con los servidores de consulta.' });
        }

        const pageHtml = await pageResponse.text();
        let cookies = '';
        try {
            if (pageResponse.headers.getSetCookie) {
                cookies = pageResponse.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
            } else {
                const raw = pageResponse.headers.get('set-cookie') || '';
                cookies = raw.split(',').map(c => c.split(';')[0].trim()).filter(Boolean).join('; ');
            }
        } catch(e) { cookies = ''; }

        const $page = cheerio.load(pageHtml);
        const token = $page('input[name="_token"]').val();

        if (!token) {
            return res.status(502).json({ error: 'No se pudo obtener el token de seguridad.' });
        }

        const formBody = new URLSearchParams();
        formBody.append('dni', dni);
        formBody.append('_token', token);

        const searchResponse = await fetch(TARGET_URL, {
            method: 'POST',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': cookies,
                'Referer': TARGET_URL,
                'Origin': 'https://eldni.com'
            },
            body: formBody.toString()
        });

        if (!searchResponse.ok) {
            return res.status(502).json({ error: 'Error en el servidor de consulta de DNI.' });
        }

        const resultHtml = await searchResponse.text();
        const $result = cheerio.load(resultHtml);
        const nombre = $result('samp.inline-block').first().text().trim();

        if (!nombre) {
            return res.status(404).json({ error: 'No se encontraron datos para este DNI.' });
        }

        return res.status(200).json({ dni, nombre, timestamp: new Date().toISOString() });

    } catch (err) {
        console.error('Error en consulta DNI:', err.message);
        return res.status(500).json({ error: 'Error interno del servidor. Intenta más tarde.' });
    }
};
