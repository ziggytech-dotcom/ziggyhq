import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Upsert a contact into shared_contacts (non-fatal if it fails)
 * Returns the contact ID if successful, null otherwise
 */
export async function upsertSharedContact(
  workspaceId: string,
  contact: {
    email?: string
    first_name?: string
    last_name?: string
    phone?: string
    company?: string
    source_app: string
  }
): Promise<string | null> {
  if (!contact.email && !contact.phone) return null

  try {
    const { data, error } = await supabaseAdmin
      .from('shared_contacts')
      .upsert(
        {
          workspace_id: workspaceId,
          ...contact,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'workspace_id,email', ignoreDuplicates: false }
      )
      .select('id')
      .single()

    if (error) {
      console.error('[shared_contacts] upsert error:', error.message)
      return null
    }
    return data?.id ?? null
  } catch (e) {
    console.error('[shared_contacts] upsert failed:', e)
    return null
  }
}

/**
 * Log a cross-app activity on a shared contact
 */
export async function logContactActivity(
  contactId: string,
  workspaceId: string,
  activity: {
    app: string
    type: string
    title: string
    body?: string
    metadata?: Record<string, unknown>
  }
): Promise<void> {
  try {
    await supabaseAdmin.from('contact_activities').insert({
      contact_id: contactId,
      workspace_id: workspaceId,
      ...activity,
    })
  } catch (e) {
    console.error('[contact_activities] log failed:', e)
  }
}

/**
 * Convert a workspace from standalone to hub mode (lossless)
 */
export async function convertWorkspaceToHub(workspaceId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('workspaces')
    .update({ mode: 'hub' })
    .eq('id', workspaceId)

  if (error) throw error
  return true
}

/**
 * Get or create a workspace record for an org
 */
export async function getOrCreateWorkspace(
  orgId: string,
  name: string,
  ownerId: string
): Promise<string> {
  // Check if workspace already exists for this org
  const { data: existing } = await supabaseAdmin
    .from('workspaces')
    .select('id')
    .eq('owner_id', ownerId)
    .single()

  if (existing?.id) return existing.id

  const { data, error } = await supabaseAdmin
    .from('workspaces')
    .insert({ name, owner_id: ownerId })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}
