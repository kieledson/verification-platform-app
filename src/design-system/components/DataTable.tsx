import { useMemo, useState, type ReactNode } from 'react';
import Icon from './Icon';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  /** CSS grid track size, e.g. '1.4fr' or '120px'. */
  width: string;
  align?: 'left' | 'right' | 'center';
  render: (row: T) => ReactNode;
  /** Enables the sort arrow on this column's header. */
  sortValue?: (row: T) => string | number;
}

interface SortState {
  key: string;
  direction: 'asc' | 'desc';
}

/**
 * Generic sortable list table, styled to match the app's existing
 * card-based rows (grid layout, same border/radius language as
 * `RecordCard`) rather than a native `<table>`. Filtering is left to the
 * caller (a single search box, per the Field App's "Your assessments"
 * pattern) — this component only owns sort and optional row expansion. One
 * column template drives both the header and every data row, so everything
 * lines up.
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const visibleRows = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return cmp * dir;
    });
  }, [rows, columns, sort]);

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
