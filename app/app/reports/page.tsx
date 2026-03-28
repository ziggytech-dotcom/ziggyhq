'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line,
} from 'recharts'

interface ReportData {
  // Existing
  stageCounts: Record<string, number>
  sourceCounts: Record<string, number>
  monthlyLeads: Record<string, number>
  agentPerformance: { name: string; leads: number; contacted: number; closed: number }[]
  funnelData: { stage: string; count: number }[]
  avgResponseHours: number | null
  totalLeads: number
  newInRange: number
  wonLeads: number
  conversionRate: number
  range: string
  // New analytics
  stageValues: Record<string, number>
  totalPipelineValue: number
  winRate: number
  avgDealDays: number | null
  sourceConversion: { source: string; leads: number; converted: number; rate: number }[]
  monthlyRevenue: Record<string, number>
  thisMonthRevenue: number
  lastMonthRevenue: number
  topContacts: { id: string; name: string; source: string; stage: string; status: string; dealValue: number }[]
}

const COLORS = ['#0ea5e9', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']
const RANGES = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'All time', value: 'all' },
]

const tooltipStyle = {
  backgroundColor: '#1a1a1a',
  border: '1px solid #2d2d2d',
  borderRadius: '8px',
  color: '#ededed',
  fontSize: '12px',
}

