import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
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
