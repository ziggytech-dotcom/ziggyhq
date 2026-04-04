'use client'

interface DeletePlanButtonProps {
  planId: string
  planName: string
}

export default function DeletePlanButton({ planId, planName }: DeletePlanButtonProps) {
  const handleDelete = async () => {
    if (!confirm(`Delete "${planName}"? This cannot be undone.`)) return
    await fetch(`/api/action-plans/${planId}`, { method: 'DELETE' })
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="px-3 py-1.5 rounded-lg border border-red-900/40 text-red-400 hover:bg-red-900/20 hover:border-red-500/40 text-sm transition-colors"
    >
      Delete
    </button>
  )
}
