import Spinner from './Spinner'

function BulkActions({
  onActivateAll,
  onDeactivateAll,
  onDeploy,
  onRefresh,
  busy = false,
  activeAction = null,
}) {
  const baseBtn =
    'inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border transition disabled:opacity-50 disabled:cursor-not-allowed'

  const renderLabel = (key, label) =>
    activeAction === key ? (
      <>
        <Spinner size={14} />
        {label}
      </>
    ) : (
      label
    )

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onRefresh}
        disabled={busy}
        className={`${baseBtn} bg-white text-slate-700 border-slate-200 hover:bg-slate-50`}
      >
        {renderLabel('refresh', 'Refresh')}
      </button>
      <button
        type="button"
        onClick={onActivateAll}
        disabled={busy}
        className={`${baseBtn} bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100`}
      >
        {renderLabel('activate', 'Activate All')}
      </button>
      <button
        type="button"
        onClick={onDeactivateAll}
        disabled={busy}
        className={`${baseBtn} bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100`}
      >
        {renderLabel('deactivate', 'Deactivate All')}
      </button>
      <button
        type="button"
        onClick={onDeploy}
        disabled={busy}
        className={`${baseBtn} bg-blue-600 text-white border-blue-600 hover:bg-blue-700`}
      >
        {renderLabel('deploy', 'Deploy')}
      </button>
    </div>
  )
}

export default BulkActions
