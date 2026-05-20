import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح لك بتعديل حسابات أهالي' }, { status: 403 });
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

    if (!role || !['super_admin', 'admin', 'staff'].includes(role)) {
      return NextResponse.json({ error: 'غير مصرح لك بتعديل حسابات أهالي' }, { status: 403 });
    }

    const { id, username, password, full_name, phone } = await request.json();

    if (!id || !username) {
      return NextResponse.json({ error: 'المعرف واسم المستخدم مطلوبان' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const loginEmail = `${username.trim().toLowerCase()}@family.shams.com`;

    const authAttributes: any = {
      email: loginEmail,
      user_metadata: {
        full_name: full_name,
        username: username,
        role: 'family'
      }
    };

    if (password && password.trim() !== '') {
      authAttributes.password = password;
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, authAttributes);

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const { error: profileError } = await supabaseAdmin.from('profiles').update({
      full_name: full_name,
      username: username.trim().toLowerCase(),
      email: loginEmail,
      phone: phone
    }).eq('id', id);

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
