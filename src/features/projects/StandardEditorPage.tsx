import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge, Button, Icon, Input, Select, Checkbox } from '@/design-system/components'
import { useStandardsStore } from '@/state/standardsStore'
import { localize } from '@/standard/localize'
import { newId } from '@/lib/id'
import type {
  AnswerOption,
  Characterisation,
  ControlType,
  Level,
  LocalizedText,
  Question,
  Section,
} from '@/standard/schema/types'

const CONTROL_TYPES: ControlType[] = [
  'TEXT',
  'TEXT_MULTILINE',
  'NUMBER',
  'DATE_TIME',
  'SINGLE_SELECT',
  'SINGLE_SELECT_MODAL',
  'MULTI_SELECT',
  'MULTI_SELECT_MODAL',
  'IMAGE',
  'SIGNATURE',
  'SITE_DETAILS',
]
const SELECT_CONTROL_TYPES = new Set<ControlType>(['SINGLE_SELECT', 'MULTI_SELECT', 'SINGLE_SELECT_MODAL', 'MULTI_SELECT_MODAL'])
const CHARACTERISATION_VALUES: Characterisation[] = ['PRACTICE', 'GOVERNANCE', 'DOCUMENTATION']

function toLocalizedText(text: string): LocalizedText {
  return [{ LocaleCode: 'en', AutoText: text, ManualText: null, Text: text }]
}

/** `AnswerOption.characterisation` is typed as `Set<Characterisation> |
 * {expression}`, but the checked-in JSON (and therefore every question
 * loaded from `STANDARD`, cloned, or round-tripped through IndexedDB before
 * this editor ever touched it) actually stores it as a plain string array —
 * JSON has no Set literal, and `standard/data/standard.ts`'s own comment
 * flags that nothing hydrates it back because nothing needed real Set
 * semantics until now. This editor is the first thing that does, so it
 * hydrates on load rather than `instanceof Set`-checking the raw value
 * (which would misread every real tag set as "computed"). */
function hydrateQuestion(q: Question): Question {
  return {
    ...q,
    options: q.options.map((opt) => ({
      ...opt,
      characterisation:
        opt.characterisation && typeof opt.characterisation === 'object' && 'expression' in opt.characterisation
          ? opt.characterisation
          : new Set(opt.characterisation as unknown as Characterisation[]),
    })),
  }
}

function levelToEditString(level: Level): string {
  if (level === null) return ''
  if (level === 'N/A') return 'N/A'
  if (typeof level === 'number') return String(level)
  return level.expression
}

/** Blank/`N/A`/numeric text map to a plain `Level`; anything else is stored
 * as a runtime expression string, matching the schema's own real-world
 * shape — this authoring UI doesn't evaluate expressions, just preserves
 * whatever text is here (including an untouched existing expression, which
 * round-trips through this same parsing unchanged). */
function editStringToLevel(text: string): Level {
  const trimmed = text.trim()
  if (trimmed === '') return null
  if (trimmed === 'N/A') return 'N/A'
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed)
  return { expression: trimmed }
}

let localSequence = 0
/** New sections/questions need a stable numeric id unique within this
 * standard. Existing ids in a cloned/loaded standard came from the source
 * data (arbitrary integers), so this counts up from the current max rather
 * than reusing any fixed range. */
function nextNumericId(existingIds: number[]): number {
  localSequence += 1
  return Math.max(0, ...existingIds) + localSequence
}

function blankQuestion(id: number, sortOrder: number): Question {
  return {
    id,
    code: '',
    text: toLocalizedText(''),
    tooltip: null,
    controlType: 'TEXT',
    sortOrder,
    isMandatory: true,
    isActivitySite: false,
    args: [],
    notification: null,
    dependsOn: [],
    options: [],
  }
}

