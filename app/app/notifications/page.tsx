'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  message: string | null
  link: string | null
  read: boolean
  created_at: string
}

const TYPE_ICONS: Record<string, string> = {
  new_lead: '👤',
  lead_assigned: '🎯',
  plan_step_due: '📋',
  document_signed: '✍️',
  follow_up_due: '⏰',
}

const TYPE_LABELS: Record<string, string> = {
  new_lead: 'New Lead',
  lead_assigned: 'Lead Assigned',
  plan_step_due: 'Plan Step Due',
  document_signed: 'Document Signed',
  follow_up_due: 'Follow-up Due',
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unread, setUnread] = useState(0)
  const router = useRouter()

  const load = useCallback(async () => {
    const res = await fetch('/api/notifications')
    if (res.ok) {
      const d = await res.json()
      setNotifications(d.notifications ?? [])
      setUnread(d.unread ?? 0)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    setUnread((prev) => Math.max(0, prev - 1))
  }

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH' })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnread(0)
  }

  const handleClick = (n: Notification) => {
    if (!n.read) markRead(n.id)
    if (n.link) router.push(n.link)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'var(--font-bebas-neue)', fontSize: '36px', letterSpacing: '0.05em', color: '#ededed' }}>
            NOTIFICATIONS
          </h1>
          <p className="text-[#b3b3b3] text-sm mt-1">{unread} unread</p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="px-4 py-2 bg-[#1a1a1a] border border-[#2d2d2d] text-[#b3b3b3] rounded-lg text-sm hover:text-white hover:border-[#ff006e]/40 transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-[#b3b3b3] text-sm py-8 text-center">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-12 text-center">
          <div className="text-4xl mb-3">🔔</div>
          <div className="text-white font-medium mb-1">All caught up</div>
          <div className="text-[#b3b3b3] text-sm">No notifications yet</div>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl overflow-hidden">
          <div className="divide-y divide-[#2d2d2d]">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex items-start gap-4 px-6 py-4 cursor-pointer hover:bg-[#2d2d2d]/30 transition-colors ${!n.read ? 'bg-[#ff006e]/5' : ''}`}
              >
                <div className="text-2xl flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] ?? '🔔'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs text-[#b3b3b3] uppercase tracking-wider">{TYPE_LABELS[n.type] ?? n.type}</span>
                      <div className="text-sm font-medium text-white mt-0.5">{n.title}</div>
                      {n.message && <div className="text-sm text-[#b3b3b3] mt-1">{n.message}</div>}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {!n.read && <span className="w-2 h-2 rounded-full bg-[#ff006e]" />}
                      <span className="text-xs text-[#b3b3b3]/60">{timeAgo(n.created_at)}</span>
                    </div>
                  </div>
                  {n.link && (
                    <Link
                      href={n.link}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-[#ff006e] hover:underline mt-2 inline-block"
                    >
                      View →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
