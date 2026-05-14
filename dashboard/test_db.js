import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfpaflndnaomtyboxsuo.supabase.co';
const supabaseAnonKey = 'sb_publishable_i-qF2xVBrTbmxgI6M2Y2ow_JQ8aDTk6';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing connection to Supabase...');
  try {
    const { data, error } = await supabase.from('profiles').select('id, role').limit(1);
    
    if (error) {
      console.error('❌ Connection or Schema Error:', error.message);
      if (error.code === '42P01') {
         console.error('Hint: It looks like the tables are missing. Did you run the schema.sql in Supabase SQL Editor?');
      }
    } else {
      console.log('✅ Connection successful!');
      console.log('✅ Database schema is present and accessible.');
      console.log('Data returned:', data);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

testConnection();