function OptionRow({
  option,
  onChange,
  onRemove,
}: {
  option: AnswerOption
  onChange: (next: AnswerOption) => void
  onRemove: () => void
}) {
  const characterisation = option.characterisation
  const isExprCharacterisation = !(characterisation instanceof Set)
  const tagSet = characterisation instanceof Set ? characterisation : new Set<Characterisation>()
  const expressionText = characterisation instanceof Set ? '' : characterisation.expression

  function toggleTag(tag: Characterisation) {
    const next = new Set(tagSet)
    if (next.has(tag)) next.delete(tag)
    else next.add(tag)
    onChange({ ...option, characterisation: next })
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 90px 1fr 32px', gap: 8, alignItems: 'start', marginBottom: 8 }}>
      <Input value={option.value} placeholder="Value" onChange={(e) => onChange({ ...option, value: e.target.value })} />
      <Input
        value={localize(option.label)}
        placeholder="Label"
        onChange={(e) => onChange({ ...option, label: toLocalizedText(e.target.value) })}
      />
      <Input
        value={levelToEditString(option.level)}
        placeholder="Level"
        onChange={(e) => onChange({ ...option, level: editStringToLevel(e.target.value) })}
      />
      {isExprCharacterisation ? (
        <button
          type="button"
          onClick={() => onChange({ ...option, characterisation: new Set() })}
          title={expressionText}
          style={{ fontSize: 11.5, color: 'var(--text-muted)', background: 'var(--gray-100)', border: 'none', borderRadius: 8, padding: '0 10px', textAlign: 'left', cursor: 'pointer' }}
        >
          Computed — click to set fixed tags
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', height: 40 }}>
          {CHARACTERISATION_VALUES.map((tag) => (
            <label key={tag} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, cursor: 'pointer' }}>
              <Checkbox checked={tagSet.has(tag)} onChange={() => toggleTag(tag)} />
              {tag[0] + tag.slice(1).toLowerCase()}
            </label>
          ))}
        </div>
      )}
      <button type="button" onClick={onRemove} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)', height: 40 }}>
        <Icon name="trash-2" size={15} />
      </button>
    </div>
  )
}

