import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { workspace_id, trigger_app, trigger_event, data } = await req.json()
  if (!workspace_id || !trigger_app || !trigger_event) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Find matching automations
  const { data: automations } = await supabaseAdmin
    .from('automations')
    .select('*')
    .eq('workspace_id', workspace_id)
    .eq('trigger_app', trigger_app)
    .eq('trigger_event', trigger_event)
    .eq('enabled', true)

  if (!automations?.length) return NextResponse.json({ triggered: 0 })

  // Execute each automation's actions (simplified runner)
  let triggered = 0
  for (const automation of automations) {
    try {
      for (const action of automation.actions || []) {
        if (action.type === 'send_email' && action.to && data[action.to.replace('{{','').replace('}}','')]) {
          // Email sending via Resend would go here
          console.log(`[automation] Would send email to ${action.to}`)
        }
        if (action.type === 'create_record') {
          // Record creation in target app would go here
          console.log(`[automation] Would create ${action.record_type} in ${action.app}`)
        }
      }
      // Log the run
      await supabaseAdmin.from('automation_runs').insert({
        automation_id: automation.id,
        workspace_id,
        status: 'success',
        trigger_data: data,
        result: { actions_count: automation.actions?.length || 0 }
      })
      // Increment run count
      await supabaseAdmin.from('automations').update({ run_count: (automation.run_count || 0) + 1 }).eq('id', automation.id)
      triggered++
    } catch (e) {
      await supabaseAdmin.from('automation_runs').insert({
        automation_id: automation.id,
        workspace_id,
        status: 'failed',
        trigger_data: data,
        result: { error: String(e) }
      })
    }
  }

  return NextResponse.json({ triggered })
}
