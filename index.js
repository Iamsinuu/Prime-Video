import express from 'express';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3000;

const TARGET_SERVER = 'https://keho.api.amazonvideo.com';
const AUTH_TOKEN = 'Bearer Atna|EwMDICe05Erpz89ScaEAgOfHx5vHmZX3Z-DT8UXPG_aEIJLTvdO0L5qWprJYWwD084dFs3NqnbqDC_N9ICyTFIQvyFRVl0SjI9JudvvnK-o9r8nu5QmEPyt0oNbFA_jOVI1b7iNKGNXjeNB5zXbZ3D-3w9rY80A4q5SJIc__Q3BHzly7j6o1ybW-X6FcXfTWJRqWjpi4OrvcEG1rBBqb40s1sy7qU4DtP2KaJSXWusKsJOs6_g';

app.use(express.raw({ type: '*/*', limit: '50mb' }));

app.all('*', async (req, res) => {
  try {
    const targetUrl = `${TARGET_SERVER}${req.originalUrl}`;
    const headers = { ...req.headers };

    headers['host'] = 'keho.api.amazonvideo.com';
    headers['authorization'] = AUTH_TOKEN;
    delete headers['content-length'];

    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers,
      data: req.body && req.body.length > 0 ? req.body : undefined,
      responseType: 'arraybuffer',
      validateStatus: () => true,
    });

    Object.keys(response.headers).forEach((key) => {
      const lower = key.toLowerCase();
      if (lower !== 'transfer-encoding' && lower !== 'content-encoding') {
        res.setHeader(key, response.headers[key]);
      }
    });

    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Proxy Error:', error.message);
    res.status(502).json({
      error: 'Bad Gateway',
      message: 'Target server se connect karne mein samasya aayi.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});