function QuestionEditorModal({
  question,
  existingCodes,
  onCancel,
  onSave,
}: {
  question: Question
  existingCodes: Set<string>
  onCancel: () => void
  onSave: (q: Question) => void
}) {
  const [code, setCode] = useState(question.code)
  const [text, setText] = useState(localize(question.text))
  const [controlType, setControlType] = useState<ControlType>(question.controlType)
  const [isMandatory, setIsMandatory] = useState(question.isMandatory)
  const [options, setOptions] = useState<AnswerOption[]>(question.options)

  const isNewQuestion = question.code === ''
  const codeTaken = code.trim() !== question.code && existingCodes.has(code.trim())
  const canSave = code.trim().length > 0 && text.trim().length > 0 && !codeTaken

  function addOption() {
    setOptions((o) => [...o, { value: '', label: toLocalizedText(''), level: null, characterisation: new Set() }])
  }
  function updateOption(i: number, next: AnswerOption) {
    setOptions((o) => o.map((row, idx) => (idx === i ? next : row)))
  }
  function removeOption(i: number) {
    setOptions((o) => o.filter((_, idx) => idx !== i))
  }

  return (
    <div
      onClick={onCancel}
      style={{ position: 'fixed', inset: 0, background: 'rgba(1,44,76,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 640, maxHeight: '85%', overflowY: 'auto', background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 12px 32px rgba(1,44,76,0.14)' }}
      >
        <h2 style={{ fontFamily: 'var(--font-display)', margin: '0 0 16px', fontSize: 20 }}>
          {isNewQuestion ? 'Add question' : `Edit ${question.code}`}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Input label="Question code" required value={code} onChange={(e) => setCode(e.target.value)} error={codeTaken ? 'Already used in this standard' : undefined} />
          <Select label="Control type" value={controlType} onChange={(e) => setControlType(e.target.value as ControlType)} options={CONTROL_TYPES} />
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', marginBottom: 6 }}>Question text</div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            style={{ width: '100%', border: '1.5px solid var(--border-strong)', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <Checkbox label="Mandatory" checked={isMandatory} onChange={(e) => setIsMandatory(e.target.checked)} />
        </div>

        {SELECT_CONTROL_TYPES.has(controlType) && (
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)' }}>Answer options</div>
              <Button variant="ghost" size="sm" iconLeft={<Icon name="plus" size={13} />} onClick={addOption}>
                Add option
              </Button>
            </div>
            {options.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>No options yet.</div>}
            {options.map((opt, i) => (
              <OptionRow key={i} option={opt} onChange={(next) => updateOption(i, next)} onRemove={() => removeOption(i)} />
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--gray-100)' }}>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!canSave}
            onClick={() =>
              onSave({
                ...question,
                code: code.trim(),
                text: toLocalizedText(text.trim()),
                controlType,
                isMandatory,
                options,
              })
            }
          >
            Save question
          </Button>
        </div>
      </div>
    </div>
  )
}

export function StandardEditorPage() {
  const { standardId } = useParams<{ standardId: string }>()
  const navigate = useNavigate()
  const isNew = standardId === 'new'
  const standards = useStandardsStore((s) => s.standards)
  const loaded = useStandardsStore((s) => s.loaded)
  const loadAll = useStandardsStore((s) => s.loadAll)
  const createStandard = useStandardsStore((s) => s.createStandard)
  const updateStandard = useStandardsStore((s) => s.updateStandard)
  const deleteStandard = useStandardsStore((s) => s.deleteStandard)
  const cloneStandard = useStandardsStore((s) => s.cloneStandard)
  const publishStandard = useStandardsStore((s) => s.publishStandard)

  useEffect(() => {
    if (!loaded) void loadAll()
  }, [loaded, loadAll])

  const existing = useMemo(() => standards.find((s) => s.id === standardId), [standards, standardId])
  const readOnly = !isNew && existing?.status === 'Published'

  const [name, setName] = useState('')
  const [version, setVersion] = useState('')
  const [sections, setSections] = useState<Section[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [codeAliases, setCodeAliases] = useState<Record<string, number>>({})
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null)
  const [newSectionName, setNewSectionName] = useState('')
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [dirty, setDirty] = useState(false)
  const [draggedQuestionId, setDraggedQuestionId] = useState<number | null>(null)
  const [dragOverQuestionId, setDragOverQuestionId] = useState<number | null>(null)

  useEffect(() => {
    if (!existing) return
    setName(existing.name)
    setVersion(existing.version)
    setSections(existing.sections)
    setQuestions(existing.questions.map(hydrateQuestion))
    setCodeAliases(existing.codeAliases)
    setActiveSectionId(existing.sections[0]?.id ?? null)
    setDirty(false)
  }, [existing])

  if (!isNew && !existing && loaded) {
    return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Standard not found.</div>
  }

  const questionsById = new Map(questions.map((q) => [q.id, q]))
  const activeSection = sections.find((s) => s.id === activeSectionId) ?? null

  function markDirty() {
    setDirty(true)
  }

  function addSection() {
    if (!newSectionName.trim()) return
    const id = nextNumericId(sections.map((s) => s.id))
    const section: Section = { id, name: newSectionName.trim(), sortOrder: sections.length, subsections: null, questionIds: [] }
    setSections((s) => [...s, section])
    setActiveSectionId(id)
    setNewSectionName('')
    markDirty()
  }

  function removeSection(id: number) {
    const section = sections.find((s) => s.id === id)
    if (!section) return
    if (!confirm(`Delete "${section.name}" and its ${section.questionIds.length} question(s)?`)) return
    setSections((s) => s.filter((x) => x.id !== id))
    setQuestions((qs) => qs.filter((q) => !section.questionIds.includes(q.id)))
    setCodeAliases((aliases) => {
      const next = { ...aliases }
      for (const q of questions.filter((x) => section.questionIds.includes(x.id))) delete next[q.code]
      return next
    })
    if (activeSectionId === id) setActiveSectionId(sections.find((s) => s.id !== id)?.id ?? null)
    markDirty()
  }

  function openAddQuestion() {
    if (!activeSection) return
    const id = nextNumericId(questions.map((q) => q.id))
    setEditingQuestion(blankQuestion(id, activeSection.questionIds.length))
  }

  function saveQuestion(q: Question) {
    const isNewQuestion = !questionsById.has(q.id)
    const previousCode = questionsById.get(q.id)?.code

    setQuestions((qs) => (isNewQuestion ? [...qs, q] : qs.map((row) => (row.id === q.id ? q : row))))
    setCodeAliases((aliases) => {
      const next = { ...aliases }
      if (previousCode && previousCode !== q.code) delete next[previousCode]
      next[q.code] = q.id
      return next
    })
    if (isNewQuestion && activeSection) {
      setSections((secs) => secs.map((s) => (s.id === activeSection.id ? { ...s, questionIds: [...s.questionIds, q.id] } : s)))
    }
    setEditingQuestion(null)
    markDirty()
  }

  /** Reorders within `section.questionIds` only — that array (not
   * `question.sortOrder`) is what the Field App actually iterates
   * (see `flatQuestions.ts`), so it's the only thing that needs to move. */
  function reorderQuestion(sectionId: number, draggedId: number, targetId: number) {
    if (draggedId === targetId) return
    setSections((secs) =>
      secs.map((s) => {
        if (s.id !== sectionId) return s
        const ids = [...s.questionIds]
        const from = ids.indexOf(draggedId)
        const to = ids.indexOf(targetId)
        if (from === -1 || to === -1) return s
        ids.splice(from, 1)
        ids.splice(to, 0, draggedId)
        return { ...s, questionIds: ids }
      }),
    )
    markDirty()
  }

  function removeQuestion(q: Question) {
    if (!confirm(`Delete question "${q.code}"?`)) return
    setQuestions((qs) => qs.filter((row) => row.id !== q.id))
    setSections((secs) => secs.map((s) => ({ ...s, questionIds: s.questionIds.filter((id) => id !== q.id) })))
    setCodeAliases((aliases) => {
      const next = { ...aliases }
      delete next[q.code]
      return next
    })
    markDirty()
  }

  async function handleSave() {
    const payload = { name, version, sections, questions, codeAliases, knownIssues: existing?.knownIssues ?? [] }
    if (isNew) {
      const id = newId()
      await createStandard({ id, status: 'Draft', isActive: false, clonedFromId: null, ...payload })
      navigate(`/standard/${id}`)
    } else if (standardId) {
      await updateStandard(standardId, payload)
      setDirty(false)
    }
  }

  return (
    <div style={{ padding: '22px 26px 30px', position: 'relative' }}>
      <button
        type="button"
        onClick={() => navigate('/standard')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--ocean)', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0, marginBottom: 14 }}
      >
        <Icon name="arrow-left" size={14} /> Back to standards
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 16 }}>
        <div style={{ flex: 1 }}>
          {readOnly ? (
            <>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, margin: 0 }}>{name}</h1>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Version {version}</div>
            </>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 12, maxWidth: 560 }}>
              <Input
                value={name}
                placeholder="Standard name"
                onChange={(e) => {
                  setName(e.target.value)
                  markDirty()
                }}
              />
              <Input
                value={version}
                placeholder="Version"
                onChange={(e) => {
                  setVersion(e.target.value)
                  markDirty()
                }}
              />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 'none' }}>
          {existing && <Badge tone={existing.status === 'Published' ? 'success' : existing.status === 'Draft' ? 'info' : 'neutral'}>{existing.status}</Badge>}
          {existing?.isActive && <Badge tone="success">Active</Badge>}
          {existing && (
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Icon name="copy" size={14} />}
              onClick={async () => {
                const clone = await cloneStandard(existing.id, `${existing.name} (copy)`, `${existing.version}-draft`)
                navigate(`/standard/${clone.id}`)
              }}
            >
              Clone
            </Button>
          )}
          {!readOnly && existing?.status === 'Draft' && (
            <Button variant="secondary" size="sm" iconLeft={<Icon name="upload" size={14} />} onClick={() => void publishStandard(existing.id)}>
              Publish
            </Button>
          )}
          {!readOnly && existing && !existing.isActive && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (confirm(`Delete "${existing.name}"? This can't be undone.`)) {
                  void deleteStandard(existing.id).then(() => navigate('/standard'))
                }
              }}
            >
              Delete
            </Button>
          )}
          {!readOnly && (
            <Button variant="primary" size="sm" onClick={() => void handleSave()} disabled={!name || !version || (!dirty && !isNew)}>
              Save standard
            </Button>
          )}
        </div>
      </div>

      {readOnly && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--color-primary-subtle)', borderRadius: 10, marginBottom: 18, fontSize: 12.5, color: 'var(--ocean-deep)' }}>
          <Icon name="lock" size={14} />
          Published standards are read-only. Clone this one to make revisions.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 2px rgba(1,44,76,0.05)' }}>
          {sections.map((s, i) => (
            <div
              key={s.id}
              onClick={() => setActiveSectionId(s.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                borderTop: i === 0 ? 'none' : '1px solid var(--gray-100)',
                background: s.id === activeSectionId ? 'var(--color-primary-subtle)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.questionIds.length} questions</div>
              </div>
              {!readOnly && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeSection(s.id)
                  }}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)', flex: 'none' }}
                >
                  <Icon name="trash-2" size={13} />
                </button>
              )}
            </div>
          ))}
          {sections.length === 0 && <div style={{ padding: 14, fontSize: 12.5, color: 'var(--text-muted)' }}>No sections yet.</div>}
          {!readOnly && (
            <div style={{ display: 'flex', gap: 6, padding: 10, borderTop: sections.length > 0 ? '1px solid var(--gray-100)' : 'none' }}>
              <input
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSection()}
                placeholder="New section name"
                style={{ flex: 1, minWidth: 0, height: 32, border: '1.5px solid var(--border-strong)', borderRadius: 8, padding: '0 10px', fontSize: 12.5 }}
              />
              <button type="button" onClick={addSection} style={{ width: 32, height: 32, border: 'none', borderRadius: 8, background: 'var(--color-primary-subtle)', color: 'var(--ocean)', cursor: 'pointer', flex: 'none' }}>
                <Icon name="plus" size={14} />
              </button>
            </div>
          )}
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 2px rgba(1,44,76,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--gray-100)' }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{activeSection ? activeSection.name : 'Select a section'}</div>
            {!readOnly && activeSection && (
              <Button variant="ghost" size="sm" iconLeft={<Icon name="plus" size={13} />} onClick={openAddQuestion}>
                Add question
              </Button>
            )}
          </div>
          {!activeSection ? (
            <div style={{ padding: 20, fontSize: 12.5, color: 'var(--text-muted)' }}>Pick a section on the left, or add one.</div>
          ) : activeSection.questionIds.length === 0 ? (
            <div style={{ padding: 20, fontSize: 12.5, color: 'var(--text-muted)' }}>No questions in this section yet.</div>
          ) : (
            activeSection.questionIds.map((qid, i) => {
              const q = questionsById.get(qid)
              if (!q) return null
              const isDragging = draggedQuestionId === qid
              const isDragOver = dragOverQuestionId === qid && draggedQuestionId !== qid
              return (
                <div
                  key={qid}
                  onClick={() => setEditingQuestion(q)}
                  draggable={!readOnly}
                  onDragStart={(e) => {
                    setDraggedQuestionId(qid)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragOver={(e) => {
                    if (readOnly || draggedQuestionId == null) return
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                    setDragOverQuestionId(qid)
                  }}
                  onDragLeave={() => setDragOverQuestionId((cur) => (cur === qid ? null : cur))}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (draggedQuestionId != null && activeSection) reorderQuestion(activeSection.id, draggedQuestionId, qid)
                    setDraggedQuestionId(null)
                    setDragOverQuestionId(null)
                  }}
                  onDragEnd={() => {
                    setDraggedQuestionId(null)
                    setDragOverQuestionId(null)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '11px 16px',
                    borderTop: isDragOver ? '2px solid var(--ocean)' : i === 0 ? 'none' : '1px solid var(--gray-100)',
                    cursor: 'pointer',
                    opacity: isDragging ? 0.4 : 1,
                    background: isDragOver ? 'var(--color-primary-subtle)' : undefined,
                  }}
                >
                  {!readOnly && (
                    <Icon
                      name="grip-vertical"
                      size={14}
                      style={{ color: 'var(--text-muted)', flex: 'none', cursor: 'grab' }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{localize(q.text)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{q.code}</div>
                  </div>
                  <Badge tone="neutral">{q.controlType}</Badge>
                  {q.options.length > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{q.options.length} options</span>}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeQuestion(q)
                      }}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                    >
                      <Icon name="trash-2" size={14} />
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {editingQuestion && !readOnly && (
        <QuestionEditorModal
          question={editingQuestion}
          existingCodes={new Set(questions.map((q) => q.code))}
          onCancel={() => setEditingQuestion(null)}
          onSave={saveQuestion}
        />
      )}
    </div>
  )
}
