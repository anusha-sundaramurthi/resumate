import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { listResumes } from '@/lib/mongodb';  // ← Changed from redis

export async function GET() {
  try {
    const { userId } =  auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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