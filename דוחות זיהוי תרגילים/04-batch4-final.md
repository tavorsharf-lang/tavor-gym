# Catalog Audit — Batch 4 (FINAL BATCH — completes the catalog)

Project: tavor-gym. All videos analyzed visually — frames extracted with `ffmpeg` from the **1080×1920 source files**, multiple timestamps per clip, burned-in captions and on-screen exercise titles transcribed.

---

## ⚠️ IMPORTANT — this batch has 7 records, not 10

You asked for "the next 10". **There are not 10 left.** The project state, verified against `src/db/seed.ts`, is:

| Batch | Records audited |
|---|---|
| Batch 1 | `db-bench-press` (pos 1), `dips` (pos 4) — 2 records |
| Batch 2 | `pushup` (0), `decline-machine-press` (3), `decline-pec-fly` (5), `bench-machine-press` (6), `overhead-tricep-ext` (7), `cable-tricep-pushdown` (8), `cross-cable-tricep` (9), `lat-pulldown` (10), `seated-row-heavy` (11), `seated-row-light` (12) — 10 records. **Also created** `incline-barbell-bench-press` (pos 2) by splitting the bench press. |
| Batch 3 | `low-row-rack` (13) … `machine-shoulder-press` (22) — 10 records |
| **Total audited before this batch** | **22 of 29** |

The catalog holds **29 records** (orders 0–28). That leaves **6 records never audited** — positions 23–28 — plus **`incline-barbell-bench-press` (position 2)**, which was *created* by batch 2's split and described inside `db-bench-press`'s entry but never given its own standalone A–L + BIOMECHANICAL HANDOFF. Since it is now a separate catalog record that your research model will receive as its own exercise, it gets a full standalone entry here.

**So: 7 entries below, and this batch finishes the entire catalog.** I did not pad to 10 with already-audited records.

---

## Verified project state at the start of this batch
- 29 exercises, orders 0–28 contiguous, no duplicate IDs.
- Migrations at version 10 (batch 2's split + field fixes). Batch 3 added no migration.
- `VIDEO_MISMATCH` open on: `seated-row-light`, `forearm-dumbbell`.
- Records with no video: `decline-pec-fly`, `bench-machine-press`, `behind-body-cable-curl`, `machine-squat`.
- 34 video clips across 25 records.

## Two global facts that apply to every record
1. `targetSets` and `defaultRestSeconds` in the seed are documentation only — `SEED_EXERCISES` overwrites both with the global defaults. Effective values everywhere are **2 sets / 120 s rest**. Only `targetReps` is per-record.
2. All demo clips are third-party instructional videos, not footage of Tavor's own equipment.

---

# BATCH EXERCISE 1 / GLOBAL CATALOG EXERCISE 2 — Incline Barbell Bench Press

*(Record created by batch 2's split of `db-bench-press`. Auditing it standalone here so the research model receives it as its own exercise.)*

## A. Identification
**App name after audit:** `לחיצת חזה במוט בשיפוע חיובי`
**Previous app name:** did not exist as its own record — it was half of `לחיצת חזה במוט — שיפוע חיובי ושטוח`
**Exercise ID / key:** `incline-barbell-bench-press`
**Hebrew standardized name:** לחיצת חזה במוט בשיפוע חיובי
**English standardized name:** **Incline Barbell Bench Press (~30–40°, free bar in a rack, moderately wide pronated grip)**
**Alternative/common names:** Incline Bench Press · Incline BB Press
**Exercise category:** inclined horizontal press
**Equipment:** free straight Olympic barbell + adjustable incline bench inside a power/half rack. Not a Smith machine, not dumbbells, not a machine press.

## B. Starting Position
**Body orientation:** supine on an inclined bench, feet on the floor.
**Torso angle:** **~30–40° from horizontal.** Low-to-moderate incline — clearly not a steep 45–60° shoulder-dominant setting; the athlete's head sits well below the top of the pad and the bar tracks to the upper chest rather than the clavicle/neck.
**Back support/position:** fully supported; deliberate lumbar arch with the glutes staying on the bench.
**Shoulder position:** retracted **and** depressed into the pad, held there the entire set.
**Elbow position:** ~45–60° from the torso, forearm vertical at the bottom, elbow stacked under the wrist.
**Hip position:** on the bench, hip in slight extension because of the arch.
**Knee position:** ~80–90°, feet pulled back under/behind the knees.
**Foot position:** flat on the floor, roughly shoulder-width, planted for leg drive.

## C. Grip / Contact
**Grip type:** pronated (overhand), full grip.
**Grip width:** moderately wide — roughly **1.4–1.6× biacromial width**, clearly outside the shoulders. Not close-grip.
**Hand position:** bar on the **heel of the palm, stacked in line with the forearm**. The clip devotes a close-up to this: bar high in the fingers → wrist bent back (❌, with an overlay marking the broken angle) vs bar in the palm heel with a straight wrist (✅).
**Handle/bar/attachment:** straight Olympic barbell, standard knurling, j-hooks on the rack.
**Other body contact points:** bench pad, floor.

## D. Movement
**Start position:** bar at arm's length above the upper chest, taken off the j-hooks.
**End position:** bar touching the **upper chest, just below the clavicle**.
**Main joint actions:** shoulder horizontal adduction **plus a larger shoulder-flexion component than the flat press**, elbow extension, scapular retraction/depression held isometrically.
**Movement path:** the bar descends in a shallow arc down and slightly toward the feet, then presses up and slightly back over the shoulder; it tracks higher than on a flat bench.
**Elbow path:** down and out at ~45–60°; the forearm is kept perpendicular to the floor at the bottom.
**Shoulder path:** the humerus travels through a greater arc of flexion than on the flat press because of the bench angle.
**Scapular behavior:** pinned retracted + depressed against the pad; no forward roll or shrug at lockout.
**Hip/knee behavior:** static, feet planted, mild leg drive into the floor.

## E. Resistance Mechanics
**Resistance source:** gravity on a free barbell.
**Direction of resistance:** straight down, constant.
**Cable direction:** N/A.
**Machine path:** N/A — free bar, lifter-controlled; no fixed arc, no convergence.
**Resistance relative to body:** the vector is vertical while the torso is tilted ~30–40°, so the shoulder's moment arm peaks around chest-touch and shrinks toward lockout. The tilt is what shifts load distribution relative to the flat version.

## F. Range of Motion
**Approximate ROM:** near-lockout → bar touching the upper chest.
**Deep stretch position:** bar in contact with the upper chest; shoulder at maximal horizontal abduction/extension for that grip width and bench angle.
**Peak contraction position:** top, just short of full lockout.
**Full / partial / deliberately restricted:** full at the bottom, **deliberately stopped short of lockout at the top** to keep tension.
**Any ROM-specific coaching:** app cue 3 says lower the bar to the **upper chest, under the clavicle** — the single detail that separates the incline path from the flat one.

## G. Execution Details
**Unilateral / bilateral:** bilateral · **Alternating / simultaneous:** simultaneous
**Open / closed kinetic chain:** closed at the scapula/torso (fixed to the bench), open at the hands
**Tempo:** not determinable — edited technique demo, not a filmed set
**Special technique:** scapular retraction + depression · deliberate arch, glutes down · feet planted · elbows 45–60° · stacked wrist · bar in the palm heel
**Stability requirements:** moderate — the bar must be balanced in three dimensions, unlike a machine or Smith press.

## H. CRITICAL VARIATION DETAILS
**What distinguishes it:** the bench sits at **~30–40°**, which is the single variable that separates it from its twin record `db-bench-press` (flat). That tilt raises the bar's touch point to the **upper chest under the clavicle** instead of the mid/lower chest, and increases the shoulder-flexion component of the press. Everything else is shared with the flat version: free barbell in a rack, moderately wide pronated grip, elbows 45–60° with a vertical forearm at the bottom, scapulae pinned, arch with glutes down, no lockout.
Two further discriminators: it is **not steep** (a 45–60° setting turns the movement toward the shoulder — the app cue says so explicitly), and it is **not close-grip**.
**WHAT THIS EXERCISE IS NOT:** Not a flat bench press. Not a decline press. Not a Smith machine incline press. Not an incline dumbbell press. Not a machine chest press. Not a close-grip/triceps-biased bench. Not a partial or pin press.

## I. Confidence
**HIGH CONFIDENCE:** free straight barbell in a rack; incline bench; supine; pronated grip; bar touches the upper chest; elbows 45–60° with the forearm vertical at the bottom; scapulae retracted + depressed; bilateral; stopped short of lockout at the top.
**MODERATE CONFIDENCE:** incline angle ≈30–40° — measured from an oblique handheld camera, so 30° and 45° are both within the error band. Grip width ≈1.4–1.6× shoulder width, estimated visually with no reference scale.
**LOW CONFIDENCE:** whether the thumb is wrapped or thumbless — the ✅ close-up does not show the thumb clearly.
**UNKNOWN:** tempo, rep count, actual load, touch-and-go vs paused; and **which of the two bench records Tavor's program slot actually means on a given day** (see MANUAL REVIEW).

## J. FINAL APP DATA
**Hebrew name:** לחיצת חזה במוט בשיפוע חיובי · **English name:** Incline Barbell Bench Press · **ID:** `incline-barbell-bench-press`
**muscleGroup:** `chest` · **subTarget:** חזה עליון · **secondary:** `['triceps','shoulders']`
**equipment:** `freeWeights`
**cues:** 1) משענת ב-30–40 מעלות. תלול מזה והלחיצה עוברת לכתף הקדמית 2) שכמות נעוצות במשענת לאורך כל הסט 3) להוריד את המוט לחזה העליון, מתחת לעצם הבריח 4) מרפקים ב-45 מעלות מהגוף — האמה אנכית בתחתית
**videos:** `videos/db-bench-press-01.mp4` (12.4 s) — file name deliberately unchanged; it is the media-DB key on the device
**weight metadata:** `weightMode: 'perSide'`, `weightIncrementKg: 2.5`, `usesPlates: true`, `barWeightKg: null`, `seedWeightKg: 22.5`, `targetReps: 8–12`
**libraryId:** `lib-incline_barbell_bench_press` — a link that was impossible before the split, because one record covering both angles could not point at either of the library's two separate entries
**programs containing exercise:** **none.** אימון A (position 1) and פול באדי ב׳ / F2 (position 2) both still point at the flat record `db-bench-press`.

