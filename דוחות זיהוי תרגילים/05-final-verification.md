# Final Batch — Deep Verification Pass (catalog positions 23–28)

Project: tavor-gym. Every clip re-analyzed at the **1080×1920 source resolution**, at up to 4 fps, with targeted full-resolution crops. Machine placards, burned-in captions and on-screen exercise titles read directly.

---

## 1. CONFIRM FINAL BATCH — state check first

You listed six records as remaining. **That was true when the batch-4 report was written, but it is no longer the state of the project.** Verified against `src/db/seed.ts` and `src/db/db.ts`:

| Check | Result |
|---|---|
| Catalog records | 29, orders 0–28 contiguous |
| Reports on disk | `01-…`, `02-…`, `03-batch3-13-22.md`, **`04-batch4-final.md`** |
| Batch 4 scope | Global 2, **23, 24, 25, 26, 27, 28** — i.e. **all six you listed, plus `incline-barbell-bench-press`** |
| Migrations | up to **`version(11)`** — batch 4 shipped the `shrugs` cue fix |

So **all 29 records were already audited**, and batch 4 already applied the one high-confidence fix these six warranted.

**What this pass therefore is:** your sections 6–11 asked far more specific questions than batch 4 answered — humeral plane and rotation on the lateral raise, shrug taxonomy, rear-delt-vs-mid-back bias, a formal split decision on wrist flexion vs extension, exact joint actions, and the crunch-vs-plank-vs-leg-raise question. This is a **deeper verification pass on those exact six**, in your requested format, that either confirms, sharpens or **downgrades** what batch 4 said.

**It produced no new catalog changes** — see section K throughout and the CATALOG CHANGES SUMMARY. It did produce **one correction to my own previous report** (lateral raise humeral plane), several material refinements, and a formal split decision.

### ⚠️ Correction to the batch-4 report
Batch 4 stated as fact that the lateral raise puts *"the humerus in the scapular plane"*. **That was an inference presented as an observation, and this pass downgrades it to UNKNOWN.** The clip is filmed in pure side profile, from which the humeral plane cannot be determined. Details in FINAL BATCH EXERCISE 1.

---

# FINAL BATCH EXERCISE 1 / GLOBAL CATALOG EXERCISE 23 — Dumbbell Lateral Raise

## A. Identification
**App name after audit:** `הרמת ידיים לצדדים` (unchanged)
**Previous app name:** `הרמה לצדדים` — renamed in migration 3
**Exercise ID / key:** `lateral-raise`
**Hebrew standardized name:** הרמת ידיים לצדדים עם דאמבלים, מרפק כפוף
**English standardized name:** **Standing Bilateral Dumbbell Lateral Raise, markedly bent arm (~90° elbow), elbow-led, capped at shoulder height**
**Alternative/common names:** Lateral Raise · Side Raise · Bent-Arm Lateral Raise
**Exercise category:** shoulder abduction (single-joint), plane not determinable
**Equipment:** two dumbbells (Hammer Strength hex, "10" visible), standing, unsupported. Not a cable. Not a machine.
**New record created by split:** no.

## B. Starting Position
**Body orientation:** standing upright.
**Torso angle:** **strictly vertical throughout** — verified frame by frame across the whole rep at 4 fps. There is **no torso lean** in this clip, forward or sideways.
**Back support/position:** unsupported.
**Shoulder position:** neutral at rest. The clip's opening ❌/✅ pair is the **start position**: dumbbell held **in front of the thigh** (❌) vs **beside/slightly behind the thigh** (✅).
**Elbow position:** at the start, near-extended with the arm hanging. **At the top the elbow is flexed to roughly 90°** — a pronounced bend, not the token "slight bend" of a classic straight-arm lateral raise. This is the single most analysis-relevant refinement of this pass.
**Hip position:** neutral, no swing.
**Knee position:** soft, static.
**Foot position:** hip-width, even, flat.

## C. Grip / Contact
**Grip type:** neutral at the top — the dumbbell handle runs roughly **front-to-back** relative to the body (both plates visible side-on in the side view). Whether any internal rotation ("pinky up") is applied is **not determinable**.
**Grip width:** N/A — one dumbbell per hand.
**Hand position:** at the top the **hand sits below elbow height**. This is the clip's dominant ❌/✅ pair, repeated four times: wrist cocked up with the hand above the elbow (❌, pain sparks drawn at the shoulder) vs the elbow leading and the hand trailing below (✅, green line along the top of the arm with an angle marker at the elbow).
**Handle/bar/attachment:** dumbbell.
**Other body contact points:** none.

## D. Movement
**Start position:** arms hanging, dumbbells beside/slightly behind the thighs.
**End position:** upper arms raised to about shoulder height, elbows leading and bent ~90°, hands below elbow level, dumbbells at roughly chin height in the side view.
**Main joint actions:** shoulder abduction; elbow flexion increasing through the ascent (it is **not** held at a constant angle — the arm folds as it rises).
**Movement path:** the upper arm rises; the forearm folds inward so the dumbbell describes a shorter arc than the elbow.
**Elbow path:** leads throughout, rising ahead of and above the hand.
**Shoulder path:** abduction to roughly 90°, stopping at shoulder height.
**Scapular behavior:** shoulders held down; no shrug to gain height.
**Hip/knee behavior:** static — app cue 4 treats any momentum as failure of the exercise.
**Wrist/forearm behavior:** wrist held neutral, not cocked up. Forearm rotation not determinable.

## E. Resistance Mechanics
**Resistance source:** gravity on free dumbbells.
**Direction of resistance:** straight down, constant.
**Cable direction:** N/A.
**Machine path:** N/A.
**Resistance relative to body:** vertical against a rotating arm. Because the elbow folds as the arm rises, the **load's moment arm at the shoulder is shortened** relative to a straight-arm lateral raise — the resistance still grows toward the top, but less steeply. This is a real difference in the torque profile and is why the bent-arm version tolerates more load.

## F. Range of Motion
**Approximate ROM:** arm at the side → upper arm at shoulder height (~90° abduction).
**Deep stretch position:** the bottom, arm hanging — with essentially no tension there.
**Peak contraction position:** the top, at shoulder height.
**Full / partial / intentionally restricted:** **deliberately capped at shoulder height** (app cue 2). Does not go overhead.
**Any ROM-specific coaching:** stop at shoulder height; start with the dumbbell beside/behind the thigh, not in front.

## G. Execution Details
**Unilateral / bilateral:** **bilateral** — two dumbbells are visible at the top position.
**Alternating / simultaneous:** simultaneous.
**Open / closed kinetic chain:** open.
**Tempo:** not determinable.
**Pause:** none shown.
**Special technique:** elbow leads · hand below elbow · elbow folds to ~90° at the top · start behind the thigh · light load, no momentum · capped at shoulder height.
**Stability requirements:** moderate — standing and unsupported, easily cheated with torso English, which app cue 4 explicitly guards against.

## H. CRITICAL VARIATION DETAILS
**WHAT EXACTLY DISTINGUISHES THIS EXERCISE FROM SIMILAR VARIATIONS?**
- **Markedly bent arm (~90° at the top), not a straight-arm raise.** The forearm folds during the ascent, shortening the resistance arm at the shoulder. Any analysis that assumes a long-lever straight-arm lateral raise will over-estimate the shoulder torque.
- **Elbow leads and finishes above the hand.** The clip's central correction.
- **Free weight, standing** → tension is near zero at the bottom and peaks at the top. The opposite profile from a cable lateral raise.
- **Start position beside/behind the thigh**, not in front.
- **Capped at shoulder height**, excluding the overhead range.
- **Torso strictly vertical** — this is *not* a leaning/lean-away lateral raise.
- **Bilateral and simultaneous.**

**WHAT THIS EXERCISE IS NOT:**
Not a front raise. Not an upright row (ruled out by dumbbell orientation — see Confidence). Not a cable lateral raise. Not a machine lateral raise. Not a leaning/lean-away lateral raise. Not a seated lateral raise. Not a straight-arm lateral raise. Not raised above shoulder height. Not unilateral.

## I. Confidence
**HIGH CONFIDENCE:** standing; dumbbells; bilateral and simultaneous; torso strictly vertical with no lean; start beside/behind the thigh; elbow leads with the hand below it at the top; **elbow flexed to roughly 90° at the top**; capped at shoulder height; no momentum.
**MODERATE CONFIDENCE:** that the exercise is a lateral raise rather than an upright row. The discriminator used: at the top the **dumbbell handle lies front-to-back with both plates visible side-on**, which is the orientation of a laterally abducted arm; in an upright row the handles run across the body and would appear end-on from this camera. That, plus Tavor's own folder label and a `verified: true` mark in his source document, makes lateral raise the reading — but it is inference from one geometric cue, not direct observation.
**LOW CONFIDENCE:** the exact elbow angle at the top (~90°, estimated from a drawn angle marker).
**UNKNOWN — explicitly downgraded from the batch-4 report:**
- **The humeral plane.** Whether the arm abducts in the pure frontal plane or in the scapular plane (~30° forward) **cannot be determined** — the clip is filmed in pure side profile for its entire 5.6 s, and that is precisely the one view from which this cannot be read. Batch 4 asserted "scapular plane"; that assertion is withdrawn.
- **Forearm/thumb rotation.** Whether any internal rotation ("pouring"/pinky-up) or external rotation is applied is not visible.
- Tempo, rep count, and whether Tavor performs it exactly as demonstrated.

