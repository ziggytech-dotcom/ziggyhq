'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'

// All fields we can map to
const CRM_FIELDS = [
  { key: 'full_name', label: 'Full Name', required: true },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'email_2', label: 'Email 2' },
  { key: 'phone_2', label: 'Phone 2' },
  { key: 'co_buyer_name', label: 'Co-Buyer Name' },
  { key: 'stage', label: 'Stage' },
  { key: 'source', label: 'Lead Source' },
  { key: 'status', label: 'Status' },
  { key: 'tags', label: 'Tags (comma separated)' },
  { key: 'notes', label: 'Notes' },
  { key: 'budget_min', label: 'Budget Min' },
  { key: 'budget_max', label: 'Budget Max' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'property_type', label: 'Property Type' },
  { key: 'assigned_to_email', label: 'Assigned Agent Email' },
  { key: 'next_followup_at', label: 'Next Follow-up Date' },
]

// Auto-mapping rules -- detect common CSV column names from FUB, kvCORE, etc.
const AUTO_MAP: Record<string, string> = {
  'first name': '', 'last name': '', // handled specially below
  'full name': 'full_name', 'name': 'full_name', 'contact name': 'full_name',
  'email': 'email', 'email address': 'email', 'primary email': 'email',
  'email 2': 'email_2', 'secondary email': 'email_2',
  'phone': 'phone', 'phone number': 'phone', 'mobile': 'phone', 'cell': 'phone', 'primary phone': 'phone',
  'phone 2': 'phone_2', 'secondary phone': 'phone_2',
  'co buyer': 'co_buyer_name', 'co-buyer': 'co_buyer_name', 'spouse': 'co_buyer_name', 'partner': 'co_buyer_name',
  'stage': 'stage', 'pipeline stage': 'stage', 'status': 'status',
  'source': 'source', 'lead source': 'source',
  'tags': 'tags', 'tag': 'tags',
  'notes': 'notes', 'note': 'notes', 'description': 'notes',
  'budget min': 'budget_min', 'min budget': 'budget_min', 'price min': 'budget_min',
  'budget max': 'budget_max', 'max budget': 'budget_max', 'price max': 'budget_max',
  'timeline': 'timeline', 'timeframe': 'timeline',
  'property type': 'property_type', 'type': 'property_type',
  'assigned to': 'assigned_to_email', 'agent': 'assigned_to_email', 'assigned agent': 'assigned_to_email',
  'follow up': 'next_followup_at', 'next follow up': 'next_followup_at', 'follow-up date': 'next_followup_at',
}

// FUB template columns
const FUB_TEMPLATE = ['First Name', 'Last Name', 'Email', 'Phone', 'Stage', 'Source', 'Tags', 'Notes', 'Assigned To']
const GENERIC_TEMPLATE = ['Full Name', 'Email', 'Phone', 'Stage', 'Source', 'Tags', 'Notes', 'Budget Min', 'Budget Max', 'Timeline', 'Property Type']

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return { headers: [], rows: [] }
  const parseRow = (line: string) => {
    const result: string[] = []
    let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') { inQ = !inQ; continue }
      if (c === ',' && !inQ) { result.push(cur.trim()); cur = ''; continue }
      cur += c
    }
    result.push(cur.trim())
    return result
  }
  const headers = parseRow(lines[0])
  const rows = lines.slice(1).map(parseRow).filter((r) => r.some((c) => c.trim()))
  return { headers, rows }
}

function buildMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  const hasFirst = headers.some((h) => h.toLowerCase() === 'first name')
  const hasLast = headers.some((h) => h.toLowerCase() === 'last name')
  for (const h of headers) {
    const norm = h.toLowerCase().trim()
    if (hasFirst && hasLast && (norm === 'first name' || norm === 'last name')) {
      mapping[h] = '__name_part'
      continue
    }
    mapping[h] = AUTO_MAP[norm] ?? ''
  }
  return mapping
}

function rowsToLeads(headers: string[], rows: string[][], mapping: Record<string, string>) {
  const firstIdx = headers.findIndex((h) => h.toLowerCase() === 'first name')
  const lastIdx = headers.findIndex((h) => h.toLowerCase() === 'last name')
  const hasNameParts = firstIdx >= 0 && lastIdx >= 0 && mapping[headers[firstIdx]] === '__name_part'

  return rows.map((row) => {
    const lead: Record<string, string> = {}
    if (hasNameParts) {
      const first = row[firstIdx]?.trim() ?? ''
      const last = row[lastIdx]?.trim() ?? ''
      lead['full_name'] = `${first} ${last}`.trim()
    }
    headers.forEach((h, i) => {
      const field = mapping[h]
      if (!field || field === '__name_part') return
      if (row[i]?.trim()) lead[field] = row[i].trim()
    })
    return lead
  })
}

