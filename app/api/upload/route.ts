import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { uploadFile } from '@/lib/storage';
import { saveResume } from '@/lib/mongodb';  
import { analyzeResume } from '@/lib/ai';
import { prepareInstructions } from '@/constants';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { userId } =  auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const imageFile = formData.get('imageFile') as File;
    const companyName = formData.get('companyName') as string;
    const jobTitle = formData.get('jobTitle') as string;
    const jobDescription = formData.get('jobDescription') as string;

    if (!file || !imageFile) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('Starting file upload process...');
    
    // Upload resume file
    const resumeBlob = await uploadFile(file, userId);
    console.log('Resume uploaded to:', resumeBlob.url);
    
    // Upload image file
    const imageBlob = await uploadFile(imageFile, userId);
    console.log('Image uploaded to:', imageBlob.url);

    // Generate UUID for resume
    const resumeId = crypto.randomUUID();
    console.log('Generated resume ID:', resumeId);

    // Prepare data
    const resumeData = {
      id: resumeId,
      resumePath: resumeBlob.url,
      imagePath: imageBlob.url,
      companyName: companyName || 'Not Specified',
      jobTitle: jobTitle || 'General Position',
      jobDescription: jobDescription || 'General resume optimization',
      feedback: null as any,
    };

    // Save to MongoDB without feedback first
    await saveResume(userId, resumeData);
    console.log('Resume data saved to MongoDB');

    // Analyze with AI
    try {
      const instructions = prepareInstructions({
        jobTitle: resumeData.jobTitle,
        jobDescription: resumeData.jobDescription,
      });

      console.log('Starting AI analysis with Google Gemini...');
      
      const feedbackText = await analyzeResume(resumeBlob.url, instructions);
      
      console.log('AI analysis complete, parsing feedback...');
      
      let feedback;
      try {
        feedback = JSON.parse(feedbackText);
        console.log('Feedback parsed successfully');
      } catch (parseError) {
        console.error('Failed to parse AI response');
        
        feedback = {
          overallScore: 75,
          ATS: {
            score: 75,
            tips: [
              { type: 'improve', tip: 'AI analysis completed but response format was unexpected.' }
            ]
          },
          toneAndStyle: { 
            score: 75, 
            tips: [
              { type: 'improve', tip: 'Professional Tone', explanation: 'Maintain professional language.' }
            ]
          },
          content: { 
            score: 75, 
            tips: [
              { type: 'improve', tip: 'Content Quality', explanation: 'Include quantifiable achievements.' }
            ]
          },
          structure: { 
            score: 75, 
            tips: [
              { type: 'improve', tip: 'Clear Structure', explanation: 'Use standard sections.' }
            ]
          },
          skills: { 
            score: 75, 
            tips: [
              { type: 'improve', tip: 'Relevant Skills', explanation: 'List job-specific skills.' }
            ]
          }
        };
      }

      // Update with feedback
      resumeData.feedback = feedback;
      await saveResume(userId, resumeData);
      console.log('Feedback saved to MongoDB');

      return NextResponse.json({
        success: true,
        resumeId,
        feedback,
      });
    } catch (aiError) {
      console.error('AI analysis failed:', aiError);
      
      const errorMessage = aiError instanceof Error ? aiError.message : '';
      const isApiKeyError = errorMessage.includes('API key') || errorMessage.includes('GEMINI_API_KEY');
      
      const defaultFeedback = {
        overallScore: 70,
        ATS: {
          score: 70,
          tips: [
            { 
              type: 'improve', 
              tip: isApiKeyError 
                ? '⚠️ API Key Error: Please check GEMINI_API_KEY' 
                : '⚠️ AI analysis error. Resume saved. Try again later.' 
            }
          ]
        },
        toneAndStyle: { score: 70, tips: [] },
        content: { score: 70, tips: [] },
        structure: { score: 70, tips: [] },
        skills: { score: 70, tips: [] }
      };
      
      resumeData.feedback = defaultFeedback;
      await saveResume(userId, resumeData);
      
      return NextResponse.json({
        success: true,
        resumeId,
        feedback: defaultFeedback,
        warning: 'AI analysis failed, but resume was uploaded',
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}