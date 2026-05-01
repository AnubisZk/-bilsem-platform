import { NextResponse } from 'next/server';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'http://localhost:3001/api';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { message: 'Başvuru ID eksik.' },
        { status: 400 }
      );
    }

    const backendUrl = `${API_BASE}/applications/${id}/approve`;

    const res = await fetch(backendUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const text = await res.text();

    let data: any;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      console.error('[Applications Approve Backend Error]', {
        backendUrl,
        status: res.status,
        data,
      });

      return NextResponse.json(
        {
          message: 'Başvuru onaylanamadı.',
          detail: data?.message || data?.error || data,
          backendStatus: res.status,
        },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('[Applications Approve Proxy Error]', error);

    return NextResponse.json(
      {
        message: 'Başvuru onaylanamadı.',
        detail: error?.message || 'Bilinmeyen hata',
      },
      { status: 500 }
    );
  }
}
