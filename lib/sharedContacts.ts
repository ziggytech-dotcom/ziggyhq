import { createAdminClient } from './supabase/admin'

export interface SharedContactData {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  company?: string | null
  external_ids?: Record<string, string>
}

/**
 * Upsert a contact into the shared_contacts table (best-effort, non-fatal).
 * source: 'ziggyhq' -- identifies this record came from ZiggyHQ CRM.
 * workspace_id: the org_id used throughout ZiggyHQ (matches hub workspace).
 */
export async function upsertSharedContact(
  workspaceId: string,
  data: SharedContactData,
  externalId?: string,
): Promise<void> {
  try {
    const supabase = createAdminClient()

    const payload = {
      workspace_id: workspaceId,
      source: 'ziggyhq' as const,
      first_name: data.first_name ?? null,
      last_name: data.last_name ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      company: data.company ?? null,
      external_ids: externalId ? { ziggyhq_lead_id: externalId } : {},
      updated_at: new Date().toISOString(),
    }

    if (data.email) {
      // Check if contact already exists by workspace + email
      const { data: existing } = await supabase
        .from('shared_contacts')
        .select('id, external_ids')
        .eq('workspace_id', workspaceId)
        .eq('email', data.email)
        .single()

      if (existing) {
        const mergedIds = {
          ...(existing.external_ids as Record<string, string> ?? {}),
          ...(payload.external_ids as Record<string, string>),
        }
        await supabase
          .from('shared_contacts')
          .update({ ...payload, external_ids: mergedIds })
          .eq('id', existing.id)
      } else {
        await supabase.from('shared_contacts').insert(payload)
      }
    } else {
      // No email -- always insert (can't deduplicate without email)
      await supabase.from('shared_contacts').insert(payload)
    }
  } catch {
    // Best-effort -- never fail the primary operation due to shared contacts
  }
}
