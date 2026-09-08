-- Demiurge Studio licensing (CD-key style activation, fully offline-capable)

CREATE TYPE studio_edition AS ENUM ('free', 'creator', 'pro', 'enterprise');

CREATE TABLE studio_license_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_hash CHAR(64) NOT NULL UNIQUE,
    edition studio_edition NOT NULL,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    max_activations INTEGER NOT NULL DEFAULT 2 CHECK (max_activations > 0),
    activations_used INTEGER NOT NULL DEFAULT 0 CHECK (activations_used >= 0),
    expires_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_studio_license_keys_edition ON studio_license_keys (edition);

CREATE TABLE studio_activations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key_id UUID NOT NULL REFERENCES studio_license_keys(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    machine_id VARCHAR(128) NOT NULL,
    edition studio_edition NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deactivated_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_studio_activation_user_active
    ON studio_activations (user_id) WHERE is_active = TRUE;

CREATE UNIQUE INDEX idx_studio_activation_license_machine
    ON studio_activations (license_key_id, machine_id);

CREATE INDEX idx_studio_activations_user ON studio_activations (user_id);

COMMENT ON TABLE studio_license_keys IS 'Pre-generated CD-keys for Studio editions (hash stored, not plaintext)';
COMMENT ON TABLE studio_activations IS 'Binds a license key to a QOR user and machine';
