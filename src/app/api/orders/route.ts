import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = 'add_order', order, orders, sheetUrl: customSheetUrl } = body;

    // Use sheetUrl from request, or environment variable
    const targetUrl = customSheetUrl || process.env.GOOGLE_SHEET_URL;

    if (!targetUrl) {
      // If no sheet URL configured, return success locally
      return NextResponse.json({
        success: true,
        message: 'Order saved locally (Google Sheet URL not configured yet)',
      });
    }

    // Forward to Google Apps Script Web App
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        order,
        orders,
      }),
      redirect: 'follow',
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return NextResponse.json({
      success: true,
      sheetResponse: data,
    });
  } catch (error: any) {
    console.error('Error forwarding to Google Sheet:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to sync with Google Sheet',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url') || process.env.GOOGLE_SHEET_URL;

  if (!targetUrl) {
    return NextResponse.json({
      connected: false,
      message: 'No Google Sheet URL provided',
    });
  }

  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
    });
    const text = await res.text();
    return NextResponse.json({
      connected: res.ok,
      response: text,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        connected: false,
        error: err?.message,
      },
      { status: 500 }
    );
  }
}
