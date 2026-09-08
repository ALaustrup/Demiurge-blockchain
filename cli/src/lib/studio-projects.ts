/**
 * Demiurge Studio project filesystem helpers (CLI).
 * Mirrors apps/hub/src/lib/studio/projects-server.ts
 */

import * as fs from 'fs';
import * as path from 'path';

export interface StudioProjectSummary {
  slug: string;
  displayName: string;
  name: string;
  version: string;
  path: string;
  chainDataDir: string;
  updatedAt?: string;
  isActive: boolean;
}

export interface ActiveProjectMeta {
  slug: string;
  name: string;
  displayName: string;
  path: string;
  chainDataDir: string;
  activatedAt: string;
}

function findRepoRoot(start: string = process.cwd()): string {
  let dir = path.resolve(start);
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, 'projects', '_template'))) {
      return dir;
    }
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'));
      if (pkg.name === 'demiurge-ecosystem') return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(start);
}

export function getProjectsRoot(cwd?: string): string {
  if (process.env.DEMIURGE_PROJECTS_ROOT) {
    return path.resolve(process.env.DEMIURGE_PROJECTS_ROOT);
  }
  return path.join(findRepoRoot(cwd), 'projects');
}

export function getStudioMetaDir(cwd?: string): string {
  return path.join(getProjectsRoot(cwd), '.studio');
}

export function getActiveProjectFile(cwd?: string): string {
  return path.join(getStudioMetaDir(cwd), 'active-project.json');
}

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'project'
  );
}

function readActiveSlug(cwd?: string): string | null {
  try {
    const raw = fs.readFileSync(getActiveProjectFile(cwd), 'utf-8');
    const data = JSON.parse(raw) as ActiveProjectMeta;
    return data.slug ?? null;
  } catch {
    return null;
  }
}

export function listProjects(cwd?: string): StudioProjectSummary[] {
  const root = getProjectsRoot(cwd);
  const activeSlug = readActiveSlug(cwd);
  if (!fs.existsSync(root)) return [];

  const projects: StudioProjectSummary[] = [];

  for (const entry of fs.readdirSync(root)) {
    if (entry.startsWith('.') || entry === '_template') continue;
    const projectPath = path.join(root, entry);
    const configPath = path.join(projectPath, 'project.json');
    try {
      if (!fs.statSync(projectPath).isDirectory()) continue;
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      projects.push({
        slug: entry,
        name: config.name,
        displayName: config.displayName || config.name,
        version: config.version || '0.1.0',
        path: projectPath,
        chainDataDir: path.join(projectPath, 'chain'),
        updatedAt: config.updatedAt,
        isActive: entry === activeSlug,
      });
    } catch {
      /* skip */
    }
  }

  return projects.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

export function createProject(
  displayName: string,
  cwd?: string
): StudioProjectSummary {
  const root = getProjectsRoot(cwd);
  const slug = slugify(displayName);
  const projectPath = path.join(root, slug);

  if (fs.existsSync(projectPath)) {
    throw new Error(`Project "${slug}" already exists`);
  }

  fs.mkdirSync(path.join(projectPath, 'chain'), { recursive: true });
  fs.mkdirSync(path.join(projectPath, 'assets', 'items'), { recursive: true });
  fs.mkdirSync(path.join(projectPath, 'docs'), { recursive: true });

  const templatePath = path.join(root, '_template', 'project.json');
  let base: Record<string, unknown> = {
    rpcUrl: 'http://127.0.0.1:9944',
    wsUrl: 'ws://127.0.0.1:9944',
    authUrl: 'http://127.0.0.1:8080/api/v1',
    currency: { symbol: 'CGT', decimals: 2, sparksPerCgt: 100 },
    engine: { primary: 'unreal', pluginPath: 'sdk/unreal/DemiurgeSDK' },
    version: '0.1.0',
  };
  if (fs.existsSync(templatePath)) {
    base = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));
  }

  const now = new Date().toISOString();
  const config = {
    ...base,
    name: slug,
    displayName: displayName.trim(),
    description: `Demiurge Studio project — ${displayName}`,
    createdAt: now,
    updatedAt: now,
  };

  fs.writeFileSync(path.join(projectPath, 'project.json'), JSON.stringify(config, null, 2));

  const summary: StudioProjectSummary = {
    slug,
    name: slug,
    displayName: config.displayName,
    version: String(config.version),
    path: projectPath,
    chainDataDir: path.join(projectPath, 'chain'),
    updatedAt: now,
    isActive: false,
  };

  setActiveProject(slug, cwd);
  return summary;
}

export function setActiveProject(slug: string, cwd?: string): ActiveProjectMeta {
  const root = getProjectsRoot(cwd);
  const projectPath = path.join(root, slug);
  const configPath = path.join(projectPath, 'project.json');

  if (!fs.existsSync(configPath)) {
    throw new Error(`Project not found: ${slug}`);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const chainDataDir = path.join(projectPath, 'chain');
  fs.mkdirSync(chainDataDir, { recursive: true });

  const meta: ActiveProjectMeta = {
    slug,
    name: config.name,
    displayName: config.displayName,
    path: projectPath,
    chainDataDir,
    activatedAt: new Date().toISOString(),
  };

  fs.mkdirSync(getStudioMetaDir(cwd), { recursive: true });
  fs.writeFileSync(getActiveProjectFile(cwd), JSON.stringify(meta, null, 2));

  config.updatedAt = new Date().toISOString();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  return meta;
}

export function getActiveProject(cwd?: string): ActiveProjectMeta | null {
  try {
    const raw = fs.readFileSync(getActiveProjectFile(cwd), 'utf-8');
    return JSON.parse(raw) as ActiveProjectMeta;
  } catch {
    return null;
  }
}
