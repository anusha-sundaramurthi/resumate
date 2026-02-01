import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { uploadFile } from '@/lib/storage';
import { saveResume } from '@/lib/redis';
import { analyzeResume } from '@/lib/ai';  // ← Using Google Gemini now
import { prepareInstructions } from '@/constants';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
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

    console.log('Uploading files...');
    
    // Upload resume file
    const resumeBlob = await uploadFile(file, userId);
    
    // Upload image file
    const imageBlob = await uploadFile(imageFile, userId);

    // Generate UUID for resume
    const resumeId = crypto.randomUUID();

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

    // Save to Redis without feedback first
    await saveResume(userId, resumeData);

    // Analyze with AI (Gemini is fast - usually 5-10 seconds)
    try {
      const instructions = prepareInstructions({
        jobTitle: resumeData.jobTitle,
        jobDescription: resumeData.jobDescription,
      });

      console.log('Starting AI analysis with Gemini 1.5 Pro...');
      const feedbackText = await analyzeResume(resumeBlob.url, instructions);
      
      console.log('AI analysis complete, parsing feedback...');
      
      // Parse JSON
      let feedback;
      try {
        feedback = JSON.parse(feedbackText);
        console.log('Feedback parsed successfully');
      } catch (parseError) {
        console.error('Failed to parse AI response:', feedbackText);
        // Create default feedback if parsing fails
        feedback = {
          overallScore: 75,
          ATS: {
            score: 75,
            tips: [
              { type: 'improve', tip: 'AI analysis completed but response format was unexpected. The resume has been saved. You can try re-analyzing.' }
            ]
          },
          toneAndStyle: { 
            score: 75, 
            tips: [
              { type: 'improve', tip: 'Professional tone', explanation: 'Unable to analyze in detail at this time.' }
            ]
          },
          content: { 
            score: 75, 
            tips: [
              { type: 'improve', tip: 'Content quality', explanation: 'Unable to analyze in detail at this time.' }
            ]
          },
          structure: { 
            score: 75, 
            tips: [
              { type: 'improve', tip: 'Resume structure', explanation: 'Unable to analyze in detail at this time.' }
            ]
          },
          skills: { 
            score: 75, 
            tips: [
              { type: 'improve', tip: 'Skills section', explanation: 'Unable to analyze in detail at this time.' }
            ]
          }
        };
      }

      // Update with feedback
      resumeData.feedback = feedback;
      await saveResume(userId, resumeData);

      return NextResponse.json({
        success: true,
        resumeId,
        feedback,
      });
    } catch (aiError) {
      console.error('AI analysis failed:', aiError);
      
      // Return success anyway with default feedback
      const defaultFeedback = {
        overallScore: 70,
        ATS: {
          score: 70,
          tips: [
            { type: 'improve', tip: 'AI analysis encountered an error. Your resume has been saved. Please check your Gemini API key and try again.' }
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
        warning: 'AI analysis failed, but resume was uploaded. Please check your API key.',
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