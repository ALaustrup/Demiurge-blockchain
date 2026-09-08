import path from 'path';

/** Monorepo `projects/` directory (repo root). */
export function getProjectsRoot(): string {
  if (process.env.DEMIURGE_PROJECTS_ROOT) {
    return path.resolve(process.env.DEMIURGE_PROJECTS_ROOT);
  }
  // hub dev: apps/hub -> ../../projects
  return path.resolve(process.cwd(), '..', '..', 'projects');
}

export function getStudioMetaDir(): string {
  return path.join(getProjectsRoot(), '.studio');
}

export function getActiveProjectFile(): string {
  return path.join(getStudioMetaDir(), 'active-project.json');
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40) || 'project';
}
