import { NextResponse } from 'next/server';
import { createProject, listProjects } from '@/lib/studio/projects-server';

export async function GET() {
  try {
    const projects = await listProjects();
    return NextResponse.json({ projects });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to list projects';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const displayName = String(body.displayName || '').trim();
    if (!displayName) {
      return NextResponse.json({ error: 'displayName is required' }, { status: 400 });
    }
    const project = await createProject({
      displayName,
      name: body.name ? String(body.name) : undefined,
    });
    return NextResponse.json(
      { project, message: 'Restart demiurge-node to use this project chain data.' },
      { status: 201 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create project';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