## K. CORRECTIONS MADE
**No changes required in this batch.** The record was created and fully populated by batch 2 (migration 10). Re-verified here against the video: name, angle cue, bar path cue, elbow cue and library link all hold.

## L. VIDEO-BY-VIDEO VERIFICATION
| Video | Actual exercise shown | Key biomechanics | Final assignment | Confidence |
|---|---|---|---|---|
| `db-bench-press-01.mp4` | Incline barbell bench press, ~30–40°, free bar in a rack | Grip close-ups (bar in palm heel vs fingers, stacked vs broken wrist); rear/overhead view showing vertical forearms with the elbow under the wrist; side views of the full rep with the bar touching the upper chest; pec highlighted at the stretch | `incline-barbell-bench-press` | HIGH for the exercise; MODERATE for the exact angle |

## BIOMECHANICAL HANDOFF
**Final exercise name:** Incline Barbell Bench Press (~30–40°)
**Equipment:** free straight Olympic barbell, adjustable incline bench, power/half rack with j-hooks
**Body orientation:** supine on an inclined bench, feet on the floor
**Torso angle:** ~30–40° from horizontal (MODERATE confidence)
**Bench/body angle:** back fully supported; deliberate lumbar arch, glutes on the bench
**Grip:** pronated, full grip, bar on the heel of the palm, wrist stacked
**Grip width:** ~1.4–1.6× biacromial width (MODERATE confidence)
**Shoulder position:** retracted and depressed into the pad, held isometrically
**Elbow path:** down and out at ~45–60° from the torso; forearm vertical at the bottom, elbow under the wrist
**Scapular motion:** none — pinned retracted + depressed for the whole set
**Cable/resistance direction:** vertical (gravity), constant; peak shoulder moment arm around chest-touch
**ROM:** near-lockout → bar contacts the **upper chest, below the clavicle**; top stopped short of lockout
**Machine mechanics:** none — free bar, no fixed path, no convergence, three-dimensional balance demand
**Unilateral/bilateral:** bilateral, simultaneous
**Support:** bench + floor; scapula fixed, hands free
**Primary movement pattern:** inclined horizontal press
**Critical variation details:** ~30–40° bench (not steep) · bar to the upper chest (not mid/lower) · larger shoulder-flexion component than flat · moderately wide pronated grip · elbows 45–60° · no lockout
**What this exercise is NOT:** not flat · not decline · not Smith · not dumbbell · not machine · not close-grip
**Confidence limitations:** the incline angle and grip width are pixel-geometry estimates from an oblique handheld camera; tempo, load and rep count unknown.

---

# BATCH EXERCISE 2 / GLOBAL CATALOG EXERCISE 23 — Dumbbell Lateral Raise

## A. Identification
**App name after audit:** `הרמת ידיים לצדדים` (unchanged)
**Previous app name:** `הרמה לצדדים` — renamed in migration 3
**Exercise ID / key:** `lateral-raise`
**Hebrew standardized name:** הרמת ידיים לצדדים עם דאמבלים
**English standardized name:** **Standing Dumbbell Lateral Raise (elbow-led, raised to shoulder height, dumbbell starting slightly behind the thigh)**
**Alternative/common names:** Lateral Raise · Side Raise · Dumbbell Side Lateral
**Exercise category:** shoulder abduction in the scapular plane (single-joint)
**Equipment:** two dumbbells, standing, unsupported.

## B. Starting Position
**Body orientation:** standing upright, feet about hip-width.
**Torso angle:** vertical, braced; no lean-back and no swing.
**Back support/position:** unsupported.
**Shoulder position:** neutral, arms hanging. **The video's first ❌/✅ pair is the start position:** dumbbell held **in front of the thigh** (❌, arm forward of the torso line) vs **beside/slightly behind the thigh** (✅). That places the working plane slightly behind the front of the body rather than making it a front raise.
**Elbow position:** slightly bent and held at a fixed angle — the elbow, not the hand, is what rises.
**Hip position:** neutral.
**Knee position:** soft.
**Foot position:** hip-width, even.

## C. Grip / Contact
**Grip type:** neutral (palms facing the body / slightly rotated down at the top).
**Grip width:** N/A — one dumbbell per hand.
**Hand position:** at the top the **hand sits slightly LOWER than the elbow**. The video's dominant ❌/✅ pair is exactly this: wrist cocked up so the hand is above the elbow (❌, with pain sparks drawn at the shoulder) vs the forearm/elbow leading with the hand trailing below (✅, green line drawn along the top of the arm).
**Handle/bar/attachment:** dumbbell.
**Other body contact points:** none — free standing.

## D. Movement
**Start position:** arms hanging, dumbbells beside/slightly behind the thighs.
**End position:** upper arms raised to **shoulder height only**, elbows leading, hands slightly below elbow level.
**Main joint actions:** shoulder abduction in the scapular plane; a small, fixed amount of elbow flexion held throughout; scapular upward rotation late in the range.
**Movement path:** the dumbbells arc out and up in a plane slightly forward of the pure frontal plane.
**Elbow path:** leads the movement, rising ahead of the hand, staying at a constant bend.
**Shoulder path:** abduction to roughly 90°, stopping at shoulder height.
**Scapular behavior:** shoulders held down; no shrug to gain height.
**Hip/knee behavior:** static — app cue 4 warns that momentum means the delt has stopped working.

## E. Resistance Mechanics
**Resistance source:** gravity on free dumbbells.
**Direction of resistance:** straight down, constant.
**Cable direction:** N/A. **Machine path:** N/A.
**Resistance relative to body:** vertical against a rotating arm, so the moment arm at the shoulder grows continuously from zero at the bottom to maximum at shoulder height — almost no tension at the start, peak tension at the top. That is the classic free-weight lateral raise profile.

## F. Range of Motion
**Approximate ROM:** arm at the side (~0° abduction) → shoulder height (~90°).
**Deep stretch position:** bottom, arm hanging — but with essentially no tension there.
**Peak contraction position:** top, at shoulder height, where the moment arm is longest.
**Full / partial / deliberately restricted:** **deliberately capped at shoulder height** (app cue 2) — it does not go overhead.
**Any ROM-specific coaching:** stop at shoulder height; start with the dumbbell slightly behind the thigh, not in front.

## G. Execution Details
**Unilateral / bilateral:** bilateral · **Alternating / simultaneous:** simultaneous
**Open / closed kinetic chain:** open
**Tempo:** not determinable; the cue against momentum implies controlled.
**Special technique:** lead with the elbow · hand below elbow at the top · slight forward tilt of the dumbbell ("like pouring water") · light load · stop at shoulder height · start behind the thigh
**Stability requirements:** moderate — standing, unsupported, easily cheated with torso English.

## H. CRITICAL VARIATION DETAILS
**What distinguishes it:** it is a **free-weight standing** raise, so tension is near-zero at the bottom and peaks at the top — the opposite profile from a cable lateral raise, where tension is high in the stretched position. The **start position behind the thigh** and the **hand-below-elbow finish** put the humerus in the scapular plane with mild internal rotation, not in pure frontal abduction and not in front raise. The **cap at shoulder height** excludes the overhead portion where the upper traps take over. Elbow is bent and fixed, not straight.
**WHAT THIS EXERCISE IS NOT:** Not a front raise. Not an upright row. Not a cable lateral raise. Not a machine lateral raise. Not a leaning/incline-supported lateral raise. Not raised above shoulder height.

## I. Confidence
**HIGH CONFIDENCE:** standing dumbbell lateral raise; elbow leads with the hand trailing below; capped at shoulder height; start position beside/behind the thigh rather than in front; light load; no momentum.
**MODERATE CONFIDENCE:** bilateral simultaneous execution — the clip is filmed in pure side profile so only the near arm is visible; "12.5 kg per hand" in the source list and `weightMode: 'perSide'` are what make bilateral the reading. Also moderate: the exact degree of elbow bend.
**LOW CONFIDENCE:** how much internal rotation ("pouring") is actually applied.
**UNKNOWN:** tempo, reps.

## J. FINAL APP DATA
**Hebrew name:** הרמת ידיים לצדדים · **English name:** Lateral Raise · **ID:** `lateral-raise`
**muscleGroup:** `shoulders` · **subTarget:** דלתא צדי · **secondary:** `[]` (isolation)
**equipment:** `freeWeights`
**cues:** 1) להוביל עם המרפק, לא עם כף היד 2) להרים עד גובה הכתף בלבד 3) הטיה קלה קדימה, כמו למזוג מים 4) משקל קטן — ברגע שיש תנופה, זה כבר לא הדלתא
**videos:** `videos/lateral-raise-01.mp4` (5.6 s)
**weight metadata:** `weightMode: 'perSide'`, `weightIncrementKg: 2.5`, `usesPlates: false`, `barWeightKg: null`, `seedWeightKg: 12.5`, `targetReps: 12–20`
**libraryId:** `lib-lateral_raise`
**programs containing exercise:** פול באדי ב׳ / F2 (position 4), and the **shoulders block** (position 1)

