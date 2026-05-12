import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Security: prevent path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  const filepath = join(UPLOAD_DIR, filename);
  if (!existsSync(filepath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  try {
    const buffer = await readFile(filepath);
    const ext = '.' + filename.split('.').pop()?.toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
  }
}
