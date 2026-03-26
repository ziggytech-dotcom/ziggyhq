'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'

interface Lead {
  id: string
  full_name: string
  phone: string | null
  source: string | null
  stage: string | null
  lead_score: number
  budget_min: number | null
  budget_max: number | null
  assigned_to: string | null
  stage_entered_at: string | null
  created_at: string
  users?: { full_name: string | null; email: string } | null
}

const STAGE_COLORS: Record<string, string> = {
  'New Lead':        '#3b82f6',
  'Contacted':       '#8b5cf6',
  'Appointment Set': '#f59e0b',
  'Showing':         '#06b6d4',
  'Offer Made':      '#f97316',
  'Under Contract':  '#22c55e',
  'Closed Won':      '#ff006e',
  'Closed Lost':     '#b3b3b3',
}

function daysInStage(lead: Lead): number {
  const since = lead.stage_entered_at ?? lead.created_at
  return Math.floor((Date.now() - new Date(since).getTime()) / 86400000)
}

function formatBudget(min: number | null, max: number | null): string {
  if (!min && !max) return ''
  const fmt = (n: number) => n >= 1000000 ? `$${(n/1000000).toFixed(1)}M` : `$${Math.round(n/1000)}K`
  if (min && max) return `${fmt(min)}–${fmt(max)}`
  if (max) return `Up to ${fmt(max)}`
  return `${fmt(min!)}+`
}

// ── Draggable Lead Card ────────────────────────────────────────────────────────
function LeadCard({ lead, onClick }: { lead: Lead; onClick: (l: Lead) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id })
  const days = daysInStage(lead)
  const scoreColor = lead.lead_score >= 70 ? '#22c55e' : lead.lead_score >= 40 ? '#f59e0b' : '#ff006e'

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onClick(lead)}
      style={{
        transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined,
        opacity: isDragging ? 0.4 : 1,
        cursor: 'grab',
      }}
      className="bg-[#0a0a0a] border border-[#2d2d2d] rounded-lg p-3 hover:border-[#ff006e]/40 transition-colors select-none"
    >
      <div className="font-medium text-sm text-white mb-1 truncate">{lead.full_name}</div>
      {lead.phone && <div className="text-xs text-[#b3b3b3] mb-1">{lead.phone}</div>}
      {lead.source && <div className="text-xs text-[#b3b3b3]/60 mb-2">{lead.source}</div>}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-12 h-1 bg-[#2d2d2d] rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${lead.lead_score}%`, backgroundColor: scoreColor }} />
          </div>
          <span className="text-xs" style={{ color: scoreColor }}>{lead.lead_score}</span>
        </div>
        <span className="text-xs text-[#b3b3b3]/60">{days}d</span>
      </div>

      {(lead.budget_min || lead.budget_max) && (
        <div className="text-xs text-[#b3b3b3] mt-1.5">{formatBudget(lead.budget_min, lead.budget_max)}</div>
      )}

      {lead.users && (
        <div className="mt-2 flex items-center gap-1">
          <div className="w-4 h-4 rounded-full bg-[#ff006e]/20 flex items-center justify-center">
            <span className="text-[8px] text-[#ff006e] font-semibold">
              {(lead.users.full_name ?? lead.users.email).charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-xs text-[#b3b3b3]/60 truncate">{lead.users.full_name ?? lead.users.email}</span>
        </div>
      )}
    </div>
  )
}

// ── Stage Column (droppable) ───────────────────────────────────────────────────
function StageColumn({
  stage,
  leads,
  onCardClick,
}: {
  stage: string
  leads: Lead[]
  onCardClick: (l: Lead) => void
}) {
  const { isOver, setNodeRef } = useDroppable({ id: stage })
  const color = STAGE_COLORS[stage] ?? '#b3b3b3'
  const totalValue = leads.reduce((sum, l) => sum + (l.budget_max ?? l.budget_min ?? 0), 0)

  return (
    <div className="flex-shrink-0 w-64 flex flex-col">
      <div className="mb-2 px-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs font-semibold text-white uppercase tracking-wide">{stage}</span>
          </div>
          <span className="text-xs text-[#b3b3b3] bg-[#2d2d2d] px-1.5 py-0.5 rounded-full">{leads.length}</span>
        </div>
        {totalValue > 0 && (
          <div className="text-xs text-[#b3b3b3]/60 px-4">{formatBudget(null, totalValue)}</div>
        )}
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 min-h-48 rounded-xl p-2 space-y-2 transition-colors"
        style={{ backgroundColor: isOver ? `${color}10` : '#1a1a1a', border: `1px solid ${isOver ? color + '40' : '#2d2d2d'}` }}
      >
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onClick={onCardClick} />
        ))}
        {leads.length === 0 && (
          <div className="text-xs text-[#b3b3b3]/40 text-center py-6">Drop leads here</div>
        )}
      </div>
    </div>
  )
}

