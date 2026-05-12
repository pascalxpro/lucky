import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'uploads');
const MAX_SIZE = 10 * 1024 * 1024; // 10MB after compression

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: '未選擇檔案' }, { status: 400 });
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: '檔案過大（最大 10MB）' }, { status: 400 });
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: '不支援的圖片格式' }, { status: 400 });
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Generate unique filename
    const ext = file.type === 'image/png' ? '.png'
      : file.type === 'image/webp' ? '.webp'
      : file.type === 'image/gif' ? '.gif'
      : '.jpg';
    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
    const filepath = join(UPLOAD_DIR, filename);

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    // Return URL (served via /api/uploads/[filename])
    const url = `/api/uploads/${filename}`;

    return NextResponse.json({
      url,
      filename,
      size: file.size,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: '上傳失敗' }, { status: 500 });
  }
}
