function StatusBadge({ active }) {
  const base =
    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border'
  const styles = active
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-slate-100 text-slate-600 border-slate-200'
  const dot = active ? 'bg-emerald-500' : 'bg-slate-400'

  return (
    <span className={`${base} ${styles}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

export default StatusBadge