## J. FINAL APP DATA
**Hebrew name:** הרמת ידיים לצדדים · **English name:** Lateral Raise · **ID:** `lateral-raise`
**muscleGroup:** `shoulders` · **subTarget:** דלתא צדי · **secondary:** `[]` (isolation)
**equipment:** `freeWeights`
**cues:** 1) להוביל עם המרפק, לא עם כף היד 2) להרים עד גובה הכתף בלבד 3) הטיה קלה קדימה, כמו למזוג מים 4) משקל קטן — ברגע שיש תנופה, זה כבר לא הדלתא
**videos:** `videos/lateral-raise-01.mp4` (5.6 s)
**posters:** `videos/lateral-raise-01.jpg`
**weight metadata:** `weightMode: 'perSide'`, `weightIncrementKg: 2.5`, `usesPlates: false`, `barWeightKg: null`, `seedWeightKg: 12.5`, `targetReps: 12–20`
**libraryId:** `lib-lateral_raise`
**programs containing exercise:** פול באדי ב׳ / F2 (position 4); **shoulders block** (position 1)

## K. CORRECTIONS MADE
**No changes required.** All four cues remain consistent with the video.
*Considered and rejected:* rewording cue 3 (`הטיה קלה קדימה, כמו למזוג מים`) to state explicitly that the **torso** stays vertical, since "הטיה קלה קדימה" could be misread as a torso lean. Rejected because "כמו למזוג מים" is the standard Hebrew idiom anchoring the tilt to the dumbbell, so the cue is not factually wrong — and changing it would require a twelfth migration for a wording preference rather than an error. Logged under MANUAL REVIEW as an optional one-line tweak.

## L. VIDEO-BY-VIDEO VERIFICATION
| Video | Actual Exercise Shown | Key Biomechanics | Final Assignment | Confidence |
|---|---|---|---|---|
| `lateral-raise-01.mp4` | Standing bilateral dumbbell lateral raise, bent-arm style. **One variation only** — no second variation in the clip | Pure side-profile split-screen throughout. ❌/✅ #1: dumbbell in front of the thigh vs beside/behind it. ❌/✅ #2 (×4): hand above elbow with shoulder pain sparks vs elbow leading with hand below, green angle marker showing ~90° elbow flexion at the top. Torso vertical in every frame. Two dumbbells visible at the top → bilateral. Dumbbell handle front-to-back at the top → lateral abduction rather than an upright row | `lateral-raise` | HIGH for the identity; **plane UNKNOWN** |

## BIOMECHANICAL HANDOFF
**Final exercise name:** Standing Bilateral Dumbbell Lateral Raise (bent-arm, ~90° elbow at the top)
**Equipment:** dumbbells, standing, unsupported
**Body orientation:** upright standing
**Torso angle:** **vertical — no lean, confirmed frame by frame**
**Bench/body angle:** N/A
**Grip:** neutral; handle front-to-back at the top; rotation not determinable
**Grip width:** N/A (one dumbbell per hand)
**Shoulder position:** neutral at rest; abducts to ~90°; scapula kept depressed, no shrug
**Elbow path:** **leads the movement and folds to ~90° by the top**; hand trails below elbow height
**Scapular motion:** minimal; upward rotation only late in the range
**Wrist/forearm action:** wrist held neutral, not cocked up; forearm rotation not determinable
**Hip position:** neutral, static
**Knee position:** soft, static
**Foot position:** hip-width, flat, even
**Cable/resistance direction:** vertical (gravity); ascending torque curve, **blunted by the folding elbow**
**ROM:** arm at the side → upper arm at shoulder height; **capped there**; starts beside/behind the thigh
**Machine mechanics:** none — free weight
**Unilateral/bilateral:** bilateral, simultaneous
**Support:** none
**Primary movement pattern:** single-joint shoulder abduction
**Critical variation details:** markedly bent arm (~90°) · elbow-led with hand below · start behind the thigh · capped at shoulder height · vertical torso · free-weight ascending resistance
**What this exercise is NOT:** not a front raise · not an upright row · not a cable or machine lateral raise · not a leaning lateral raise · not a straight-arm lateral raise · not seated · not unilateral
**Confidence limitations:** ⚠️ **the humeral plane (frontal vs scapular) is UNKNOWN** — the clip is pure side profile. Forearm rotation is likewise not visible. Lateral-raise-vs-upright-row rests on dumbbell orientation plus Tavor's own labelling, at MODERATE confidence.

---

# FINAL BATCH EXERCISE 2 / GLOBAL CATALOG EXERCISE 24 — Dumbbell Shrug

## A. Identification
**App name after audit:** `הרמת כתפיים עם דאמבלים` (unchanged)
**Previous app name:** `הרמת כתפיים` — renamed in migration 3
**Exercise ID / key:** `shrugs`
**Hebrew standardized name:** הרמת כתפיים עם דאמבלים בהטיה קדימה, סחיטה למעלה ואחורה
**English standardized name:** **Forward-Leaning ("Incline") Dumbbell Shrug with a Scapular-Retraction Component — elevation up-and-back, not vertical**
**Alternative/common names:** Leaning Shrug · Incline Dumbbell Shrug · Bent-Over Shrug
**Exercise category:** scapular elevation **plus retraction** (single-joint girdle movement)
**Equipment:** two dumbbells (Rogue hex), standing, unsupported. Not a barbell. Not a trap bar. Not a Smith. Not a machine.
**New record created by split:** no.

## B. Starting Position
**Body orientation:** standing with a **forward hip hinge** — the clip's first instruction card is literally "LEAN FORWARD".
**Torso angle:** **~25–35° forward of vertical at the setup, deepening to ~35–45° during the squeeze frames.** Measured across the sequence at 3 fps.
**Back support/position:** unsupported; neutral spine held isometrically.
**Shoulder position:** the second card is "SHOULDERS DOWN" — the rep begins from **full scapular depression**, letting the dumbbells pull the girdle down.
**Elbow position:** **straight and completely passive** — app cue 4: the hands only hold, they do not bend. Confirmed in every frame.
**Hip position:** hinged back to produce the lean; held, not bounced.
**Knee position:** soft, static.
**Foot position:** hip- to shoulder-width, flat, even.

## C. Grip / Contact
**Grip type:** **neutral** — palms facing the body, handles running front-to-back.
**Grip width:** N/A — one dumbbell per hand.
**Hand position:** **beside and slightly behind the thighs**, a consequence of the forward lean. **Not in front of the body** — which is the geometry that makes the up-and-back path possible.
**Handle/bar/attachment:** dumbbells.
**Other body contact points:** none.

## D. Movement
**Start position:** torso leaning forward, shoulders fully depressed, arms hanging straight beside/behind the thighs.
**End position:** shoulder girdle squeezed **up and back** along a diagonal — a blue arrow in the clip marks roughly **45–60° from horizontal**, captioned "SQUEEZE UP & BACK". Held one second per app cue 3.
**Main joint actions:** scapular **elevation combined with retraction**. Not pure elevation.
**Movement path:** the girdle travels up and rearward; the dumbbells rise a short distance along that diagonal.
**Elbow path:** none — elbows locked straight.
**Shoulder path:** up and back, then a controlled return to full depression.
**Scapular behavior:** this **is** the exercise — full depression at the bottom, elevation **plus retraction** at the top. No circular rolling is demonstrated anywhere in the clip.
**Hip/knee behavior:** static; the lean is held for the whole set.
**Wrist/forearm behavior:** passive grip only; wrists neutral.

## E. Resistance Mechanics
**Resistance source:** gravity on free dumbbells.
**Direction of resistance:** straight down, constant.
**Cable direction:** N/A.
**Machine path:** N/A.
**Resistance relative to body:** vertical through the hanging arms into the shoulder girdle. Because the torso is hinged forward, the **vertical load line falls in front of the scapulae**, so the up-and-back squeeze works against gravity through a longer effective range than an upright shrug — which is exactly why the clip teaches the lean and marks the upright version as wrong.

## F. Range of Motion
**Approximate ROM:** full scapular depression → maximal elevation-with-retraction.
**Deep stretch position:** the bottom, girdle allowed to sink fully.
**Peak contraction position:** top of the up-and-back squeeze.
**Full / partial / intentionally restricted:** full, both ends emphasised.
**Any ROM-specific coaching:** start from full depression; squeeze **up and back**, not straight up; hold one second at the top (app cue, not shown in the clip).

## G. Execution Details
**Unilateral / bilateral:** bilateral · **Alternating / simultaneous:** simultaneous
**Open / closed kinetic chain:** open
**Tempo:** not measurable.
**Pause:** one second at the top, prescribed by the app; the clip does not demonstrate a timed hold.
**Special technique:** forward hip hinge · full depression start · up-and-back squeeze · passive straight arms · no shoulder circling.
**Stability requirements:** moderate — the forward lean is an isometric hold for the whole set.

## H. CRITICAL VARIATION DETAILS
**WHAT EXACTLY DISTINGUISHES THIS EXERCISE FROM SIMILAR VARIATIONS?**
Taxonomically this is an **incline/leaning shrug with a retraction component**, and it is emphatically **not a pure vertical shrug**:
- **Torso hinged forward ~25–45°**, held isometrically. Cards: "LEAN FORWARD".
- **The path is diagonal, up AND back (~45–60°)** — elevation *plus* scapular retraction, not vertical elevation.
- **The clip explicitly marks the upright vertical shrug as wrong**, captioning "DON'T DO THIS." over an athlete standing bolt upright shrugging straight up.
- **Dumbbells beside/behind the thighs**, not in front — unlike a barbell shrug where the bar sits in front of the thighs and constrains the path to vertical.
- **Arms completely passive**, so there is no upright-row component.
- **No rolling/circling** is shown; the app's cue against it is sound coaching but is not sourced from this clip.
- **Neck and head neutral**, gaze forward-down; not cranked back.

