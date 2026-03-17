/**
 * worker/lib/prompt-constants.js
 *
 * Standalone copy of lib/prompt-constants.js for the worker service.
 * Single source of truth for all virtual staging prompt constants.
 */

export const STRUCTURAL_LOCK_DIRECTIVE = buildStructuralLock()

/**
 * Builds the structural lock directive, optionally excluding walls and/or floors
 * from the protected elements list when the user wants to override them.
 *
 * @param {{ preserveWalls?: boolean, preserveFloors?: boolean }} opts
 * @returns {string}
 */
export function buildStructuralLock({ preserveWalls = true, preserveFloors = true } = {}) {
  const protectedElements = [
    `- DOORS: door panels, door frames, door handles, hinges, locks, doorbells, thresholds, door trim/molding, peepholes, sliding door tracks`,
    `- WINDOWS: window frames, glass panes, window sills, window grilles/bars/railings, window handles, shutters, blind tracks, mosquito screens`,
    preserveWalls ? `- WALLS: wall surfaces, paint colors, wall textures, baseboards/skirting boards, crown moldings, wall tiles, wall outlets, light switches, intercoms` : null,
    preserveFloors ? `- FLOORS: floor material, floor color, floor pattern, floor texture, floor transitions, drain covers` : null,
    `- CEILING: ceiling surface, ceiling height, recessed spotlights/downlights (embutidos), ceiling fans, ceiling moldings, exposed beams, skylights — NOTE: hanging pendant lights, chandeliers, and suspended fixtures are NOT on this protected list and may be replaced by the staging rules below`,
    `- OPENINGS: corridors, archways, passages, hallways — ALL must remain fully visible, unobstructed, and dimensionally identical`,
    `- VIEWS THROUGH OPENINGS: Everything visible beyond doors, corridors, windows, and any opening — adjacent rooms, hallways, exterior views, sky — MUST remain PIXEL-PERFECT identical to the original photograph. NEVER invent, add, substitute, or alter what is seen through any opening. Do NOT add gardens, patios, courtyards, outdoor landscaping, plants, trees, sky gradients, or any content NOT present in the original beyond any opening.`,
    `- FIXED INSTALLATIONS: built-in cabinets, fixed countertops, plumbing fixtures, electrical panels, air conditioning units, radiators, water heaters, gas registers`,
  ].filter(Boolean).join('\n')

  return `PRIORITY ZERO — STRUCTURAL INTEGRITY LOCK (ABSOLUTE AND INVIOLABLE):
Every architectural and structural element in the original photograph MUST remain PIXEL-PERFECT and COMPLETELY UNCHANGED. This rule OVERRIDES all other instructions without exception.

RESOLUTION & DIMENSION LOCK:
The output image MUST preserve the EXACT SAME resolution, dimensions, and aspect ratio as the input photograph. Do NOT crop, pad, resize, letterbox, or change the pixel dimensions in any way. The output must be a 1:1 dimensional match of the input.

PERSPECTIVE GEOMETRY LOCK — INVIOLABLE:
The camera position and optical geometry of the original photograph are FROZEN:
- The horizon line must be at the EXACT SAME pixel height as the original.
- All vanishing points must remain at their EXACT SAME pixel coordinates.
- Wall angles, floor angles, and ceiling angles must be GEOMETRICALLY IDENTICAL to the original — do NOT tilt, warp, distort, or re-perspectivize any surface.
- The relative size of all architectural elements (ceiling height, wall width, door/window proportions) must appear IDENTICAL to the original.
- This means: do NOT zoom in or out even slightly — any perceived change in room scale is PROHIBITED.

ELEMENTS THAT MUST NEVER BE ALTERED, REMOVED, MOVED, RESIZED, RECOLORED, OR OBSCURED:
${protectedElements}

MANDATORY VERIFICATION BEFORE OUTPUT:
Count every door and window visible in the original image. The output MUST have the EXACT SAME number of doors and windows, in the EXACT SAME positions, with the EXACT SAME dimensions, colors, and materials. If ANY door or window is missing, altered, partially hidden, or dimensionally changed — the output is INVALID.
Verify the horizon line and perspective geometry are unchanged. If the walls, floor, or ceiling appear to have shifted angle compared to the original — the output is INVALID.

NO piece of furniture, rug, curtain, plant, or decorative element may block, cover, partially obstruct, or reduce the visible area of ANY door, window, corridor, passage, or architectural opening.`
}

