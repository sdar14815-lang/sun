import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح لك بإرسال إشعارات' }, { status: 403 });
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

    if (!role || !['super_admin', 'admin', 'staff', 'doctor', 'therapist'].includes(role)) {
      return NextResponse.json({ error: 'غير مصرح لك بإرسال إشعارات' }, { status: 403 });
    }

    const { title, body, url } = await request.json();

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_REST_API_KEY;

    if (!appId || !apiKey) {
      console.error("OneSignal configuration keys are missing in environment variables.");
      return NextResponse.json(
        { error: 'OneSignal environment variables are not configured.' },
        { status: 500 }
      );
    }

    const payload = {
      app_id: appId,
      included_segments: ['Subscribed Users'],
      headings: {
        en: title,
        ar: title,
      },
      contents: {
        en: body,
        ar: body,
      },
      url: url || undefined,
    };

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OneSignal API Error response:', data);
      return NextResponse.json(
        { error: data.errors?.[0] || 'Failed to send notification via OneSignal' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error in send notification API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