**WHAT THIS EXERCISE IS NOT:**
Not an upright/vertical dumbbell shrug (that is the clip's explicit ❌). Not a barbell shrug. Not a trap-bar shrug. Not a behind-the-back shrug. Not a Smith machine shrug. Not a machine shrug. Not an upright row. Not a shoulder roll/circle. Not a scapular retraction row.

## I. Confidence
**HIGH CONFIDENCE:** dumbbells; standing; forward hip hinge taught as required; start from full depression; **squeeze up and back with an explicit retraction component**; arms passive and straight; hands beside/behind the thighs; neck neutral; no rolling demonstrated; **the upright straight-up shrug is explicitly captioned as the mistake**. All of this is burned-in text plus direct observation, not inference.
**MODERATE CONFIDENCE:** the lean is ~25–45° — a side-profile estimate that deepens through the sequence.
**LOW CONFIDENCE:** the exact diagonal angle of the squeeze (the arrow reads ~45–60°).
**UNKNOWN:** tempo; rep count; whether the one-second hold in the app cue reflects what Tavor does; and whether the logged 20 kg means per dumbbell or a combined figure.

## J. FINAL APP DATA
**Hebrew name:** הרמת כתפיים עם דאמבלים · **English name:** Dumbbell Shrug · **ID:** `shrugs`
**muscleGroup:** `shoulders` · **subTarget:** טרפזים · **secondary:** `['forearms']`
**equipment:** `freeWeights`
**cues:** 1) **הטיה קלה קדימה מהירך, ולסחוט את הכתפיים למעלה ואחורה — לא ישר למעלה בעמידה זקופה** *(fixed in batch 4, migration 11)* 2) לא לסובב את הכתפיים במעגל 3) לעצור שנייה למעלה 4) ידיים רק מחזיקות — לא מכופפות
**videos:** `videos/shrugs-01.mp4` (6.8 s)
**posters:** `videos/shrugs-01.jpg`
**weight metadata:** `weightMode: 'total'`, `weightIncrementKg: 2.5`, `usesPlates: false`, `barWeightKg: null`, `seedWeightKg: 20`, `targetReps: 12–15`
**libraryId:** `lib-shrug`
**programs containing exercise:** **shoulders block** (position 2)

## K. CORRECTIONS MADE
**No changes required in this pass.** The cue contradiction was found and fixed in batch 4 (cue 1 rewritten, `CATALOG_FIXES_V11`, migration 11, 3 tests). This pass re-verified the fix against the clip at 3 fps and confirms it: the corrected cue now states exactly what the three instruction cards say.

## L. VIDEO-BY-VIDEO VERIFICATION
| Video | Actual Exercise Shown | Key Biomechanics | Final Assignment | Confidence |
|---|---|---|---|---|
| `shrugs-01.mp4` | Forward-leaning dumbbell shrug with retraction | Title "HOW TO SHOULDER SHRUG"; cards in sequence "LEAN FORWARD" → "SHOULDERS DOWN" → "SQUEEZE UP & BACK" with a ~45–60° blue arrow; then **"DON'T DO THIS."** over an upright athlete shrugging vertically; then back to the leaning version. Rogue hex dumbbells, neutral grip, beside/behind the thighs, elbows locked straight in every frame, neck neutral, no rolling shown | `shrugs` | HIGH |

## BIOMECHANICAL HANDOFF
**Final exercise name:** Forward-Leaning Dumbbell Shrug (elevation + retraction)
**Equipment:** dumbbells, standing, unsupported
**Body orientation:** standing with a forward hip hinge
**Torso angle:** ~25–35° at setup, ~35–45° during the squeeze
**Bench/body angle:** N/A
**Grip:** neutral, passive; handles front-to-back
**Grip width:** N/A (one dumbbell per hand)
**Shoulder position:** starts in **full depression**; girdle elevates and retracts
**Elbow path:** none — locked straight, completely passive
**Scapular motion:** **elevation combined with retraction**, along a ~45–60° up-and-back diagonal, returning to full depression
**Wrist/forearm action:** passive grip, wrists neutral
**Hip position:** hinged back, held isometrically
**Knee position:** soft, static
**Foot position:** hip- to shoulder-width, flat
**Cable/resistance direction:** vertical (gravity); with the torso hinged, the load line falls **in front of** the scapulae
**ROM:** full depression → maximal up-and-back elevation; 1-second hold prescribed
**Machine mechanics:** none — free weight
**Unilateral/bilateral:** bilateral, simultaneous
**Support:** none; the lean is an isometric hold
**Primary movement pattern:** single-joint scapular elevation **plus** retraction
**Critical variation details:** forward lean is required · path is diagonal up-and-back, **not vertical** · dumbbells beside/behind the thighs · full depression start · arms never bend · no circling
**What this exercise is NOT:** **not an upright vertical shrug** (the clip's explicit ❌) · not a barbell, trap-bar, behind-the-back, Smith or machine shrug · not an upright row · not a shoulder roll
**Confidence limitations:** lean angle and arrow angle are side-profile estimates; per-dumbbell vs combined load unresolved.

---

# FINAL BATCH EXERCISE 3 / GLOBAL CATALOG EXERCISE 25 — Reverse Pec Deck (Rear Delt Fly)

## A. Identification
**App name after audit:** `פרפר הפוך במכונה` (unchanged)
**Previous app name:** same
**Exercise ID / key:** `reverse-machine-fly`
**Hebrew standardized name:** פרפר הפוך במכונת פק-דק דו-תכליתית, חזה נשען, זרוע כמעט ישרה בגובה הכתף
**English standardized name:** **Seated Chest-Supported Reverse Pec Deck on a dual-function "Rear Delt / Pec Fly" machine — near-straight arms at shoulder height, pure horizontal abduction, scapulae deliberately NOT retracted**
**Alternative/common names:** Reverse Pec Deck · Rear Delt Fly Machine · Reverse Fly
**Exercise category:** shoulder horizontal abduction (single-joint)
**Equipment:** **machine identified from its own placard — "Rear Delt / Pec Fly", a dual-purpose pec deck that converts between chest fly and rear delt fly.** Clip 01 is a **Precor** unit (placard legible twice in frame); clip 02 is a different brand whose placard also reads "Rear Delt / Pec Fly". Selectorized weight stack.
**New record created by split:** no.

## B. Starting Position
**Body orientation:** seated **straddling a narrow saddle seat**, facing the machine, chest against a vertical pad.
**Torso angle:** upright, chest actively pressed into the pad. Clip 01's ❌/✅ pair (yellow dashed reference line down the back) is exactly this: upper back rounded with the chest coming off the pad and the shoulder shrugging up (❌) vs chest pinned to the pad with the shoulder down (✅).
**Back support/position:** the **chest**, not the back, is supported — this is what removes trunk swing (app cue 1).
**Shoulder position:** protracted at the start with the arms forward; **at the finish the arms are level with the shoulders**, i.e. shoulder abduction ≈90° in the transverse plane.
**Elbow position:** **near-straight — only a soft bend.** This is a refinement of batch 4, which described a more pronounced "slight bend". Verified in both the side view and the rear view: the arms are long, close to a straight-arm reverse fly.
**Hip position:** seated ~90°, straddling.
**Knee position:** ~90°, knees wide either side of the seat.
**Foot position:** flat on the floor, wide.

## C. Grip / Contact
**Grip type:** **neutral** — vertical handles, palms facing each other.
**Grip width:** fixed by the machine, roughly shoulder-width at the start.
**Hand position:** clip 02's opening ❌/✅ pair is the grip itself: a full wrapped fist (❌) vs an **open, thumbless hand pushing through the heel of the palm** (✅) — the intent being to stop the hand from turning the movement into a pull.
**Handle/bar/attachment:** fixed **vertical** machine handles on the movement arms.
**Other body contact points:** chest pad (the load-bearing contact), saddle seat, floor.

## D. Movement
**Start position:** arms extended forward, handles together in front, scapulae protracted.
**End position:** arms opened out to roughly the **plane of the body**, at shoulder height, with a squeeze.
**Main joint actions:** **shoulder horizontal abduction only.** The elbow angle is essentially constant, so the elbow contributes nothing.
**Movement path:** the handles sweep **directly sideways and slightly backward in a horizontal plane at shoulder height** — not upward, not downward.
**Elbow path:** leads outward and rearward; clip 02 draws a directional arrow on the elbow.
**Shoulder path:** horizontal abduction from protraction to roughly the body line.
**Scapular behavior:** **deliberately quiet.** Clip 02's rear-view ❌/✅ pair shows the scapulae squeezing together (❌, red across the mid-back, arms bent) vs staying apart (✅, yellow double arrow) while the movement comes from the shoulder. App cue 4 says the same. In the rear-view frames the mid-back is visibly flat at the finish.
**Hip/knee behavior:** static.
**Wrist/forearm behavior:** wrist neutral, hand passive against the handle.

## E. Resistance Mechanics
**Resistance source:** **selectorized** weight stack (`usesPlates: false`, `weightIncrementKg: 5`).
**Direction of resistance:** pulls the handles forward, back toward the start.
**Cable direction:** N/A — internal cable/cam, not user-visible.
**Machine path:** **fixed arc**; the two movement arms swing apart in a horizontal plane, so the handle paths **diverge**. Pivot is at the top of the frame above and behind the shoulders (visible in the rear view as the twin swing arms).
**Resistance relative to body:** horizontal into the hands at shoulder height; the chest pad takes the entire reaction force, so the trunk contributes nothing.
**Machine classification:** selectorized · fixed arc · **diverging** · chest-supported · pivot above/behind the shoulders · **linked vs independent arms UNKNOWN** (the two arms move together in every frame, but the mechanism is not visible).

## F. Range of Motion
**Approximate ROM:** handles together in front (arms forward, scapulae protracted) → arms opened to roughly the body plane at shoulder height.
**Deep stretch position:** the start, arms forward with the scapulae protracted.
**Peak contraction position:** arms at the body line, squeezed.
**Full / partial / intentionally restricted:** **deliberately capped at the body line** (app cue 3). It does not travel further behind the torso — which is where scapular retraction would take over.
**Any ROM-specific coaching:** open back to the body line and squeeze; keep the shoulder blades apart.

## G. Execution Details
**Unilateral / bilateral:** bilateral · **Alternating / simultaneous:** simultaneous
**Open / closed kinetic chain:** open
**Tempo:** not determinable.
**Pause:** a squeeze at the finish, per app cue 3; duration not shown.
**Special technique:** chest pinned to the pad · open/thumbless grip · near-straight arms · elbow leads · **scapulae stay apart** · stop at the body line.
**Stability requirements:** low — the chest pad does the stabilising.

## H. CRITICAL VARIATION DETAILS
**WHAT EXACTLY DISTINGUISHES THIS EXERCISE FROM SIMILAR VARIATIONS?**
Answering your explicit question — **this is REAR-DELT BIASED, not mid-back / scapular-retraction biased.** Four independent pieces of evidence:
1. **The scapulae are deliberately held apart.** Both the app cue and a dedicated rear-view ❌/✅ pair in clip 02 make "don't squeeze the shoulder blades" the central instruction.
2. **The ROM is capped at the body line**, stopping short of the range where the retractors dominate.
3. **The arms are near-straight**, so there is no elbow flexion to convert the movement into a row.
4. **The handles travel in a horizontal plane at shoulder height** (~90° shoulder abduction), which is the horizontal-abduction line rather than the lower, elbow-driven line of a rear-delt row.
Further discriminators: **neutral vertical handles** (not pronated); **chest-supported and seated**, so the trunk is out of the equation, unlike a bent-over dumbbell reverse fly; **machine fixed arc**, so the path is constant, unlike cables; and an **open/thumbless grip** to keep the hands passive.

**WHAT THIS EXERCISE IS NOT:**
Not a face pull. Not a rear-delt row. Not a bent-over dumbbell reverse fly. Not a cable reverse fly. Not a wide-grip row. Not a scapular-retraction exercise. Not a chest fly — although the same machine performs one in its other configuration.

## I. Confidence
**HIGH CONFIDENCE:** seated chest-supported reverse pec deck; **machine class identified from its own placard as a dual-function "Rear Delt / Pec Fly"**; neutral vertical handles; arms near-straight; hands and elbows at shoulder height with ~90° horizontal abduction; handles travel sideways-and-back in a horizontal plane; scapulae deliberately held apart; ROM capped at the body line; open/thumbless grip taught; bilateral; open chain; **rear-delt biased rather than mid-back biased**; both clips show the same variation.
**MODERATE CONFIDENCE:** that the handle paths diverge (inferred from the twin swing-arm geometry in the rear view); grip width, which is machine-fixed and differs slightly between the two units.
**LOW CONFIDENCE:** linked vs independent movement arms.
**UNKNOWN:** the brand/model in **Tavor's** gym — both clips are third-party; the cam's resistance curve; seat-height setting; tempo; reps; and the load, since `seedWeightKg` is `null`.

## J. FINAL APP DATA
**Hebrew name:** פרפר הפוך במכונה · **English name:** Reverse Pec Deck (Rear Delt Fly) · **ID:** `reverse-machine-fly`
**muscleGroup:** `shoulders` · **subTarget:** דלתא אחורי · **secondary:** `['back']`
**equipment:** `machine`
**cues:** 1) חזה צמוד לכרית 2) מרפקים כפופים קלות וקבועים 3) לפתוח אחורה עד קו הגוף ולסחוט 4) לא לכווץ שכמות — התנועה מהכתף האחורית
**videos:** `videos/reverse-machine-fly-01.mp4` (6.0 s), `videos/reverse-machine-fly-02.mp4` (10.4 s)
**posters:** `videos/reverse-machine-fly-01.jpg`, `-02.jpg`
**weight metadata:** `weightMode: 'total'`, `weightIncrementKg: 5`, `usesPlates: false`, `barWeightKg: null`, `seedWeightKg: null`, `targetReps: 12–20`
**libraryId:** `lib-rear_delt_fly`
**programs containing exercise:** **shoulders block** (position 3)