export const STAGING_UNIVERSAL_RULES = `PERSPECTIVE — INVIOLABLE RULE:
THE CAMERA DOES NOT MOVE. The viewpoint, angle, focal length, framing, and proportions of the original photo are ABSOLUTELY IMMUTABLE. The horizon line, vanishing points, and perspective geometry must be IDENTICAL pixel by pixel. Do NOT rotate, tilt, zoom in, zoom out, or crop the image in any way. Do NOT alter the apparent height of the ceiling, the width of the walls, or the depth of the room. All architectural angles (walls meeting floor, walls meeting ceiling, floor receding into distance) must match the original exactly. Any deviation in perspective geometry makes the output INVALID.

UNIVERSAL POSITIONING RULE — MANDATORY AND ABSOLUTE:
No piece of furniture, rug, decorative object, or any inserted element may obstruct, block, partially cover, or reduce the passage through DOORS, WINDOWS, CORRIDORS, or any visible opening in the room. All access points and openings must remain completely unobstructed and visible in the final image, exactly as they appear in the original photo.

FURNITURE PLACEMENT CLEARANCE ZONE — MANDATORY:
- NEVER place wardrobes, closets, tall cabinets, bookshelves, or any tall furniture against a wall that contains a window. Windows must remain fully unobstructed with clear space in front of them.
- Large furniture (wardrobes, closets, dressers taller than 1m) must ONLY be placed against solid, uninterrupted walls — walls with NO windows and NO doors.
- If the room has limited wall space, prefer a smaller piece of furniture rather than blocking a window.
- Beds may be placed against a wall with a window ONLY if the headboard is lower than the window sill.
- NEVER place any furniture item against a wall segment that is clearly too narrow to accommodate it. If a wall section is bounded by structural elements (pillars, columns, door frames, window frames, corners) and the visible width is less than the furniture's width, leave that wall section EMPTY. Choose only wall segments with clearly sufficient open width.
- NEVER add built-in wardrobes, built-in cabinets, or built-in shelving units that do not already exist in the original photograph. Only ever add free-standing, portable furniture pieces, unless the specific style prompt explicitly requests a fitted wardrobe in a bedroom context.- INTEGRATED DINING AREA RULE: If the style prompt suggests adding a dining table in a living room, the table and chairs may ONLY be placed in an area with at least 1.5 meters of clear space on ALL sides — NEVER in front of, adjacent to, or within the path of a corridor, passage, archway, or any transition area between rooms. If there is no suitable area that meets this clearance requirement, DO NOT add a dining set at all.
GEOMETRIC ALIGNMENT — MANDATORY:
- All furniture must be positioned PARALLEL or PERPENDICULAR to the nearest walls. NEVER at a diagonal angle.
- Sofas and beds must be placed flush against a wall.
- Rugs must be aligned with the main axis of the room (parallel to the longest walls).
- Coffee tables must be centered relative to the sofa, aligned with its axes.
- Chairs must be aligned with tables, NEVER at an angle.

LIGHTING UPGRADE RULE — MANDATORY FOR ALL STAGING:
Any existing hanging pendant light, chandelier, suspended fixture, or wall sconce visible in the original photograph MUST be replaced with a NEW lighting fixture appropriate to the selected decorating style.
- The new fixture must be visually consistent with the furniture style being staged.
- The new fixture must be correctly centered above the main furniture group (table, sofa area, bed) or in the same ceiling position as the original.
- The hanging wire/cable and ceiling canopy must look clean, new, and properly installed.
- NEVER keep an old, damaged, crooked, improvised, or style-mismatched lighting fixture in a staged image.
- Recessed spotlights (spots embutidos) and ceiling fans are EXEMPT from this rule and must remain unchanged.`

