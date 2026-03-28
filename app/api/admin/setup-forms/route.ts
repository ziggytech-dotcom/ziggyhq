/**
 * One-time setup endpoint to create lead capture forms tables.
 * Hit GET /api/admin/setup-forms to create tables if they don't exist.
 * Uses service role key — authenticated via SETUP_SECRET env var.
 */
import { createAdminClient } from '@/lib/supabase/admin'

const SETUP_SECRET = process.env.SETUP_SECRET ?? 'ziggyhq-setup-2026'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  if (secret !== SETUP_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // We can't run DDL via the JS client directly, but we can check if tables exist
  // and return instructions if they don't.
  const admin = createAdminClient()
  
  // Try to query the crm_forms table
  const { error: formsError } = await admin.from('crm_forms').select('id').limit(1)
  const { error: subsError } = await admin.from('crm_form_submissions').select('id').limit(1)
  
  if (!formsError && !subsError) {
    return Response.json({ 
      status: 'ok', 
      message: 'Tables already exist and are accessible.',
      tables: ['crm_forms', 'crm_form_submissions']
    })
  }

  // Tables don't exist — return the SQL to run
  const sql = `
-- Run this SQL in your Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/tabrmsrxtqnuwivgwggb/sql/new

CREATE TABLE IF NOT EXISTS crm_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES crm_organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  fields JSONB NOT NULL DEFAULT '[]',
  widget_key TEXT NOT NULL,
  submission_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_forms_org_id ON crm_forms(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_forms_widget_key ON crm_forms(widget_key);

CREATE TABLE IF NOT EXISTS crm_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES crm_forms(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES crm_organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_form_submissions_form_id ON crm_form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_crm_form_submissions_org_id ON crm_form_submissions(org_id);
`

  return Response.json({
    status: 'tables_missing',
    message: 'Tables do not exist yet. Run the SQL below in the Supabase dashboard.',
    formsTableError: formsError?.message,
    submissionsTableError: subsError?.message,
    sql,
    dashboard: 'https://supabase.com/dashboard/project/tabrmsrxtqnuwivgwggb/sql/new',
  })
}
