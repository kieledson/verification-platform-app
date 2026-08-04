/**
 * The generated standard has no first-class "unit" field — `question.args`
 * only ever carries `MODAL:*`/`SELECTONLY`/`MULTILINE` tokens, never a unit
 * (confirmed against all 298 questions). But several NUMBER questions do
 * imply a unit in their own wording ("...in hectares?", "...in metric tons
 * per hectare?"), which the design calls for rendering inside the field.
 * This infers that unit from the question text itself rather than
 * fabricating a schema field the source data doesn't have. Derived by
 * reading all 26 real NUMBER-question texts, not guessed in the abstract —
 * see the file this was built against for the exact phrasings matched.
 */
export function inferUnit(questionText: string): string | null {
  const text = questionText.toLowerCase()

  if (/metric tons per hectare/.test(text)) return 'mt/ha'
  if (/hectares/.test(text)) return 'ha'
  if (/metric tons/.test(text)) return 'mt'
  if (/\bin percent\b/.test(text) || /percentage/.test(text)) return '%'
  if (/how many kg\b/.test(text) || /\bkg of\b/.test(text)) return 'kg'

  return null
}
