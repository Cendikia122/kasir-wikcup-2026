import { NextRequest, NextResponse } from 'next/server';
import { SEED_USERS } from '@/lib/seeder';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const password = (body.password || '').trim();

    const user = SEED_USERS.find((u) => u.password === password);
    if (!user) {
      return NextResponse.json(
        { error: 'Password salah. Coba lagi.' },
        { status: 401 }
      );
    }

    const session = {
      userId: user.id,
      name: user.name,
      role: user.role,
    };

    const res = NextResponse.json({ success: true, session });

    // Set cookie on response
    res.cookies.set('wik_session', JSON.stringify(session), {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: false,
      sameSite: 'lax',
      secure: false, // allow HTTP over local network IP
    });

    return res;
  } catch (err) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem' },
      { status: 500 }
    );
  }
}