export const CLEAN_UP_PROMPT = `Edit and return the provided real estate photo with a professional virtual cleanup applied. OUTPUT: Hyperrealistic cleaned interior photo, same resolution, dimensions, and framing as input, photorealistic and indistinguishable from a real photograph.

RESOLUTION & DIMENSION LOCK:
The output image MUST preserve the EXACT SAME resolution, dimensions, and aspect ratio as the input photograph. Do NOT crop, pad, resize, letterbox, or change the pixel dimensions in any way.

PERSPECTIVE — INVIOLABLE RULE:
THE CAMERA DOES NOT MOVE. The viewpoint, angle, focal length, framing, and proportions of the original photo are ABSOLUTELY IMMUTABLE. The horizon line, vanishing points, and perspective geometry must be IDENTICAL pixel by pixel. Do NOT rotate, tilt, zoom in, zoom out, or crop the image in any way.

Act as a professional real estate photography editor. Your task is to perform a complete and impeccable virtual cleaning of the provided image, preparing it for a premium property listing.

CLEANING AND ORGANIZATION INSTRUCTIONS (UNIVERSAL FOR ANY ROOM):

1. COMPLETE REMOVAL OF TRANSIENT ITEMS: Identify and remove ALL objects that a person would take when moving out or that indicate personal use. When in doubt, REMOVE.

   EXPLICIT LIST — REMOVE (TRANSIENT):
   - Clothing (on floor, chairs, clotheslines, baskets), shoes, bags, backpacks
   - Plastic bags, cardboard boxes, packaging, deliveries
   - Portable clotheslines (floor or hanging removable), laundry baskets
   - Brooms, squeegees, buckets, visible vacuum cleaners, floor cloths
   - Dishes (dirty or clean outside cabinets), pots, loose cutlery, dish towels
   - Detergents, sponges, visible cleaning products
   - Food items, bottles, grocery bags
   - Used towels, bathrobes, crumpled bath mats
   - Hygiene products (shampoos, soaps, toothbrushes, creams, makeup)
   - Toilet paper not in holder, open or full trash cans
   - Toys, games, loose pieces
   - Loose papers, pens, cables, chargers, visible wires
   - Personal electronics in use (phones, tablets, open laptops)
   - Remote controls, magazines, newspapers
   - Suitcases, backpacks, bags on the floor
   - Any type of trash or misplaced item

   EXPLICIT LIST — KEEP (FIXED/PERMANENT):
   - Sofas, beds, tables, chairs, shelves, TV stands, nightstands, dressers
   - Refrigerators, stoves, built-in microwaves, washers/dryers
   - Built-in cabinets, fixed countertops, wall-mounted shelves
   - Fixed lighting: recessed spotlights (spots embutidos), ceiling fans, wall-mounted permanent fixtures in clearly good condition
   - Wall-mounted frames and mirrors
   - Large decorative vases with plants (that appear to be part of the decor)
   - Curtains and blinds
   - Large rugs under furniture (that appear to be part of the decor)

2. LIGHTING REPAIR / REMOVAL:
   Inspect all visible light fixtures. Apply the following:
   - If a pendant light, chandelier, or suspended fixture is hanging crooked, has exposed wires, shows damage, rust, or is clearly improvised/makeshift: REMOVE it completely and leave a clean ceiling surface.
   - If a pendant light or chandelier is in good structural condition but simply dirty or dusty: keep it, clean it visually.
   - If the ceiling has only a bare hanging wire with no shade/fixture, or a wire with tape: REMOVE the wire and restore a clean ceiling.
   - Recessed spotlights (spots embutidos) and ceiling fans in any condition: KEEP and do not alter.

3. SURFACE ORGANIZATION:
   - Leave all horizontal surfaces (countertops, tables, nightstands, desks, floors) completely clean, uncluttered, and polished.
   - If there are beds: Make them perfectly, with sheets and covers stretched hotel-style.
   - If there are sofas/armchairs: Straighten the cushions to look new and aligned.
   - Straighten chairs and stools to be aligned with tables or countertops.

CRITICAL AND ABSOLUTE RESTRICTIONS (DO NOT TOUCH):

1. DO NOT ALTER THE STRUCTURE: Do not change walls, ceiling surface, floor, windows, doors, recessed spotlights, built-in cabinets, or fixed countertops. Exception: damaged or improvised hanging fixtures as described above.
2. DO NOT MOVE OR REMOVE PERMANENT FURNITURE: Items from the FIXED/PERMANENT list above must remain EXACTLY where they are.
3. DO NOT CHANGE THE DESIGN: Do not alter paint colors, material textures, fabric patterns, or the style of permanent decor.
4. DO NOT ALTER THE LIGHTING CONDITIONS: Maintain the exact natural light, shadow, and reflection conditions of the original photograph.

HYPERREALISM REQUIREMENT:
The output must be absolutely hyperrealistic — indistinguishable from a real photograph taken with a professional DSLR camera. Lighting, shadows, reflections, material textures, and depth of field must all be perfectly natural and consistent with the original photo.

Expected result: A professional, hyperrealistic real estate photograph showing the room exactly as it is, but in its cleanest, most organized, and most presentable state possible. Completely indistinguishable from a real photograph.`

