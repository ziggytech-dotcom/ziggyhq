-- Create core tables that are missing (crm_organizations, crm_users, crm_leads)
-- Also create auth trigger to auto-create user profiles on signup

-- crm_organizations table
CREATE TABLE IF NOT EXISTS public.crm_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- crm_users table (links auth.users to organizations)
CREATE TABLE IF NOT EXISTS public.crm_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES crm_organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_users_org ON crm_users(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_users_email ON crm_users(email);

-- crm_leads table (core data model)
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES crm_organizations(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  title TEXT,
  stage TEXT DEFAULT 'new',
  lead_score INT DEFAULT 0,
  score_breakdown_json JSONB DEFAULT '{}',
  stage_entered_at TIMESTAMPTZ DEFAULT NOW(),
  last_contacted_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_leads_org ON crm_leads(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_stage ON crm_leads(stage);
CREATE INDEX IF NOT EXISTS idx_crm_leads_org_stage ON crm_leads(org_id, stage);
CREATE INDEX IF NOT EXISTS idx_crm_leads_score ON crm_leads(org_id, lead_score DESC);

-- Function to handle new auth user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Create default organization for user
  INSERT INTO public.crm_organizations (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email) || '''s Workspace')
  RETURNING id INTO org_id;
  
  -- Create user profile linked to their organization
  INSERT INTO public.crm_users (id, org_id, email, full_name)
  VALUES (
    NEW.id,
    org_id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies
ALTER TABLE crm_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

-- Organizations: users can see their own org
DROP POLICY IF EXISTS "Users can view own organization" ON crm_organizations;
CREATE POLICY "Users can view own organization"
  ON crm_organizations FOR SELECT
  USING (id IN (SELECT org_id FROM crm_users WHERE id = auth.uid()));

-- Users: users can see all users in their org
DROP POLICY IF EXISTS "Users can view org members" ON crm_users;
CREATE POLICY "Users can view org members"
  ON crm_users FOR SELECT
  USING (org_id IN (SELECT org_id FROM crm_users WHERE id = auth.uid()));

-- Leads: users can see leads in their org
DROP POLICY IF EXISTS "Users can view org leads" ON crm_leads;
CREATE POLICY "Users can view org leads"
  ON crm_leads FOR SELECT
  USING (org_id IN (SELECT org_id FROM crm_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert leads in their org" ON crm_leads;
CREATE POLICY "Users can insert leads in their org"
  ON crm_leads FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM crm_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update leads in their org" ON crm_leads;
CREATE POLICY "Users can update leads in their org"
  ON crm_leads FOR UPDATE
  USING (org_id IN (SELECT org_id FROM crm_users WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM crm_users WHERE id = auth.uid()));
