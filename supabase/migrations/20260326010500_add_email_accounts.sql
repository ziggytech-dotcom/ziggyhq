CREATE TABLE IF NOT EXISTS crm_email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES crm_organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES crm_users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'gmail',
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  sync_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  history_id TEXT, -- Gmail history ID for incremental sync
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, email)
);

CREATE INDEX IF NOT EXISTS idx_crm_email_accounts_org ON crm_email_accounts(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_email_accounts_user ON crm_email_accounts(user_id);
