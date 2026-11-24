const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Target Server aur Aapka Bearer Token
const TARGET_SERVER = 'https://keho.api.amazonvideo.com';
const AUTH_TOKEN = 'Bearer Atna|EwMDICe05Erpz89ScaEAgOfHx5vHmZX3Z-DT8UXPG_aEIJLTvdO0L5qWprJYWwD084dFs3NqnbqDC_N9ICyTFIQvyFRVl0SjI9JudvvnK-o9r8nu5QmEPyt0oNbFA_jOVI1b7iNKGNXjeNB5zXbZ3D-3w9rY80A4q5SJIc__Q3BHzly7j6o1ybW-X6FcXfTWJRqWjpi4OrvcEG1rBBqb40s1sy7qU4DtP2KaJSXWusKsJOs6_g';

// Incoming request body ko raw format mein handle karne ke liye
app.use(express.raw({ type: '*/*', limit: '50mb' }));

// Sabhi routes aur HTTP methods (GET, POST, PUT, etc.) ko intercept karein
app.all('*', async (req, res) => {
    try {
        // Target ka poora URL banayein (path + query parameters ke saath)
        const targetUrl = `${TARGET_SERVER}${req.originalUrl}`;

        // Original request ke headers copy karein aur zaroori changes karein
        const headers = { ...req.headers };
        
        // Host header ko target server ke hisab se update karna zaroori hai
        headers['host'] = 'keho.api.amazonvideo.com';
        
        // Aapka Authorization token inject karein
        headers['authorization'] = AUTH_TOKEN;

        // Content-length ko delete karein taaki axios khud sahi length calculate kar sake
        delete headers['content-length'];

        // Original Server ko request forward karein
        const response = await axios({
            method: req.method,
            url: targetUrl,
            headers: headers,
            data: req.body && req.body.length > 0 ? req.body : undefined,
            responseType: 'arraybuffer', // Binary, JSON, ya video chunks sabko safely handle karne ke liye
            validateStatus: () => true   // 4xx ya 5xx errors par crash hone ki jagah original status code return karein
        });

        // Target server se mile response headers ko client ke liye set karein
        Object.keys(response.headers).forEach((key) => {
            // Transfer-encoding aur content-encoding ko skip karein taaki decompression issue na aaye
            if (key.toLowerCase() !== 'transfer-encoding' && key.toLowerCase() !== 'content-encoding') {
                res.setHeader(key, response.headers[key]);
            }
        });

        // Same status code aur data wapas App Client ko forward karein
        res.status(response.status).send(response.data);

    } catch (error) {
        console.error('Proxy Error:', error.message);
        res.status(502).json({
            error: 'Bad Gateway',
            message: 'Target server se connect karne mein samasya aayi.'
        });
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server chal raha hai: http://localhost:${PORT}`);
    console.log(`Forwarding requests to: ${TARGET_SERVER}`);
});