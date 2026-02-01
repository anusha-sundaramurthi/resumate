// Google Gemini AI Integration - FREE & High Quality
// Get your API key: https://makersuite.google.com/app/apikey

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

async function callGemini(prompt: string, options: {
  temperature?: number;
  maxTokens?: number;
} = {}): Promise<string> {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.maxTokens || 8192,
          topP: 0.95,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_NONE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_NONE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_NONE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE'
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data: GeminiResponse = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
      const text = data.candidates[0].content.parts[0].text;
      return text;
    }
    
    throw new Error('No response from Gemini API');
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}

export async function analyzeResume(
  resumeUrl: string,
  instructions: string
): Promise<string> {
  try {
    // Fetch the resume file
    const response = await fetch(resumeUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch resume');
    }
    
    const blob = await response.blob();
    const text = await blob.text();
    
    // Gemini can handle large context (1M tokens), so no need to truncate
    const resumeText = text;
    
    const prompt = `${instructions}

Resume Content:
${resumeText}

IMPORTANT: Return ONLY valid JSON with no markdown formatting, no backticks, no explanations. Just the raw JSON object.`;

    console.log('Analyzing resume with Google Gemini 1.5 Pro...');
    const result = await callGemini(prompt, { temperature: 0.3, maxTokens: 4096 });
    
    // Clean the response - remove markdown if present
    let cleanedResult = result.trim();
    
    // Remove markdown code blocks if present
    if (cleanedResult.startsWith('```json')) {
      cleanedResult = cleanedResult.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedResult.startsWith('```')) {
      cleanedResult = cleanedResult.replace(/```\n?/g, '');
    }
    
    cleanedResult = cleanedResult.trim();
    
    // Validate it's JSON
    try {
      JSON.parse(cleanedResult);
      return cleanedResult;
    } catch (parseError) {
      // Try to extract JSON from text
      const jsonMatch = cleanedResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return jsonMatch[0];
      }
      throw new Error('Could not parse JSON from response');
    }
  } catch (error) {
    console.error('Resume analysis error:', error);
    throw new Error(`Failed to analyze resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function optimizeResume(
  resumeUrl: string,
  instructions: string
): Promise<string> {
  try {
    // Fetch the resume file
    const response = await fetch(resumeUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch resume');
    }
    
    const blob = await response.blob();
    const text = await blob.text();
    
    const resumeText = text;
    
    const prompt = `${instructions}

Original Resume:
${resumeText}

IMPORTANT: Provide ONLY the optimized resume text with proper formatting. Do not include any explanations, comments, or markdown formatting like backticks. Just the resume content itself.`;

    console.log('Optimizing resume with Google Gemini 1.5 Pro...');
    const result = await callGemini(prompt, { temperature: 0.5, maxTokens: 8192 });
    
    // Remove any markdown formatting
    let cleanedResult = result.trim();
    if (cleanedResult.startsWith('```')) {
      cleanedResult = cleanedResult.replace(/```[a-z]*\n?/g, '').replace(/```\n?/g, '');
    }
    
    return cleanedResult.trim();
  } catch (error) {
    console.error('Resume optimization error:', error);
    throw new Error(`Failed to optimize resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function chatWithAI(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  // Convert messages to a single prompt
  const prompt = messages
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n\n');
  
  return callGemini(prompt);
}