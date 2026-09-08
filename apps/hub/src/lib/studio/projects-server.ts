import fs from 'fs/promises';
import path from 'path';
import {
  getProjectsRoot,
  getStudioMetaDir,
  getActiveProjectFile,
  slugify,
} from './paths';
import type {
  ActiveProjectMeta,
  StudioProjectConfig,
  StudioProjectSummary,
} from './project-types';

const TEMPLATE_DIR = '_template';

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function readActiveSlug(): Promise<string | null> {
  try {
    const raw = await fs.readFile(getActiveProjectFile(), 'utf-8');
    const data = JSON.parse(raw) as ActiveProjectMeta;
    return data.slug ?? null;
  } catch {
    return null;
  }
}

export async function listProjects(): Promise<StudioProjectSummary[]> {
  const root = getProjectsRoot();
  const activeSlug = await readActiveSlug();
  let entries: string[] = [];
  try {
    entries = await fs.readdir(root);
  } catch {
    return [];
  }

  const projects: StudioProjectSummary[] = [];

  for (const entry of entries) {
    if (entry.startsWith('.') || entry === TEMPLATE_DIR) continue;
    const projectPath = path.join(root, entry);
    const configPath = path.join(projectPath, 'project.json');
    try {
      const stat = await fs.stat(projectPath);
      if (!stat.isDirectory()) continue;
      const raw = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(raw) as StudioProjectConfig;
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
      /* skip invalid folders */
    }
  }

  return projects.sort((a, b) =>
    (b.updatedAt || '').localeCompare(a.updatedAt || '')
  );
}

export async function createProject(input: {
  displayName: string;
  name?: string;
}): Promise<StudioProjectSummary> {
  const root = getProjectsRoot();
  const slug = slugify(input.name || input.displayName);
  const projectPath = path.join(root, slug);

  try {
    await fs.access(projectPath);
    throw new Error(`Project "${slug}" already exists`);
  } catch (e) {
    if (e instanceof Error && e.message.includes('already exists')) throw e;
  }

  const templatePath = path.join(root, TEMPLATE_DIR);
  await ensureDir(projectPath);
  await ensureDir(path.join(projectPath, 'chain'));
  await ensureDir(path.join(projectPath, 'assets', 'items'));
  await ensureDir(path.join(projectPath, 'docs'));

  let templateConfig: StudioProjectConfig | null = null;
  try {
    const t = await fs.readFile(path.join(templatePath, 'project.json'), 'utf-8');
    templateConfig = JSON.parse(t) as StudioProjectConfig;
  } catch {
    templateConfig = null;
  }

  const now = new Date().toISOString();
  const config: StudioProjectConfig = {
    ...(templateConfig || {
      rpcUrl: 'http://127.0.0.1:9944',
      wsUrl: 'ws://127.0.0.1:9944',
      authUrl: 'http://127.0.0.1:8080/api/v1',
      currency: { symbol: 'CGT', decimals: 2, sparksPerCgt: 100 },
      engine: { primary: 'unreal', pluginPath: 'sdk/unreal/DemiurgeSDK' },
      version: '0.1.0',
    }),
    name: slug,
    displayName: input.displayName.trim(),
    description: `Demiurge Studio project — ${input.displayName}`,
    createdAt: now,
    updatedAt: now,
  };

  await fs.writeFile(
    path.join(projectPath, 'project.json'),
    JSON.stringify(config, null, 2)
  );

  const summary: StudioProjectSummary = {
    slug,
    name: config.name,
    displayName: config.displayName,
    version: config.version,
    path: projectPath,
    chainDataDir: path.join(projectPath, 'chain'),
    updatedAt: now,
    isActive: false,
  };

  await setActiveProject(slug);
  return summary;
}

export async function setActiveProject(slug: string): Promise<ActiveProjectMeta> {
  const root = getProjectsRoot();
  const projectPath = path.join(root, slug);
  const configPath = path.join(projectPath, 'project.json');

  const raw = await fs.readFile(configPath, 'utf-8');
  const config = JSON.parse(raw) as StudioProjectConfig;
  const chainDataDir = path.join(projectPath, 'chain');
  await ensureDir(chainDataDir);

  const meta: ActiveProjectMeta = {
    slug,
    name: config.name,
    displayName: config.displayName,
    path: projectPath,
    chainDataDir,
    activatedAt: new Date().toISOString(),
  };

  await ensureDir(getStudioMetaDir());
  await fs.writeFile(getActiveProjectFile(), JSON.stringify(meta, null, 2));

  config.updatedAt = new Date().toISOString();
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));

  return meta;
}

export async function getActiveProject(): Promise<ActiveProjectMeta | null> {
  try {
    const raw = await fs.readFile(getActiveProjectFile(), 'utf-8');
    return JSON.parse(raw) as ActiveProjectMeta;
  } catch {
    return null;
  }
}
