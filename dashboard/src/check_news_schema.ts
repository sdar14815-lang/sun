
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function check() {
  const { data, error } = await supabase.from('news').select('*').limit(1);
  if (error) {
    console.error('Error fetching news:', error);
  } else {
    console.log('News columns:', data.length > 0 ? Object.keys(data[0]) : 'No data found to check columns');
  }
}

check();
