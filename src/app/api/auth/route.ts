import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/actions';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const user = await verifyAdmin(username, password);
    if (user) {
      return NextResponse.json({ success: true, token: `admin_${user.id}_${Date.now()}` });
    }
    return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: '登入失敗' }, { status: 500 });
  }
}
