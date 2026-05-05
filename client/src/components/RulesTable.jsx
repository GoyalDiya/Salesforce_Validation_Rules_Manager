import StatusBadge from './StatusBadge'
import ToggleSwitch from './ToggleSwitch'

function RulesTable({ rules, onToggle, pendingIds = new Set(), disabled = false }) {
  if (rules.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400">
        No validation rules found on the Account object.
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-6 py-3 font-medium">Rule Name</th>
            <th className="px-6 py-3 font-medium">Description</th>
            <th className="px-6 py-3 font-medium">Status</th>
            <th className="px-6 py-3 font-medium text-right">Toggle</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rules.map((rule) => {
            const isPending = pendingIds.has(rule.id)
            return (
              <tr
                key={rule.id}
                className={isPending ? 'bg-amber-50/50' : 'hover:bg-slate-50/50'}
              >
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-800">{rule.name}</div>
                  {rule.errorMessage && (
                    <div className="text-xs text-slate-400 mt-0.5">
                      {rule.errorMessage}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 max-w-md">
                  {rule.description || (
                    <span className="text-slate-300 italic">No description</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <StatusBadge active={rule.active} />
                    {isPending && (
                      <span
                        title="Unsaved change — click Deploy to apply"
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"
                      >
                        Pending
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="inline-flex">
                    <ToggleSwitch
                      checked={rule.active}
                      onChange={(next) => onToggle(rule.id, next)}
                      disabled={disabled}
                      label={`Toggle ${rule.name}`}
                    />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default RulesTable
