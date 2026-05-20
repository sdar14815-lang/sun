import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح لك بإضافة موظفين' }, { status: 403 });
    }

    let role = session.user.user_metadata?.role;
    if (!role) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      role = profile?.role;
    }

    if (role !== 'super_admin' && role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح لك بإضافة موظفين' }, { status: 403 });
    }

    const { username, password, full_name, phone, role } = await request.json();

    if (!username || !password || !role) {
      return NextResponse.json({ error: 'اسم المستخدم، كلمة المرور، والدور مطلوبان' }, { status: 400 });
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

    const loginEmail = username.includes('@') ? username.trim().toLowerCase() : `${username.trim().toLowerCase()}@shams.com`;

    // 1. Create User using Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: loginEmail,
      password: password,
      email_confirm: true, // Auto confirm
      user_metadata: {
        full_name: full_name,
        username: username,
        role: role
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
      phone: phone || null,
      role: role,
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
