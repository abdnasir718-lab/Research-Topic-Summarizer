    const { GEMINI_API_KEY } = process.env;

module.exports = async function handler(req, res) {
    const origin = req.headers.origin;

    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { topic } = req.body;

    if (!topic || typeof topic !== 'string') {
        return res.status(400).json({ error: 'Topic is required' });
    }

    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    const prompt = `You are a research analyst for "Global Research Trends". Provide a concise summary and key trends for the research topic below.

Research Topic: ${topic}

Your response should be structured as follows:

SUMMARY:
[A 2-3 sentence overview of the research topic]

KEY TRENDS:
[3-5 bullet points highlighting the most important current trends, developments, or findings in this area]

Be specific, data-driven, and focus on recent developments (last 2-3 years). Use academic but accessible language.`;

    try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 800,
                }
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Gemini API error:', response.status, errorData);
            return res.status(response.status).json({
                error: 'Failed to generate summary. Please try again.'
            });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}