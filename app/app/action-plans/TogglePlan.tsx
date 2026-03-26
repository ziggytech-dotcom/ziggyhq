'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TogglePlan({ planId, isActive }: { planId: string; isActive: boolean }) {
  const [active, setActive] = useState(isActive)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggle = async () => {
    setLoading(true)
    const res = await fetch(`/api/action-plans/${planId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !active }),
    })
    if (res.ok) {
      setActive(!active)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${active ? 'bg-[#22c55e]' : 'bg-[#2d2d2d]'} disabled:opacity-50`}
      title={active ? 'Disable plan' : 'Enable plan'}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${active ? 'translate-x-4' : 'translate-x-0.5'}`}
      />
    </button>
  )
}
