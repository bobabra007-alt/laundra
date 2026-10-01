import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  const session = await auth(); const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const fd = await req.formData(); const file = fd.get('file');
  const entityId = String(fd.get('entityId') ?? ''); const entityType = String(fd.get('entityType') ?? 'DEAL');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file' }, { status: 400 });
  if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: 'Максимум 2 МБ' }, { status: 413 });
  const blob = await put(`laundra/${entityType.toLowerCase()}/${crypto.randomUUID()}-${file.name}`, file, { access: 'private' });
  const attachment = await prisma.attachment.create({ data: { entityType: entityType as any, entityId, filename: file.name, mime: file.type || 'application/octet-stream', size: file.size, url: blob.url, uploadedBy: userId } });
  return NextResponse.json(attachment);
}
