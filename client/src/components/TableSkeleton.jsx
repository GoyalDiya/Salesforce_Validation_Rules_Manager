function TableSkeleton({ rows = 5 }) {
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
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td className="px-6 py-4">
                <div className="h-3 bg-slate-200 rounded animate-pulse w-40 mb-2" />
                <div className="h-2 bg-slate-100 rounded animate-pulse w-56" />
              </td>
              <td className="px-6 py-4">
                <div className="h-3 bg-slate-100 rounded animate-pulse w-72" />
              </td>
              <td className="px-6 py-4">
                <div className="h-5 bg-slate-100 rounded-full animate-pulse w-16" />
              </td>
              <td className="px-6 py-4 text-right">
                <div className="h-6 bg-slate-100 rounded-full animate-pulse w-11 inline-block" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TableSkeleton