// ── Limpa Bagunça — 3 Níveis ──────────────────────────────────────────────────

/**
 * NÍVEL 1 — Organizar Apenas
 */
export const CLEAN_UP_LEVEL_1 = `Edit and return the provided real estate photo with MINIMAL virtual cleanup applied. OUTPUT: Hyperrealistic cleaned interior photo, same resolution, dimensions, and framing as input, photorealistic and indistinguishable from a real photograph.

RESOLUTION & DIMENSION LOCK:
The output image MUST preserve the EXACT SAME resolution, dimensions, and aspect ratio as the input photograph. Do NOT crop, pad, resize, letterbox, or change the pixel dimensions in any way.

PERSPECTIVE — INVIOLABLE RULE:
THE CAMERA DOES NOT MOVE. The viewpoint, angle, focal length, framing, and proportions of the original photo are ABSOLUTELY IMMUTABLE. The horizon line, vanishing points, and perspective geometry must be IDENTICAL pixel by pixel. Do NOT rotate, tilt, zoom in, zoom out, or crop the image in any way.

Act as a professional real estate photography editor. Your task is to perform a VERY LIGHT virtual organization of the provided image — ONLY removing loose trash and straightening furniture. This is the MOST RESTRICTIVE cleanup level.

ALLOWED ACTIONS (ONLY THESE — NOTHING ELSE):
1. Remove LOOSE TRASH on the floor or surfaces: plastic bags, crumpled paper, napkins, food wrappers, empty bottles/cans, cigarette butts, random small debris, leaves/dirt brought in from outside.
2. Remove LOOSE PERSONAL ITEMS from floors: shoes, clothing on floor, bags on floor.
3. Straighten existing furniture: align chairs with tables, straighten cushions on existing sofas/chairs.
4. Make beds if present: straighten sheets and pillows neatly.
5. Close open cabinet doors or drawers that are visibly ajar.

ABSOLUTELY PROHIBITED — DO NOT DO ANY OF THESE:
- Do NOT alter, clean, repaint, or touch ANY wall surface — keep all stains, marks, scuffs, paint chips, crayon marks, construction dust, exposed wiring, or imperfections.
- Do NOT alter, clean, or touch ANY floor surface — keep all stains, scratches, dust, cement residue, or imperfections.
- Do NOT alter, clean, or touch the ceiling in any way.
- Do NOT remove or alter ANY lighting fixture (pendant lights, bare wires, broken fixtures — keep them ALL exactly as they are).
- Do NOT remove items on shelves, countertops, tables, or other surfaces (only remove items that are on the FLOOR and clearly trash).
- Do NOT remove large items: boxes, appliances, furniture, tools, construction materials, buckets, ladders.
- Do NOT remove curtains, blinds, or any window treatment.
- Do NOT remove wall-mounted items: frames, mirrors, clocks, shelves.
- Do NOT add ANY new objects, furniture, or decorative elements.
- Do NOT change paint colors, material textures, or surface finishes.
- Do NOT alter the lighting conditions — maintain exact natural light, shadows, and reflections.
- Do NOT remove construction-related elements: cement bags, paint cans, tools, scaffolding, protective plastic sheets, masking tape on walls.

HYPERREALISM REQUIREMENT:
The output must be absolutely hyperrealistic — indistinguishable from a real photograph. Lighting, shadows, reflections, material textures, and depth of field must all be perfectly natural and consistent with the original photo.

Expected result: The EXACT SAME room with ONLY loose floor trash removed and existing furniture straightened. Every wall stain, floor mark, ceiling imperfection, and fixture must remain EXACTLY as in the original. The room should look tidied but NOT renovated, NOT cleaned, NOT repainted.`

/**
 * NÍVEL LOGO — Mesmo molde do Level 1, mas com foco exclusivo em remoção de marca d'agua/logotipo.
 */