## K. CORRECTIONS MADE
**No changes required.** All four cues match the video point for point — cue 1 is literally the clip's main ❌/✅ pair, cue 2 matches the capped height, cue 3 matches the hand-below-elbow "pouring" finish, cue 4 matches the anti-momentum framing.
*(The start-position detail — dumbbell beside/behind the thigh — is an extra the cues do not mention, but it does not contradict them, so no cue was added.)*

## L. VIDEO-BY-VIDEO VERIFICATION
| Video | Actual exercise shown | Key biomechanics | Final assignment | Confidence |
|---|---|---|---|---|
| `lateral-raise-01.mp4` | Standing dumbbell lateral raise | Side-profile ❌/✅ pairs throughout: start with the dumbbell in front of the thigh (red) vs beside/behind it (green); at the top, hand above elbow with pain sparks at the shoulder (red) vs elbow leading with the hand below (green line along the arm); raise height stops at shoulder level | `lateral-raise` | HIGH |

## BIOMECHANICAL HANDOFF
**Final exercise name:** Standing Dumbbell Lateral Raise
**Equipment:** dumbbells, standing, unsupported
**Body orientation:** upright standing
**Torso angle:** vertical, braced
**Bench/body angle:** N/A
**Grip:** neutral, dumbbell in mid-handle
**Grip width:** N/A (one dumbbell per hand)
**Shoulder position:** neutral at rest; abducts in the scapular plane; shoulders held down, no shrug
**Elbow path:** slightly bent at a fixed angle, **leads the movement**; hand trails below elbow height at the top
**Scapular motion:** minimal; upward rotation only late in the range
**Cable/resistance direction:** vertical (gravity) — moment arm zero at the bottom, maximal at shoulder height
**ROM:** ~0° → ~90° abduction, **capped at shoulder height**; starts with the dumbbell beside/slightly behind the thigh
**Machine mechanics:** none — free weight, ascending resistance curve
**Unilateral/bilateral:** bilateral, simultaneous (MODERATE — side-profile filming)
**Support:** none
**Primary movement pattern:** single-joint shoulder abduction in the scapular plane
**Critical variation details:** elbow-led with hand below elbow · start behind the thigh · capped at shoulder height · light load, no momentum · fixed slight elbow bend
**What this exercise is NOT:** not a front raise · not an upright row · not a cable or machine lateral raise · not leaning/incline-supported · not raised overhead
**Confidence limitations:** filmed in pure side profile, so bilateral execution and the exact plane of the raise are inferred rather than directly observed.

---

# BATCH EXERCISE 3 / GLOBAL CATALOG EXERCISE 24 — Dumbbell Shrug

## A. Identification
**App name after audit:** `הרמת כתפיים עם דאמבלים` (unchanged)
**Previous app name:** `הרמת כתפיים` — renamed in migration 3
**Exercise ID / key:** `shrugs`
**Hebrew standardized name:** הרמת כתפיים עם דאמבלים בהטיה קדימה
**English standardized name:** **Forward-Leaning Dumbbell Shrug (torso hinged forward, scapulae squeezed up-and-back)**
**Alternative/common names:** Dumbbell Shrug · Leaning Shrug · Scapular Elevation
**Exercise category:** scapular elevation / upward-and-backward scapular translation (single-joint)
**Equipment:** two dumbbells, standing, unsupported.

## B. Starting Position
**Body orientation:** standing, **torso hinged forward from the hips** — the video's first instruction card is literally "LEAN FORWARD".
**Torso angle:** clearly forward of vertical, roughly **30–45° of hip hinge** in the demonstrated ✅ frames.
**Back support/position:** unsupported, neutral spine, braced.
**Shoulder position:** the video's second card is "SHOULDERS DOWN" — start from a **full depression/stretch**, letting the dumbbells pull the shoulder girdle down before each rep.
**Elbow position:** straight and passive — app cue 4: "the hands only hold, they do not bend".
**Hip position:** hinged back to produce the forward lean.
**Knee position:** soft.
**Foot position:** hip- to shoulder-width, even.

## C. Grip / Contact
**Grip type:** neutral, dumbbells hanging at the sides/slightly behind the thighs because of the lean.
**Grip width:** N/A — one dumbbell per hand.
**Hand position:** passive hooks; no elbow flexion.
**Handle/bar/attachment:** dumbbells.
**Other body contact points:** none.

## D. Movement
**Start position:** torso leaning forward, shoulders fully depressed, arms hanging.
**End position:** shoulders squeezed **up and back** along a diagonal — the video draws a blue arrow at roughly 45° with the caption "SQUEEZE UP & BACK" — held one second (app cue 3).
**Main joint actions:** scapular elevation combined with **retraction** — not pure elevation.
**Movement path:** the shoulder girdle travels up and rearward; the dumbbells rise a short distance along that diagonal.
**Elbow path:** none — the elbows stay straight.
**Shoulder path:** up and back, then a controlled return to full depression.
**Scapular behavior:** this **is** the exercise — full depression at the bottom, elevation plus retraction at the top, and no circular rolling (app cue 2).
**Hip/knee behavior:** static; the lean is held, not bounced.

## E. Resistance Mechanics
**Resistance source:** gravity on free dumbbells.
**Direction of resistance:** straight down, constant.
**Cable direction:** N/A. **Machine path:** N/A.
**Resistance relative to body:** vertical through the hanging arms into the shoulder girdle. Because the torso is hinged forward, the vertical load line sits **in front of** the scapulae, so the up-and-back squeeze works against gravity through a longer effective range than an upright shrug — which is precisely why the video teaches the lean.

## F. Range of Motion
**Approximate ROM:** full scapular depression → maximal elevation-with-retraction.
**Deep stretch position:** the bottom, shoulders allowed to sink fully ("SHOULDERS DOWN").
**Peak contraction position:** top of the up-and-back squeeze, held one second.
**Full / partial / deliberately restricted:** full, both ends emphasised.
**Any ROM-specific coaching:** start from a full stretch; squeeze up **and back**, not straight up; hold one second.

## G. Execution Details
**Unilateral / bilateral:** bilateral · **Alternating / simultaneous:** simultaneous
**Open / closed kinetic chain:** open
**Tempo:** not measurable; a one-second hold at the top is prescribed.
**Special technique:** forward hip hinge · full depression start · up-and-back squeeze · one-second hold · passive straight arms · no shoulder rolling
**Stability requirements:** moderate — the forward lean must be held isometrically for the whole set.

## H. CRITICAL VARIATION DETAILS
**What distinguishes it:** the **forward torso lean** and the **up-and-back squeeze**. The video is unambiguous — it captions the lean, the shoulders-down start and the diagonal squeeze as the method, then shows an athlete **standing bolt upright shrugging straight up** under the caption **"DON'T DO THIS."** That upright straight-up version is a materially different exercise for load distribution, and it is exactly what the app's old cue prescribed (now corrected).
Secondary discriminators: **dumbbells**, so the load hangs at the sides rather than in front (barbell) or behind (trap bar/behind-the-back); **arms completely passive**, so no upright-row component; and **no shoulder circling**.
**WHAT THIS EXERCISE IS NOT:** Not an upright standing shrug. Not a barbell shrug. Not a trap-bar or behind-the-back shrug. Not an upright row. Not a shoulder roll. Not a machine shrug.

## I. Confidence
**HIGH CONFIDENCE:** dumbbells; standing; forward hip hinge taught as required; start from full shoulder depression; squeeze up **and back**; one-second hold; arms passive; the upright straight-up shrug is explicitly marked as the mistake.
**MODERATE CONFIDENCE:** the lean is ~30–45° — estimated from side-profile frames.
**LOW CONFIDENCE:** none material.
**UNKNOWN:** tempo, reps; and whether the logged 20 kg means per dumbbell or a combined figure (see MANUAL REVIEW).

## J. FINAL APP DATA
**Hebrew name:** הרמת כתפיים עם דאמבלים · **English name:** Dumbbell Shrug · **ID:** `shrugs`
**muscleGroup:** `shoulders` · **subTarget:** טרפזים · **secondary:** `['forearms']`
**equipment:** `freeWeights`
**cues:** 1) **הטיה קלה קדימה מהירך, ולסחוט את הכתפיים למעלה ואחורה — לא ישר למעלה בעמידה זקופה** *(corrected)* 2) לא לסובב את הכתפיים במעגל 3) לעצור שנייה למעלה 4) ידיים רק מחזיקות — לא מכופפות
**videos:** `videos/shrugs-01.mp4` (6.8 s)
**weight metadata:** `weightMode: 'total'`, `weightIncrementKg: 2.5`, `usesPlates: false`, `barWeightKg: null`, `seedWeightKg: 20`, `targetReps: 12–15`
**libraryId:** `lib-shrug`
**programs containing exercise:** the **shoulders block** (position 2)

## K. CORRECTIONS MADE
**Changed:** cue 1 rewritten
**Before:** `למשוך ישר למעלה לכיוון האוזניים` ("pull straight up toward the ears")
**After:** `הטיה קלה קדימה מהירך, ולסחוט את הכתפיים למעלה ואחורה — לא ישר למעלה בעמידה זקופה`
**Reason:** the demo video's on-screen instructions are "LEAN FORWARD" → "SHOULDERS DOWN" → "SQUEEZE UP & BACK" (with a 45° arrow), and it then shows an upright, straight-up shrug captioned **"DON'T DO THIS."** The old cue described the video's explicit mistake. Cues 2–4 are untouched.
**Confidence:** HIGH — burned-in text, not inference.
**Propagation:** `CATALOG_FIXES_V11` + **migration 11**, so an already-installed device receives it; the cue is replaced only if Tavor has not edited the cues himself. Covered by `src/db/migration11.test.ts` (3 tests).