// ── Lead Detail Sidebar ────────────────────────────────────────────────────────
function LeadSidebar({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const color = STAGE_COLORS[lead.stage ?? ''] ?? '#b3b3b3'
  const days = daysInStage(lead)
  const scoreColor = lead.lead_score >= 70 ? '#22c55e' : lead.lead_score >= 40 ? '#f59e0b' : '#ff006e'

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#1a1a1a] border-l border-[#2d2d2d] h-full overflow-y-auto">
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#2d2d2d] px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white truncate">{lead.full_name}</h2>
          <button onClick={onClose} className="text-[#b3b3b3] hover:text-white ml-4 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Stage badge */}
          {lead.stage && (
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-sm font-medium" style={{ color }}>{lead.stage}</span>
              <span className="text-xs text-[#b3b3b3]">· {days} day{days !== 1 ? 's' : ''} in stage</span>
            </div>
          )}

          {/* Contact info */}
          <div className="space-y-2">
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="flex items-center gap-3 text-sm text-[#b3b3b3] hover:text-white">
                <svg className="w-4 h-4 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                {lead.phone}
              </a>
            )}
            {lead.source && (
              <div className="flex items-center gap-3 text-sm text-[#b3b3b3]">
                <svg className="w-4 h-4 text-[#8b5cf6]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                Source: {lead.source}
              </div>
            )}
          </div>

          {/* Score */}
          <div className="bg-[#0a0a0a] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#b3b3b3]">Lead Score</span>
              <span className="text-lg font-bold" style={{ color: scoreColor }}>{lead.lead_score}</span>
            </div>
            <div className="h-2 bg-[#2d2d2d] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${lead.lead_score}%`, backgroundColor: scoreColor }} />
            </div>
          </div>

          {/* Budget */}
          {(lead.budget_min || lead.budget_max) && (
            <div className="bg-[#0a0a0a] rounded-lg p-4">
              <div className="text-xs font-medium text-[#b3b3b3] mb-1">Budget</div>
              <div className="text-sm text-white">{formatBudget(lead.budget_min, lead.budget_max)}</div>
            </div>
          )}

          {/* Agent */}
          {lead.users && (
            <div className="bg-[#0a0a0a] rounded-lg p-4">
              <div className="text-xs font-medium text-[#b3b3b3] mb-2">Assigned Agent</div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#ff006e]/20 border border-[#ff006e]/30 flex items-center justify-center">
                  <span className="text-xs text-[#ff006e] font-semibold">
                    {(lead.users.full_name ?? lead.users.email).charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-white">{lead.users.full_name ?? lead.users.email}</span>
              </div>
            </div>
          )}

          <Link
            href={`/app/leads/${lead.id}`}
            className="block w-full py-2.5 text-center rounded-lg bg-[#ff006e] text-white text-sm font-medium hover:bg-[#ff006e]/90 transition-colors"
          >
            Open Full Lead Profile →
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [stages, setStages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const load = useCallback(async () => {
    const [leadsRes, settingsRes] = await Promise.all([
      fetch('/api/leads?limit=500'),
      fetch('/api/settings'),
    ])
    if (leadsRes.ok) {
      const d = await leadsRes.json()
      setLeads(d.leads ?? [])
    }
    if (settingsRes.ok) {
      const s = await settingsRes.json()
      const pipelineStages: string[] = s.settings_json?.pipeline_stages ?? []
      setStages(pipelineStages.length > 0 ? pipelineStages : [
        'New Lead', 'Contacted', 'Appointment Set', 'Showing', 'Offer Made', 'Under Contract', 'Closed Won', 'Closed Lost',
      ])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const activeLeadObj = activeId ? leads.find((l) => l.id === activeId) ?? null : null

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(e.active.id as string)
  }

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const leadId = active.id as string
    const newStage = over.id as string
    const lead = leads.find((l) => l.id === leadId)
    if (!lead || lead.stage === newStage) return

    // Optimistic update
    setLeads((prev) => prev.map((l) =>
      l.id === leadId ? { ...l, stage: newStage, stage_entered_at: new Date().toISOString() } : l
    ))

    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage, stage_entered_at: new Date().toISOString() }),
    })
  }

  const leadsByStage = stages.reduce<Record<string, Lead[]>>((acc, stage) => {
    acc[stage] = leads.filter((l) => l.stage === stage)
    return acc
  }, {})

  const totalLeads = leads.length
  const totalValue = leads.reduce((sum, l) => sum + (l.budget_max ?? l.budget_min ?? 0), 0)

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#2d2d2d] flex items-center justify-between flex-shrink-0">
        <div>
          <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '36px', letterSpacing: '0.05em', color: '#ededed' }}>
            PIPELINE
          </h1>
          <p className="text-[#b3b3b3] text-sm mt-1">
            {totalLeads} lead{totalLeads !== 1 ? 's' : ''}
            {totalValue > 0 && <span> · {formatBudget(null, totalValue)} pipeline value</span>}
          </p>
        </div>
        <Link
          href="/app/leads"
          className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#2d2d2d] text-[#b3b3b3] rounded-lg text-sm hover:text-white hover:border-[#ff006e]/40 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          List View
        </Link>
      </div>

      {/* Board */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-[#b3b3b3] text-sm">Loading pipeline...</div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 p-6 min-h-full h-full" style={{ width: 'max-content' }}>
              {stages.map((stage) => (
                <StageColumn
                  key={stage}
                  stage={stage}
                  leads={leadsByStage[stage] ?? []}
                  onCardClick={setSelectedLead}
                />
              ))}
              {/* Unstaged */}
              {leads.filter((l) => !l.stage || !stages.includes(l.stage)).length > 0 && (
                <StageColumn
                  stage="No Stage"
                  leads={leads.filter((l) => !l.stage || !stages.includes(l.stage))}
                  onCardClick={setSelectedLead}
                />
              )}
            </div>

            <DragOverlay>
              {activeLeadObj && (
                <div className="bg-[#0a0a0a] border border-[#ff006e]/40 rounded-lg p-3 shadow-2xl w-64 rotate-2">
                  <div className="font-medium text-sm text-white truncate">{activeLeadObj.full_name}</div>
                  {activeLeadObj.phone && <div className="text-xs text-[#b3b3b3]">{activeLeadObj.phone}</div>}
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {/* Lead detail sidebar */}
      {selectedLead && <LeadSidebar lead={selectedLead} onClose={() => setSelectedLead(null)} />}
    </div>
  )
}
