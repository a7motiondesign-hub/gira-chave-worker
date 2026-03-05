/**
 * worker/lib/prompts.js
 *
 * Re-exports the prompt library from the main Next.js lib directory.
 * Works in both local and Render environments because the entire repo
 * is cloned — worker/ and lib/ are siblings in the same directory tree.
 *
 * NOTE: Node.js ESM requires explicit .js extensions for relative imports.
 * The original files in lib/ omit extensions (Next.js bundler resolves them);
 * we re-export here with explicit paths to avoid resolving issues.
 */

// ── Full unified library (all rooms, all styles) ────────────────────────────
export { PROMPT_LIBRARY } from '../../lib/prompt-library.js'

// ── Shared prompt constants ─────────────────────────────────────────────────
export { CLEAN_UP_PROMPT, STRUCTURAL_LOCK_DIRECTIVE, STAGING_UNIVERSAL_RULES } from '../../lib/prompt-constants.js'
