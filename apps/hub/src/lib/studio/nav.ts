/**
 * Studio-focused Hub navigation.
 * WIP / non-core modules are omitted from primary nav until production-ready.
 */

export const STUDIO_NAV_PRIMARY = [
  { label: 'Projects', href: '/studio/projects' },
  { label: 'Create', href: '/create', feature: 'create_drc369' as const },
  { label: 'Explorer', href: '/explorer' },
  { label: 'Docs', href: '/docs' },
] as const;

export const STUDIO_NAV_MORE = [
  { label: 'Agents', href: '/agents', feature: 'agents' as const },
  { label: 'Developers', href: '/developers' },
  { label: 'Studio License', href: '/activate' },
  { label: 'Settings', href: '/settings' },
] as const;

/** Shown on dashboard but marked coming soon */
export const STUDIO_COMING_SOON = [
  { label: 'VYB Social', href: '/social' },
  { label: 'Music', href: '/music' },
  { label: 'Sophia AI', href: '/sophia' },
  { label: 'Marketplace', href: '/marketplace' },
] as const;
