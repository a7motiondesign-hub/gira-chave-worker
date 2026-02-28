/**
 * worker/lib/prompts.js
 *
 * Re-exports the prompt library from the main Next.js lib directory.
 * Works in both local and Render environments because the entire repo
 * is cloned â€” worker/ and lib/ are siblings in the same directory tree.
 *
 * NOTE: Node.js ESM requires explicit .js extensions for relative imports.
 * The original files in lib/ omit extensions (Next.js bundler resolves them);
 * we re-export here with explicit paths to avoid resolving issues.
 */

// â”€â”€ Popular Brasileiro prompts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export { POPULAR_BRASILEIRO_PROMPTS, MODERNO_BRASILEIRO_PROMPTS } from './prompt-library-popular.js'

// â”€â”€ Full library â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export { PROMPT_LIBRARY } from './prompt-library.js'

