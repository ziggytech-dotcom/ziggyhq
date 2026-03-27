-- Lead routing rules table
CREATE TABLE IF NOT EXISTS crm_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES crm_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,  -- lower = higher priority
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  -- Conditions (all must match — AND logic)
  match_source TEXT,          -- match leads from this source
  match_score_min INTEGER,    -- match leads with score >= this
  match_score_max INTEGER,
  match_stage TEXT,           -- match leads entering this stage
  -- Action
  action TEXT NOT NULL DEFAULT 'assign',  -- 'assign' | 'round_robin'
  assign_to_user_id UUID REFERENCES crm_users(id) ON DELETE SET NULL,
  -- round_robin config stored in settings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Round-robin state table (tracks whose turn it is per org)
CREATE TABLE IF NOT EXISTS crm_routing_round_robin (
  org_id UUID PRIMARY KEY REFERENCES crm_organizations(id) ON DELETE CASCADE,
  agent_ids UUID[] NOT NULL DEFAULT '{}',
  current_index INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_routing_rules_org ON crm_routing_rules(org_id, is_active, priority);
