import { NextResponse } from 'next/server';
import { getActiveProject, setActiveProject } from '@/lib/studio/projects-server';

export async function GET() {
  try {
    const active = await getActiveProject();
    return NextResponse.json({ active });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to read active project';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slug = String(body.slug || '').trim();
    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 });
    }
    const active = await setActiveProject(slug);
    return NextResponse.json({
      active,
      message: 'Restart demiurge-node to load this project chain.',
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to set active project';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