export const CLEAN_UP_LOGO_ONLY_LEVEL_1 = `Edit and return the provided real estate photo with MINIMAL logo cleanup applied. OUTPUT: Hyperrealistic cleaned interior photo, same resolution, dimensions, and framing as input, photorealistic and indistinguishable from a real photograph.

RESOLUTION & DIMENSION LOCK:
The output image MUST preserve the EXACT SAME resolution, dimensions, and aspect ratio as the input photograph. Do NOT crop, pad, resize, letterbox, or change the pixel dimensions in any way.

PERSPECTIVE — INVIOLABLE RULE:
THE CAMERA DOES NOT MOVE. The viewpoint, angle, focal length, framing, and proportions of the original photo are ABSOLUTELY IMMUTABLE. The horizon line, vanishing points, and perspective geometry must be IDENTICAL pixel by pixel. Do NOT rotate, tilt, zoom in, zoom out, or crop the image in any way.

Act as a professional real estate photography editor. Your task is to perform a VERY LIGHT virtual cleanup of the provided image — ONLY removing logos, watermarks, and text overlays. This is the MOST RESTRICTIVE cleanup level.

ALLOWED ACTIONS (ONLY THESE — NOTHING ELSE):
1. Remove visible portal logos (ZAP, VivaReal, OLX, Loft, QuintoAndar, Imovelweb, etc.).
2. Remove watermark text overlays: agency names, broker names, CRECI, phone numbers, URLs, emails.
3. Remove semi-transparent branding overlays, badges, ribbons, or labels.
4. Inpaint removed regions naturally, matching surrounding texture, lighting, and perspective with no visible seams.

ABSOLUTELY PROHIBITED — DO NOT DO ANY OF THESE:
- Do NOT alter, clean, repaint, or touch ANY wall surface — keep all stains, marks, scuffs, paint chips, crayon marks, construction dust, exposed wiring, or imperfections.
- Do NOT alter, clean, or touch ANY floor surface — keep all stains, scratches, dust, cement residue, or imperfections.
- Do NOT alter, clean, or touch the ceiling in any way.
- Do NOT remove or alter ANY lighting fixture (pendant lights, bare wires, broken fixtures — keep them ALL exactly as they are).
- Do NOT remove, move, organize, or alter ANY object/furniture/item in the room.
- Do NOT remove large items: boxes, appliances, furniture, tools, construction materials, buckets, ladders.
- Do NOT remove curtains, blinds, or any window treatment.
- Do NOT remove wall-mounted items: frames, mirrors, clocks, shelves.
- Do NOT add ANY new objects, furniture, or decorative elements.
- Do NOT change paint colors, material textures, or surface finishes.
- Do NOT alter the lighting conditions — maintain exact natural light, shadows, and reflections.
- Do NOT remove construction-related elements: cement bags, paint cans, tools, scaffolding, protective plastic sheets, masking tape on walls.

HYPERREALISM REQUIREMENT:
The output must be absolutely hyperrealistic — indistinguishable from a real photograph. Lighting, shadows, reflections, material textures, and depth of field must all be perfectly natural and consistent with the original photo.

Expected result: The EXACT SAME room with ONLY logos, watermarks, and text overlays removed. Every wall stain, floor mark, ceiling imperfection, furniture item, and fixture must remain EXACTLY as in the original.`

/**
 * NÍVEL 2 — Organizar + Pintar
 * @param {string} wallColor
 * @returns {string}
 */
