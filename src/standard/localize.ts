import type { LocalizedText } from '@/standard/schema/types'

/** English-only for now (per Document 1 §0) — always reads the `en` entry,
 * falling back to whatever's first so a malformed/empty array never throws. */
export function localize(text: LocalizedText | null | undefined): string {
  if (!text || text.length === 0) return ''
  const en = text.find((t) => t.LocaleCode === 'en')
  return (en ?? text[0]).Text
}