## L. VIDEO-BY-VIDEO VERIFICATION
| Video | Actual exercise shown | Key biomechanics | Final assignment | Confidence |
|---|---|---|---|---|
| `shrugs-01.mp4` | Forward-leaning dumbbell shrug | Title card "HOW TO SHOULDER SHRUG"; instruction cards "LEAN FORWARD", "SHOULDERS DOWN", "SQUEEZE UP & BACK" with a 45° blue arrow; then "DON'T DO THIS." over an upright athlete shrugging straight up; dumbbells hanging at the sides, elbows straight throughout | `shrugs` | HIGH |

## BIOMECHANICAL HANDOFF
**Final exercise name:** Forward-Leaning Dumbbell Shrug
**Equipment:** dumbbells, standing, unsupported
**Body orientation:** standing with a forward hip hinge
**Torso angle:** ~30–45° forward of vertical (MODERATE confidence)
**Bench/body angle:** N/A
**Grip:** neutral, passive
**Grip width:** N/A (one dumbbell per hand)
**Shoulder position:** starts in **full depression**; elbows straight, arms passive
**Elbow path:** none — elbows locked straight
**Scapular motion:** **elevation combined with retraction** — up and back along a ~45° diagonal, then a full return to depression
**Cable/resistance direction:** vertical (gravity); because the torso is hinged, the load line falls in front of the scapulae
**ROM:** full depression → maximal up-and-back elevation, 1-second hold
**Machine mechanics:** none — free weight
**Unilateral/bilateral:** bilateral, simultaneous
**Support:** none; the forward lean is held isometrically
**Primary movement pattern:** single-joint scapular elevation + retraction
**Critical variation details:** forward lean is required, not optional · squeeze up **and back**, not straight up · full depression start · one-second hold · no shoulder circling · arms never bend
**What this exercise is NOT:** not an upright straight-up shrug (explicitly the video's ❌) · not a barbell or trap-bar shrug · not a behind-the-back shrug · not an upright row · not a shoulder roll
**Confidence limitations:** lean angle is a side-profile estimate; whether 20 kg is per dumbbell or combined is unresolved.

---

# BATCH EXERCISE 4 / GLOBAL CATALOG EXERCISE 25 — Reverse Pec Deck (Rear Delt Fly)

## A. Identification
**App name after audit:** `פרפר הפוך במכונה` (unchanged)
**Previous app name:** same
**Exercise ID / key:** `reverse-machine-fly`
**Hebrew standardized name:** פרפר הפוך במכונה (חזה נשען, אחיזה ניטרלית)
**English standardized name:** **Seated Chest-Supported Reverse Pec Deck / Rear Delt Fly (neutral vertical handles, elbow-led, scapulae deliberately NOT squeezed)**
**Alternative/common names:** Reverse Pec Deck · Rear Delt Fly Machine · Reverse Fly
**Exercise category:** shoulder horizontal abduction (single-joint)
**Equipment:** seated reverse pec-deck machine with a **chest pad** and vertical (neutral) handles. Both clips show this machine type; the specific units differ (a Precor in clip 01, another brand in clip 02).

## B. Starting Position
**Body orientation:** seated, chest pressed against a vertical pad, facing the machine.
**Torso angle:** upright against the chest pad.
**Back support/position:** the **chest** is supported, not the back — this is what removes trunk swing (app cue 1).
**Shoulder position:** arms extended forward at roughly shoulder height, shoulders protracted at the start.
**Elbow position:** **slightly bent and locked at that angle** for the whole rep (app cue 2). Clip 01's main ❌/✅ pair is the elbow bending progressively during the rep (❌, red forearm with the hand travelling further back than the elbow, against a vertical yellow reference line) vs a fixed slight bend (✅).
**Hip position:** seated ~90°.
**Knee position:** ~90°, straddling or beside the seat.
**Foot position:** flat on the floor for bracing.

## C. Grip / Contact
**Grip type:** **neutral** — vertical handles, palms facing each other.
**Grip width:** fixed by the machine, roughly shoulder-width at the start.
**Hand position:** clip 02's opening ❌/✅ pair is the grip itself: a full wrapped fist (❌) vs an **open/thumbless hand pushing through the heel of the palm** (✅) — the point being to stop the arm from turning into a puller.
**Handle/bar/attachment:** fixed vertical machine handles.
**Other body contact points:** chest pad (the load-bearing contact), seat, floor.

## D. Movement
**Start position:** arms forward at shoulder height, handles together in front, scapulae protracted.
**End position:** arms opened out and back **to roughly the plane of the body** (app cue 3), with a squeeze.
**Main joint actions:** shoulder **horizontal abduction**; the elbow angle is held constant, so no elbow action.
**Movement path:** the handles sweep out and back in a horizontal arc at shoulder height.
**Elbow path:** leads the movement outward and rearward; clip 02 draws a yellow arrow on the elbow.
**Shoulder path:** horizontal abduction from protraction to roughly the body line.
**Scapular behavior:** **deliberately quiet.** Clip 02's rear-view ❌/✅ pair shows the scapulae squeezing together (❌, red across the mid-back with the arms bent) vs staying apart with a yellow double arrow (✅) while the movement comes from the shoulder. App cue 4 says exactly this.
**Hip/knee behavior:** static.

## E. Resistance Mechanics
**Resistance source:** machine lever driven by a weight stack (`usesPlates: false`, `weightIncrementKg: 5`).
**Direction of resistance:** pulls the handles forward, back toward the start.
**Cable direction:** N/A.
**Machine path:** **fixed arc, diverging** — the handles travel apart as they go back. Pivot is above/behind the seat. Whether the arms are mechanically linked could not be established from either clip.
**Resistance relative to body:** horizontal into the hands at shoulder height; the chest pad takes the reaction so the trunk contributes nothing.
**Machine classification:** selectorized · fixed arc · **diverging** · chest-supported · linked/independent arms UNKNOWN.

## F. Range of Motion
**Approximate ROM:** handles together in front → arms opened to roughly the body plane.
**Deep stretch position:** the start, arms forward with the scapulae protracted.
**Peak contraction position:** arms at the body line, squeezed.
**Full / partial / deliberately restricted:** **deliberately capped at the body line** (app cue 3) — it does not travel further behind the torso, which is where the scapular retractors would take over.
**Any ROM-specific coaching:** open back to the body line and squeeze; keep the shoulder blades apart.

## G. Execution Details
**Unilateral / bilateral:** bilateral · **Alternating / simultaneous:** simultaneous
**Open / closed kinetic chain:** open
**Tempo:** not determinable.
**Special technique:** chest pinned to the pad · open/thumbless grip · fixed slight elbow bend · elbow leads · **scapulae stay apart** · stop at the body line
**Stability requirements:** low — the chest pad does the stabilising.

## H. CRITICAL VARIATION DETAILS
**What distinguishes it:** the instruction to **NOT squeeze the shoulder blades**. That single cue, present both in the app and as a dedicated ❌/✅ pair in clip 02, is what keeps this a shoulder-joint movement rather than a mid-back movement. Combined with the **capped ROM at the body line** and the **fixed slight elbow bend**, it separates the exercise from a rear-delt row or a face pull, where scapular retraction and elbow flexion are the point.
Further discriminators: **neutral vertical handles** (not pronated), **chest-supported and seated** (no trunk involvement, unlike a bent-over dumbbell reverse fly), **machine fixed arc** (constant path, unlike cables), and an **open/thumbless grip** to keep the hands from pulling.
**WHAT THIS EXERCISE IS NOT:** Not a face pull. Not a rear-delt row. Not a bent-over dumbbell reverse fly. Not a cable reverse fly. Not a wide-grip row. Not a scapular-retraction exercise.

## I. Confidence
**HIGH CONFIDENCE:** seated chest-supported reverse pec-deck machine; neutral vertical handles; fixed slight elbow bend with the elbow leading; scapulae deliberately held apart; ROM capped at the body line; open/thumbless grip taught; bilateral; open chain; both clips show the same variation.
**MODERATE CONFIDENCE:** that the machine diverges (inferred from the handle geometry in the rear-view frames); grip width, since it is machine-fixed and the units differ between clips.
**LOW CONFIDENCE:** linked vs independent arms.
**UNKNOWN:** brand/model in Tavor's gym; the cam curve; tempo; reps; the load — `seedWeightKg` is `null`.

## J. FINAL APP DATA
**Hebrew name:** פרפר הפוך במכונה · **English name:** Reverse Pec Deck (Rear Delt Fly) · **ID:** `reverse-machine-fly`
**muscleGroup:** `shoulders` · **subTarget:** דלתא אחורי · **secondary:** `['back']`
**equipment:** `machine`
**cues:** 1) חזה צמוד לכרית 2) מרפקים כפופים קלות וקבועים 3) לפתוח אחורה עד קו הגוף ולסחוט 4) לא לכווץ שכמות — התנועה מהכתף האחורית
**videos:** `videos/reverse-machine-fly-01.mp4` (6.0 s), `videos/reverse-machine-fly-02.mp4` (10.4 s)
**weight metadata:** `weightMode: 'total'`, `weightIncrementKg: 5`, `usesPlates: false`, `barWeightKg: null`, `seedWeightKg: null`, `targetReps: 12–20`
**libraryId:** `lib-rear_delt_fly`
**programs containing exercise:** the **shoulders block** (position 3)