export function buildCleanUpLevel2(wallColor = 'Branco Neve') {
  return `Edit and return the provided real estate photo with cleanup AND wall repainting applied. OUTPUT: Hyperrealistic photo, same resolution, dimensions, and framing as input, indistinguishable from a real photograph.

RESOLUTION & DIMENSION LOCK:
The output image MUST preserve the EXACT SAME resolution, dimensions, and aspect ratio as the input photograph. Do NOT crop, pad, resize, letterbox, or change the pixel dimensions in any way.

PERSPECTIVE — INVIOLABLE RULE:
THE CAMERA DOES NOT MOVE. The viewpoint, angle, focal length, framing, and proportions of the original photo are ABSOLUTELY IMMUTABLE. The horizon line, vanishing points, and perspective geometry must be IDENTICAL pixel by pixel.

You have TWO tasks. They have a strict priority order:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 1 — CLEAN UP THE ROOM (PRIMARY — EXECUTE FIRST — MANDATORY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This task is NON-NEGOTIABLE. It must be executed in full before any surface changes.
AN OUTPUT WITH VISIBLE CLUTTER, TRASH, OR MESS IS COMPLETELY UNACCEPTABLE.

1. Remove ALL loose trash from ALL surfaces and floors: plastic bags, crumpled paper, food wrappers, empty bottles/cans, debris, napkins, food scraps.
2. Remove ALL personal items from floors AND all surfaces: shoes, clothing, bags, toys.
3. Remove ALL loose items from countertops, tables, and shelves — leave surfaces clean and empty.
4. Remove cleaning supplies: brooms, mops, buckets, clotheslines, sponges.
5. Remove ALL visible trash cans and their contents.
6. Straighten ALL existing furniture: align chairs with tables, straighten cushions on sofas/chairs.
7. Make beds if present: straighten sheets and pillows neatly.
8. Close ALL open cabinet doors and drawers.

Do NOT remove permanent furniture (sofas, beds, tables, cabinets, appliances). Only remove loose clutter.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 2 — REPAINT WALLS (SECONDARY — EXECUTE AFTER TASK 1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Only after the room is fully cleaned, repaint ALL visible wall surfaces with a fresh uniform coat of: "${wallColor}".
- Apply uniformly, covering all stains, marks, crayon marks, scuffs, construction dust, and imperfections.
- Do NOT paint over wall tiles, exposed decorative brick, or stone surfaces — only drywall/plaster/concrete.
- Keep baseboards, crown moldings, and trim in their current color.
- Realistic paint finish — flat/matte walls with natural light reflections.

ABSOLUTELY PROHIBITED:
- Do NOT alter, touch, or change ANY floor surface — keep the floor EXACTLY as it is.
- Do NOT alter the ceiling.
- Do NOT remove or alter ANY lighting fixture.
- Do NOT add ANY new objects, furniture, or decorative elements.
- Do NOT remove construction materials (cement bags, paint cans, tools, scaffolding).
- Do NOT alter window frames, doors, or any architectural element.
- Do NOT change lighting conditions.

<verification>
Before finalizing the output, confirm:
[ ] ALL loose trash, clutter, and personal items have been removed from ALL surfaces and floors
[ ] ALL furniture is straightened and beds are made
[ ] ALL open cabinet doors and drawers are closed
[ ] ALL visible wall surfaces are freshly painted in "${wallColor}"
[ ] The floor is IDENTICAL to the original — not altered in any way
[ ] The perspective, framing, and dimensions are IDENTICAL to the input
</verification>

Expected result: The room is BOTH fully cleaned/organized AND all walls freshly painted in "${wallColor}". Floors, ceiling, and fixtures remain untouched and identical to the original.`
}

/**
 * NÍVEL 3 — Reforma Completa
 * @param {string} wallColor
 * @param {string} floorType
 * @returns {string}
 */
