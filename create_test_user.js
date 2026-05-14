
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: './dashboard/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createTestUser() {
    const username = 'testfamily' + Math.floor(Math.random() * 1000);
    const password = 'TestPassword123!';
    const email = `${username}@family.shams.com`;

    console.log(`Creating user: ${username} ...`);

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            full_name: 'Test Family Member',
            username: username,
            role: 'family'
        }
    });

    if (authError) {
        console.error('Auth error:', authError);
        return;
    }

    const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        full_name: 'Test Family Member',
        username: username,
        email: email,
        role: 'family',
        status: 'active'
    });

    if (profileError) {
        console.error('Profile error:', profileError);
        return;
    }

    console.log('User created successfully!');
    console.log('Username:', username);
    console.log('Password:', password);
}

createTestUser();