## K. CORRECTIONS MADE
**No changes required.** All four cues map one-to-one onto the two videos' teaching points — cue 4 in particular is the exact content of clip 02's rear-view ❌/✅ pair.

## L. VIDEO-BY-VIDEO VERIFICATION
| Video | Actual exercise shown | Key biomechanics | Final assignment | Confidence |
|---|---|---|---|---|
| `reverse-machine-fly-01.mp4` | Seated reverse pec deck (Precor) | Side-view ❌/✅ pairs against a vertical yellow reference line: elbow bending progressively so the hand travels past the elbow (red) vs a fixed slight bend with the elbow leading (green); chest pinned to the pad throughout | `reverse-machine-fly` | HIGH |
| `reverse-machine-fly-02.mp4` | Seated reverse pec deck (different unit) | Grip ❌/✅ (wrapped fist vs open thumbless palm); rear-view ❌/✅ on scapulae squeezing together (red mid-back) vs staying apart (green, yellow double arrow); ❌ whole upper back loaded vs ✅ posterior deltoid highlighted with a directional arrow; ❌/✅ on elbow bend; rear shots of the arms opening to the body line | `reverse-machine-fly` | HIGH |

## BIOMECHANICAL HANDOFF
**Final exercise name:** Seated Chest-Supported Reverse Pec Deck (Rear Delt Fly)
**Equipment:** selectorized reverse pec-deck machine, chest pad, vertical neutral handles
**Body orientation:** seated, chest against a vertical pad, facing the machine
**Torso angle:** upright, chest-supported
**Bench/body angle:** hips and knees ~90°
**Grip:** neutral (vertical handles), **open/thumbless — pushing through the heel of the palm**
**Grip width:** machine-fixed, ~shoulder-width at the start
**Shoulder position:** protracted at the start, horizontally abducting to the body line
**Elbow path:** **fixed slight bend held throughout**; the elbow leads out and back
**Scapular motion:** **deliberately minimal — the shoulder blades are kept APART, not squeezed**
**Cable/resistance direction:** horizontal, resisting the opening; machine lever arc
**ROM:** handles together in front → arms opened to roughly the plane of the body, **capped there**
**Machine mechanics:** selectorized · fixed arc · diverging handle path · chest-supported · arm linkage unknown
**Unilateral/bilateral:** bilateral, simultaneous
**Support:** chest pad takes the reaction force; trunk contributes nothing
**Primary movement pattern:** single-joint shoulder horizontal abduction
**Critical variation details:** scapulae held apart (the defining cue) · fixed slight elbow bend · ROM capped at the body line · neutral vertical handles · open thumbless grip · chest-supported
**What this exercise is NOT:** not a face pull · not a rear-delt row · not a bent-over dumbbell reverse fly · not a cable reverse fly · not a scapular retraction exercise
**Confidence limitations:** two different machine units appear across the clips; divergence is inferred from handle geometry; arm linkage and cam curve unknown.

---

# BATCH EXERCISE 5 / GLOBAL CATALOG EXERCISE 26 — Cable Wrist Curl (Straight Bar)

## A. Identification
**App name after audit:** `כפיפות שורש כף יד בכבל עם מוט ישר` (unchanged)
**Previous app name:** `אמות — סטריט בר בכבל` — renamed in migration 3
**Exercise ID / key:** `forearm-straight-bar`
**Hebrew standardized name:** כפיפות שורש כף יד בכבל עם מוט ישר
**English standardized name:** **Standing Cable Wrist Curl with a Short Straight Bar, supinated grip, elbows fixed and flexed**
**Alternative/common names:** Cable Wrist Curl · Straight Bar Cable Wrist Curl
**Exercise category:** wrist flexion (single-joint)
**Equipment:** cable tower + short straight bar attachment.
**⚠ Both attached clips are multi-exercise forearm *routines*, not single-exercise demos.** Clip 01's first segment is captioned **"Straight bar cable wrist curl — Targets the flexors"** and matches this record exactly; the rest of both clips demonstrates other forearm exercises. See section L.

## B. Starting Position
**Body orientation:** standing beside/facing a cable tower.
**Torso angle:** upright.
**Back support/position:** unsupported.
**Shoulder position:** neutral, upper arms held close to the body.
**Elbow position:** **flexed and held fixed** (roughly 90–120°), hands raised to about chin height in the segment shown — app cue 1: only the wrist moves, the elbow stays put.
**Hip position:** neutral. **Knee position:** soft. **Foot position:** stable stance.

## C. Grip / Contact
**Grip type:** **supinated** (palms up) on the bar — this is what makes it a flexor exercise rather than an extensor one.
**Grip width:** roughly shoulder-width on a short bar.
**Hand position:** the fingers are allowed to open at the bottom and roll the bar back up — app cue 2, which extends the range beyond simple wrist flexion into finger flexion.
**Handle/bar/attachment:** short straight bar on a cable.
**Other body contact points:** none in the version shown standing; other segments of the routine use a bench with the forearms on the thighs.

## D. Movement
**Start position:** wrists extended, bar rolled toward the fingertips, forearm flexors lengthened.
**End position:** wrists fully flexed, bar curled toward the forearms.
**Main joint actions:** wrist flexion, plus finger flexion when the roll-out is used.
**Movement path:** the bar arcs a short distance around the wrist joint.
**Elbow path:** none — fixed.
**Shoulder path:** none.
**Scapular behavior:** N/A.
**Hip/knee behavior:** N/A.

## E. Resistance Mechanics
**Resistance source:** cable, selectorized stack.
**Direction of resistance:** along the cable toward the pulley, resisting wrist flexion.
**Cable direction:** in the segment shown, the cable descends from a **high/upper pulley** to hands held at about chin height — an unusual arrangement that keeps constant tension across the whole wrist range.
**Machine path:** N/A — free on the cable.
**Resistance relative to body:** the line of pull opposes wrist flexion directly; because it is a cable rather than a dumbbell, tension does not fall off at the ends of the range.

## F. Range of Motion
**Approximate ROM:** full wrist extension (with the bar rolled to the fingers) → full wrist flexion.
**Deep stretch position:** wrist extended, fingers open, bar at the fingertips.
**Peak contraction position:** wrist fully flexed.
**Full / partial / deliberately restricted:** full, and **deliberately extended** by the finger roll-out.
**Any ROM-specific coaching:** app cue 3 — full range, slow.

## G. Execution Details
**Unilateral / bilateral:** bilateral in the named segment (both hands on one bar); the routine also shows single-arm variants.
**Alternating / simultaneous:** simultaneous.
**Open / closed kinetic chain:** open
**Tempo:** slow, per app cue 3.
**Special technique:** elbows fixed · supinated grip · finger roll-out at the bottom · slow full range
**Stability requirements:** low.

## H. CRITICAL VARIATION DETAILS
**What distinguishes it:** **supinated grip = wrist FLEXION**, which is the opposite muscle group from a reverse (pronated) wrist curl. That distinction is the single most important fact here, and the record's own `subTarget` acknowledges that Tavor trains both directions ("כופפים ופושטים" — flexors and extensors). Second, it is a **cable**, so tension is maintained at both ends of a very short range — unlike a dumbbell wrist curl, where the resistance falls off. Third, the **finger roll-out** extends the exercise beyond pure wrist flexion into finger flexion.
The attached clips also demonstrate, as separate exercises within the same routine: a **reverse EZ-bar curl** (elbow flexion, pronated — brachioradialis) and a **single-arm reverse cable wrist curl** (wrist extension). Those are different exercises and are labelled as such on screen.
**WHAT THIS EXERCISE IS NOT:** Not a reverse/pronated wrist curl. Not a reverse curl (that is elbow flexion, not wrist). Not a dumbbell wrist curl. Not a hammer curl. Not a forearm-on-bench barbell wrist curl.

## I. Confidence
**HIGH CONFIDENCE:** cable + short straight bar; supinated grip; wrist flexion; elbows fixed; only the wrist moves; finger roll-out used; the named exercise appears in clip 01 with an on-screen title matching the record.
**MODERATE CONFIDENCE:** the pulley height — the demonstrated segment uses a high/upper pulley with the hands at chin height, which is not the most common setup; Tavor may use a low pulley.
**LOW CONFIDENCE:** whether Tavor performs it standing (as in the clip) or seated with the forearms braced.
**UNKNOWN:** load (`seedWeightKg` is `null`), tempo, reps, whether he does the flexion and extension versions in the same session.

## J. FINAL APP DATA
**Hebrew name:** כפיפות שורש כף יד בכבל עם מוט ישר · **English name:** Cable Wrist Curl (Straight Bar) · **ID:** `forearm-straight-bar`
**muscleGroup:** `forearms` · **subTarget:** אמות — כופפים ופושטים · **secondary:** `[]`
**equipment:** `cables`
**cues:** 1) רק שורש כף היד נע, המרפק קבוע 2) לפתוח את האצבעות בתחתית ולגלגל חזרה 3) טווח מלא, איטי
**videos:** `videos/forearm-straight-bar-01.mp4` (14.5 s), `videos/forearm-straight-bar-02.mp4` (25.3 s)
**weight metadata:** `weightMode: 'total'`, `weightIncrementKg: 5`, `usesPlates: false`, `barWeightKg: null`, `seedWeightKg: null`, `targetReps: 12–20`
**libraryId:** none — documented reason: the library's only forearm record is a reverse wrist curl, the opposite movement
**programs containing exercise:** the **forearms block** (position 0)

