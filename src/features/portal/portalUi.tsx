import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Icon, Badge } from '@/design-system/components'
import type { AssessmentOutcome, GroupGoal } from '@/db/schema'

/** Page header recipe shared with `AssessmentListPage` — title + muted
 * subtitle on the left, primary actions on the right. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18, gap: 16 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, margin: 0 }}>{title}</h1>
        {subtitle && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{subtitle}</div>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, flex: 'none' }}>{actions}</div>}
    </div>
  )
}

/** The pill search box from `AssessmentListPage`, extracted for reuse. */
export function SearchBox({
  value,
  onChange,
  placeholder = 'Search',
  width = 260,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  width?: number
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width,
        height: 40,
        borderRadius: 999,
        border: '1px solid var(--border)',
        padding: '0 14px',
        background: '#fff',
      }}
    >
      <Icon name="search" size={15} style={{ color: 'var(--text-muted)', flex: 'none' }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ border: 'none', outline: 'none', flex: 1, fontSize: 13, minWidth: 0 }}
      />
    </div>
  )
}

/** Secondary in-section tab strip — Users/Invitations/Roles under Security,
 * etc. Same active/inactive visual language as the top-level nav in
 * `TopBar.tsx` but smaller and left-aligned under the page header. */
export function SectionTabs({ items }: { items: { to: string; label: string }[] }) {
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          style={({ isActive }) => ({
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: isActive ? 700 : 600,
            color: isActive ? 'var(--ocean)' : 'var(--text-muted)',
            borderBottom: isActive ? '2px solid var(--ocean)' : '2px solid transparent',
            marginBottom: -1,
            textDecoration: 'none',
          })}
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  )
}

const OUTCOME_TONE: Record<Exclude<AssessmentOutcome, null>, 'success' | 'warning' | 'neutral'> = {
  Green: 'success',
  Yellow: 'warning',
  Grey: 'neutral',
}

/** Green/Yellow/Grey per Document 4 §10 — Grey is a real result, not a
 * blank state, so it still renders a badge (just a neutral-toned one). */
export function OutcomeBadge({ outcome }: { outcome: AssessmentOutcome }) {
  if (!outcome) return <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Not yet scored</span>
  return <Badge tone={OUTCOME_TONE[outcome]}>{outcome}</Badge>
}

export function GroupGoalBadge({ goal }: { goal: GroupGoal }) {
  return <Badge tone={goal === 'Green' ? 'success' : 'warning'}>{goal}</Badge>
}

/** Shared "row as card" recipe from `AssessmentRow.tsx` — a white card with
 * a colored left accent, used across the Portal's list screens instead of
 * a dense Kendo-style grid for anything that reads better as records. */
export function RecordCard({
  accentColor,
  onClick,
  children,
}: {
  accentColor: string
  onClick?: () => void
  children: ReactNode
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        background: '#fff',
        border: '1px solid var(--border)',
        borderLeft: `4px solid ${accentColor}`,
        borderRadius: 12,
        padding: '14px 18px',
        marginBottom: 10,
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 1px 2px rgba(1,44,76,0.06)',
      }}
    >
      {children}
    </div>
  )
}

export function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div style={{ padding: '64px 20px', textAlign: 'center' }}>
      <Icon name={icon} size={32} style={{ color: 'var(--border-strong)' }} />
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600, margin: '14px 0 6px' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{subtitle}</div>}
    </div>
  )
}
