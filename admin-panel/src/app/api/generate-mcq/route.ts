import { NextResponse } from 'next/server';

// CORS headers for mobile app access
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}
const DIFFICULTY_PROMPTS = {
    beginner: `Difficulty: Beginner (Basic factual knowledge, direct information)`,
    pro: `Difficulty: Moderate (UPSC Prelims level, conceptual understanding)`,
    advanced: `Difficulty: Advanced (High analytical ability, multi-statement questions, nuanced)`
};

const PAPER_TOPICS: Record<string, string> = {
    GS1: 'History, Geography, Art & Culture, Indian Society',
    GS2: 'Polity, Governance, Constitution, International Relations, Social Justice',
    GS3: 'Economy, Environment, Science & Technology, Disaster Management, Security',
    GS4: 'Ethics, Integrity, Aptitude, Case Studies',
    Optional: 'General Knowledge across all subjects'
};

export async function POST(req: Request) {
    try {
        const { examType, paperType, difficulty, language, numQuestions, preferences } = await req.json();

        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'OpenRouter API Key not configured' }, { status: 500, headers: corsHeaders });
        }

        const model = 'google/gemini-3-flash-preview';

        const topicText = `${PAPER_TOPICS[paperType] || paperType}. ${preferences ? `Focus on: ${preferences}` : ''}`;

        const prompt = `
You are an expert UPSC question setter.

Generate ${numQuestions} UPSC Prelims-style Multiple Choice Questions (MCQs).

Topic: ${topicText}
Result Language: ${language === 'hindi' ? 'Hindi (translation of everything)' : 'English'}
${DIFFICULTY_PROMPTS[difficulty as keyof typeof DIFFICULTY_PROMPTS] || 'Difficulty: Moderate'}

Rules:
•⁠  ⁠Questions must be strictly UPSC Prelims standard
•⁠  ⁠Each question must have exactly 4 options (A, B, C, D)
•⁠  ⁠Only ONE option must be correct
•⁠  ⁠Avoid factual ambiguity
•⁠  ⁠Provide a clear explanation for the correct answer

Output strictly in JSON format as below:

{
  "questions": [
    {
      "question": "Question text",
      "options": [
        { "text": "Option A", "isCorrect": false },
        { "text": "Option B", "isCorrect": true },
        { "text": "Option C", "isCorrect": false },
        { "text": "Option D", "isCorrect": false }
      ],
      "explanation": "Why option B is correct"
    }
  ]
}
`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://upsc-prep-app.com',
                'X-Title': 'UPSC AI MCQ Generator',
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' } // Ensure JSON
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('OpenRouter API Error:', response.status, errText);
            throw new Error(`OpenRouter API Error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        try {
            const parsedContent = JSON.parse(content);
            return NextResponse.json(parsedContent, { headers: corsHeaders });
        } catch (e) {
            console.error('Failed to parse AI response as JSON:', content);
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500, headers: corsHeaders });
        }

    } catch (error: any) {
        console.error('Error generating MCQs:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500, headers: corsHeaders });
    }
}