## K. CORRECTIONS MADE
**No changes required.** The record name, equipment and all three cues match clip 01's titled segment. The clips being routine compilations rather than single-exercise demos is documented rather than "fixed" — nothing is mis-assigned, and there is no other catalog record the extra segments belong to.

## L. VIDEO-BY-VIDEO VERIFICATION
| Video | Actual exercise shown | Key biomechanics | Final assignment | Confidence |
|---|---|---|---|---|
| `forearm-straight-bar-01.mp4` | **Three exercises**, titled on screen: (1) "Straight bar cable wrist curl — Targets the flexors" ✅ matches this record; (2) "Reverse EZ Bar curls — Targets the brachioradialis" — an **elbow-flexion** reverse curl on a cable EZ bar; (3) "Single arm reverse cable wrist curl — Targets the extensors" — **wrist extension**, one arm | Segment 1: standing, cable from a high pulley, short straight bar, supinated grip, elbows fixed and flexed, wrist-only motion | `forearm-straight-bar` (segment 1 is the record; segments 2–3 are extra content) | HIGH |
| `forearm-straight-bar-02.mp4` | Single-arm cable forearm routine — colour-coded forearm anatomy with several wrist movements: standing single-arm wrist flexion, seated single-arm wrist curl with the forearm on the thigh, standing single-arm wrist extension | All single-arm cable, small handle, elbow fixed, wrist-only motion; directional arrows mark flexion vs extension | `forearm-straight-bar` (routine content, same movement family) | HIGH for content; MODERATE that it represents Tavor's exact setup |

## BIOMECHANICAL HANDOFF
**Final exercise name:** Standing Cable Wrist Curl (short straight bar, supinated)
**Equipment:** cable tower, selectorized stack, short straight bar
**Body orientation:** standing, upright
**Torso angle:** vertical
**Bench/body angle:** N/A (the routine also shows a seated forearm-on-thigh variant)
**Grip:** **supinated** (palms up) — this is what makes it wrist FLEXION
**Grip width:** ~shoulder-width on a short bar
**Shoulder position:** neutral, upper arms close to the body
**Elbow path:** none — fixed at ~90–120° flexion
**Scapular motion:** none
**Cable/resistance direction:** along the cable toward the pulley; in the demonstrated segment the cable comes from a **high pulley** (MODERATE confidence)
**ROM:** full wrist extension with the bar rolled to the fingertips → full wrist flexion; deliberately extended by a **finger roll-out**
**Machine mechanics:** cable — tension maintained at both ends of a very short range, unlike a free weight
**Unilateral/bilateral:** bilateral on one bar (the routine also shows single-arm variants)
**Support:** none in the standing version
**Primary movement pattern:** single-joint wrist flexion (plus finger flexion during the roll-out)
**Critical variation details:** supinated grip · elbow completely fixed · cable rather than dumbbell · finger roll-out extends the range · slow full ROM
**What this exercise is NOT:** not a reverse/pronated wrist curl · not a reverse curl (elbow flexion) · not a dumbbell wrist curl · not a hammer curl
**Confidence limitations:** both clips are multi-exercise routines; the pulley height and whether Tavor stands or sits are not established.

---

# BATCH EXERCISE 6 / GLOBAL CATALOG EXERCISE 27 — Dumbbell Wrist Curl

## A. Identification
**App name after audit:** `כפיפות שורש כף יד עם דאמבלים` (unchanged)
**Previous app name:** `אמות — דאמבלים` — renamed in migration 3
**Exercise ID / key:** `forearm-dumbbell`
**Hebrew standardized name:** כפיפות שורש כף יד עם דאמבלים, אמות נשענות
**English standardized name:** **Braced Dumbbell Wrist Curl (forearms resting on the thighs or a bench), performed in both directions** — *name verified as a real exercise; the attached video shows a different exercise.*
**Alternative/common names:** Dumbbell Wrist Curl · Seated Wrist Curl · Wrist Flexion/Extension
**Exercise category:** wrist flexion and wrist extension (single-joint)
**Equipment:** dumbbells + a bench or the thighs as a brace.

## B–G. Position, grip, movement, mechanics, ROM, execution
**⚠ The attached video does NOT show this exercise.** It shows **incline dumbbell biceps curls** — this is a long-standing documented mismatch (`VIDEO_MISMATCH`), re-verified here and now described more precisely.
What can be stated from the record itself (**inference, not observation**):
- **Seated**, with the **forearms braced on the thighs or a bench** (cue 1), wrists hanging past the edge so the joint can move freely.
- Dumbbell in each hand; the elbow and shoulder do not move.
- **Full stretch at the bottom** (cue 2) — the wrist extends fully before curling.
- **Both directions are trained:** cue 3 says to also do the reverse direction for the extensors, which means the record covers **supinated wrist flexion and pronated wrist extension** as one entry.
- Resistance: gravity on the dumbbell, so tension peaks in the mid-range and falls off at the ends — the opposite profile from the cable version in `forearm-straight-bar`.
Everything else — grip width, exact bench height, whether both arms work together, tempo, ROM depth: **UNKNOWN.**

## H. CRITICAL VARIATION DETAILS
**What distinguishes it:** it is the **free-weight** forearm exercise, braced against a fixed surface, and the record explicitly covers **both flexion and extension**. Compared with `forearm-straight-bar` (cable, straight bar, flexion-only as named), it has a **gravity-based resistance curve** — no tension at the ends of the range — and the forearm is physically supported, which removes any elbow or shoulder contribution.
**WHAT THIS EXERCISE IS NOT:** Not a cable wrist curl. Not a barbell wrist curl. Not a reverse curl (elbow flexion). Not a biceps curl of any kind — despite what the attached video shows. Not a wrist roller.

## I. Confidence
**HIGH CONFIDENCE:** it is a braced dumbbell wrist curl covering both flexion and extension; the attached video shows a different exercise.
**HIGH CONFIDENCE (about the video's content):** dumbbell **biceps curls on an incline bench**, shown in two variants — prone/chest-supported over the incline, and supine lying back on the incline with the arms hanging behind the body. Anatomy overlays highlight the upper arm, not the forearm.
**MODERATE CONFIDENCE:** that the forearms rest on the thighs rather than a bench (cue 1 permits either).
**LOW CONFIDENCE / UNKNOWN:** grip, ROM, tempo, load (`seedWeightKg` is `null`), one arm vs two — no valid footage exists.

## J. FINAL APP DATA
**Hebrew name:** כפיפות שורש כף יד עם דאמבלים · **English name:** Dumbbell Wrist Curl · **ID:** `forearm-dumbbell`
**muscleGroup:** `forearms` · **subTarget:** אמות · **secondary:** `[]`
**equipment:** `freeWeights`
**cues:** 1) אמות נשענות על הברכיים או על ספסל 2) לרדת עד מתיחה מלאה 3) לעשות גם כיוון הפוך לפושטים
**videos:** `videos/forearm-dumbbell-01.mp4` (17.0 s) — **flagged as mismatched**
**weight metadata:** `weightMode: 'total'`, `weightIncrementKg: 2.5`, `usesPlates: false`, `barWeightKg: null`, `seedWeightKg: null`, `targetReps: 12–20`
**libraryId:** none — documented reason: the library's only forearm record is a reverse wrist curl
**programs containing exercise:** the **forearms block** (position 1)

## K. CORRECTIONS MADE
**Changed:** mismatch note made precise (documentation only — the video was **not** moved)
**Before:** `הסרטון מראה כפיפת מרפקים בשיפוע — תרגיל ביצפס, לא אמות`
**After:** `הסרטון מראה כפיפת מרפקים בדאמבלים על ספסל בשיפוע — גם בשכיבת פנים וגם בשכיבת גב — תרגיל ביצפס, לא אמות`
**Reason:** the note was correct but vague. The clip shows **two** distinct incline curl variants (prone chest-supported and supine), which matters because neither has a home in the catalog: `preacher-curl` fixes the humerus in front, `hammer-curl` keeps it at the side, `behind-body-cable-curl` puts it behind but on a cable. Creating an `incline-dumbbell-curl` record would add an exercise there is no evidence Tavor performs.
**Confidence:** HIGH.
**Video assignment:** `VIDEO_ASSIGNMENT_REVIEW_REQUIRED` — left in place with its warning, per the project's stated policy that a labelled wrong clip beats no clip until a replacement exists.

## L. VIDEO-BY-VIDEO VERIFICATION
| Video | Actual exercise shown | Key biomechanics | Final assignment | Confidence |
|---|---|---|---|---|
| `forearm-dumbbell-01.mp4` | **Incline dumbbell biceps curl**, two variants | Prone/chest-supported over an incline bench with the arms hanging (yellow arrow showing the bench-angle setup), and supine on an incline with the arms hanging behind the torso; anatomy close-ups colour-coding **upper-arm** musculature; dumbbell grip close-up; elbow flexion throughout — no wrist-only motion anywhere | `forearm-dumbbell` (**unchanged — flagged**) | video content HIGH; assignment knowingly wrong and labelled as such in-app |