## K. CORRECTIONS MADE
**No changes required.** All four cues map one-to-one onto the two clips.
*Considered and rejected:* sharpening cue 2 (`מרפקים כפופים קלות וקבועים`) because the arms are nearer to straight than "slightly bent" suggests. Rejected — "slightly bent and fixed" is a correct description of a soft-elbow near-straight arm, so there is no contradiction to fix, only a shade of emphasis.

## L. VIDEO-BY-VIDEO VERIFICATION
| Video | Actual Exercise Shown | Key Biomechanics | Final Assignment | Confidence |
|---|---|---|---|---|
| `reverse-machine-fly-01.mp4` | Seated reverse pec deck on a **Precor "Rear Delt / Pec Fly"** (placard legible) | Side view, split ❌/✅ with a yellow dashed spine reference: upper back rounded, chest off the pad, shoulder shrugged (❌) vs chest pinned to the pad with the shoulder down (❌→✅). Arms near-straight and horizontal at shoulder height in both halves; neutral vertical handles; straddled saddle seat | `reverse-machine-fly` | HIGH |
| `reverse-machine-fly-02.mp4` | Seated reverse pec deck, different brand, placard also reads "Rear Delt / Pec Fly" | Grip ❌/✅ (wrapped fist vs open thumbless palm). **Rear view** ❌/✅: scapulae squeezed together with bent arms (red mid-back) vs scapulae held apart (yellow double arrow) with the posterior deltoids highlighted. Finish frames show arms fully horizontal at shoulder height, mid-back flat, twin swing arms diverging | `reverse-machine-fly` | HIGH |

## BIOMECHANICAL HANDOFF
**Final exercise name:** Seated Chest-Supported Reverse Pec Deck (Rear Delt Fly)
**Equipment:** selectorized dual-function "Rear Delt / Pec Fly" pec-deck machine, chest pad, saddle seat, vertical neutral handles
**Body orientation:** seated astride a saddle seat, chest against a vertical pad, facing the machine
**Torso angle:** upright, chest actively pressed into the pad
**Bench/body angle:** hips and knees ~90°, knees wide
**Grip:** neutral (vertical handles), **open/thumbless — pressure through the heel of the palm**
**Grip width:** machine-fixed, ~shoulder-width at the start
**Shoulder position:** protracted at the start; **~90° horizontal abduction at the finish, arms level with the shoulders**
**Elbow path:** **near-straight, soft-elbow, angle held constant**; the elbow leads out and back
**Scapular motion:** **deliberately minimal — shoulder blades kept APART, not squeezed**
**Wrist/forearm action:** neutral, passive
**Hip position:** seated ~90°, static
**Knee position:** ~90°, wide, static
**Foot position:** flat, wide, bracing only
**Cable/resistance direction:** horizontal, resisting the opening; machine lever arc at shoulder height
**ROM:** handles together in front → arms opened to roughly the body plane, **capped there**
**Machine mechanics:** selectorized · fixed arc · **diverging** handle path · pivot above/behind the shoulders · chest-supported · arm linkage unknown
**Unilateral/bilateral:** bilateral, simultaneous
**Support:** chest pad takes the reaction force; trunk contributes nothing
**Primary movement pattern:** single-joint shoulder horizontal abduction
**Critical variation details:** **rear-delt biased, NOT mid-back/retraction biased** — scapulae held apart, ROM capped at the body line, arms near-straight, horizontal plane at shoulder height, neutral vertical handles, open thumbless grip, chest-supported
**What this exercise is NOT:** not a face pull · not a rear-delt row · not a bent-over dumbbell reverse fly · not a cable reverse fly · not a scapular-retraction exercise · not the chest-fly configuration of the same machine
**Confidence limitations:** both clips are third-party on two different units; Tavor's own machine is unidentified. Divergence inferred from swing-arm geometry; arm linkage and cam curve unknown.

---

# FINAL BATCH EXERCISE 4 / GLOBAL CATALOG EXERCISE 26 — Cable Wrist Curl (Straight Bar)

## A. Identification
**App name after audit:** `כפיפות שורש כף יד בכבל עם מוט ישר` (unchanged)
**Previous app name:** `אמות — סטריט בר בכבל` — renamed in migration 3
**Exercise ID / key:** `forearm-straight-bar`
**Hebrew standardized name:** כפיפות שורש כף יד בכבל עם מוט ישר, אחיזה עילית-הפוכה (סופינציה), פולי גבוה
**English standardized name:** **Standing Two-Hand Cable Wrist Curl with a short straight bar, SUPINATED grip, from a HIGH pulley — wrist FLEXION**
**Alternative/common names:** Cable Wrist Curl · Straight-Bar Cable Wrist Curl
**Exercise category:** wrist flexion (single-joint)
**Equipment:** cable tower + short straight bar attachment, selectorized stack.
**New record created by split:** no — **and a split was formally considered and rejected; see section H.**

## B. Starting Position
**Body orientation:** standing beside the cable tower.
**Torso angle:** upright, vertical.
**Back support/position:** unsupported.
**Shoulder position:** neutral, upper arms held close to the torso.
**Elbow position:** **flexed to roughly 90–120° and held completely fixed**, with the hands up at about chin height in the segment demonstrated. App cue 1: only the wrist moves.
**Hip position:** neutral. **Knee position:** soft. **Foot position:** stable, roughly shoulder-width.

## C. Grip / Contact
**Grip type:** **supinated (palms up)** — this is the single fact that makes it a flexor exercise.
**Grip width:** roughly shoulder-width on a short bar.
**Hand position:** the fingers are deliberately allowed to **open at the bottom so the bar rolls to the fingertips**, then rolled back up — app cue 2, which extends the movement beyond wrist flexion into finger flexion.
**Handle/bar/attachment:** short straight bar on a cable.
**Other body contact points:** none in the standing version. The routine also demonstrates a seated variant with the forearm braced on the thigh.

