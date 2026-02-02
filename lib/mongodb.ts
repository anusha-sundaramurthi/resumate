import { MongoClient, Db, Collection } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = 'resumate';
const COLLECTION_NAME = 'resumes';

let client: MongoClient | null = null;
let db: Db | null = null;

export interface Resume {
  id: string;
  userId: string;
  companyName?: string;
  jobTitle?: string;
  jobDescription?: string;
  imagePath: string;
  resumePath: string;
  feedback: any;
  createdAt: Date;
  updatedAt: Date;
}

async function connectToDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Failed to connect to MongoDB');
  }
}

async function getCollection(): Promise<Collection<Resume>> {
  const database = await connectToDatabase();
  return database.collection<Resume>(COLLECTION_NAME);
}

export async function saveResume(userId: string, resumeData: Omit<Resume, 'userId' | 'createdAt' | 'updatedAt'>): Promise<void> {
  try {
    const collection = await getCollection();
    
    const now = new Date();
    const document: Resume = {
      ...resumeData,
      userId,
      createdAt: now,
      updatedAt: now,
    };

    // Upsert (update if exists, insert if not)
    await collection.updateOne(
      { id: resumeData.id, userId },
      { $set: document },
      { upsert: true }
    );

    console.log('Resume saved to MongoDB:', resumeData.id);
  } catch (error) {
    console.error('Error saving resume:', error);
    throw new Error('Failed to save resume to database');
  }
}

export async function getResume(userId: string, resumeId: string): Promise<Resume | null> {
  try {
    const collection = await getCollection();
    
    const resume = await collection.findOne({ 
      id: resumeId, 
      userId 
    });

    return resume;
  } catch (error) {
    console.error('Error getting resume:', error);
    throw new Error('Failed to get resume from database');
  }
}

export async function listResumes(userId: string): Promise<Resume[]> {
  try {
    const collection = await getCollection();
    
    const resumes = await collection
      .find({ userId })
      .sort({ createdAt: -1 }) // Most recent first
      .toArray();

    return resumes;
  } catch (error) {
    console.error('Error listing resumes:', error);
    throw new Error('Failed to list resumes from database');
  }
}

export async function deleteResume(userId: string, resumeId: string): Promise<void> {
  try {
    const collection = await getCollection();
    
    await collection.deleteOne({ 
      id: resumeId, 
      userId 
    });

    console.log('Resume deleted from MongoDB:', resumeId);
  } catch (error) {
    console.error('Error deleting resume:', error);
    throw new Error('Failed to delete resume from database');
  }
}

export async function flushUserData(userId: string): Promise<void> {
  try {
    const collection = await getCollection();
    
    await collection.deleteMany({ userId });

    console.log('All resumes deleted for user:', userId);
  } catch (error) {
    console.error('Error flushing user data:', error);
    throw new Error('Failed to flush user data from database');
  }
}

// Close connection (optional - for cleanup)
export async function closeConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed');
  }
}