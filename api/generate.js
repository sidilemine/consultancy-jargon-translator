import axios from 'axios';

// --- IMPORTANT: API Key is read from environment variables ---
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export default async function handler(req, res) {
    console.log("Generate Function Started");

    // Only allow POST requests
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    if (!OPENAI_API_KEY) {
        console.error('OpenAI API key is not set in environment variables.');
        return res.status(500).json({ error: 'Internal Server Error' });
    }

    const prompt = "Generate a short paragraph (2-3 sentences) of impressive-sounding but ultimately vague consultancy jargon.";

    try {
        const response = await axios.post(OPENAI_API_URL, {
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a generator of consultancy jargon." },
                { role: "user", content: prompt }
            ],
            temperature: 0.8, // Slightly higher creativity
            max_tokens: 100
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            }
        });

        if (response.data && response.data.choices && response.data.choices.length > 0 && response.data.choices[0].message) {
            res.status(200).json({ jargon: response.data.choices[0].message.content.trim() });
        } else {
            console.error('Invalid response format from OpenAI API:', response.data);
            res.status(500).json({ error: 'Invalid response format from generation API.' });
        }

    } catch (error) {
        console.error('Error calling OpenAI API for generation:', error.response ? error.response.data : error.message);
        const statusCode = error.response ? error.response.status : 500;
        const errorMessage = error.response?.data?.error?.message || 'Failed to generate jargon from API.';
        res.status(statusCode).json({ error: `API Error: ${errorMessage}` });
    }
}