## BIOMECHANICAL HANDOFF
**Final exercise name:** Braced Dumbbell Wrist Curl (flexion **and** extension) — **the record is real; no valid footage exists**
**Equipment:** dumbbells, forearms braced on the thighs or a bench
**Body orientation:** seated, leaning forward, forearms supported
**Torso angle:** seated, hinged forward (inferred)
**Bench/body angle:** forearms flat on the thighs or a bench, wrists past the edge
**Grip:** supinated for the flexion version, pronated for the extension version
**Grip width:** N/A (one dumbbell per hand)
**Shoulder position:** static
**Elbow path:** none — braced
**Scapular motion:** none
**Cable/resistance direction:** vertical (gravity); tension peaks mid-range and falls off at both ends
**ROM:** full wrist extension → full flexion (and the reverse for the extensor version)
**Machine mechanics:** none — free weight
**Unilateral/bilateral:** unknown
**Support:** forearms fully braced, which removes elbow and shoulder contribution
**Primary movement pattern:** single-joint wrist flexion and wrist extension
**Critical variation details:** braced forearms · free-weight resistance curve (unlike the cable version) · the record deliberately covers **both** directions
**What this exercise is NOT:** not a cable wrist curl · not a barbell wrist curl · not a reverse curl · **not an incline biceps curl** (which is what the attached video shows)
**Confidence limitations:** ⚠ **no valid footage.** Everything above is inferred from the record's own cues. The attached clip is a different exercise and is labelled as such in the app.

---

# BATCH EXERCISE 7 / GLOBAL CATALOG EXERCISE 28 — Plank

## A. Identification
**App name after audit:** `פלאנק` (unchanged)
**Previous app name:** `בטן` ("abs") — renamed in migration 3 because the clip is specifically a plank, not general abdominal work
**Exercise ID / key:** `abs`
**Hebrew standardized name:** פלאנק על אמות
**English standardized name:** **Forearm Plank (elbows under shoulders, forearms parallel, isometric hold)**
**Alternative/common names:** Plank · Forearm Plank · Front Plank · Elbow Plank
**Exercise category:** anti-extension trunk isometric
**Equipment:** bodyweight, floor only.

## B. Starting Position
**Body orientation:** prone, supported on the forearms and toes.
**Torso angle:** roughly parallel to the floor, in one straight line from heel to head.
**Back support/position:** unsupported. The video's central ❌/✅ pair is a curved **red** line through sagging hips versus a straight/slightly-rounded **green** line with a yellow up-arrow at the hips.
**Shoulder position:** stacked over the elbows, and **protracted** — the rear-view frame shows the upper back highlighted with a yellow double arrow, i.e. push the floor away rather than letting the chest sink between the shoulder blades.
**Elbow position:** directly under the shoulders, ~90°.
**Hip position:** level — neither sagging nor piked. The video's ✅ shows a small posterior pelvic tilt bringing the hips *up* out of a sag.
**Knee position:** straight.
**Foot position:** toes on the floor. The video marks foot spacing as a variable with a yellow double arrow between the feet — wider is more stable.

## C. Grip / Contact
**Grip type:** N/A — open hands on the floor.
**Grip width:** N/A.
**Hand position:** **forearms parallel with the hands apart.** This is an explicit ❌/✅ pair: hands clasped together (❌, red forearms with inward arrows) vs forearms parallel and hands apart (✅, green with outward arrows).
**Handle/bar/attachment:** none.
**Other body contact points:** forearms and toes — the only two contact points, and the whole exercise is holding the line between them.

## D. Movement
**Start position:** the hold position itself — there is no rep.
**End position:** the same; the exercise is timed.
**Main joint actions:** none dynamically. Isometric trunk anti-extension, hip extension, scapular protraction, and neutral cervical position.
**Movement path:** none.
**Elbow path:** none. **Shoulder path:** none.
**Scapular behavior:** held protracted — actively pushing the floor away.
**Hip/knee behavior:** held; the glutes are squeezed to stop the pelvis from tipping forward (app cue 3).

## E. Resistance Mechanics
**Resistance source:** bodyweight (gravity).
**Direction of resistance:** straight down, pulling the hips toward the floor.
**Cable direction:** N/A. **Machine path:** N/A.
**Resistance relative to body:** gravity acts on the mass between the two contact points, creating an extension moment at the lumbar spine that the trunk must resist. Moving the feet further from the elbows lengthens that lever and increases the demand.

## F. Range of Motion
**Approximate ROM:** none — isometric.
**Deep stretch position:** N/A.
**Peak contraction position:** the entire hold.
**Full / partial / deliberately restricted:** N/A.
**Any ROM-specific coaching:** the target is **time**, not reps — the app stores it with `metric: 'seconds'` and a closed target range of exactly **75 seconds (1:15)**.

## G. Execution Details
**Unilateral / bilateral:** bilateral · **Alternating / simultaneous:** N/A
**Open / closed kinetic chain:** closed
**Tempo:** N/A — a timed hold
**Special technique:** elbows under shoulders · forearms parallel, hands apart (not clasped) · scapulae protracted · hips level · glutes and abs braced · neutral neck (the video marks a cranked-up head as ❌) · normal breathing
**Stability requirements:** the exercise **is** the stability requirement.

## H. CRITICAL VARIATION DETAILS
**What distinguishes it:** it is a **forearm** plank, not a straight-arm/push-up plank — the elbows are the contact point, which shortens the lever at the shoulder and shifts the demand. Within forearm planks, this version specifies **parallel forearms with the hands apart** rather than clasped, which changes shoulder rotation and the width of the base. It also asks for **active scapular protraction** rather than a passive sag between the shoulder blades. The neck is held **neutral**, not extended. And it is scored on **time to a fixed 75-second target**, not on reps — so it is a submaximal endurance hold, not a max-effort test.
**WHAT THIS EXERCISE IS NOT:** Not a straight-arm/high plank. Not a side plank. Not an RKC plank (which is a maximal-tension short hold). Not a crunch, cable crunch, leg raise or any dynamic abdominal movement. Not weighted.

## I. Confidence
**HIGH CONFIDENCE:** forearm plank; elbows under shoulders; forearms parallel with hands apart (explicit ❌/✅); hips level, no sag; scapular protraction taught; neutral neck; feet apart for stability; bodyweight only; timed rather than counted.
**MODERATE CONFIDENCE:** the exact foot spacing; and the nuance that the video's ✅ shows a slight hip elevation while app cue 2 says the pelvis should neither drop nor rise — the arrow is correcting a sag rather than asking for a pike, so I read them as compatible rather than contradictory.
**LOW CONFIDENCE:** none material.
**UNKNOWN:** whether Tavor performs it in one continuous hold or in pieces; the actual hold times achieved.

## J. FINAL APP DATA
**Hebrew name:** פלאנק · **English name:** Plank · **ID:** `abs`
**muscleGroup:** `abs` · **subTarget:** core — בטן · **secondary:** `[]`
**equipment:** `bodyweight`
**cues:** 1) מרפקים מתחת לכתפיים, אמות על הרצפה 2) גוף בקו ישר מהעקב עד הראש — אגן לא נופל ולא מתרומם 3) בטן ועכוז נעולים, נשימה רגילה 4) מודדים כמה זמן החזקת — לא כמה תנועות עשית
**videos:** `videos/abs-01.mp4` (9.2 s)
**weight metadata:** `weightMode: 'bodyweight'`, `weightIncrementKg: 0`, `usesPlates: false`, `barWeightKg: null`, `seedWeightKg: null`, **`metric: 'seconds'`**, `targetReps: 75–75` (a closed range — a clock, not a rep target)
**libraryId:** `lib-plank`
**programs containing exercise:** פול באדי א׳ / F1 (position 7), and the **abs block** (position 0)

## K. CORRECTIONS MADE
**No changes required.** All four cues match the video, and the `metric: 'seconds'` / 75-second target modelling (migration 5) is correct.
*(The video adds two details the cues do not mention — forearms parallel rather than clasped, and active scapular protraction. Neither contradicts an existing cue, so no cue was rewritten.)*

## L. VIDEO-BY-VIDEO VERIFICATION
| Video | Actual exercise shown | Key biomechanics | Final assignment | Confidence |
|---|---|---|---|---|
| `abs-01.mp4` | Forearm plank | Rear view of scapular position with a yellow double arrow (protract, push the floor away); ❌ sagging hips (red curved line) vs ✅ level hips (green line + up arrow); ❌ hands clasped (red forearms, inward arrows) vs ✅ forearms parallel with hands apart (green, outward arrows); foot-spacing arrow; ❌ head cranked up (red head/neck) vs ✅ neutral; abdominal-wall anatomy overlay red vs green | `abs` | HIGH |

## BIOMECHANICAL HANDOFF
**Final exercise name:** Forearm Plank (isometric, 75-second target)
**Equipment:** bodyweight, floor
**Body orientation:** prone, supported on forearms and toes
**Torso angle:** roughly horizontal, straight line heel → hip → shoulder → head
**Bench/body angle:** N/A
**Grip:** N/A — open hands, **forearms parallel, hands apart (not clasped)**
**Grip width:** N/A
**Shoulder position:** stacked directly over the elbows, **actively protracted**
**Elbow path:** none — isometric
**Scapular motion:** held in protraction (push the floor away), not allowed to sag between the blades
**Cable/resistance direction:** vertical (gravity), creating a lumbar extension moment the trunk resists
**ROM:** none — isometric hold
**Machine mechanics:** none
**Unilateral/bilateral:** bilateral
**Support:** two contact points only — forearms and toes; foot spacing sets the base width
**Primary movement pattern:** anti-extension trunk isometric
**Critical variation details:** forearm (not straight-arm) plank · forearms parallel with hands apart · active scapular protraction · hips level, no sag and no pike · neutral neck · **timed to a fixed 75 s target, not counted in reps**
**What this exercise is NOT:** not a high/straight-arm plank · not a side plank · not an RKC max-tension plank · not a crunch, cable crunch or leg raise · not weighted
**Confidence limitations:** foot spacing not measurable; whether the hold is continuous is unknown.

---

# NEW EXERCISES CREATED

