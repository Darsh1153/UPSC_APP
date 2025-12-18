import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '../_cors';

// Polyfill DOMMatrix for pdf-parse (backend only)
if (typeof global.DOMMatrix === 'undefined') {
    (global as any).DOMMatrix = class DOMMatrix { };
}

// @ts-ignore
const pdf = require('pdf-parse');

export const runtime = 'nodejs';

// Generate MCQs using AI
async function generateMCQsWithAI(text: string, count: number, apiKey: string) {
    const prompt = `You are an expert UPSC question setter.

Generate ${count} UPSC Prelims-style Multiple Choice Questions (MCQs) based on the provided content.

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
      "correctAnswer": "B",
      "explanation": "Why option B is correct"
    }
  ]
}

CONTENT:
${text.substring(0, 50000)}
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
            model: "google/gemini-2.0-flash-001",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: 'json_object' }
        })
    });

    if (!response.ok) {
        throw new Error(`AI API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '{}';
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { fileBase64, count = 10 } = body;

        if (!fileBase64) {
            return NextResponse.json({ error: 'No file data provided' }, { status: 400, headers: corsHeaders });
        }

        // Convert Base64 to Buffer
        const buffer = Buffer.from(fileBase64, 'base64');

        // Extract Text
        let text = '';
        try {
            const data = await pdf(buffer);
            text = data.text;
        } catch (e) {
            console.error('PDF Parse Error:', e);
            return NextResponse.json({ error: 'Failed to extract text from PDF' }, { status: 500, headers: corsHeaders });
        }

        if (!text || text.trim().length < 50) {
            return NextResponse.json({ error: 'Insufficient text found in PDF' }, { status: 422, headers: corsHeaders });
        }

        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
        if (!OPENROUTER_API_KEY) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
        }

        const jsonContent = await generateMCQsWithAI(text, count, OPENROUTER_API_KEY);
        let parsedData;

        try {
            parsedData = JSON.parse(jsonContent);
        } catch (e) {
            console.error('JSON Parse Error:', e);
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500, headers: corsHeaders });
        }

        // Transform to expected client format (MCQ[])
        const mcqs = (parsedData.questions || []).map((q: any, i: number) => {
            // Find correct answer letter
            const correctOpt = q.options.find((o: any) => o.isCorrect);
            let correctLetter = q.correctAnswer || (correctOpt ?
                (q.options.indexOf(correctOpt) === 0 ? 'A' :
                    q.options.indexOf(correctOpt) === 1 ? 'B' :
                        q.options.indexOf(correctOpt) === 2 ? 'C' : 'D') : 'A');

            return {
                id: i + 1,
                question: q.question,
                optionA: q.options[0]?.text || '',
                optionB: q.options[1]?.text || '',
                optionC: q.options[2]?.text || '',
                optionD: q.options[3]?.text || '',
                correctAnswer: correctLetter,
                explanation: q.explanation || ''
            };
        });

        return NextResponse.json({
            success: true,
            mcqs: mcqs,
            count: mcqs.length
        }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('PDF Generator API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}
