// Google Gemini AI Integration - FREE & High Quality
// API Key: Get from https://makersuite.google.com/app/apikey

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  error?: {
    message: string;
    code: number;
  };
}

async function callGemini(prompt: string, options: {
  temperature?: number;
  maxTokens?: number;
} = {}): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

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
          topK: 40,
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
      console.error('Gemini API Error Response:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data: GeminiResponse = await response.json();
    
    if (data.error) {
      throw new Error(`Gemini API error: ${data.error.message}`);
    }
    
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
    console.log('Fetching resume from:', resumeUrl);
    
    const response = await fetch(resumeUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch resume: ${response.status}`);
    }
    
    const blob = await response.blob();
    const text = await blob.text();
    
    console.log(`Resume text length: ${text.length} characters`);
    
    const resumeText = text;
    
    const prompt = `${instructions}

Resume Content:
${resumeText}

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON
2. NO markdown formatting (no backticks, no \`\`\`json)
3. NO explanations before or after the JSON
4. Just the raw JSON object starting with { and ending with }
5. Ensure all strings are properly escaped
6. Follow the exact structure specified in the instructions above`;

    console.log('Calling Gemini API for resume analysis...');
    const result = await callGemini(prompt, { temperature: 0.3, maxTokens: 4096 });
    
    console.log('Gemini API returned result, cleaning...');
    
    let cleanedResult = result.trim();
    
    if (cleanedResult.includes('```json')) {
      cleanedResult = cleanedResult.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedResult.includes('```')) {
      cleanedResult = cleanedResult.replace(/```\n?/g, '');
    }
    
    const jsonStart = cleanedResult.indexOf('{');
    if (jsonStart > 0) {
      cleanedResult = cleanedResult.substring(jsonStart);
    }
    
    const jsonEnd = cleanedResult.lastIndexOf('}');
    if (jsonEnd > 0 && jsonEnd < cleanedResult.length - 1) {
      cleanedResult = cleanedResult.substring(0, jsonEnd + 1);
    }
    
    cleanedResult = cleanedResult.trim();
    
    console.log('Validating JSON response...');
    
    try {
      JSON.parse(cleanedResult);
      console.log('JSON validation successful');
      return cleanedResult;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Attempted to parse:', cleanedResult.substring(0, 500));
      
      const jsonMatch = cleanedResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          JSON.parse(jsonMatch[0]);
          console.log('Successfully extracted JSON from response');
          return jsonMatch[0];
        } catch (e) {
          throw new Error('Could not parse JSON from AI response');
        }
      }
      throw new Error('Could not parse JSON from AI response');
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
    console.log('Fetching resume for optimization from:', resumeUrl);
    
    const response = await fetch(resumeUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch resume: ${response.status}`);
    }
    
    const blob = await response.blob();
    const text = await blob.text();
    
    console.log(`Resume text length: ${text.length} characters`);
    
    const resumeText = text;
    
    const prompt = `${instructions}

Original Resume:
${resumeText}

CRITICAL INSTRUCTIONS:
1. Provide ONLY the optimized resume text
2. NO markdown formatting (no backticks, no \`\`\`)
3. NO explanations, comments, or meta-text
4. Just the resume content itself
5. Use plain text formatting
6. Start directly with the candidate name`;

    console.log('Calling Gemini API for resume optimization...');
    const result = await callGemini(prompt, { temperature: 0.5, maxTokens: 8192 });
    
    console.log('Gemini API returned optimization result, cleaning...');
    
    let cleanedResult = result.trim();
    
    if (cleanedResult.includes('```')) {
      cleanedResult = cleanedResult.replace(/```[a-z]*\n?/gi, '').replace(/```\n?/g, '');
    }
    
    const resumeStartPatterns = [
      /^[A-Z\s]{2,50}\n/m,
      /^Here is the optimized resume:?\n+/i,
      /^Optimized Resume:?\n+/i,
      /^Based on.*?:\n+/i,
    ];
    
    for (const pattern of resumeStartPatterns) {
      const match = cleanedResult.match(pattern);
      if (match && match.index !== undefined && match.index < 200) {
        cleanedResult = cleanedResult.substring(match.index + match[0].length);
        break;
      }
    }
    
    cleanedResult = cleanedResult.trim();
    
    console.log('Optimization complete, result length:', cleanedResult.length);
    
    return cleanedResult;
  } catch (error) {
    console.error('Resume optimization error:', error);
    throw new Error(`Failed to optimize resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function chatWithAI(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const prompt = messages
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n\n');
  
  return callGemini(prompt);
}