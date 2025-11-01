import express from 'express';
import cors from 'cors';
import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3001;

// 启用CORS
app.use(cors());
app.use(express.json());

// 阿里云DashScope API代理
app.post('/api/dashscope', async (req, res) => {
  try {
    let { prompt, apiKey } = req.body;
    if (!apiKey) {
      apiKey = process.env.VITE_DASHSCOPE_API_KEY || '';
    }
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API Key is required' });
    }

    const postData = JSON.stringify({
      model: 'qwen-turbo',
      input: {
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      parameters: {
        result_format: 'message'
      }
    });

    const options = {
      hostname: 'dashscope.aliyuncs.com',
      port: 443,
      path: '/api/v1/services/aigc/text-generation/generation',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req2 = https.request(options, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        if (response.statusCode !== 200) {
          console.error('API request failed:', response.statusCode, data);
          return res.status(500).json({ error: `API request failed: ${response.statusCode}` });
        }
        
        try {
          const jsonData = JSON.parse(data);
          res.json(jsonData);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          res.status(500).json({ error: 'Invalid JSON response' });
        }
      });
    });

    req2.on('error', (error) => {
      console.error('Request error:', error);
      res.status(500).json({ error: error.message });
    });

    req2.write(postData);
    req2.end();
  } catch (error) {
    console.error('DashScope API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`代理服务器运行在 http://localhost:${PORT}`);
  console.log('支持端点: POST /api/dashscope');
});