function downloadTemplate(type: 'fub' | 'generic') {
  const cols = type === 'fub' ? FUB_TEMPLATE : GENERIC_TEMPLATE
  const csv = cols.join(',') + '\n'
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = type === 'fub' ? 'ziggyhq-fub-import.csv' : 'ziggyhq-import-template.csv'
  a.click()
}

type Step = 'upload' | 'map' | 'preview' | 'done'

interface ImportResult {
  imported: number
  skipped: { row: number; reason: string; name: string }[]
  warnings: { row: number; message: string; name: string }[]
}

export default function ImportPage() {
  const [step, setStep] = useState<Step>('upload')
  const [headers, setHeaders] = useState<string[]>([])
  const [csvRows, setCsvRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [previewStats, setPreviewStats] = useState<{ toImport: number; skipped: ImportResult['skipped']; warnings: ImportResult['warnings'] } | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError('Please upload a CSV file')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const { headers: h, rows: r } = parseCSV(text)
      if (h.length === 0) { setError('Could not parse CSV -- is the file empty?'); return }
      setHeaders(h)
      setCsvRows(r)
      setMapping(buildMapping(h))
      setError(null)
      setStep('map')
    }
    reader.readAsText(file)
  }, [])

  const runPreview = async () => {
    setLoading(true)
    setError(null)
    const leads = rowsToLeads(headers, csvRows, mapping)
    const res = await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: leads, dryRun: true }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    setPreview(data.preview ?? [])
    setPreviewStats({ toImport: data.toImport, skipped: data.skipped, warnings: data.warnings })
    setStep('preview')
    setLoading(false)
  }

  const runImport = async () => {
    setLoading(true)
    setError(null)
    const leads = rowsToLeads(headers, csvRows, mapping)
    const res = await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: leads, dryRun: false }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    setResult(data)
    setStep('done')
    setLoading(false)
  }

  const reset = () => {
    setStep('upload'); setHeaders([]); setCsvRows([]); setMapping({})
    setPreview([]); setPreviewStats(null); setResult(null); setError(null)
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/app/leads" className="text-[#b3b3b3] hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '32px', letterSpacing: '0.05em', color: '#ededed' }}>
          IMPORT LEADS
        </h1>
      </div>
      <p className="text-[#b3b3b3] text-sm mb-6 ml-8">Import from Follow Up Boss, kvCORE, BoomTown, or any CRM that exports CSV.</p>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8 ml-8">
        {(['upload', 'map', 'preview', 'done'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === s ? 'bg-[#0ea5e9] text-white' : (['upload','map','preview','done'].indexOf(step) > i) ? 'bg-[#22c55e] text-white' : 'bg-[#2d2d2d] text-[#b3b3b3]'}`}>
              {(['upload','map','preview','done'].indexOf(step) > i) ? '✓' : i + 1}
            </div>
            <span className={`text-xs capitalize ${step === s ? 'text-white' : 'text-[#b3b3b3]'}`}>{s}</span>
            {i < 3 && <div className="w-6 h-px bg-[#2d2d2d]" />}
          </div>
        ))}
      </div>

      <div className="ml-8">
        {error && <div className="mb-4 px-4 py-3 rounded-lg bg-red-900/20 border border-red-900/40 text-red-400 text-sm">{error}</div>}

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${dragging ? 'border-[#0ea5e9] bg-[#0ea5e9]/5' : 'border-[#2d2d2d] hover:border-[#0ea5e9]/50'}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              onClick={() => fileRef.current?.click()}
            >
              <div className="text-4xl mb-3">📁</div>
              <div className="text-white font-medium mb-1">Drop your CSV file here</div>
              <div className="text-[#b3b3b3] text-sm">or click to browse</div>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            </div>

            <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
              <div className="text-sm font-medium text-white mb-3">Download a template</div>
              <div className="flex gap-3">
                <button onClick={() => downloadTemplate('fub')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2d2d2d] text-[#b3b3b3] text-sm hover:text-white hover:bg-[#3d3d3d] transition-colors">
                  <span>📥</span> Follow Up Boss Template
                </button>
                <button onClick={() => downloadTemplate('generic')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2d2d2d] text-[#b3b3b3] text-sm hover:text-white hover:bg-[#3d3d3d] transition-colors">
                  <span>📥</span> Generic Template
                </button>
              </div>
              <p className="text-xs text-[#b3b3b3] mt-3">
                In Follow Up Boss: go to <span className="text-white">People → ⋮ → Export</span> and download the CSV. Upload it directly here &mdash; columns are auto-mapped.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Map columns */}
        {step === 'map' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-[#b3b3b3]">{csvRows.length} rows detected &middot; Map your columns below</div>
              <button onClick={reset} className="text-xs text-[#b3b3b3] hover:text-white transition-colors">← Start over</button>
            </div>
            <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl overflow-hidden">
              <div className="grid grid-cols-2 gap-px bg-[#2d2d2d]">
                <div className="bg-[#1a1a1a] px-4 py-2 text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider">Your Column</div>
                <div className="bg-[#1a1a1a] px-4 py-2 text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider">Maps to ZiggyHQ Field</div>
              </div>
              <div className="divide-y divide-[#2d2d2d]">
                {headers.map((h) => (
                  <div key={h} className="grid grid-cols-2 gap-px bg-[#2d2d2d]">
                    <div className="bg-[#1a1a1a] px-4 py-2.5 text-sm text-white flex items-center">{h}</div>
                    <div className="bg-[#1a1a1a] px-4 py-1.5">
                      <select
                        value={mapping[h] ?? ''}
                        onChange={(e) => setMapping((prev) => ({ ...prev, [h]: e.target.value }))}
                        className="w-full px-2 py-1 rounded bg-[#0a0a0a] border border-[#2d2d2d] text-sm text-white focus:outline-none focus:border-[#0ea5e9]"
                      >
                        <option value="">&mdash; Skip this column &mdash;</option>
                        {mapping[h] === '__name_part' && <option value="__name_part">Name part (auto-combined)</option>}
                        {CRM_FIELDS.map((f) => <option key={f.key} value={f.key}>{f.label}{f.required ? ' *' : ''}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={runPreview} disabled={loading} className="px-6 py-2.5 rounded-lg bg-[#0ea5e9] text-white font-medium text-sm hover:bg-[#0ea5e9]/90 disabled:opacity-50 transition-colors">
              {loading ? 'Processing...' : 'Preview Import →'}
            </button>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && previewStats && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-[#22c55e]">{previewStats.toImport}</div>
                <div className="text-xs text-[#b3b3b3] mt-0.5">Will import</div>
              </div>
              <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-[#f59e0b]">{previewStats.skipped.length}</div>
                <div className="text-xs text-[#b3b3b3] mt-0.5">Skipped (duplicates)</div>
              </div>
              <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-[#b3b3b3]">{previewStats.warnings.length}</div>
                <div className="text-xs text-[#b3b3b3] mt-0.5">Warnings</div>
              </div>
            </div>

            {/* Skipped list */}
            {previewStats.skipped.length > 0 && (
              <div className="bg-[#1a1a1a] border border-[#f59e0b]/20 rounded-xl p-4">
                <div className="text-xs font-semibold text-[#f59e0b] uppercase tracking-wider mb-2">Skipped ({previewStats.skipped.length})</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {previewStats.skipped.slice(0, 20).map((s, i) => (
                    <div key={i} className="text-xs text-[#b3b3b3]"><span className="text-white">{s.name}</span> &mdash; {s.reason}</div>
                  ))}
                  {previewStats.skipped.length > 20 && <div className="text-xs text-[#b3b3b3]">...and {previewStats.skipped.length - 20} more</div>}
                </div>
              </div>
            )}

            {/* Preview rows */}
            {preview.length > 0 && (
              <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-4">
                <div className="text-xs font-semibold text-[#b3b3b3] uppercase tracking-wider mb-3">Preview (first {preview.length} leads)</div>
                <div className="space-y-2">
                  {preview.map((lead, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className="text-white font-medium w-40 truncate">{lead.full_name || '(no name)'}</span>
                      <span className="text-[#b3b3b3] truncate">{lead.email || lead.phone || '--'}</span>
                      {lead.stage && <span className="px-1.5 py-0.5 rounded bg-[#2d2d2d] text-[#b3b3b3] text-[10px]">{lead.stage}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep('map')} className="px-4 py-2.5 rounded-lg border border-[#2d2d2d] text-[#b3b3b3] text-sm hover:text-white transition-colors">← Back</button>
              <button onClick={runImport} disabled={loading || previewStats.toImport === 0} className="px-6 py-2.5 rounded-lg bg-[#0ea5e9] text-white font-medium text-sm hover:bg-[#0ea5e9]/90 disabled:opacity-50 transition-colors">
                {loading ? 'Importing...' : `Import ${previewStats.toImport} Leads →`}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 'done' && result && (
          <div className="space-y-4">
            <div className="bg-[#1a1a1a] border border-[#22c55e]/30 rounded-xl p-8 text-center">
              <div className="text-4xl mb-3">✅</div>
              <div className="text-2xl font-bold text-[#22c55e] mb-1">{result.imported} leads imported</div>
              {result.skipped.length > 0 && <div className="text-[#b3b3b3] text-sm">{result.skipped.length} skipped (duplicates)</div>}
              {result.warnings.length > 0 && <div className="text-[#f59e0b] text-sm mt-1">{result.warnings.length} warnings</div>}
            </div>
            <div className="flex gap-3">
              <Link href="/app/leads" className="px-6 py-2.5 rounded-lg bg-[#0ea5e9] text-white font-medium text-sm hover:bg-[#0ea5e9]/90 transition-colors">
                View Leads →
              </Link>
              <button onClick={reset} className="px-4 py-2.5 rounded-lg border border-[#2d2d2d] text-[#b3b3b3] text-sm hover:text-white transition-colors">
                Import Another File
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