| Exercise | Hebrew | English | ID | Origin | Videos | Reason |
|---|---|---|---|---|---|---|
| — | — | — | — | — | — | `No new exercises created in this batch.` |

No record in this batch contained two biomechanically distinct variations that justified a split. The two clips carrying non-matching content — `forearm-straight-bar`'s routine segments and `forearm-dumbbell`'s incline curls — are third-party compilation/mis-filed content with no evidence they are part of Tavor's program, so per your own rule no record was invented to house them.

---

# VIDEOS MOVED

| Video | From | To | Reason | Confidence |
|---|---|---|---|---|
| — | — | — | `No videos moved in this batch.` | — |

---

# EXERCISES SPLIT

| Original | New Records | Reason | Program Mapping |
|---|---|---|---|
| — | — | `No exercises split in this batch.` | — |

The one split candidate considered was `forearm-straight-bar` — its clips demonstrate wrist **flexion**, a reverse **curl**, and wrist **extension**, which are three different exercises. It was rejected because the record itself names only the flexion version, its `subTarget` already declares that Tavor trains both directions, and the extra segments are routine content rather than evidence of separate program slots.

---

# CATALOG CHANGES SUMMARY

| Exercise | Action | Before | After | Confidence |
|---|---|---|---|---|
| `shrugs` | cue 1 corrected + migration 11 | `למשוך ישר למעלה לכיוון האוזניים` | `הטיה קלה קדימה מהירך, ולסחוט את הכתפיים למעלה ואחורה — לא ישר למעלה בעמידה זקופה` | HIGH |
| `forearm-dumbbell` | mismatch note made precise | `הסרטון מראה כפיפת מרפקים בשיפוע — תרגיל ביצפס, לא אמות` | `…כפיפת מרפקים בדאמבלים על ספסל בשיפוע — גם בשכיבת פנים וגם בשכיבת גב — תרגיל ביצפס, לא אמות` | HIGH |
| `incline-barbell-bench-press`, `lateral-raise`, `reverse-machine-fly`, `forearm-straight-bar`, `abs` | verified, no change | — | — | — |

**Supporting code changes:** `src/db/catalogFix.ts` (`CATALOG_FIXES_V11`), `src/db/db.ts` (`version(11)` migration), `src/db/catalogFix.test.ts` (generation chain extended to V11), `src/db/migration11.test.ts` (new, 3 tests).

---

# MANUAL REVIEW REQUIRED

| Exercise | Issue | Why uncertain | Recommended check |
|---|---|---|---|
| `shrugs`, `hammer-curl` | `weightMode: 'total'` while `lateral-raise` — the other bilateral dumbbell exercise — is `'perSide'` | Your own source list writes "12.5 kg per hand" for the lateral raise but plain "20 kg" / "17.5 kg" for the shrug and hammer curl, so the difference may be deliberate. Changing it would halve or double all historical volume for those exercises. | Decide what the logged number means for each: the weight of one dumbbell (→ `perSide`) or a combined figure (→ keep `total`). |
| `forearm-dumbbell` | `VIDEO_ASSIGNMENT_REVIEW_REQUIRED` — the clip is an incline dumbbell **biceps** curl (two variants), not a forearm exercise | No catalog record fits an incline dumbbell curl, and creating one would add an exercise you may not perform. | Replace the clip with real footage of the wrist curl, or confirm you want an incline-curl record created. |
| `forearm-straight-bar` | Both clips are multi-exercise forearm **routines**; only clip 01's first segment matches the record name. The demonstrated setup also uses a **high pulley** with the hands at chin height | The clips are correct-family content, not mis-assignments, so there is nothing to move. But the pulley height and whether you stand or sit are not established. | Confirm your own setup (pulley height, standing vs seated, and whether you train the extensor direction on the same station). |
| `incline-barbell-bench-press` | `PROGRAM_MAPPING_REVIEW_REQUIRED` — still carried over from batch 2 | אימון A (position 1) and F2 (position 2) both still point at the **flat** record. Your source document lists A01 as a single slot covering both angles, so which one a given session means is unknowable. | Decide whether those slots should stay flat, move to incline, or hold both. One line in the program editor. |
| `reverse-machine-fly`, `forearm-straight-bar`, `forearm-dumbbell`, `abs` | `seedWeightKg: null` on four records | Legitimate for bodyweight (`abs`) and for exercises where you use "whatever's on the machine", but it means the app has no starting suggestion until you log a set. | Optional — add a starting weight if you want the first session pre-filled. |
| `leg-curl` / `leg-extension` | Your source document `הנחיה-לתיקון-שמות.md` still contains a **wrong** "mandatory" instruction to swap these two videos | Disproved in batch 3 by the machine placards visible in both clips. The document is outside this repo, so I did not edit it. | Delete or correct section "תיקוני וידאו #1" so a future pass does not act on it. |

---

# VIDEO MISMATCHES STILL OPEN

| Current Exercise | Video | Actual Content | Why Not Moved |
|---|---|---|---|
| `seated-row-light` | `seated-row-light-01.mp4` | Single-arm **underhand plate-loaded machine lat pulldown** (vertical pull) | The correct home does not exist. `lat-pulldown` is a bilateral wide-pronated **cable** pulldown — three variation differences away. Creating a record would add an exercise with no evidence it is trained. |
| `forearm-dumbbell` | `forearm-dumbbell-01.mp4` | **Incline dumbbell biceps curl**, prone and supine variants | No catalog record fits an incline dumbbell curl; the three biceps records all fix the humerus differently and on different equipment. |

Both remain visible with their in-app warning label, per the project's stated policy that a labelled wrong clip beats no clip until a replacement exists.

---

# FINAL CHECK

- [x] **Exactly 7 new records audited — not 10, because only 7 remained.** 6 never-audited records (positions 23–28) plus `incline-barbell-bench-press` (position 2), which batch 2 created but never gave a standalone entry. **This completes all 29 catalog records.**
- [x] **No previously audited record was re-audited** — `incline-barbell-bench-press` had never received its own A–L entry, which is why it is included.
- [x] **Batch number given for every record** (Batch Exercise 1–7 of 7).
- [x] **Global catalog position given for every record** (2, 23, 24, 25, 26, 27, 28) — all determinable from `src/db/seed.ts` order.
- [x] **All videos analyzed visually** — 8 clips at 1080×1920, multiple timestamps, captions and on-screen titles transcribed.
- [x] **Every variation mismatch documented** — `forearm-straight-bar`'s routine segments and `forearm-dumbbell`'s incline curls, both with per-segment detail.
- [x] **High-confidence corrections actually applied** — the `shrugs` cue (with migration 11 so an installed device receives it) and the sharpened mismatch note.
- [x] **Nothing uncertain was "fixed" on a guess** — the `weightMode` inconsistency, the two open video mismatches and the bench-press program mapping were all left alone and logged.
- [x] **No new duplicate IDs** — 29 exercises, 29 unique ids, orders 0…28 contiguous.
- [x] **No broken references** — every program and block item resolves; every manifest key maps to a real exercise.
- [x] **No new orphaned videos** — 34 clips, unchanged; every `src`/`poster` exists on disk (`manifests.test.ts`).
- [x] **Program mappings intact** — no program item added, removed or repointed in this batch.
- [x] **Migrations valid** — version 11 added following the existing pattern; guarded so it skips records the user has edited; covered by `migration11.test.ts`.
- [x] **build / typecheck / tests pass** — `tsc --noEmit` clean · `vitest run` **525 passed / 42 files** (run repeatedly) · `npm run build` succeeds · `oxlint` reports only the one pre-existing unrelated warning.
- [x] **BIOMECHANICAL HANDOFF written for all 7.**

---

# CATALOG-WIDE STATE AFTER FOUR BATCHES

**All 29 records audited.** Cumulative totals:

- **1 record split** — `db-bench-press` → flat + `incline-barbell-bench-press` (batch 2)
- **1 record created** — `incline-barbell-bench-press`
- **2 videos reassigned** — `db-bench-press-01.mp4` → the incline record (batch 2); `machine-squat-01.mp4` → `leg-press` (batch 3)
- **1 muscle group corrected** — `dips`: `chest` → `triceps` (batch 2)
- **1 equipment flag corrected** — `db-bench-press`: `usesPlates` false → true (batch 2)
- **2 library links opened** — both bench-press records, unlocked by the split (batch 2)
- **6 cues rewritten** — `dips` ×2, `cable-tricep-pushdown` ×1, `cross-cable-tricep` ×2 (batch 2), `shrugs` ×1 (batch 4)
- **2 mismatch notes sharpened** — `seated-row-light` (batch 3), `forearm-dumbbell` (batch 4)
- **1 mismatch resolved** — `machine-squat` (batch 3, by moving the clip to its correct record)
- **1 documented "mandatory fix" rejected on evidence** — the `leg-curl` ⇄ `leg-extension` swap (batch 3)
- **2 migrations added** — version 10 and version 11
- **9 new tests added** — `migration10.test.ts` (6), `migration11.test.ts` (3)

**Still open across the whole catalog:** 2 video mismatches (`seated-row-light`, `forearm-dumbbell`) · 4 records with no video (`decline-pec-fly`, `bench-machine-press`, `behind-body-cable-curl`, `machine-squat`) · 1 program mapping decision (which bench press アimon A and F2 mean) · 1 `weightMode` consistency decision (`shrugs` / `hammer-curl` vs `lateral-raise`) · 2 unverified names (`decline-pec-fly`'s "decline", `bench-machine-press`'s identity) · 1 duplicate display name (`decline-machine-press` and `bench-machine-press` are both "לחיצת חזה במכונה").
