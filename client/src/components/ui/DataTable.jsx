import { useMemo, useState } from 'react';

/**
 * columns: [{ key, label, sortable, render?: (row) => node, className? }]
 * rows: array of objects
 * Client-side sort + pagination (25/page). For server-paginated data,
 * pass `serverPaginated` and handle paging outside.
 */
export default function DataTable({
  columns,
  rows,
  pageSize = 25,
  emptyState,
  selectable = false,
  selectedIds = [],
  onSelectChange,
  rowKey = (r) => r._id || r.id,
  onRowClick,
}) {
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (!sort.key) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number') return sort.dir === 'asc' ? av - bv : bv - av;
      return sort.dir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return copy;
  }, [rows, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  function toggleSort(key) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  }

  const allSelected = pageRows.length > 0 && pageRows.every((r) => selectedIds.includes(rowKey(r)));

  function toggleAll() {
    if (!onSelectChange) return;
    if (allSelected) {
      onSelectChange(selectedIds.filter((id) => !pageRows.some((r) => rowKey(r) === id)));
    } else {
      const ids = new Set(selectedIds);
      pageRows.forEach((r) => ids.add(rowKey(r)));
      onSelectChange([...ids]);
    }
  }

  function toggleOne(id) {
    if (!onSelectChange) return;
    onSelectChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  }

  if (!rows.length && emptyState) return emptyState;

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/50 border-b border-white/10">
              {selectable && (
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-current" />
                </th>
              )}
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-4 py-3 font-medium whitespace-nowrap ${c.sortable ? 'cursor-pointer select-none hover:text-white' : ''} ${c.className || ''}`}
                  onClick={() => c.sortable && toggleSort(c.key)}
                >
                  {c.label}
                  {c.sortable && sort.key === c.key && (
                    <span className="ml-1 text-accent">{sort.dir === 'asc' ? '▲' : '▼'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => {
              const id = rowKey(r);
              return (
                <tr
                  key={id}
                  className={`border-b border-white/5 hover:bg-white/5 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(r)}
                >
                  {selectable && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.includes(id)} onChange={() => toggleOne(id)} />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td key={c.key} className={`px-4 py-3 text-white/85 ${c.cellClassName || ''}`}>
                      {c.render ? c.render(r) : r[c.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 text-sm">
          <span className="text-white/40">
            Page {safePage} of {totalPages} · {sorted.length} rows
          </span>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded-lg bg-white/10 disabled:opacity-40 hover:bg-white/15"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </button>
            <button
              className="px-3 py-1 rounded-lg bg-white/10 disabled:opacity-40 hover:bg-white/15"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
