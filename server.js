import express from 'express';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000; // Use Render's port or 3000 locally

// --- IMPORTANT: API Key is read from environment variables ---
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Middleware to parse JSON request bodies
app.use(express.json());

// Serve static files (HTML, CSS, JS) from the current directory
app.use(express.static(path.join(__dirname)));

// API endpoint for translation
app.post('/api/translate', async (req, res) => {
    const { jargon, style } = req.body;

    if (!jargon || !style) {
        return res.status(400).json({ error: 'Missing jargon or style in request body.' });
    }

    if (!OPENAI_API_KEY) {
        console.error('OpenAI API key is not set in environment variables.');
        return res.status(500).json({ error: 'Server configuration error: API key missing.' });
    }

    const prompt = `Translate the following consultancy jargon into the style of "${style}". Jargon: "${jargon}"`;

    try {
        const response = await axios.post(OPENAI_API_URL, {
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful assistant that translates consultancy jargon into various styles." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 150
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            }
        });

        if (response.data && response.data.choices && response.data.choices.length > 0 && response.data.choices[0].message) {
            res.json({ translation: response.data.choices[0].message.content.trim() });
        } else {
            console.error('Invalid response format from OpenAI API:', response.data);
            res.status(500).json({ error: 'Invalid response format from translation API.' });
        }

    } catch (error) {
        console.error('Error calling OpenAI API:', error.response ? error.response.data : error.message);
        const statusCode = error.response ? error.response.status : 500;
        const errorMessage = error.response?.data?.error?.message || 'Failed to fetch translation from API.';
        res.status(statusCode).json({ error: `API Error: ${errorMessage}` });
    }
});

// Fallback to serve index.html for any other GET request (useful for single-page apps)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
