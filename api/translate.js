import axios from 'axios';

// --- IMPORTANT: API Key is read from environment variables ---
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export default async function handler(req, res) {
    console.log("API Function Started");

    // Vercel automatically parses the body for POST requests if Content-Type is application/json
    const { jargon, style, explainBullets } = req.body; // Get explainBullets flag

    // Only allow POST requests
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    if (!jargon || !style) {
        return res.status(400).json({ error: 'Missing jargon or style in request body.' });
    }

    if (!OPENAI_API_KEY) {
        console.error('OpenAI API key is not set in environment variables.');
        // Avoid exposing detailed server errors to the client
        return res.status(500).json({ error: 'Internal Server Error' });
    }

    // Construct the prompt based on the style and explainBullets flag
    let prompt;
    if (explainBullets && style === 'Key Bullet Points') {
        prompt = `Translate the following consultancy jargon into key bullet points. After the bullet points, add a section titled "Explanation:" where you explain what each bullet point means in simple, clear English.\n\nJargon: "${jargon}"`;
    } else {
        prompt = `Translate the following consultancy jargon into the style of "${style}". Jargon: "${jargon}"`;
    }
    console.log("Using prompt:", prompt); // Log the prompt being used

    try {
        const response = await axios.post(OPENAI_API_URL, {
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful assistant that translates consultancy jargon into various styles." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            // Increase max_tokens slightly for bullet points + explanation
            max_tokens: (explainBullets && style === 'Key Bullet Points') ? 250 : 150
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            }
        });

        if (response.data && response.data.choices && response.data.choices.length > 0 && response.data.choices[0].message) {
            // Send the successful translation back
            res.status(200).json({ translation: response.data.choices[0].message.content.trim() });
        } else {
            console.error('Invalid response format from OpenAI API:', response.data);
            res.status(500).json({ error: 'Invalid response format from translation API.' });
        }

    } catch (error) {
        console.error('Error calling OpenAI API:', error.response ? error.response.data : error.message);
        const statusCode = error.response ? error.response.status : 500;
        const errorMessage = error.response?.data?.error?.message || 'Failed to fetch translation from API.';
        // Send a generic error message or the specific API error if desired
        res.status(statusCode).json({ error: `API Error: ${errorMessage}` });
    }
}
