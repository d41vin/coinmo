import { createTables } from '@/lib/db';

async function setup() {
  try {
    await createTables();
    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating database tables:', error);
    process.exit(1);
  }
}

setup();