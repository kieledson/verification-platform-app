import { Badge, Icon } from '@/design-system/components'
import { STANDARD } from '@/standard/data/standard'
import { PageHeader, SectionTabs } from '@/features/portal/portalUi'

/** Read-only, per the "just show the current v2.4 standard" scope decision
 * — older/test versions in the real system ("OUT OF ORDER", "OUT OF
 * ORDER_2") aren't worth a version list here, and a live question/rule
 * authoring builder is a separate, much larger feature than this pass
 * covers. The standard is already fully authored as checked-in data
 * (`standard.v2_4.json`) — this page just makes that data browsable. */
export function StandardSummaryPage() {
  const optionCount = STANDARD.questions.reduce((n, q) => n + q.options.length, 0)
  const ruleCount = STANDARD.questions.reduce((n, q) => n + q.dependsOn.length, 0)
  const alertCount = STANDARD.questions.filter((q) => q.notification !== null).length
  const sections = [...STANDARD.sections].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div style={{ padding: '22px 26px 30px' }}>
      <PageHeader title="Standards" subtitle="The published standard this programme assesses against." />
      <SectionTabs items={[{ to: '/projects', label: 'Projects' }, { to: '/standard', label: 'Standards' }]} />

      <div
        style={{
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '20px 22px',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>Shrimp: Farm Standard</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Version {STANDARD.version}</div>
          </div>
          <Badge tone="success">Published</Badge>
        </div>
        <div style={{ display: 'flex', gap: 28, marginTop: 18 }}>
          {[
            ['Sections', sections.length],
            ['Questions', STANDARD.questions.length],
            ['Options', optionCount],
            ['Dependency rules', ruleCount],
            ['Alerts', alertCount],
          ].map(([label, value]) => (
            <div key={label as string}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--ocean-deep)' }}>{value}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
        {sections.map((s, i) => (
          <div
            key={s.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '12px 20px',
              borderTop: i === 0 ? 'none' : '1px solid var(--gray-100)',
            }}
          >
            <div style={{ width: 26, height: 26, borderRadius: 999, background: 'var(--color-primary-subtle)', color: 'var(--ocean)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flex: 'none' }}>
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.name}</div>
              {s.subsections && (
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{s.subsections.map((sub) => sub.name).join(' · ')}</div>
              )}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{s.questionIds.length} questions</div>
          </div>
        ))}
      </div>

      {STANDARD.knownIssues.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Icon name="alert-triangle" size={15} style={{ color: 'var(--warning)' }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)' }}>
              Flagged data issues ({STANDARD.knownIssues.length})
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
            Reported, not fixed — preserved verbatim from the source standard rather than silently corrected.
          </div>
          {STANDARD.knownIssues.map((issue, i) => {
            const question = STANDARD.questions.find((q) => q.id === issue.questionId)
            return (
              <div key={i} style={{ fontSize: 12.5, padding: '6px 0', borderTop: i === 0 ? 'none' : '1px solid var(--gray-100)' }}>
                <span style={{ fontFamily: 'monospace', color: 'var(--ocean)' }}>{question?.code ?? issue.questionId}</span>
                <span style={{ color: 'var(--text-muted)' }}> · {issue.field} — {issue.description}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