export function buildCleanUpLevel3(wallColor = 'Branco Neve', floorType = 'Porcelanato Claro') {
  return `Edit and return the provided real estate photo with COMPLETE virtual renovation applied. OUTPUT: Hyperrealistic renovated interior photo, same resolution, dimensions, and framing as input, indistinguishable from a real photograph.

RESOLUTION & DIMENSION LOCK:
The output image MUST preserve the EXACT SAME resolution, dimensions, and aspect ratio as the input photograph. Do NOT crop, pad, resize, letterbox, or change the pixel dimensions in any way.

PERSPECTIVE — INVIOLABLE RULE:
THE CAMERA DOES NOT MOVE. The viewpoint, angle, focal length, framing, and proportions of the original photo are ABSOLUTELY IMMUTABLE. The horizon line, vanishing points, and perspective geometry must be IDENTICAL pixel by pixel.

You have FOUR tasks. They have a strict sequential priority order:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 1 — CLEAN UP THE ROOM (PRIMARY — EXECUTE FIRST — MANDATORY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This task is NON-NEGOTIABLE. AN OUTPUT WITH ANY VISIBLE CLUTTER, TRASH, OR MESS IS COMPLETELY UNACCEPTABLE.

1. Remove ALL loose trash, debris, and litter from ALL surfaces and floors.
2. Remove ALL transient items: clothing, shoes, bags, boxes, papers, cables, chargers, food items, bottles, hygiene products, toys.
3. Remove ALL cleaning tools: brooms, mops, buckets, clotheslines.
4. Remove ALL trash cans and their contents.
5. Straighten ALL existing furniture neatly.
6. Make beds perfectly, hotel-style.
7. Leave ALL horizontal surfaces (countertops, tables, shelves) completely clean and empty.

Do NOT remove permanent furniture or fixed architectural elements.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 2 — REPAINT WALLS (EXECUTE AFTER TASK 1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Repair ALL wall imperfections: fill cracks, patch holes, level uneven surfaces.
- Repaint ALL visible wall surfaces with fresh, uniform: "${wallColor}".
- Do NOT paint over wall tiles, decorative brick, or stone surfaces.
- Keep baseboards and moldings; paint them white/clean if visibly damaged.
- Smooth, professional finish — freshly plastered and painted look.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 3 — REPLACE FLOOR (EXECUTE AFTER TASKS 1 AND 2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Replace the ENTIRE visible floor surface with: "${floorType}".
- Follow room geometry perfectly — correct perspective, proper grout lines/joints, realistic material texture.
- Natural reflections and shadows on the new floor surface.
- Floor transitions at doorways look natural and properly finished.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 4 — CEILING + LIGHTING REPAIR (EXECUTE LAST)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Clean ceiling: remove stains, watermarks, mold, discoloration. Appears freshly painted white.
- Repair visible cracks or damage on the ceiling surface.
- Keep ALL recessed spotlights, ceiling fans, and fixed ceiling elements in place.
- Pendant light/chandelier hanging crooked, with exposed wires, or damaged: REMOVE it, restore clean ceiling.
- Bare hanging wires with no fixture: REMOVE and restore clean ceiling.

STRUCTURAL ELEMENTS — DO NOT ALTER:
- Do NOT alter doors, windows, door frames, window frames, or any architectural opening.
- Do NOT change room layout or wall positions.
- Do NOT remove built-in cabinets, fixed countertops, or plumbing fixtures.
- Do NOT add ANY new furniture, decorative objects, or staging elements.
- Do NOT alter the lighting conditions — maintain natural light and shadows.

<verification>
Before finalizing the output, confirm:
[ ] ALL loose trash, clutter, and personal items have been removed from ALL surfaces and floors
[ ] The room is completely tidy — no mess visible anywhere
[ ] ALL visible wall surfaces are freshly painted in "${wallColor}"
[ ] The ENTIRE floor surface has been replaced with "${floorType}"
[ ] The ceiling is clean and repaired
[ ] The perspective, framing, and dimensions are IDENTICAL to the input
</verification>

Expected result: A COMPLETELY RENOVATED room — cleaned of ALL loose items AND walls painted in "${wallColor}" AND floor replaced with "${floorType}" AND ceiling clean. Move-in ready, as if a real renovation crew just finished.`
}

// ── Virtual Staging — Modular Option Fragments ────────────────────────────────

export const STAGING_EXCLUSIONS = {
  curtains: `WINDOW TREATMENT EXCLUSION: Do NOT add any curtains, drapes, sheers, blinds, or any window treatment. Leave all windows completely bare — only the existing frames and glass.`,
  lighting: `LIGHTING EXCLUSION: Do NOT replace, upgrade, or add any lighting fixture. Keep ALL existing lighting fixtures EXACTLY as they are in the original photograph, regardless of their condition. This OVERRIDES the LIGHTING UPGRADE RULE.`,
  decor: `DECORATIVE ACCESSORIES EXCLUSION: Do NOT add any decorative accessories — no vases, candles, books, picture frames, sculptures, clocks, trays, bowls, or small decorative objects. Only add functional furniture pieces.`,
  plants: `PLANTS EXCLUSION: Do NOT add any indoor plants, potted plants, hanging plants, succulents, or any greenery/vegetation inside the room.`,
  rugs: `RUGS EXCLUSION: Do NOT add any area rugs, carpets, runners, or any floor covering. Leave the floor completely bare and visible.`,
  wallDecor: `WALL DECOR EXCLUSION: Do NOT add any wall art, framed prints, paintings, mirrors hung on walls, floating shelves, or any decorative object mounted or placed on walls. Leave all walls completely bare.`,
}

/**
 * Builds a wall paint override instruction for staging.
 * @param {string} color
 * @returns {string}
 */
export function buildStagingWallPaintOverride(color, texture = null) {
  const textureClause = texture
    ? `\nAPPLY WALL TEXTURE: In addition to the paint color, apply a "${texture}" decorative texture finish to all repainted wall surfaces. The texture must be realistic, consistent, and follow the natural light direction and shadows of the room.`
    : ''
  return `WALL PAINT OVERRIDE — THIS OVERRIDES THE WALL PRESERVATION RULE FOR WALLS ONLY:
Repaint ALL visible wall surfaces (drywall, plaster, concrete) with a fresh uniform coat of: "${color}".
- Apply uniformly, covering all existing paint, stains, marks, and imperfections.
- Do NOT paint over wall tiles, decorative exposed brick, or stone surfaces.
- Keep baseboards and crown moldings in their current color.
- Maintain realistic flat/matte paint finish with natural light reflections.${textureClause}
- This override applies ONLY to wall surfaces — floors, ceiling, and all other protected elements remain UNCHANGED.`
}