## D. Movement
**Start position:** wrists extended, bar rolled toward the fingertips, forearm flexors lengthened.
**End position:** wrists fully flexed, bar curled toward the forearms.
**Main joint actions:** **wrist flexion**, plus finger flexion during the roll-out.
**Movement path:** the bar arcs a short distance around the wrist joint.
**Elbow path:** none — fixed.
**Shoulder path:** none.
**Scapular behavior:** N/A.
**Hip/knee behavior:** N/A.
**Wrist/forearm behavior:** this is the entire exercise — wrist flexion/extension through a full range, with the forearm held in supination.

## E. Resistance Mechanics
**Resistance source:** cable, selectorized stack.
**Direction of resistance:** along the cable toward the pulley, resisting wrist flexion.
**Cable direction:** **HIGH pulley** — the cable descends from an upper carriage to hands held at about chin height. Verified at full resolution. This is an unusual arrangement and keeps constant tension across the whole (very short) wrist range.
**Machine path:** N/A — free on the cable.
**Resistance relative to body:** the line of pull opposes wrist flexion directly; being a cable rather than a dumbbell, tension does not fall off at the ends of the range.

## F. Range of Motion
**Approximate ROM:** full wrist extension with the bar at the fingertips → full wrist flexion.
**Deep stretch position:** wrist extended, fingers open, bar rolled to the fingertips.
**Peak contraction position:** wrist fully flexed.
**Full / partial / intentionally restricted:** full, and **deliberately extended** by the finger roll-out.
**Any ROM-specific coaching:** app cue 3 — full range, slow.

## G. Execution Details
**Unilateral / bilateral:** bilateral in the named segment (both hands on one bar).
**Alternating / simultaneous:** simultaneous.
**Open / closed kinetic chain:** open.
**Tempo:** slow, per app cue 3.
**Pause:** none prescribed.
**Special technique:** elbows completely fixed · supinated grip · finger roll-out at the bottom · slow full range.
**Stability requirements:** low.

## H. CRITICAL VARIATION DETAILS
**WHAT EXACTLY DISTINGUISHES THIS EXERCISE FROM SIMILAR VARIATIONS?**
- **Supinated grip = wrist FLEXION.** The antagonist exercise (pronated = wrist extension) is a different muscle group entirely, and both appear in the attached clip as separately titled exercises.
- **HIGH pulley, hands at chin height** — not the common low-pulley or forearms-on-bench setup.
- **Cable, not dumbbell** → tension maintained at both ends of a very short range.
- **Finger roll-out** extends the exercise beyond pure wrist flexion into finger flexion.
- **Elbow completely fixed** — the movement is wrist-only, not elbow-driven. This is what separates it from the reverse EZ-bar curl that appears in the same clip.

### SPLIT ANALYSIS — formally considered and rejected
Clip 01 contains **three separately titled exercises**:
| Segment | On-screen title | Joint action | Grip | Cable |
|---|---|---|---|---|
| 1 | "Straight bar cable wrist curl — **Targets the flexors**" | wrist **flexion** | supinated, two hands | **high** pulley |
| 2 | "Reverse EZ Bar curls — **Targets the brachioradialis**" | **elbow flexion** | pronated, two hands, EZ bar | low pulley |
| 3 | "Single arm reverse cable wrist curl — **Targets the extensors**" | wrist **extension** | pronated, one hand | **low** pulley |

Wrist flexion and wrist extension are genuinely antagonist exercises, and you listed that pair as a justified split. **I nonetheless did not split, for three reasons:**
1. **No program evidence for separate slots.** The forearms block contains exactly **two** items — `forearm-straight-bar` and `forearm-dumbbell`. Both records' own text already claims both directions (`forearm-straight-bar`'s `subTarget` is "אמות — כופפים ופושטים"; `forearm-dumbbell`'s cue 3 says to also do the reverse direction). Splitting both would create four records where Tavor trains two slots.
2. **The clips are routine compilations, not mis-assignments.** Segment 1 matches the record's name exactly; segments 2–3 are additional content from the same creator's forearm routine. Nothing is mis-filed.
3. **A split would be based on the videos' content rather than on evidence about Tavor's training.** That is the line your own instructions draw.
**Logged for your decision under MANUAL REVIEW.** In the meantime the segment breakdown above gives the research model everything it needs to analyze flexion and extension separately without the catalog being fragmented.

**WHAT THIS EXERCISE IS NOT:**
Not a reverse/pronated wrist curl (that is the opposite muscle group and appears as a separate titled segment in the same clip). Not a reverse curl — that is elbow flexion, not wrist. Not a dumbbell wrist curl. Not a hammer curl. Not a barbell forearms-on-bench wrist curl. Not a wrist roller. Not a low-pulley wrist curl.

## I. Confidence
**HIGH CONFIDENCE:** cable + short straight bar; **supinated grip**; **wrist flexion**; elbows completely fixed; wrist-only motion; finger roll-out used; the named exercise appears in clip 01 with an on-screen title matching the record exactly; the clip also contains two other, separately titled exercises.
**HIGH CONFIDENCE:** the demonstrated segment uses a **high pulley** with the hands at chin height — read at full resolution.
**MODERATE CONFIDENCE:** that Tavor uses the same high-pulley setup; the clips are third-party and the folder name says only "straight bar cable".
**LOW CONFIDENCE:** whether Tavor performs it standing (as demonstrated) or seated with the forearms braced.
**UNKNOWN:** the load — `seedWeightKg` is `null`; tempo; reps; whether he trains the extensor direction on the same station or only via `forearm-dumbbell`.

## J. FINAL APP DATA
**Hebrew name:** כפיפות שורש כף יד בכבל עם מוט ישר · **English name:** Cable Wrist Curl (Straight Bar) · **ID:** `forearm-straight-bar`
**muscleGroup:** `forearms` · **subTarget:** אמות — כופפים ופושטים · **secondary:** `[]`
**equipment:** `cables`
**cues:** 1) רק שורש כף היד נע, המרפק קבוע 2) לפתוח את האצבעות בתחתית ולגלגל חזרה 3) טווח מלא, איטי
**videos:** `videos/forearm-straight-bar-01.mp4` (14.5 s), `videos/forearm-straight-bar-02.mp4` (25.3 s)
**posters:** `videos/forearm-straight-bar-01.jpg`, `-02.jpg`
**weight metadata:** `weightMode: 'total'`, `weightIncrementKg: 5`, `usesPlates: false`, `barWeightKg: null`, `seedWeightKg: null`, `targetReps: 12–20`
**libraryId:** none — documented reason: the library's only forearm record is a reverse wrist curl, the opposite movement
**programs containing exercise:** **forearms block** (position 0)

## K. CORRECTIONS MADE
**No changes required.** Name, equipment and all three cues match clip 01's titled segment. The split was formally evaluated and rejected with reasons recorded above.

## L. VIDEO-BY-VIDEO VERIFICATION
| Video | Actual Exercise Shown | Key Biomechanics | Final Assignment | Confidence |
|---|---|---|---|---|
| `forearm-straight-bar-01.mp4` | **Three titled exercises** — see the split-analysis table in section H | Segment 1 (the record): standing, **high** pulley, short straight bar, **supinated**, elbows fixed and flexed ~90–120°, hands at chin height, wrist-only motion. Segment 2: cable EZ bar, pronated, **elbow** flexion. Segment 3: **low** pulley, single arm, pronated, wrist **extension**, free hand bracing the working forearm | `forearm-straight-bar` — segment 1 is the record; 2–3 are additional routine content | HIGH |
| `forearm-straight-bar-02.mp4` | Single-arm cable forearm routine with colour-coded forearm anatomy | Standing single-arm wrist flexion; seated single-arm wrist curl with the forearm braced on the thigh; standing single-arm wrist extension. Small single handle throughout, elbow fixed, wrist-only motion, directional arrows marking flexion vs extension | `forearm-straight-bar` — same movement family, routine content | HIGH for content; MODERATE that it reflects Tavor's setup |

## BIOMECHANICAL HANDOFF
**Final exercise name:** Standing Two-Hand Cable Wrist Curl (short straight bar, supinated, high pulley)
**Equipment:** cable tower, selectorized stack, short straight bar
**Body orientation:** standing, upright, beside the tower
**Torso angle:** vertical
**Bench/body angle:** N/A (a seated forearm-on-thigh variant also appears in the routine)
**Grip:** **supinated (palms up)** — this is what makes it wrist FLEXION
**Grip width:** ~shoulder-width on a short bar
**Shoulder position:** neutral, upper arms close to the torso, static
**Elbow path:** none — **fixed at ~90–120° flexion**
**Scapular motion:** none
**Wrist/forearm action:** **wrist flexion through a full range, plus finger flexion via a deliberate roll-out at the bottom**; forearm held supinated throughout
**Hip position:** neutral, static · **Knee position:** soft, static · **Foot position:** shoulder-width, stable
**Cable/resistance direction:** downward along the cable from a **HIGH pulley**, resisting wrist flexion
**ROM:** full wrist extension with the bar at the fingertips → full wrist flexion; deliberately extended by the roll-out
**Machine mechanics:** cable — tension maintained at both ends of a very short range, unlike a free weight
**Unilateral/bilateral:** bilateral on one bar
**Support:** none in the standing version
**Primary movement pattern:** single-joint wrist flexion
**Critical variation details:** supinated grip · high pulley, hands at chin height · elbow completely fixed · cable rather than dumbbell · finger roll-out extends the range · slow full ROM
**What this exercise is NOT:** not a reverse/pronated wrist curl (a separate titled segment in the same clip) · not a reverse curl (elbow flexion) · not a dumbbell wrist curl · not a hammer curl · not a low-pulley wrist curl
**Confidence limitations:** both clips are multi-exercise third-party routines; whether Tavor uses this pulley height, stands or sits, and whether he trains the extensor direction here are all unestablished.

