import raw from './standard.v2_4.json';
import type { Standard } from '../schema/types';

/**
 * NOTE on `characterisation`: `AnswerOption.characterisation` is typed as a
 * `Set<Characterisation>` (see `standard/schema/types.ts`), but JSON has no
 * Set literal, so the generated file stores it as a plain sorted string
 * array. This cast does not hydrate that array back into a real `Set` —
 * nothing in this codebase's dependency/visibility engine reads
 * `characterisation` (it is a scoring concept, out of scope here; see
 * Document 1 §6.1), so this has never needed to matter in practice. If a
 * future feature needs real `Set` semantics (e.g. `.has(...)`), add a
 * hydration step here (`new Set(entry.characterisation)` per option)
 * instead of relying on this cast.
 */
export const STANDARD: Standard = raw as unknown as Standard;
