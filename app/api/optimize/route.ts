import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getResume } from '@/lib/redis';
import { optimizeResume } from '@/lib/ai';  // ← Using Google Gemini
import { prepareOptimizationInstructions } from '@/constants';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resumeId } = await request.json();

    if (!resumeId) {
      return NextResponse.json({ error: 'Resume ID required' }, { status: 400 });
    }

    // Get resume data
    const resumeData = await getResume(userId, resumeId);
    if (!resumeData) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Validate required fields
    if (!resumeData.jobTitle || !resumeData.jobDescription) {
      return NextResponse.json(
        { error: 'Job title and description are required for optimization' },
        { status: 400 }
      );
    }

    // Prepare optimization instructions
    const instructions = prepareOptimizationInstructions({
      jobTitle: resumeData.jobTitle,
      jobDescription: resumeData.jobDescription,
      companyName: resumeData.companyName || 'Target Company',
      currentFeedback: resumeData.feedback ? JSON.stringify(resumeData.feedback) : undefined,
    });

    console.log('Optimizing resume with Google Gemini 1.5 Pro...');
    
    // Optimize resume with AI
    const optimizedContent = await optimizeResume(resumeData.resumePath, instructions);

    console.log('Resume optimization complete!');

    return NextResponse.json({
      success: true,
      optimizedContent,
      originalName: resumeData.resumePath.split('/').pop() || 'resume.pdf',
    });
  } catch (error) {
    console.error('Optimization error:', error);
    return NextResponse.json(
      { error: 'Optimization failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}