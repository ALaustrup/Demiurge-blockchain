const MACHINE_ID_KEY = 'demiurge_studio_machine_id';
const LICENSE_CACHE_KEY = 'demiurge_studio_license';

export interface StudioLicenseStatus {
  edition: string;
  features: string[];
  activated_at?: string;
  expires_at?: string;
  machine_id?: string;
  requires_activation: boolean;
}

function getAuthBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_QOR_AUTH_URL?.replace(/\/$/, '') ||
    'http://localhost:8080/api/v1'
  );
}

/** Stable per-browser machine id for CD-key activation limits */
export function getStudioMachineId(): string {
  if (typeof window === 'undefined') {
    return 'server';
  }

  let id = localStorage.getItem(MACHINE_ID_KEY);
  if (!id) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? `studio-${crypto.randomUUID()}`
        : `studio-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(MACHINE_ID_KEY, id);
  }
  return id;
}

export function cacheLicenseStatus(status: StudioLicenseStatus): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LICENSE_CACHE_KEY, JSON.stringify(status));
  }
}

export function getCachedLicenseStatus(): StudioLicenseStatus | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(LICENSE_CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StudioLicenseStatus;
  } catch {
    return null;
  }
}

export async function fetchLicenseStatus(token: string): Promise<StudioLicenseStatus> {
  const res = await fetch(`${getAuthBaseUrl()}/studio/license`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('Failed to load license status');
  }
  const data = await res.json();
  const features = Array.isArray(data.features)
    ? data.features
    : typeof data.features === 'string'
      ? JSON.parse(data.features)
      : [];
  const status: StudioLicenseStatus = {
    edition: data.edition,
    features,
    activated_at: data.activated_at,
    expires_at: data.expires_at,
    machine_id: data.machine_id,
    requires_activation: Boolean(data.requires_activation),
  };
  cacheLicenseStatus(status);
  return status;
}

export async function activateLicenseKey(
  token: string,
  licenseKey: string
): Promise<StudioLicenseStatus> {
  const res = await fetch(`${getAuthBaseUrl()}/studio/activate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      license_key: licenseKey.trim(),
      machine_id: getStudioMachineId(),
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data?.error?.message || data?.message || 'License activation failed';
    throw new Error(msg);
  }

  const features = Array.isArray(data.features) ? data.features : [];
  const status: StudioLicenseStatus = {
    edition: data.edition,
    features,
    activated_at: data.activated_at,
    expires_at: data.expires_at,
    machine_id: data.machine_id,
    requires_activation: false,
  };
  cacheLicenseStatus(status);
  return status;
}

export function editionLabel(edition: string): string {
  switch (edition) {
    case 'enterprise':
      return 'Studio Enterprise';
    case 'pro':
      return 'Studio Pro';
    case 'creator':
      return 'Studio Creator';
    default:
      return 'Studio Free';
  }
}
