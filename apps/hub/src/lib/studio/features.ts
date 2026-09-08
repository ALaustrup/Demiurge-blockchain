/** Feature flags per Studio edition — used for UI gating. */

export type StudioEdition = 'free' | 'creator' | 'pro' | 'enterprise';

export const EDITION_ORDER: StudioEdition[] = [
  'free',
  'creator',
  'pro',
  'enterprise',
];

export const FEATURES = {
  projects: ['free', 'creator', 'pro', 'enterprise'],
  create_drc369: ['creator', 'pro', 'enterprise'],
  agents: ['creator', 'pro', 'enterprise'],
  unreal_plugin: ['creator', 'pro', 'enterprise'],
  analytics: ['pro', 'enterprise'],
  scatter3d: ['pro', 'enterprise'],
  white_label: ['enterprise'],
} as const;

export type StudioFeature = keyof typeof FEATURES;

export function editionRank(edition: string): number {
  const i = EDITION_ORDER.indexOf(edition as StudioEdition);
  return i >= 0 ? i : 0;
}

export function hasFeature(edition: string, feature: StudioFeature): boolean {
  const allowed: readonly StudioEdition[] = FEATURES[feature];
  return allowed.includes(edition as StudioEdition);
}

export function editionLabel(edition: string): string {
  switch (edition) {
    case 'enterprise':
      return 'Enterprise';
    case 'pro':
      return 'Pro';
    case 'creator':
      return 'Creator';
    default:
      return 'Free';
  }
}