---

# FINAL BATCH EXERCISE 5 / GLOBAL CATALOG EXERCISE 27 — Dumbbell Wrist Curl

## A. Identification
**App name after audit:** `כפיפות שורש כף יד עם דאמבלים` (unchanged)
**Previous app name:** `אמות — דאמבלים` — renamed in migration 3
**Exercise ID / key:** `forearm-dumbbell`
**Hebrew standardized name:** כפיפות ופשיטות שורש כף יד עם דאמבלים, אמות נשענות
**English standardized name:** **Braced Dumbbell Wrist Curl — wrist FLEXION and wrist EXTENSION, forearms supported on the thighs or a bench** — *the record is real; the attached clip shows a different exercise.*
**Alternative/common names:** Dumbbell Wrist Curl · Seated Wrist Curl · Wrist Flexion/Extension
**Exercise category:** wrist flexion **and** wrist extension (single-joint)
**Equipment:** dumbbells + a bench or the thighs as a brace.
**New record created by split:** no.

## B–G. Position, grip, movement, mechanics, ROM, execution
**⚠️ The attached video does NOT show this exercise.** Re-verified at full resolution this pass.
From the record itself (**inference, not observation**):
- **Seated**, torso hinged forward, **forearms braced on the thighs or a bench** (cue 1), wrists past the edge so the joint can move freely.
- A dumbbell in each hand; elbow and shoulder do not move.
- **Full stretch at the bottom** (cue 2) — the wrist extends fully before curling.
- **Both directions are trained:** cue 3 explicitly says to also do the reverse direction for the extensors. So the record covers **supinated wrist flexion and pronated wrist extension** as one entry.
- Resistance: gravity on the dumbbell → tension peaks in the mid-range and **falls off at both ends** — the opposite profile from the cable version in `forearm-straight-bar`.
Everything else — grip width, bench height, one arm vs two, tempo, exact ROM: **UNKNOWN.**

### Exact joint action of what the clip actually shows
Answering your section 10 instruction not to call every dumbbell movement a "forearm curl" — the clip contains **no wrist movement at all**. It shows **elbow flexion** in two setups:
| Variant in the clip | Body position | Shoulder position | Joint action |
|---|---|---|---|
| Prone / chest-supported incline curl | lying **face-down** over an incline bench, arms hanging | shoulder **flexed** (arms in front of the torso line) | elbow flexion, supinated grip |
| Supine incline curl | lying **back** on an incline bench (~45–55°), arms hanging behind the torso | shoulder **extended** (arms behind the torso line) | elbow flexion, supinated grip |
Anatomy overlays in the clip colour the **upper arm**, not the forearm. There is **no radial/ulnar deviation, no pronation/supination drill and no wrist curl** anywhere in it.

## H. CRITICAL VARIATION DETAILS
**WHAT EXACTLY DISTINGUISHES THIS EXERCISE FROM SIMILAR VARIATIONS?**
- It is the **free-weight** forearm exercise, **braced against a fixed surface**, which removes all elbow and shoulder contribution.
- The record **deliberately covers both directions** — flexion and extension — unlike `forearm-straight-bar`, whose name covers only flexion.
- **Gravity-based resistance curve**: tension peaks mid-range and disappears at the ends, the opposite of the cable version.

**WHAT THIS EXERCISE IS NOT:**
Not a cable wrist curl. Not a barbell wrist curl. Not a reverse curl (elbow flexion). Not a wrist roller. Not radial or ulnar deviation. Not a pronation/supination drill. **And not a biceps curl of any kind — despite what the attached video shows.**

## I. Confidence
**HIGH CONFIDENCE:** the record is a braced dumbbell wrist curl covering both flexion and extension; **the attached clip shows a different exercise**.
**HIGH CONFIDENCE (about the clip's content):** dumbbell **biceps curls on an incline bench**, in the two variants tabulated above, with upper-arm anatomy overlays and zero wrist movement.
**MODERATE CONFIDENCE:** that the forearms rest on the thighs rather than a bench — cue 1 permits either.
**LOW CONFIDENCE / UNKNOWN:** grip, ROM, tempo, load (`seedWeightKg` is `null`), one arm vs two, and how much of the extension direction he actually does. **No valid footage exists.**

## J. FINAL APP DATA
**Hebrew name:** כפיפות שורש כף יד עם דאמבלים · **English name:** Dumbbell Wrist Curl · **ID:** `forearm-dumbbell`
**muscleGroup:** `forearms` · **subTarget:** אמות · **secondary:** `[]`
**equipment:** `freeWeights`
**cues:** 1) אמות נשענות על הברכיים או על ספסל 2) לרדת עד מתיחה מלאה 3) לעשות גם כיוון הפוך לפושטים
**videos:** `videos/forearm-dumbbell-01.mp4` (17.0 s) — **flagged in `VIDEO_MISMATCH`**
**posters:** `videos/forearm-dumbbell-01.jpg`
**weight metadata:** `weightMode: 'total'`, `weightIncrementKg: 2.5`, `usesPlates: false`, `barWeightKg: null`, `seedWeightKg: null`, `targetReps: 12–20`
**libraryId:** none — documented reason: the library's only forearm record is a reverse wrist curl
**programs containing exercise:** **forearms block** (position 1)

## K. CORRECTIONS MADE
**No changes required in this pass.** The mismatch note was already sharpened in batch 4 to name both incline-curl variants. This pass re-verified it at full resolution and confirms the wording is accurate.
**Video assignment:** remains `VIDEO_ASSIGNMENT_REVIEW_REQUIRED` — the clip stays in place with its warning label, because no catalog record fits an incline dumbbell curl (the three biceps records each fix the humerus differently and two are on other equipment), and creating one would add an exercise with no evidence Tavor performs it.

## L. VIDEO-BY-VIDEO VERIFICATION
| Video | Actual Exercise Shown | Key Biomechanics | Final Assignment | Confidence |
|---|---|---|---|---|
| `forearm-dumbbell-01.mp4` | **Incline dumbbell biceps curl**, two variants — prone/chest-supported and supine | Prone: face-down over an incline bench, arms hanging, shoulder flexed, elbow flexion. Supine: lying back on a ~45–55° incline, arms hanging **behind** the torso, shoulder extended, elbow flexion, supinated grip. Upper-arm anatomy overlays. Bench-angle setup arrow. **Zero wrist movement anywhere in the clip** | `forearm-dumbbell` (**unchanged — flagged**) | video content HIGH; assignment knowingly wrong and labelled in-app |

## BIOMECHANICAL HANDOFF
**Final exercise name:** Braced Dumbbell Wrist Curl (flexion **and** extension) — **⚠️ record is real; NO valid footage exists**
**Equipment:** dumbbells, forearms braced on the thighs or a bench
**Body orientation:** seated, torso hinged forward, forearms supported (inferred)
**Torso angle:** seated and hinged forward (inferred, not observed)
**Bench/body angle:** forearms flat on the thighs or a bench, wrists past the edge
**Grip:** supinated for the flexion version, pronated for the extension version
**Grip width:** N/A (one dumbbell per hand)
**Shoulder position:** static, uninvolved
**Elbow path:** none — braced
**Scapular motion:** none
**Wrist/forearm action:** **wrist flexion and, in the reverse direction, wrist extension** — the record deliberately covers both
**Hip position:** seated (inferred) · **Knee position:** ~90° (inferred) · **Foot position:** flat (inferred)
**Cable/resistance direction:** vertical (gravity); tension peaks mid-range and **falls off at both ends**
**ROM:** full wrist extension → full flexion, and the reverse for the extensor version
**Machine mechanics:** none — free weight
**Unilateral/bilateral:** unknown
**Support:** forearms fully braced, removing elbow and shoulder contribution
**Primary movement pattern:** single-joint wrist flexion and wrist extension
**Critical variation details:** braced forearms · free-weight resistance curve unlike the cable version · covers **both** directions in one record
**What this exercise is NOT:** not a cable wrist curl · not a barbell wrist curl · not a reverse curl · not radial/ulnar deviation · not a pronation/supination drill · **not an incline biceps curl** (which is what the attached clip shows)
**Confidence limitations:** ⚠️ **everything above is inferred from the record's own cues — there is no valid footage.** Treat this entry as the weakest in the catalog.

---

# FINAL BATCH EXERCISE 6 / GLOBAL CATALOG EXERCISE 28 — Plank

## A. Identification
**App name after audit:** `פלאנק` (unchanged)
**Previous app name:** `בטן` ("abs") — renamed in migration 3 because the clip is specifically a plank, not general abdominal work
**Exercise ID / key:** `abs` (the ID is a legacy of the old generic name; it carries all the history and was deliberately not migrated)
**Hebrew standardized name:** פלאנק על אמות, אמות מקבילות
**English standardized name:** **Forearm Plank — isometric anti-extension hold, elbows under shoulders, forearms parallel with the hands apart, scapulae protracted**
**Alternative/common names:** Plank · Forearm Plank · Front Plank · Elbow Plank
**Exercise category:** trunk anti-extension isometric
**Equipment:** bodyweight, floor only.
**New record created by split:** no.

## B. Starting Position
**Body orientation:** prone, supported on the forearms and toes.
**Torso angle:** roughly parallel to the floor, one straight line from heel to head.
**Back support/position:** unsupported. The clip's central ❌/✅ pair is a curved **red** line through sagging hips vs a straight **green** line with a yellow up-arrow at the hips.
**Shoulder position:** stacked over the elbows and **actively protracted** — the rear-view frame highlights the upper back with a yellow double arrow: push the floor away rather than letting the chest sink between the shoulder blades.
**Elbow position:** directly under the shoulders, ~90°.
**Hip position:** level. The ✅ shows a small posterior pelvic tilt lifting the hips out of a sag — not a pike.
**Knee position:** straight.
**Foot position:** toes on the floor; foot spacing is marked as a variable with a yellow double arrow between the feet.

