import { useMemo, useState } from 'react'
import { Logo, Icon, Avatar } from '@/design-system/components'
import { STANDARD } from '@/standard/data/standard'
import { useAssessmentStore } from '@/state/assessmentStore'
import { useUiStore } from '@/state/uiStore'
import { flatVisibleQuestions, perSectionCounts } from '@/features/workspace/flatQuestions'
import { SyncDrawer } from '@/features/workspace/SyncDrawer'
import { ConnectionPill } from '@/app/ConnectionPill'

/** Icon + short label per section, in SortOrder — positional against
 * `STANDARD.sections`, which is confirmed to carry these exact 12 sections
 * in this exact order. Per the Assessment Workspace v2 handoff §A. */
const SECTION_CHROME: { icon: string; short: string }[] = [
  { icon: 'clipboard-list', short: 'Info' },
  { icon: 'home', short: 'Farm profile' },
  { icon: 'droplets', short: 'Effluent' },
  { icon: 'trees', short: 'Habitat' },
  { icon: 'fish', short: 'Stock' },
  { icon: 'wheat', short: 'Feed' },
  { icon: 'shield-plus', short: 'Biosecurity' },
  { icon: 'flask-conical', short: 'Chemicals' },
  { icon: 'log-out', short: 'Escapes' },
  { icon: 'bird', short: 'Wildlife' },
  { icon: 'truck', short: 'Harvest' },
  { icon: 'pen-line', short: 'Finalise' },
]

export function AssessmentChrome({
  mode,
  assessmentId,
  farmName,
  siteReference,
  assessorType,
  onBack,
  onToggleReview,
  onPickSection,
}: {
  mode: 'assess' | 'review'
  assessmentId: string
  farmName: string
  siteReference: string
  assessorType: string
  /** Leaves the assessment entirely, back to the assessment list. */
  onBack: () => void
  onToggleReview: () => void
  /** Jumps to a section's first visible question and switches to assess mode. */
  onPickSection: (sectionId: number) => void
}) {
  const currentCode = useAssessmentStore((s) => s.currentCode)
  const answers = useAssessmentStore((s) => s.answers)
  const visibility = useAssessmentStore((s) => s.visibility)
  const connectionMode = useUiStore((s) => s.connectionMode)
  const online = connectionMode !== 'offline'
  const [syncOpen, setSyncOpen] = useState(false)

  const flat = useMemo(() => flatVisibleQuestions(visibility), [visibility])
  const counts = useMemo(() => perSectionCounts(flat, answers), [flat, answers])

  const overallAnswered = [...counts.values()].reduce((n, c) => n + c.done, 0)
  const overallTotal = flat.length
  const overallPct = overallTotal === 0 ? 0 : Math.round((overallAnswered / overallTotal) * 100)

  const currentEntry = flat.find((x) => x.question.code === currentCode)
  const activeSectionId = currentEntry?.sectionId ?? STANDARD.sections[0]?.id

  return (
    <div style={{ flex: 'none', background: 'var(--ocean-deep)', color: '#fff', padding: '0 22px', position: 'relative', zIndex: 5 }}>
      <div style={{ height: 54, display: 'flex', alignItems: 'center', gap: 13 }}>
        <Logo variant="mark-white" height={24} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 600, lineHeight: 1.15 }}>
            Verification Platform
          </span>
          <span
            style={{
              fontSize: 9.5,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--ocean-light)',
              fontWeight: 700,
            }}
          >
            Field assessment
          </span>
        </div>
        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.16)' }} />
        <button
          type="button"
          onClick={onBack}
          title="Back to assessment list"
          style={{
            width: 28,
            height: 28,
            flex: 'none',
            borderRadius: 999,
            border: 'none',
            background: 'rgba(255,255,255,0.08)',
            color: '#fff',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="arrow-left" size={15} />
        </button>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 15.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {farmName}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ocean-light)', letterSpacing: '0.03em' }}>
            {siteReference}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap' }}>
            {assessorType} assessment
          </span>
        </div>
        <div style={{ flex: 1 }} />

        <button
          type="button"
          onClick={onToggleReview}
          style={{
            height: 30,
            padding: '0 14px',
            borderRadius: 999,
            border: 'none',
            background: 'var(--ocean-light)',
            color: 'var(--ocean-deep)',
            fontSize: 11.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
          }}
        >
          <Icon name={mode === 'review' ? 'arrow-left' : 'arrow-right'} size={13} />
          <span>{mode === 'review' ? 'Back to questions' : 'Review & finalise'}</span>
        </button>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}>
          <ConnectionPill dark />
          <button
            type="button"
            onClick={() => setSyncOpen((v) => !v)}
            title="Sync status"
            style={{
              width: 22,
              height: 30,
              flex: 'none',
              borderRadius: 999,
              border: 'none',
              background: 'none',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={syncOpen ? 'chevron-up' : 'chevron-down'} size={14} />
          </button>
          {syncOpen && (
            <SyncDrawer assessmentId={assessmentId} farmName={farmName} answeredCount={overallAnswered} online={online} />
          )}
        </div>

        <Avatar name="Linh Pham" size={28} />
      </div>

      <div style={{ height: 92, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ flex: 1, position: 'relative', height: 76, paddingTop: 6 }}>
          <div
            style={{
              position: 'absolute',
              left: 24,
              right: 24,
              top: 19,
              height: 2,
              background: 'rgba(255,255,255,0.18)',
              borderRadius: 999,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 24,
              top: 19,
              height: 2,
              background: 'var(--ocean-light)',
              borderRadius: 999,
              width: `calc((100% - 48px) * ${STANDARD.sections.findIndex((s) => s.id === activeSectionId) / 11})`,
              transition: 'width 300ms ease',
            }}
          />
          <div style={{ position: 'relative', display: 'flex' }}>
            {STANDARD.sections.map((section, i) => {
              const chrome = SECTION_CHROME[i] ?? { icon: 'circle', short: section.name }
              const c = counts.get(section.id) ?? { done: 0, total: 0 }
              const done = c.total > 0 && c.done === c.total
              const active = section.id === activeSectionId
              // Fill only ever signals completeness (green = done, light blue
              // = not yet done); "you are here" is a separate yellow ring on
              // top, so a section can be both active and done at once.
              const dotBg = done ? 'var(--rating-best)' : 'var(--ocean-light)'
              const dotColor = done ? '#fff' : 'var(--ocean-deep)'
              const dotShadow = active ? '0 0 0 3px var(--rating-good)' : 'none'
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => onPickSection(section.id)}
                  title={`${section.name} · ${c.done} of ${c.total} answered`}
                  style={{
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 5,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 999,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: dotBg,
                      color: dotColor,
                      boxShadow: dotShadow,
                      transition: 'all 150ms ease',
                    }}
                  >
                    <Icon name={chrome.icon} size={14} />
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.01em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%',
                      padding: '0 2px',
                      fontWeight: active ? 800 : 600,
                      color: active ? '#fff' : 'rgba(255,255,255,0.62)',
                    }}
                  >
                    {chrome.short}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.03em',
                      whiteSpace: 'nowrap',
                      color: done ? 'var(--rating-best)' : active ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.42)',
                    }}
                  >
                    {done ? 'Done' : `${c.total - c.done} left`}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 600, color: '#fff', lineHeight: 1 }}>
            {overallPct}%
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.25 }}>
              {overallAnswered} of {overallTotal}
            </span>
            <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.25 }}>
              answered for this farm
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}
