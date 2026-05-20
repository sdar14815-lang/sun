import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspect() {
  console.log('--- PROFILES ---');
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('*');
  if (pError) console.error(pError);
  else console.log(profiles);

  console.log('--- FAMILY LINKS ---');
  const { data: links, error: lError } = await supabase
    .from('family_links')
    .select('*');
  if (lError) console.error(lError);
  else console.log(links);

  console.log('--- RESIDENTS ---');
  const { data: residents, error: rError } = await supabase
    .from('residents')
    .select('id, full_name, file_number');
  if (rError) console.error(rError);
  else console.log(residents);
}

inspect();