function formatCurrency(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`
  return `$${val.toLocaleString()}`
}

function RevenueChange({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <span className="text-[#b3b3b3] text-xs">No data</span>
  if (previous === 0) return <span className="text-[#22c55e] text-xs">New this month</span>
  const pct = Math.round(((current - previous) / previous) * 100)
  const up = pct >= 0
  return (
    <span className={`text-xs font-medium flex items-center gap-0.5 ${up ? 'text-[#22c55e]' : 'text-red-400'}`}>
      {up ? '↑' : '↓'} {Math.abs(pct)}% vs last month
    </span>
  )
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [range, setRange] = useState('30d')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/reports?range=${range}`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [range])

  useEffect(() => { load() }, [load])

  const stageData = data ? Object.entries(data.stageCounts).map(([stage, count]) => ({ stage, count })) : []
  const stageValueData = data
    ? Object.entries(data.stageValues)
        .filter(([, v]) => v > 0)
        .map(([stage, value]) => ({ stage, value }))
    : []
  const sourceData = data ? Object.entries(data.sourceCounts).map(([source, count]) => ({ source, count })) : []
  const monthlyData = data ? Object.entries(data.monthlyLeads).map(([month, count]) => ({ month, count })) : []
  const monthlyRevenueData = data ? Object.entries(data.monthlyRevenue).map(([month, value]) => ({ month, value })) : []

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '36px', letterSpacing: '0.05em', color: '#ededed' }}>
            REPORTS & ANALYTICS
          </h1>
          <p className="text-[#b3b3b3] text-sm mt-1">Pipeline analytics and performance</p>
        </div>
        <div className="flex rounded-lg border border-[#2d2d2d] overflow-hidden">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-2 text-xs transition-colors ${range === r.value ? 'bg-[#0ea5e9] text-white' : 'bg-[#1a1a1a] text-[#b3b3b3] hover:text-white'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-[#b3b3b3] text-sm py-12 text-center">Loading analytics...</div>
      ) : !data ? null : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Leads', value: data.totalLeads, sub: `+${data.newInRange} in period`, color: '#3b82f6' },
              { label: 'Pipeline Value', value: formatCurrency(data.totalPipelineValue), sub: `${stageValueData.length} stages`, color: '#0ea5e9' },
              { label: 'Win Rate', value: `${data.winRate}%`, sub: `${data.wonLeads} closed won`, color: '#22c55e' },
              { label: 'Avg Deal Time', value: data.avgDealDays != null ? `${data.avgDealDays}d` : '—', sub: 'days to close', color: '#f59e0b' },
            ].map((card) => (
              <div key={card.label} className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
                <div className="text-3xl font-bold mb-1" style={{ color: card.color }}>{card.value}</div>
                <div className="text-sm font-medium text-white mb-0.5">{card.label}</div>
                <div className="text-xs text-[#b3b3b3]">{card.sub}</div>
              </div>
            ))}
          </div>

          {/* Monthly revenue cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
              <div className="text-sm text-[#b3b3b3] mb-1">Revenue This Month</div>
              <div className="text-2xl font-bold text-[#22c55e] mb-1">{formatCurrency(data.thisMonthRevenue)}</div>
              <RevenueChange current={data.thisMonthRevenue} previous={data.lastMonthRevenue} />
            </div>
            <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
              <div className="text-sm text-[#b3b3b3] mb-1">Revenue Last Month</div>
              <div className="text-2xl font-bold text-white mb-1">{formatCurrency(data.lastMonthRevenue)}</div>
              <span className="text-xs text-[#b3b3b3]">Total closed deal value</span>
            </div>
          </div>

          {/* Row 1: Pipeline value by stage + Win rate / Response */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="col-span-2 bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
              <h2 className="text-sm font-semibold text-white mb-4">Pipeline Value by Stage</h2>
              {stageValueData.length === 0 ? (
                <p className="text-[#b3b3b3] text-sm">No deal value data — add budget to leads to see this chart</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stageValueData} margin={{ top: 0, right: 0, bottom: 40, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" />
                    <XAxis dataKey="stage" tick={{ fill: '#b3b3b3', fontSize: 11 }} angle={-30} textAnchor="end" />
                    <YAxis tick={{ fill: '#b3b3b3', fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'Deal Value']} />
                    <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 flex flex-col gap-5">
              <div>
                <h2 className="text-sm font-semibold text-white mb-3">Win Rate</h2>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-4xl font-bold text-[#22c55e]">{data.winRate}%</div>
                </div>
                <div className="h-2.5 bg-[#2d2d2d] rounded-full overflow-hidden mb-1">
                  <div className="h-full rounded-full bg-[#22c55e] transition-all" style={{ width: `${data.winRate}%` }} />
                </div>
                <p className="text-xs text-[#b3b3b3]">Closed-won / total closed</p>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white mb-3">Conversion Rate</h2>
                <div className="text-4xl font-bold text-[#0ea5e9] mb-1">{data.conversionRate}%</div>
                <div className="h-2.5 bg-[#2d2d2d] rounded-full overflow-hidden mb-1">
                  <div className="h-full rounded-full bg-[#0ea5e9]" style={{ width: `${data.conversionRate}%` }} />
                </div>
                <p className="text-xs text-[#b3b3b3]">Won / total leads</p>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white mb-1">Avg Response</h2>
                <div className="text-2xl font-bold text-[#f59e0b]">
                  {data.avgResponseHours != null ? `${data.avgResponseHours}h` : '—'}
                </div>
                <p className="text-xs text-[#b3b3b3]">Time to first contact</p>
              </div>
            </div>
          </div>

          {/* Row 2: Monthly revenue + Pipeline leads chart */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="col-span-2 bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
              <h2 className="text-sm font-semibold text-white mb-4">Monthly Revenue Tracked (Closed Deals)</h2>
              {monthlyRevenueData.every(d => d.value === 0) ? (
                <p className="text-[#b3b3b3] text-sm">No revenue data yet — mark leads as won with budget to track</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" />
                    <XAxis dataKey="month" tick={{ fill: '#b3b3b3', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#b3b3b3', fontSize: 11 }} tickFormatter={formatCurrency} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'Revenue']} />
                    <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
              <h2 className="text-sm font-semibold text-white mb-4">Lead Sources</h2>
              {sourceData.length === 0 ? (
                <p className="text-[#b3b3b3] text-sm">No source data</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={sourceData} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={65} paddingAngle={2}>
                        {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {sourceData.slice(0, 4).map((d, i) => (
                      <div key={d.source} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-[#b3b3b3] truncate">{d.source}</span>
                        </div>
                        <span className="text-white font-medium ml-2">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Row 3: Monthly new leads + Funnel */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="col-span-2 bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
              <h2 className="text-sm font-semibold text-white mb-4">Monthly Trends — New Leads</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" />
                  <XAxis dataKey="month" tick={{ fill: '#b3b3b3', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#b3b3b3', fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} dot={{ fill: '#0ea5e9', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6">
              <h2 className="text-sm font-semibold text-white mb-4">Conversion Funnel</h2>
              {data.funnelData.every((d) => d.count === 0) ? (
                <p className="text-[#b3b3b3] text-sm">No funnel data</p>
              ) : (
                <div className="space-y-2">
                  {data.funnelData.filter((d) => d.count > 0).map((d, i, arr) => {
                    const pct = arr[0].count > 0 ? Math.round((d.count / arr[0].count) * 100) : 0
                    return (
                      <div key={d.stage}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#b3b3b3] truncate">{d.stage}</span>
                          <span className="text-white font-medium ml-2">{d.count} <span className="text-[#b3b3b3]">({pct}%)</span></span>
                        </div>
                        <div className="h-2 bg-[#2d2d2d] rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[#0ea5e9] transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Conversion by lead source table */}
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-[#2d2d2d] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Conversion by Lead Source</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2d2d2d]">
                  {['Source', 'Total Leads', 'Converted', 'Conversion Rate'].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-[#b3b3b3] px-6 py-3 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d2d]">
                {data.sourceConversion.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-[#b3b3b3] text-sm">No source data</td></tr>
                ) : (
                  data.sourceConversion.map((s) => (
                    <tr key={s.source} className="hover:bg-[#2d2d2d]/20">
                      <td className="px-6 py-3 text-sm text-white font-medium">{s.source}</td>
                      <td className="px-6 py-3 text-sm text-[#b3b3b3]">{s.leads}</td>
                      <td className="px-6 py-3 text-sm text-[#22c55e] font-medium">{s.converted}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-[#2d2d2d] rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-[#22c55e]" style={{ width: `${s.rate}%` }} />
                          </div>
                          <span className="text-xs text-white font-medium">{s.rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Top contacts by deal value */}
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-[#2d2d2d]">
              <h2 className="text-sm font-semibold text-white">Top Contacts by Deal Value</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2d2d2d]">
                  {['Contact', 'Source', 'Stage', 'Status', 'Deal Value'].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-[#b3b3b3] px-6 py-3 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d2d]">
                {data.topContacts.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-[#b3b3b3] text-sm">No contacts with deal value — add budget max to leads</td></tr>
                ) : (
                  data.topContacts.map((c, i) => (
                    <tr key={c.id} className="hover:bg-[#2d2d2d]/20">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#0ea5e9]/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] text-[#0ea5e9] font-bold">{i + 1}</span>
                          </div>
                          <Link href={`/app/leads/${c.id}`} className="text-sm text-white hover:text-[#0ea5e9] transition-colors font-medium">
                            {c.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-[#b3b3b3]">{c.source}</td>
                      <td className="px-6 py-3 text-sm text-[#b3b3b3]">{c.stage}</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded capitalize font-medium ${
                          c.status === 'won' ? 'bg-[#22c55e]/10 text-[#22c55e]' :
                          c.status === 'active' ? 'bg-[#0ea5e9]/10 text-[#0ea5e9]' :
                          'bg-[#2d2d2d] text-[#b3b3b3]'
                        }`}>{c.status}</span>
                      </td>
                      <td className="px-6 py-3 text-sm font-bold text-[#22c55e]">{formatCurrency(c.dealValue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Agent performance table */}
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#2d2d2d]">
              <h2 className="text-sm font-semibold text-white">Agent Performance</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2d2d2d]">
                  {['Agent', 'Leads Assigned', 'Contacted', 'Closed Won', 'Close Rate'].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-[#b3b3b3] px-6 py-3 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d2d]">
                {data.agentPerformance.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-[#b3b3b3] text-sm">No agent data</td></tr>
                ) : (
                  data.agentPerformance.sort((a, b) => b.leads - a.leads).map((a) => {
                    const closeRate = a.leads > 0 ? Math.round((a.closed / a.leads) * 100) : 0
                    return (
                      <tr key={a.name} className="hover:bg-[#2d2d2d]/20">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#0ea5e9]/20 flex items-center justify-center">
                              <span className="text-xs text-[#0ea5e9] font-semibold">{a.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <span className="text-sm text-white">{a.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-sm text-white font-medium">{a.leads}</td>
                        <td className="px-6 py-3 text-sm text-[#b3b3b3]">{a.contacted}</td>
                        <td className="px-6 py-3 text-sm text-[#22c55e] font-medium">{a.closed}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-[#2d2d2d] rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-[#22c55e]" style={{ width: `${closeRate}%` }} />
                            </div>
                            <span className="text-xs text-[#b3b3b3]">{closeRate}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
