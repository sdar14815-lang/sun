import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function check() {
  const { data: nData, error: nErr } = await supabase.from('notifications').select('*').limit(1);
  console.log('Notifications schema (keys):', nData ? Object.keys(nData[0] || {}) : nErr);

  const { data: mData, error: mErr } = await supabase.from('messages').select('*').limit(1);
  console.log('Messages schema (keys):', mData ? Object.keys(mData[0] || {}) : mErr);
}

check();