## C. Grip / Contact
**Grip type:** N/A — open hands flat on the floor.
**Grip width:** N/A.
**Hand position:** **forearms parallel with the hands apart.** Explicit ❌/✅ pair: hands clasped together (❌, red forearms, inward arrows) vs forearms parallel and hands apart (✅, green, outward arrows).
**Handle/bar/attachment:** none.
**Other body contact points:** forearms and toes — the only two contact points; the exercise is holding the line between them.

## D. Movement
**Start position:** the hold position itself — there is no rep.
**End position:** the same; the exercise is timed.
**Main joint actions:** **none dynamically.** Isometric trunk anti-extension, isometric hip extension, isometric scapular protraction, neutral cervical position.
**Movement path:** none.
**Elbow path:** none. **Shoulder path:** none.
**Scapular behavior:** held protracted, actively pushing the floor away.
**Hip/knee behavior:** held; glutes squeezed to stop the pelvis tipping forward (app cue 3).
**Wrist/forearm behavior:** forearms flat and parallel on the floor; wrists neutral, unloaded.

## E. Resistance Mechanics
**Resistance source:** bodyweight (gravity).
**Direction of resistance:** straight down, pulling the hips toward the floor.
**Cable direction:** N/A. **Machine path:** N/A.
**Resistance relative to body:** gravity acts on the mass between the two contact points, creating a **lumbar extension moment** the trunk must resist. Moving the feet further from the elbows lengthens that lever and increases the demand.

## F. Range of Motion
**Approximate ROM:** none — isometric.
**Deep stretch position:** N/A.
**Peak contraction position:** the entire hold.
**Full / partial / intentionally restricted:** N/A.
**Any ROM-specific coaching:** the target is **time**, not reps — the app stores `metric: 'seconds'` with a closed target of exactly **75 seconds (1:15)**.

## G. Execution Details
**Unilateral / bilateral:** bilateral · **Alternating / simultaneous:** N/A
**Open / closed kinetic chain:** closed
**Tempo:** N/A — a timed hold
**Pause:** the entire exercise is the pause
**Special technique:** elbows under shoulders · forearms parallel, hands apart · scapulae protracted · hips level · glutes and abs braced · neutral neck (a cranked-up head is marked ❌) · normal breathing
**Stability requirements:** the exercise **is** the stability requirement.

## H. CRITICAL VARIATION DETAILS
**WHAT EXACTLY DISTINGUISHES THIS EXERCISE FROM SIMILAR VARIATIONS?**
Answering your section 11 question directly — **this is neither spinal flexion nor hip flexion. There is no joint movement at all.** It is a **static anti-extension hold**, which is a fundamentally different demand from any of the dynamic abdominal exercises on your list.
- **Forearm plank, not a straight-arm/high plank** — the elbows are the contact point, which shortens the lever at the shoulder.
- **Forearms parallel with the hands apart**, not clasped — changes shoulder rotation and the width of the base.
- **Active scapular protraction**, not a passive sag between the shoulder blades.
- **Neutral neck**, not extended.
- **Hips level** — no sag, no pike.
- **Scored on time against a fixed 75-second target**, so it is a submaximal endurance hold, not a maximal-tension test.
- **Foot spacing is a deliberate variable** affecting base width and difficulty.

**WHAT THIS EXERCISE IS NOT:**
Not a crunch. Not a machine crunch. Not a cable crunch. Not a reverse crunch. Not a leg raise or hanging leg raise. Not a decline crunch. Not a sit-up. Not an ab wheel rollout. Not a side plank. Not an RKC (maximal-tension) plank. Not a straight-arm/high plank. Not a rotational or oblique movement. Not weighted. **And specifically: no spinal flexion and no hip flexion occur.**

## I. Confidence
**HIGH CONFIDENCE:** forearm plank; elbows under shoulders; forearms parallel with hands apart (explicit ❌/✅); hips level with no sag; scapular protraction taught; neutral neck taught; feet apart for stability; bodyweight only; isometric; timed rather than counted; **no spinal or hip flexion occurs**.
**MODERATE CONFIDENCE:** the exact foot spacing; and the nuance that the clip's ✅ shows a slight hip elevation while app cue 2 says the pelvis should neither drop nor rise — the arrow is correcting a sag rather than asking for a pike, so I read them as compatible rather than contradictory.
**LOW CONFIDENCE:** none material.
**UNKNOWN:** whether Tavor holds it continuously or in pieces; actual hold times achieved.

## J. FINAL APP DATA
**Hebrew name:** פלאנק · **English name:** Plank · **ID:** `abs`
**muscleGroup:** `abs` · **subTarget:** core — בטן · **secondary:** `[]`
**equipment:** `bodyweight`
**cues:** 1) מרפקים מתחת לכתפיים, אמות על הרצפה 2) גוף בקו ישר מהעקב עד הראש — אגן לא נופל ולא מתרומם 3) בטן ועכוז נעולים, נשימה רגילה 4) מודדים כמה זמן החזקת — לא כמה תנועות עשית
**videos:** `videos/abs-01.mp4` (9.2 s)
**posters:** `videos/abs-01.jpg`
**weight metadata:** `weightMode: 'bodyweight'`, `weightIncrementKg: 0`, `usesPlates: false`, `barWeightKg: null`, `seedWeightKg: null`, **`metric: 'seconds'`**, `targetReps: 75–75` (a closed range — a clock, not a rep target)
**libraryId:** `lib-plank`
**programs containing exercise:** פול באדי א׳ / F1 (position 7); **abs block** (position 0)

## K. CORRECTIONS MADE
**No changes required.** All four cues match the clip, and the `metric: 'seconds'` / 75-second modelling from migration 5 is correct.
*Not changed:* the ID is still `abs`, a legacy of the old generic name. It is the key for all history, personal records, the video manifest and two program references; renaming it would break user data for cosmetic benefit, which your section 16 forbids.

## L. VIDEO-BY-VIDEO VERIFICATION
| Video | Actual Exercise Shown | Key Biomechanics | Final Assignment | Confidence |
|---|---|---|---|---|
| `abs-01.mp4` | Forearm plank — one exercise only, no second variation | Rear view of scapular position with a yellow double arrow (protract, push the floor away); ❌ sagging hips (red curved line) vs ✅ level hips (green line + up arrow); ❌ hands clasped (red forearms, inward arrows) vs ✅ forearms parallel, hands apart (green, outward arrows); foot-spacing double arrow; ❌ head/neck cranked up (red head and neck, yellow arrow) vs ✅ neutral; abdominal-wall anatomy overlay red vs green | `abs` | HIGH |

## BIOMECHANICAL HANDOFF
**Final exercise name:** Forearm Plank (isometric anti-extension, 75-second target)
**Equipment:** bodyweight, floor
**Body orientation:** prone, supported on forearms and toes
**Torso angle:** roughly horizontal; straight line heel → hip → shoulder → head
**Bench/body angle:** N/A
**Grip:** N/A — open hands flat, **forearms parallel with the hands apart (not clasped)**
**Grip width:** N/A
**Shoulder position:** stacked directly over the elbows, **actively protracted**
**Elbow path:** none — isometric, ~90°
**Scapular motion:** held in protraction; not allowed to sag between the blades
**Wrist/forearm action:** forearms flat and parallel on the floor; wrists neutral and unloaded
**Hip position:** level, glutes braced, small posterior tilt out of any sag
**Knee position:** straight
**Foot position:** toes down, feet apart — spacing is a deliberate variable setting base width
**Cable/resistance direction:** vertical (gravity), creating a **lumbar extension moment** the trunk resists
**ROM:** none — isometric hold
**Machine mechanics:** none
**Unilateral/bilateral:** bilateral
**Support:** two contact points only — forearms and toes
**Primary movement pattern:** **trunk anti-extension isometric — no spinal flexion, no hip flexion, no joint movement at all**
**Critical variation details:** forearm (not straight-arm) plank · forearms parallel, hands apart · active scapular protraction · hips level, no sag and no pike · neutral neck · **timed to a fixed 75 s target, not counted in reps**
**What this exercise is NOT:** not a crunch, machine crunch, cable crunch, reverse crunch, leg raise, hanging leg raise, decline crunch, sit-up or ab wheel · not a side plank · not an RKC max-tension plank · not a straight-arm plank · not rotational · not weighted
**Confidence limitations:** foot spacing not measurable; whether the hold is continuous is unknown.

---

# NEW EXERCISES CREATED

| Exercise | Hebrew | English | ID | Origin | Videos | Reason |
|---|---|---|---|---|---|---|
| — | — | — | — | — | — | **No new exercises created in this pass.** |

---

# VIDEOS MOVED

| Video | From | To | Reason | Confidence |
|---|---|---|---|---|
| — | — | — | **No videos moved in this pass.** | — |

---

# EXERCISES SPLIT

| Original | New Records | Reason | Program Mapping |
|---|---|---|---|
| — | — | **No exercises split in this pass.** | — |

One split was formally evaluated — `forearm-straight-bar` (wrist flexion vs wrist extension) — and rejected. Full reasoning in FINAL BATCH EXERCISE 4, section H.

---

# CATALOG CHANGES SUMMARY

