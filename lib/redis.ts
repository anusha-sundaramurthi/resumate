import { kv } from '@vercel/kv';

export interface Resume {
  id: string;
  companyName?: string;
  jobTitle?: string;
  jobDescription?: string;
  imagePath: string;
  resumePath: string;
  feedback: any;
}

export async function saveResume(userId: string, resumeData: Resume): Promise<void> {
  const key = `resume:${userId}:${resumeData.id}`;
  await kv.set(key, JSON.stringify(resumeData));
}

export async function getResume(userId: string, resumeId: string): Promise<Resume | null> {
  const key = `resume:${userId}:${resumeId}`;
  const data = await kv.get<string>(key);
  return data ? JSON.parse(data) : null;
}

export async function listResumes(userId: string): Promise<Resume[]> {
  const pattern = `resume:${userId}:*`;
  const keys = await kv.keys(pattern);
  
  if (keys.length === 0) return [];
  
  const resumes = await Promise.all(
    keys.map(async (key) => {
      const data = await kv.get<string>(key);
      return data ? JSON.parse(data) : null;
    })
  );
  
  return resumes.filter((r): r is Resume => r !== null);
}

export async function deleteResume(userId: string, resumeId: string): Promise<void> {
  const key = `resume:${userId}:${resumeId}`;
  await kv.del(key);
}

export async function flushUserData(userId: string): Promise<void> {
  const pattern = `resume:${userId}:*`;
  const keys = await kv.keys(pattern);
  if (keys.length > 0) {
    await kv.del(...keys);
  }
}