/**
 * Builds a floor replacement override instruction for staging.
 * @param {string} floorType
 * @returns {string}
 */
export function buildStagingFloorOverride(floorType) {
  return `FLOOR REPLACEMENT OVERRIDE — THIS OVERRIDES THE FLOOR PRESERVATION RULE:
Replace the ENTIRE visible floor surface with: "${floorType}".
- The new floor must follow the room's geometry perfectly — correct perspective, proper grout lines/joints, realistic material texture.
- Floor transitions at doorways must look natural and properly finished.
- Maintain proper reflections and shadows on the new floor surface consistent with the room's lighting.
- This override applies ONLY to the floor — walls, ceiling, and all other protected elements remain UNCHANGED.`
}

// ── Foto Turbinada — 3 Levels ─────────────────────────────────────────────────

export const FOTO_TURBINADA_LEVELS = {
  1: {
    label: 'Sutil',
    desc: 'Ajuste leve — correção de luz e cores, sem alterar a essência',
    prompt: 'subtle professional real estate photography enhancement, gentle HDR, natural true-to-life colors, sharp details, clean image, high quality',
    negative_prompt: 'blurry, low quality, distorted, noisy, oversaturated, artificial, heavy HDR, cartoon',
    dynamic: 3,
    creativity: 0.15,
    resemblance: 0.85,
  },
  2: {
    label: 'Padrão',
    desc: 'Aprimoramento equilibrado — HDR, cores vibrantes, nitidez profissional',
    prompt: 'professional real estate photography, HDR, natural lighting, sharp details, vibrant colors, high quality',
    negative_prompt: 'blurry, low quality, distorted, noisy, dark, underexposed',
    dynamic: 6,
    creativity: 0.35,
    resemblance: 0.6,
  },
  3: {
    label: 'Máximo',
    desc: 'Transformação intensa — HDR dramático, cores vivas, impacto visual máximo',
    prompt: 'stunning luxury real estate photography, dramatic HDR, vivid vibrant colors, ultra sharp details, magazine quality, professional lighting, high contrast, beautiful',
    negative_prompt: 'blurry, low quality, distorted, noisy, dark, underexposed, dull, flat, amateur',
    dynamic: 8,
    creativity: 0.5,
    resemblance: 0.4,
  },
}

// ── Cleanup options constants ─────────────────────────────────────────────────

export const CLEANUP_WALL_COLORS = [
  { id: 'branco_neve', label: 'Branco Neve', hex: '#FAFAFA' },
  { id: 'branco_gelo', label: 'Branco Gelo', hex: '#F0F4F8' },
  { id: 'marfim', label: 'Marfim', hex: '#FFFFF0' },
  { id: 'perola', label: 'Pérola', hex: '#F5F0E8' },
  { id: 'areia', label: 'Areia', hex: '#E8DCC8' },
  { id: 'camurca', label: 'Camurça', hex: '#D2B48C' },
  { id: 'linho', label: 'Linho', hex: '#EDE8D0' },
  { id: 'bege_classico', label: 'Bege Clássico', hex: '#D9C9A8' },
  { id: 'cinza_claro', label: 'Cinza Claro', hex: '#D3D3D3' },
  { id: 'cinza_urbano', label: 'Cinza Urbano', hex: '#A9A9A9' },
]

export const CLEANUP_FLOOR_TYPES = [
  { id: 'porcelanato_claro', label: 'Porcelanato Claro', hex: '#E8E0D4' },
  { id: 'porcelanato_escuro', label: 'Porcelanato Escuro', hex: '#4A4A4A' },
  { id: 'vinilico_madeira_clara', label: 'Vinílico Madeira Clara', hex: '#C8A86E' },
  { id: 'vinilico_madeira_escura', label: 'Vinílico Madeira Escura', hex: '#6B4226' },
  { id: 'ceramica_bege', label: 'Cerâmica Bege', hex: '#D2B98B' },
  { id: 'cimento_queimado', label: 'Cimento Queimado', hex: '#8B8682' },
]
