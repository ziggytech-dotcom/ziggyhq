/**
 * Public endpoint -- no auth required.
 * Called by the embeddable form script to submit a lead.
 * POST /api/forms/[id]/submit
 */
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateLeadScore } from '@/lib/lead-score'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const admin = createAdminClient()

  // Look up the form
  const { data: form, error: formError } = await admin
    .from('crm_forms')
    .select('id, org_id, title, widget_key, active')
    .eq('id', id)
    .single()

  if (formError || !form) {
    return Response.json({ error: 'Form not found' }, { status: 404 })
  }
  if (!form.active) {
    return Response.json({ error: 'Form is not active' }, { status: 403 })
  }

  // Extract standard contact fields from submission
  const {
    full_name,
    name,
    email,
    phone,
    company,
    notes,
    message,
    ...extra
  } = body as Record<string, string>

  const contactName = full_name ?? name ?? ''
  if (!contactName.trim()) {
    return Response.json({ error: 'Name is required' }, { status: 400 })
  }

  const leadData = {
    org_id: form.org_id,
    full_name: contactName.trim(),
    email: email?.trim() || null,
    phone: phone?.trim() || null,
    source: form.title, // source = form name
    notes: (notes ?? message) ? `Via form: ${form.title}\n${notes ?? message}` : `Via form: ${form.title}`,
    status: 'active' as const,
    tags: ['Lead Form'],
  }

  // If company is included, store in notes
  if (company) {
    leadData.notes = `Company: ${company}\n${leadData.notes}`
  }

  // Add any extra fields to notes
  const extraEntries = Object.entries(extra).filter(([, v]) => v)
  if (extraEntries.length > 0) {
    const extraText = extraEntries.map(([k, v]) => `${k}: ${v}`).join('\n')
    leadData.notes = `${leadData.notes}\n${extraText}`
  }

  const breakdown = calculateLeadScore({
    source: form.title,
    email: leadData.email ?? undefined,
    phone: leadData.phone ?? undefined,
  })

  const { data: lead, error: leadError } = await admin
    .from('crm_leads')
    .insert({
      ...leadData,
      lead_score: breakdown.total,
      score_breakdown_json: breakdown,
    })
    .select('id')
    .single()

  if (leadError) {
    return Response.json({ error: leadError.message }, { status: 500 })
  }

  // Record the submission
  await admin.from('crm_form_submissions').insert({
    form_id: form.id,
    org_id: form.org_id,
    lead_id: lead.id,
    data: body,
  })

  // Increment submission count by counting actual submissions
  const { count } = await admin
    .from('crm_form_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('form_id', form.id)
  
  await admin
    .from('crm_forms')
    .update({ submission_count: count ?? 1, updated_at: new Date().toISOString() })
    .eq('id', form.id)

  return Response.json({ success: true, lead_id: lead.id }, { status: 201 })
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
