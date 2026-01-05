import mongoose from 'mongoose';

export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI || '';
  
  if (!uri) {
    throw new Error('MONGODB_URI is not configured');
  }
  
  console.log('🔄 Connecting to MongoDB...');
  
  // Use the URI as-is - let MongoDB Atlas use the default database
  // or specify database name in the connection options
  await mongoose.connect(uri, {
    dbName: 'itero',
  });
  
  console.log('✅ Connected to MongoDB');
}
