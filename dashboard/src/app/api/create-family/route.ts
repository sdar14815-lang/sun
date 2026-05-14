import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { username, password, full_name, phone } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' }, { status: 400 });
    }

    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const loginEmail = `${username.trim().toLowerCase()}@family.shams.com`;

    // 1. Create User using Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: loginEmail,
      password: password,
      email_confirm: true, // Auto confirm
      user_metadata: {
        full_name: full_name,
        username: username,
        role: 'family'
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'فشل إنشاء المستخدم في نظام الحماية' }, { status: 500 });
    }

    // 2. Upsert into profiles (using upsert because the trigger might have already created it)
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert([{
      id: authData.user.id,
      full_name: full_name,
      username: username.trim().toLowerCase(),
      email: loginEmail,
      phone: phone,
      role: 'family',
      status: 'active'
    }], { onConflict: 'id' });

    if (profileError) {
      console.error('Profile error:', profileError);
      // Rollback auth user creation if profile fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: authData.user });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
