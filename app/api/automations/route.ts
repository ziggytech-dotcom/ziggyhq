import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PRESET_AUTOMATIONS = [
  {
    name: 'New Form Submission → Create Lead',
    trigger_app: 'ziggyintake',
    trigger_event: 'form.submitted',
    actions: [{ type: 'create_record', app: 'ziggyhq', record_type: 'lead', field_map: { full_name: '{{contact_name}}', email: '{{contact_email}}', phone: '{{contact_phone}}', source: 'ZiggyIntake Form' } }]
  },
  {
    name: 'Appointment Booked → Log Contact Activity',
    trigger_app: 'ziggyschedule',
    trigger_event: 'appointment.booked',
    actions: [{ type: 'log_activity', app: 'ziggyhq', activity_type: 'appointment_booked', title: 'Appointment booked via ZiggySchedule' }]
  },
  {
    name: 'Lead Won → Create Invoice Draft',
    trigger_app: 'ziggyhq',
    trigger_event: 'lead.won',
    actions: [{ type: 'create_record', app: 'ziggyinvoice', record_type: 'invoice', field_map: { client_name: '{{contact_name}}', client_email: '{{contact_email}}', status: 'draft' } }]
  },
  {
    name: '5-Star Review → Create Follow-Up Task',
    trigger_app: 'ziggyreviews',
    trigger_event: 'review.received',
    trigger_filters: { min_rating: 5 },
    actions: [{ type: 'create_record', app: 'ziggyhq', record_type: 'task', field_map: { title: 'Follow up with happy customer', notes: '{{reviewer_name}} left a 5-star review' } }]
  },
  {
    name: 'Invoice Paid → Send Thank You Email',
    trigger_app: 'ziggyinvoice',
    trigger_event: 'invoice.paid',
    actions: [{ type: 'send_email', to: '{{client_email}}', subject: 'Thank you for your payment!', body: 'Hi {{client_name}}, thank you for your payment. We appreciate your business!' }]
  },
  // ZiggyHR automations
  {
    name: 'Offer Letter Signed → Create Employee Record',
    trigger_app: 'ziggydocs',
    trigger_event: 'document.signed',
    trigger_filters: { document_type: 'offer_letter' },
    actions: [{ type: 'create_record', app: 'ziggyhr', record_type: 'employee', field_map: { first_name: '{{signer_first_name}}', last_name: '{{signer_last_name}}', email: '{{signer_email}}', status: 'active' } }]
  },
  {
    name: 'New Employee Added → Send Welcome Email',
    trigger_app: 'ziggyhr',
    trigger_event: 'employee.created',
    actions: [{ type: 'send_email', to: '{{employee_email}}', subject: 'Welcome to the team!', body: 'Hi {{employee_first_name}}, welcome aboard! Your onboarding checklist is ready.' }]
  },
  {
    name: 'New Contractor Added → Request W-9',
    trigger_app: 'ziggyhr',
    trigger_event: 'contractor.created',
    actions: [{ type: 'send_email', to: '{{contractor_email}}', subject: 'Please complete your W-9', body: 'Hi {{contractor_first_name}}, please complete your W-9 tax form to receive payments.' }]
  },
  {
    name: 'Employee Terminated → Remove Workspace Access',
    trigger_app: 'ziggyhr',
    trigger_event: 'employee.terminated',
    actions: [{ type: 'update_field', app: 'workspace_members', field: 'status', value: 'removed', match_field: 'email', match_value: '{{employee_email}}' }]
  },
  // ZiggyPayroll automations
  {
    name: 'Payroll Run Completed → Notify Employees',
    trigger_app: 'ziggypayroll',
    trigger_event: 'payroll.completed',
    actions: [{ type: 'send_email', to: '{{employee_email}}', subject: 'Your payment has been processed', body: 'Hi {{employee_name}}, your payment of ${{net_amount}} has been processed and will arrive in your account within 2 business days.' }]
  },
  {
    name: 'New Contractor Added → Set Up in Payroll',
    trigger_app: 'ziggyhr',
    trigger_event: 'contractor.created',
    actions: [{ type: 'create_record', app: 'ziggypayroll', record_type: 'contractor', field_map: { first_name: '{{contractor_first_name}}', last_name: '{{contractor_last_name}}', email: '{{contractor_email}}', pay_type: '1099' } }]
  },
  {
    name: 'Invoice Paid → Create Contractor Payment Record',
    trigger_app: 'ziggyinvoice',
    trigger_event: 'invoice.paid',
    actions: [{ type: 'create_record', app: 'ziggypayroll', record_type: 'payment', field_map: { contractor_email: '{{client_email}}', amount: '{{invoice_amount}}', description: 'Invoice payment - {{invoice_number}}' } }]
  }
]

export async function GET(req: Request) {
  const { data: { user } } = await supabaseAdmin.auth.getUser(
    req.headers.get('authorization')?.replace('Bearer ', '') || ''
  )
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: workspace } = await supabaseAdmin
    .from('workspaces').select('id').eq('owner_id', user.id).single()
  if (!workspace) return NextResponse.json({ automations: [], presets: PRESET_AUTOMATIONS })

  const { data: automations } = await supabaseAdmin
    .from('automations').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false })

  return NextResponse.json({ automations: automations || [], presets: PRESET_AUTOMATIONS })
}

export async function POST(req: Request) {
  const { data: { user } } = await supabaseAdmin.auth.getUser(
    req.headers.get('authorization')?.replace('Bearer ', '') || ''
  )
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: workspace } = await supabaseAdmin
    .from('workspaces').select('id').eq('owner_id', user.id).single()
  if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 404 })

  const body = await req.json()
  const { data, error } = await supabaseAdmin
    .from('automations')
    .insert({ workspace_id: workspace.id, ...body })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ automation: data })
}
