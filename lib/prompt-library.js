/**
 * lib/prompt-library.js
 *
 * Unified prompt library — single source of truth for ALL virtual staging prompts.
 * All prompts in English. All 16 styles × 6 rooms = 96 prompts.
 * Each prompt includes hyperrealism requirement.
 *
 * Imported from lib/prompts/<room>.js for maintainability.
 */

import { LIVING_ROOM_PROMPTS } from './prompts/living-room.js'
import { BEDROOM_PROMPTS } from './prompts/bedroom.js'
import { BATHROOM_PROMPTS } from './prompts/bathroom.js'
import { DINING_ROOM_PROMPTS } from './prompts/dining-room.js'
import { KITCHEN_PROMPTS } from './prompts/kitchen.js'
import { OFFICE_PROMPTS } from './prompts/office.js'
// (standalone copy inside worker/lib — do not import from ../../lib/)

export const PROMPT_LIBRARY = {
  living_room: LIVING_ROOM_PROMPTS,
  bedroom: BEDROOM_PROMPTS,
  bathroom: BATHROOM_PROMPTS,
  dining_room: DINING_ROOM_PROMPTS,
  kitchen: KITCHEN_PROMPTS,
  office: OFFICE_PROMPTS,
}
