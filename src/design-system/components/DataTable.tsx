import { useMemo, useState, type ReactNode } from 'react';
import Icon from './Icon';
import Select from './Select';

export type DataTableFilter =
  | { type: 'text'; placeholder?: string }
  | { type: 'select'; options?: string[]; allLabel?: string };

export interface DataTableColumn<T> {
  key: string;
  header: string;
  /** CSS grid track size, e.g. '1.4fr' or '120px'. */
  width: string;
  align?: 'left' | 'right' | 'center';
  render: (row: T) => ReactNode;
  /** Enables the sort arrow on this column's header. */
  sortValue?: (row: T) => string | number;
  /** Enables a filter control under this column's header. Requires `filterValue`. */
  filter?: DataTableFilter;
  /** Plain-text value used for filter matching (and to derive `select` options when none are given). */
  filterValue?: (row: T) => string;
}

interface SortState {
  key: string;
  direction: 'asc' | 'desc';
}

/**
 * Generic sortable/filterable list table, styled to match the app's
 * existing card-based rows (grid layout, same border/radius language as
 * `AssessmentRow`/`RecordCard`) rather than a native `<table>`. One column
 * template drives the header, the optional filter row, and every data row,
 * so everything lines up.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  accentColor,
  onRowClick,
  renderExpanded,
  emptyState,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  accentColor?: (row: T) => string | undefined;
  onRowClick?: (row: T) => void;
  /** If given, every row gets a leading chevron toggle that reveals this
   * content in a full-width panel underneath it. */
  renderExpanded?: (row: T) => ReactNode;
  emptyState?: ReactNode;
}) {
  const [sort, setSort] = useState<SortState | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const hasFilterRow = columns.some((c) => c.filter);

  const filterOptions = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const col of columns) {
      if (col.filter?.type === 'select') {
        out[col.key] =
          col.filter.options ??
          Array.from(new Set(rows.map((r) => col.filterValue?.(r) ?? '').filter(Boolean))).sort((a, b) =>
            a.localeCompare(b),
          );
      }
    }
    return out;
  }, [columns, rows]);

  const visibleRows = useMemo(() => {
    let out = rows;
    out = out.filter((row) =>
      columns.every((col) => {
        const active = filters[col.key];
        if (!active || !col.filter) return true;
        const value = col.filterValue?.(row) ?? '';
        if (col.filter.type === 'select') return value === active;
        return value.toLowerCase().includes(active.toLowerCase());
      }),
    );
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        const dir = sort.direction === 'asc' ? 1 : -1;
        out = [...out].sort((a, b) => {
          const av = col.sortValue!(a);
          const bv = col.sortValue!(b);
          const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
          return cmp * dir;
        });
      }
    }
    return out;
  }, [rows, columns, filters, sort]);

  const gridTemplate = (renderExpanded ? '28px ' : '') + columns.map((c) => c.width).join(' ');

  function toggleSort(col: DataTableColumn<T>) {
    if (!col.sortValue) return;
    setSort((prev) => {
      if (prev?.key !== col.key) return { key: col.key, direction: 'asc' };
      if (prev.direction === 'asc') return { key: col.key, direction: 'desc' };
      return null;
    });
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: gridTemplate,
          background: 'var(--gray-100)',
          borderRadius: '10px 10px 0 0',
          border: '1px solid var(--border)',
          borderBottom: 'none',
        }}
      >
        {renderExpanded && <div />}
        {columns.map((col) => (
          <button
            key={col.key}
            type="button"
            onClick={() => toggleSort(col)}
            disabled={!col.sortValue}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start',
              gap: 4,
              padding: '10px 12px',
              background: 'none',
              border: 'none',
              cursor: col.sortValue ? 'pointer' : 'default',
              font: 'inherit',
              textAlign: col.align ?? 'left',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {col.header}
            </span>
            {col.sortValue && (
              <Icon
                name={sort?.key === col.key ? (sort.direction === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevrons-up-down'}
                size={12}
                style={{ color: sort?.key === col.key ? 'var(--ocean)' : 'var(--border-strong)' }}
              />
            )}
          </button>
        ))}
      </div>

      {hasFilterRow && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: gridTemplate,
            background: '#fff',
            border: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            padding: '6px 0',
          }}
        >
          {renderExpanded && <div />}
          {columns.map((col) => (
            <div key={col.key} style={{ padding: '0 8px' }}>
              {col.filter?.type === 'text' && (
                <input
                  value={filters[col.key] ?? ''}
                  onChange={(e) => setFilters((f) => ({ ...f, [col.key]: e.target.value }))}
                  placeholder={col.filter.placeholder ?? 'Filter…'}
                  style={{
                    width: '100%',
                    fontSize: 12.5,
                    padding: '5px 8px',
                    border: '1px solid var(--border)',
                    borderRadius: 7,
                    outline: 'none',
                  }}
                />
              )}
              {col.filter?.type === 'select' && (
                <Select
                  value={filters[col.key] ?? ''}
                  onChange={(e) => setFilters((f) => ({ ...f, [col.key]: e.target.value }))}
                  options={[
                    { value: '', label: col.filter.allLabel ?? 'All' },
                    ...filterOptions[col.key].map((v) => ({ value: v, label: v })),
                  ]}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {visibleRows.length === 0 ? (
        <div style={{ border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 10px 10px' }}>{emptyState}</div>
      ) : (
        visibleRows.map((row, i) => {
          const id = getRowId(row);
          const isExpanded = expanded.has(id);
          const isLast = i === visibleRows.length - 1;
          return (
            <div key={id}>
              <div
                onClick={() => onRowClick?.(row)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: gridTemplate,
                  alignItems: 'center',
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderTop: 'none',
                  borderLeft: accentColor ? `4px solid ${accentColor(row) ?? 'transparent'}` : undefined,
                  borderRadius: isLast && !isExpanded ? '0 0 10px 10px' : 0,
                  cursor: onRowClick ? 'pointer' : 'default',
                }}
              >
                {renderExpanded && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(id);
                    }}
                    aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      height: '100%',
                    }}
                  >
                    <Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} size={15} />
                  </button>
                )}
                {columns.map((col) => (
                  <div
                    key={col.key}
                    style={{
                      padding: '13px 12px',
                      minWidth: 0,
                      textAlign: col.align ?? 'left',
                    }}
                  >
                    {col.render(row)}
                  </div>
                ))}
              </div>
              {renderExpanded && isExpanded && (
                <div
                  style={{
                    background: 'var(--surface-warm, #FBFAE8)',
                    border: '1px solid var(--border)',
                    borderTop: 'none',
                    borderRadius: isLast ? '0 0 10px 10px' : 0,
                    padding: '16px 18px',
                  }}
                >
                  {renderExpanded(row)}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export default DataTable;
