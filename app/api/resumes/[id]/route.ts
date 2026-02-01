import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getResume } from '@/lib/redis';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const resume = await getResume(userId, id);
    
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    return NextResponse.json(resume);
  } catch (error) {
    console.error('Get resume error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resume', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}