| Exercise | Action | Before | After | Confidence |
|---|---|---|---|---|
| `lateral-raise` | verified; **prior report corrected** | batch 4 asserted "humerus in the scapular plane" | plane downgraded to **UNKNOWN**; elbow bend at the top refined to **~90°**; torso confirmed vertical; bilateral confirmed | — |
| `shrugs` | verified — batch 4's fix confirmed against the clip | — | no further change; taxonomy pinned as an **incline/leaning shrug with a retraction component** | — |
| `reverse-machine-fly` | verified; **machine identified** | machine class unstated | **"Rear Delt / Pec Fly" dual-function pec deck** (placard read); arms **near-straight**; ~90° horizontal abduction at shoulder height; **rear-delt biased, not mid-back biased** | — |
| `forearm-straight-bar` | verified; split evaluated and rejected | segments described loosely | three titled segments pinned with **pulley heights and grips**; **high** pulley for flexion, **low** for extension | — |
| `forearm-dumbbell` | verified | — | exact joint actions of the clip's two incline-curl variants tabulated | — |
| `abs` | verified | — | **explicitly established: no spinal flexion, no hip flexion — pure isometric anti-extension** | — |

**No code changes were made in this pass.** Everything fixable in these six was already applied in batch 4 (the `shrugs` cue, `CATALOG_FIXES_V11`, migration 11, `migration11.test.ts`).

---

# MANUAL REVIEW REQUIRED

| Exercise | Issue | Why uncertain | Recommended manual check |
|---|---|---|---|
| `lateral-raise` | **Humeral plane UNKNOWN** — frontal vs scapular cannot be read from a pure side-profile clip | It is the one camera angle from which the plane is invisible. Batch 4's "scapular plane" claim is withdrawn. | If the plane matters to the downstream analysis, film 3 seconds from the front or at 45°. |
| `lateral-raise` | Cue 3 (`הטיה קלה קדימה, כמו למזוג מים`) could be misread as a **torso** lean; the clip shows a strictly vertical torso | The Hebrew idiom anchors it to the dumbbell, so the cue is not wrong — only ambiguous. Changing it would mean a twelfth migration for a wording preference. | Optional one-line tweak, e.g. `להטות את הדאמבל קדימה כמו למזוג מים — הגוף נשאר זקוף`. Say the word and I'll ship it with a migration. |
| `shrugs`, `hammer-curl` | `weightMode: 'total'` while `lateral-raise` — the other bilateral dumbbell exercise — is `'perSide'` | Your source list writes "12.5 kg per hand" for the lateral raise but plain "20 kg" / "17.5 kg" for the shrug and hammer curl, so the difference may be deliberate. A change would halve or double historical volume. | Decide what the logged number means for each: one dumbbell (→ `perSide`) or a combined figure (→ keep `total`). |
| `forearm-straight-bar` | **Split decision deferred to you** — the clip contains wrist flexion, wrist extension and a reverse curl as separately titled exercises | Splitting would create four forearm records where the forearms block has two slots, based on video content rather than evidence about your training. | Tell me whether you train wrist flexion and extension as separate logged exercises. If yes, I'll split with a migration. |
| `forearm-straight-bar` | Demonstrated setup uses a **high pulley** with the hands at chin height — an unusual arrangement | The clips are third-party; your folder name says only "straight bar cable". | Confirm your own pulley height and whether you stand or sit. |
| `forearm-dumbbell` | `VIDEO_ASSIGNMENT_REVIEW_REQUIRED` — the clip is an incline dumbbell **biceps** curl (two variants), with zero wrist movement | No catalog record fits an incline dumbbell curl, and creating one would add an exercise you may not perform. This is the weakest-evidence record in the catalog. | Replace the clip with real footage, or confirm you want an incline-curl record created. |
| `incline-barbell-bench-press` | `PROGRAM_MAPPING_REVIEW_REQUIRED` — carried over from batch 2 | אימון A (position 1) and F2 (position 2) both still point at the **flat** record; your source document lists A01 as one slot covering both angles. | Decide whether those slots stay flat, move to incline, or hold both. |
| `reverse-machine-fly`, `forearm-straight-bar`, `forearm-dumbbell`, `abs` | `seedWeightKg: null` on four records | Legitimate for bodyweight (`abs`) and for "whatever's on the machine", but the app has no starting suggestion until a set is logged. | Optional — add a starting weight if you want the first session pre-filled. |
| `leg-curl` / `leg-extension` | Your source document `הנחיה-לתיקון-שמות.md` still contains a **wrong** "mandatory" instruction to swap these two videos | Disproved in batch 3 by the machine placards visible in both clips. The document is outside this repo, so I did not edit it. | Delete or correct section "תיקוני וידאו #1" so a future pass does not act on it. |

---

# VIDEO MISMATCHES STILL OPEN

| Current Exercise | Video | Actual Content | Why Not Moved |
|---|---|---|---|
| `seated-row-light` | `seated-row-light-01.mp4` | Single-arm **underhand plate-loaded machine lat pulldown** (vertical pull) | No correct home exists. `lat-pulldown` is a bilateral wide-pronated **cable** pulldown — three variation differences away. Creating a record would add an exercise with no evidence it is trained. |
| `forearm-dumbbell` | `forearm-dumbbell-01.mp4` | **Incline dumbbell biceps curl**, prone and supine variants, zero wrist movement | No catalog record fits an incline dumbbell curl; the three biceps records each fix the humerus differently and two are on other equipment. |

Both remain visible with their in-app warning label, per the project's stated policy that a labelled wrong clip beats no clip until a replacement exists.

---

# FINAL FULL-CATALOG STATUS

| Metric | Value |
|---|---|
| **Total exercise records** | **29** |
| **Total unique IDs** | **29** (no duplicates; orders 0–28 contiguous) |
| **Total videos** | **34 clips** across 25 records |
| **Exercises with valid videos** | **23** |
| **Exercises with no videos** | **4** — `decline-pec-fly`, `bench-machine-press`, `behind-body-cable-curl`, `machine-squat` |
| **Exercises with open video mismatches** | **2** — `seated-row-light`, `forearm-dumbbell` |
| **Exercises with manual-review flags** | **9** — `lateral-raise`, `shrugs`, `hammer-curl`, `forearm-straight-bar`, `forearm-dumbbell`, `incline-barbell-bench-press`, `reverse-machine-fly`, `abs`, plus the out-of-repo `leg-curl`/`leg-extension` document issue |
| **Library links** | 16 linked · 13 documented as deliberately unlinked |
| **New exercises created during ALL audits** | **1** — `incline-barbell-bench-press`, from splitting `db-bench-press` (batch 2) |
| **Broken references** | 0 |
| **Orphaned videos / manifest orphans** | 0 |
| **Migrations** | up to `version(11)`; `migration10.test.ts` (6 tests) and `migration11.test.ts` (3 tests) |
| **Any remaining unaudited records** | **None** |

## IS THE ENTIRE EXERCISE CATALOG NOW AUDITED?

# YES

All 29 records have been through a full identification + biomechanical audit, and every one has a BIOMECHANICAL HANDOFF block across reports 01–05. Four records rest on metadata alone because no footage exists (`decline-pec-fly`, `bench-machine-press`, `behind-body-cable-curl`, `machine-squat`), and two carry a clip of a different exercise (`seated-row-light`, `forearm-dumbbell`) — all six are flagged, none is silently presented as verified.

---

# FINAL CHECKLIST

- [x] **Every remaining unaudited exercise was reviewed** — and the state check found there were none left; batch 4 had already covered all six. This pass re-verified them in depth against your sections 6–11.
- [x] **No already-audited record was unnecessarily re-audited** — the six were re-examined only because your new questions targeted details the earlier pass did not resolve, and one earlier claim needed correcting.
- [x] **Correct global numbering reported** — 23, 24, 25, 26, 27, 28, all determinable from `src/db/seed.ts` order.
- [x] **Every available video visually analyzed** — 8 clips at 1080×1920, up to 4 fps, with targeted full-resolution crops.
- [x] **Burned-in captions read** — "HOW TO SHOULDER SHRUG" / "LEAN FORWARD" / "SHOULDERS DOWN" / "SQUEEZE UP & BACK" / "DON'T DO THIS."; "Straight bar cable wrist curl — Targets the flexors"; "Reverse EZ Bar curls — Targets the brachioradialis"; "Single arm reverse cable wrist curl — Targets the extensors".
- [x] **Relevant machine placards inspected** — **"Rear Delt / Pec Fly"** read on the Precor unit in `reverse-machine-fly-01.mp4` and on the second unit in clip 02.
- [x] **Every meaningful variation mismatch documented** — `forearm-straight-bar`'s three titled segments and `forearm-dumbbell`'s two incline-curl variants, each with joint actions tabulated.
- [x] **Biomechanically distinct exercises split only when justified** — one split formally evaluated and rejected with recorded reasoning.
- [x] **High-confidence catalog errors actually fixed** — the one error in these six (the `shrugs` cue) was found and fixed in batch 4 with a migration; this pass confirmed the fix against the clip.
- [x] **Low-confidence assumptions NOT written as facts** — and one earlier assumption (lateral raise humeral plane) was actively **withdrawn** and marked UNKNOWN.
- [x] **No unnecessary new exercises created** to house unrelated third-party videos.
- [x] **All program references still resolve** — 0 broken refs.
- [x] **No duplicate IDs** — 29 records, 29 unique IDs.
- [x] **No orphaned media created** — 0 manifest orphans; 34 clips unchanged.
- [x] **No broken media references** — every `src` and `poster` exists on disk (`manifests.test.ts`).
- [x] **Migrations remain valid** — through `version(11)`, all guarded against user-edited records.
- [x] **Typecheck passes** — `tsc --noEmit -p tsconfig.app.json` clean.
- [x] **Relevant tests pass** — `vitest run`: **525 passed / 42 files**.
- [x] **Build passes** — `npm run build` succeeds; `oxlint` reports only one pre-existing unrelated warning.
- [x] **BIOMECHANICAL HANDOFF exists for every exercise in this final batch** — all six.
- [x] **The report explicitly states whether the entire catalog is now fully audited** — **YES**, see FINAL FULL-CATALOG STATUS.
