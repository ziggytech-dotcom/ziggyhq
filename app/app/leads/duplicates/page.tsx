'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface DupLead {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  stage: string | null
  status: string
  match_reason: string
}

export default function DuplicatesPage() {
  const router = useRouter()
  const [searchEmail, setSearchEmail] = useState('')
  const [searchPhone, setSearchPhone] = useState('')
  const [searchName, setSearchName] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<DupLead[] | null>(null)
  const [merging, setMerging] = useState(false)
  const [keepId, setKeepId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [mergeMsg, setMergeMsg] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResults(null)
    setKeepId(null)
    setDeleteId(null)
    setMergeMsg(null)

    const res = await fetch('/api/leads/duplicates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: searchEmail || undefined,
        phone: searchPhone || undefined,
        full_name: searchName || undefined,
      }),
    })

    if (res.ok) {
      const { duplicates } = await res.json()
      setResults(duplicates ?? [])
    }
    setLoading(false)
  }

  const handleMerge = async () => {
    if (!keepId || !deleteId) return
    setMerging(true)
    const res = await fetch('/api/leads/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keep_id: keepId, delete_id: deleteId }),
    })
    if (res.ok) {
      setMergeMsg('Merge complete -- duplicate deleted.')
      setResults(null)
      setKeepId(null)
      setDeleteId(null)
      setTimeout(() => router.push(`/app/leads/${keepId}`), 1500)
    } else {
      const d = await res.json()
      setMergeMsg(`Error: ${d.error}`)
    }
    setMerging(false)
  }

  const statusColors: Record<string, string> = {
    active: '#22c55e', nurture: '#f59e0b', dead: '#b3b3b3', won: '#0ea5e9',
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Link href="/app/leads" className="text-[#b3b3b3] hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '36px', letterSpacing: '0.05em', color: '#ededed' }}>
            DUPLICATE FINDER
          </h1>
        </div>
        <p className="text-[#b3b3b3] text-sm">Search for duplicate leads by email, phone, or name, then merge them</p>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-[#b3b3b3] mb-1.5">Email</label>
              <input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-[#b3b3b3] mb-1.5">Phone</label>
              <input
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                placeholder="(702) 555-1234"
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-[#b3b3b3] mb-1.5">Full Name</label>
              <input
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="John Smith"
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#2d2d2d] text-white focus:outline-none focus:border-[#0ea5e9] text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || (!searchEmail && !searchPhone && !searchName)}
            className="px-6 py-2.5 rounded-lg bg-[#0ea5e9] text-white text-sm font-medium hover:bg-[#0ea5e9]/90 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Searching...' : 'Find Duplicates'}
          </button>
        </form>
      </div>

      {mergeMsg && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-sm">
          {mergeMsg}
        </div>
      )}

      {results !== null && (
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2d2d2d]">
            <h2 className="text-sm font-semibold text-white">
              {results.length === 0 ? 'No duplicates found' : `${results.length} potential duplicate${results.length > 1 ? 's' : ''} found`}
            </h2>
            {results.length > 0 && (
              <p className="text-xs text-[#b3b3b3] mt-0.5">Select one to keep and one to delete, then click Merge</p>
            )}
          </div>

          {results.length === 0 ? (
            <div className="px-6 py-8 text-center text-[#b3b3b3] text-sm">
              No matching records -- these contact details appear unique in your CRM.
            </div>
          ) : (
            <>
              <div className="divide-y divide-[#2d2d2d]">
                {results.map((lead) => (
                  <div key={lead.id} className="px-6 py-4 flex items-center gap-4">
                    <div className="flex gap-3 flex-shrink-0">
                      <label className="flex items-center gap-1.5 text-xs text-[#b3b3b3] cursor-pointer">
                        <input
                          type="radio"
                          name="keep"
                          value={lead.id}
                          checked={keepId === lead.id}
                          onChange={() => setKeepId(lead.id)}
                          className="accent-[#22c55e]"
                        />
                        Keep
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-[#b3b3b3] cursor-pointer">
                        <input
                          type="radio"
                          name="delete"
                          value={lead.id}
                          checked={deleteId === lead.id}
                          onChange={() => setDeleteId(lead.id)}
                          className="accent-red-400"
                        />
                        Delete
                      </label>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Link href={`/app/leads/${lead.id}`} target="_blank" className="text-sm font-medium text-white hover:text-[#0ea5e9] transition-colors">
                          {lead.full_name}
                        </Link>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded capitalize font-medium"
                          style={{ backgroundColor: `${statusColors[lead.status] ?? '#b3b3b3'}20`, color: statusColors[lead.status] ?? '#b3b3b3' }}
                        >
                          {lead.status}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b]">
                          matched on {lead.match_reason}
                        </span>
                      </div>
                      <div className="text-xs text-[#b3b3b3]">
                        {[lead.email, lead.phone, lead.stage].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {keepId && deleteId && keepId !== deleteId && (
                <div className="px-6 py-4 bg-[#0a0a0a] border-t border-[#2d2d2d]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#b3b3b3]">
                      Activities, notes, and tasks from the deleted lead will be transferred to the kept lead.
                    </p>
                    <button
                      onClick={handleMerge}
                      disabled={merging}
                      className="px-4 py-2 rounded-lg bg-[#0ea5e9] text-white text-sm font-medium hover:bg-[#0ea5e9]/90 disabled:opacity-50 transition-colors"
                    >
                      {merging ? 'Merging...' : 'Merge Now'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
