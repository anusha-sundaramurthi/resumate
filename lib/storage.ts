import { put, del, list } from '@vercel/blob';

export async function uploadFile(file: File, userId: string): Promise<{ url: string; pathname: string }> {
  const filename = `${userId}/${Date.now()}-${file.name}`;
  const blob = await put(filename, file, {
    access: 'public',
  });
  
  return {
    url: blob.url,
    pathname: blob.pathname,
  };
}

export async function deleteFile(url: string): Promise<void> {
  await del(url);
}

export async function listFiles(userId: string) {
  const { blobs } = await list({
    prefix: `${userId}/`,
  });
  return blobs;
}

export async function getFileBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch file');
  }
  return response.blob();
}