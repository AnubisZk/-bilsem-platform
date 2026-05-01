import { NextResponse } from 'next/server';

function getBackendBase() {
  const raw =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3001';

  return raw.replace(/\/api\/?$/, '').replace(/\/$/, '');
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const backend = getBackendBase();

    const res = await fetch(`${backend}/api/applications`, {
      cache: 'no-store',
    });

    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error: any) {
    console.error('[Applications Proxy GET Error]', error);

    return NextResponse.json(
      {
        message: 'Başvurular alınamadı.',
        detail: error?.message || 'Bilinmeyen hata',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const backend = getBackendBase();
    const body = await request.text();

    const res = await fetch(`${backend}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
      cache: 'no-store',
    });

    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error: any) {
    console.error('[Applications Proxy POST Error]', error);

    return NextResponse.json(
      {
        message: 'Başvuru gönderilemedi.',
        detail: error?.message || 'Bilinmeyen hata',
      },
      { status: 500 }
    );
  }
}
