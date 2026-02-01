import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { listResumes, getResume } from '@/lib/redis';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if this is a request for a specific resume
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const resumeId = pathParts[pathParts.length - 1];

    // If there's a resume ID in the path (not "resumes")
    if (resumeId && resumeId !== 'resumes') {
      const resume = await getResume(userId, resumeId);
      if (!resume) {
        return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
      }
      return NextResponse.json(resume);
    }

    // Otherwise, list all resumes
    const resumes = await listResumes(userId);

    return NextResponse.json({
      success: true,
      resumes,
    });
  } catch (error) {
    console.error('List resumes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resumes', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}