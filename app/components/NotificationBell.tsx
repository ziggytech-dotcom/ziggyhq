'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

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

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const load = async () => {
    const res = await fetch('/api/notifications')
    if (res.ok) {
      const d = await res.json()
      setNotifications(d.notifications ?? [])
      setUnread(d.unread ?? 0)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 30000) // poll every 30s
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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
    setOpen(false)
    if (n.link) router.push(n.link)
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg text-[#b3b3b3] hover:text-white hover:bg-[#2d2d2d]/50 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#0ea5e9] text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-full ml-2 top-0 w-80 bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2d2d2d]">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-[#b3b3b3] hover:text-[#0ea5e9] transition-colors">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#2d2d2d]">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-[#b3b3b3]">No notifications</div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-[#2d2d2d]/40 transition-colors ${!n.read ? 'bg-[#0ea5e9]/5' : ''}`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-base flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] ?? '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-medium text-white truncate">{n.title}</span>
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9] flex-shrink-0 mt-1" />}
                      </div>
                      {n.message && <div className="text-xs text-[#b3b3b3] mt-0.5 line-clamp-2">{n.message}</div>}
                      <div className="text-xs text-[#b3b3b3]/60 mt-1">{timeAgo(n.created_at)}</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-[#2d2d2d] px-4 py-2">
            <button
              onClick={() => { setOpen(false); router.push('/app/notifications') }}
              className="text-xs text-[#b3b3b3] hover:text-[#0ea5e9] transition-colors w-full text-center"
            >
              View all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
