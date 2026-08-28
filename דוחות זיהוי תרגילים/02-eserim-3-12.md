# Exercise Identification & Catalog Correction — Batch 2 (exercises 3–12)

Project: tavor-gym. Videos **were** analyzed visually (frames extracted with ffmpeg from the 1080×1920 *source* files, not the compressed 406×720 app copies; burned-in captions transcribed).
Batch: the next 10 catalog records after `db-bench-press` and `dips`, in catalog order — this completes Day A and starts Day B.

## Two global facts that apply to every record below
1. **`targetSets` and `defaultRestSeconds` in the seed are documentation only.** `SEED_EXERCISES` overwrites both with the global defaults (`DEFAULT_TARGET_SETS = 2`, `DEFAULT_REST_SECONDS = 120`). Effective values for *every* exercise are **2 sets / 120 s rest**. Only `targetReps` is per-record.
2. **Most demo videos are third-party instructional clips**, not footage of Tavor's own machines. They establish the *movement pattern and technique*, not the exact machine in his gym. Where that matters it is flagged per exercise.

---

# EXERCISE 1 — Push-Up

## A. Identification
**App name after correction:** `שכיבות סמיכה` (unchanged)
**Previous app name:** `שכיבות סמיכה — חימום` → `שכיבות סמיכה (חימום)` (v3) → `שכיבות סמיכה` (v5). Already correct before this pass.
**Exercise ID / key:** `pushup`
**Best standardized English name:** **Standard Bodyweight Push-Up (hands ~shoulder-width, elbows ~45°)**
**Alternative/common names:** Push-Up · Press-Up · Floor Push-Up
**Exercise category:** horizontal press, closed kinetic chain, bodyweight
**Equipment:** bodyweight only. No bench, no deficit, no handles, floor only.

## B. Starting Position
**Body orientation:** prone plank support, face down, arms extended.
**Torso angle:** rigid straight line from heel → hip → shoulder → head, roughly parallel to the floor. The video's entire first section is ❌ hips sagging / lumbar hyperextension vs ✅ straight green line.
**Back position/support:** unsupported; neutral spine, braced abs and glutes.
**Shoulder position:** stacked over/slightly behind the wrists, scapulae not winging.
**Elbow position:** extended at the start; during the rep ~45° from the torso — never 90° flared.
**Hip position:** neutral, in line with the torso; not piked, not dropped.
**Knee position:** straight, legs together or hip-width.
**Foot position:** toes on the floor, hip-width or narrower.

## C. Grip / Contact Position
**Grip type:** N/A — open palm on the floor, pronated forearm.
**Grip width:** hands about shoulder-width to slightly wider. Video explicitly marks hands placed *too far forward* (ahead of the shoulder line) as ❌ with a vertical reference line.
**Hand position:** wrist directly under the shoulder at the bottom; fingers spread.
**Handle type:** N/A.
**Other body contact points:** toes. Whole-palm contact is a stated teaching point — ❌ weight through the heel of the hand only vs ✅ the whole spread hand.

## D. Movement
**Starting position of resistance:** body mass held at arm's length above the floor.
**End position:** chest just above the floor.
**Main joint actions:** shoulder horizontal adduction, shoulder flexion, elbow extension; scapular protraction at the top, trunk anti-extension isometric throughout.
**Movement path:** the torso descends vertically; the chest travels toward the floor between the hands.
**Elbow path:** elbows travel back-and-out at ~45° toward the hips — the video's clearest ❌/✅ pair (red line perpendicular to the torso vs green diagonal).
**Shoulder/scapula behavior:** shoulders stay down away from the ears; scapulae move freely (unlike a bench press, the scapula is not pinned).
**Hip/knee path:** none — held rigid.

## E. Resistance Mechanics
**Resistance source:** bodyweight (gravity).
**Direction of resistance:** straight down, constant.
**Cable direction:** N/A. **Machine path:** N/A.
**Resistance relative to the body:** vertical vector against a horizontal torso, so the external moment at the shoulder is largest at the bottom and shrinks toward lockout.

## F. Range of Motion
**Approximate ROM:** full elbow extension → chest almost touching the floor.
**Deep stretch position:** chest at the floor.
**Peak contraction position:** lockout.
**Partial or full ROM:** full, per both the app cue and the video.

## G. Execution Details
**Unilateral or bilateral:** bilateral · **Alternating or simultaneous:** simultaneous
**Open or closed kinetic chain:** **closed** (hands fixed, body moves).
**Tempo shown:** not determinable — edited technique demo.
**Special technique:** rigid braced trunk, elbows ~45°, wrist under shoulder, whole-hand floor contact.

## H. Important Variation Details
Ordinary floor push-up. It is **not** a deficit push-up, not on handles/parallettes, not an incline/decline push-up, not a diamond/close-grip push-up, and not weighted. What distinguishes it from a wide-flared "chest push-up" is the deliberate ~45° elbow angle. The app record labels it as a warm-up movement historically, but the record itself is a plain push-up.

## I. Confidence
**HIGH CONFIDENCE:** bodyweight floor push-up; hands ~shoulder-width; elbows ~45°; full ROM to the floor; closed chain; rigid trunk.
**MODERATE CONFIDENCE:** exact hand width (shoulder-width vs slightly wider — the app cue says "slightly wider", the video's ✅ frames look shoulder-width).
**LOW CONFIDENCE:** none material.
**UNKNOWN:** tempo, reps performed, whether Tavor uses it only as a warm-up in practice.

## J. Raw App Information — AFTER correction
**Description:** no free-text field. `subTarget: "חזה, טריצפס, כתף קדמית"`
**Instructions / cues:** 1) כפות ידיים מעט רחבות מרוחב הכתפיים 2) גוף בקו ישר — בטן ועכוז נעולים 3) מרפקים ב-45 מעלות מהגוף, לא מפושקים לצדדים 4) לרדת עד שהחזה כמעט נוגע ברצפה
**Category:** `muscleGroup: 'chest'`, `equipment: 'bodyweight'`, `weightMode: 'bodyweight'`
**Muscles:** primary `chest`; secondary `['triceps','shoulders','abs']`
**Video assets:** `videos/pushup-01.mp4` (11.8 s) + poster
**Relevant metadata:** `weightIncrementKg: 0`, `targetReps: 10–20`, `usesPlates: false`, `barWeightKg: null`, `seedWeightKg: null`, `libraryId: 'lib-push_up'`
**Programs containing this exercise:** אימון A (position 0). Removed from F1/F2 by migration 5 — warm-up is now derived from the muscle group, not hard-coded into the program.

## K. Corrections Made
None. Record verified correct as-is.

## L. Video Assignment
| Video | What it actually shows | Final exercise assignment | Confidence |
|---|---|---|---|
| `pushup-01.mp4` | Bodyweight floor push-up; ❌/✅ pairs on trunk line, elbow angle, hand placement, whole-palm contact, scapular position | `pushup` | HIGH |

---

# EXERCISE 2 — Machine Chest Press

## A. Identification
**App name after correction:** `לחיצת חזה במכונה` (unchanged)
**Previous app name:** `לחיצה במכונה סיקליין` — "decline" was removed in v3 after checking the original description.
**Exercise ID / key:** `decline-machine-press`
**Best standardized English name:** **Seated Machine Chest Press (horizontal press, back pad reclined ~15–25°, handles at nipple line)**
**Alternative/common names:** Machine Chest Press · Seated Chest Press · Lever Chest Press
**Exercise category:** horizontal press, seated, machine
**Equipment:** seated chest-press machine. Video 01 shows a **KORE** selectorized/lever machine; video 02 shows a **plate-loaded lever** machine (Olympic plate on a loading horn). In Tavor's gym it is loaded **per side** (25 kg/side), i.e. plate-loaded.

## B. Starting Position
**Body orientation:** seated, back against a pad.
**Torso angle:** back pad reclined roughly **15–25° from vertical** — essentially upright, not an incline press and definitely not a decline.
**Back position/support:** fully supported; both videos insist on "sternum up / chest high" and scapulae retracted at the start.
**Shoulder position:** retracted and depressed at the start; video 01 explicitly allows the shoulders to travel **naturally forward** during the press (scapular protraction at lockout) — an unusual and important cue.
**Elbow position:** *neither* tucked to the ribs *nor* flared to 90°. Video 02: "not too close to my body like this, or too flared out like this." Roughly 45–60°, aligned with the machine's force line.
**Hip position:** seated ~90°, glutes back in the seat.
**Knee position:** ~90°. **Foot position:** flat on the floor, roughly shoulder-width.

## C. Grip / Contact Position
**Grip type:** on the KORE machine — vertical **neutral** handles; on the plate-loaded machine — angled/horizontal handles gripped semi-pronated. Both are fixed by the machine.
**Grip width:** "slightly wider than shoulder width" (stated verbatim in video 01).
**Hand position:** wrists **stacked over the forearm the entire time** — stated in both videos.
**Handle type:** fixed machine handles on lever arms.
**Other body contact points:** back pad, seat, floor.

## D. Movement
**Starting position of resistance:** handles beside the chest, elbows behind the torso line, at **nipple height** (both videos make seat height the first setup step).
**End position:** arms extended forward, handles converging slightly toward the midline.
**Main joint actions:** shoulder horizontal adduction, elbow extension, scapular protraction at the end range.
**Movement path:** handles travel forward and slightly inward; on the plate-loaded machine the arc also rises slightly because the lever pivots below and behind.
**Elbow path:** down-and-forward along the machine's force line; the cue is "elbows in the direction of that line of force".
**Shoulder/scapula behavior:** retract to set up, then *allow* protraction as you press. If the shoulders take over, re-retract.
**Hip/knee path:** N/A.

## E. Resistance Mechanics
**Resistance source:** machine lever (video 02 clearly plate-loaded; Tavor's is per-side loaded).
**Direction of resistance:** opposes the forward press — resistance pulls the handles back toward the chest along the lever arc.
**Cable direction:** N/A.
**Machine path:** **fixed arc**, and functionally **converging** — video 01's core cue is "I'm thinking about bringing my biceps together", i.e. the handles close toward the midline. **Linked or independent arms could not be determined** from either clip.
**Resistance relative to the body:** the force line meets the hand roughly horizontally at chest height and is set by the seat height — which is why both videos start with seat adjustment.
**Machine classification:** fixed arc · converging · plate-loaded (Tavor's) · arm linkage UNKNOWN.

## F. Range of Motion
**Approximate ROM:** handles at the chest with elbows behind the torso → full forward extension.
**Deep stretch position:** handles at the chest, elbows back. Video 02 caps it: "you don't want to go too close or too far — right here is good."
**Peak contraction position:** full extension with the handles converged.
**Partial or full ROM:** full, with a capped stretch depth; controlled eccentric ("come down slowly", "I'm controlling that eccentric").

## G. Execution Details
**Unilateral or bilateral:** bilateral · **simultaneous**
**Open or closed kinetic chain:** open (the handles move, the torso is fixed).
**Tempo shown:** not measurable, but explicitly slow eccentric with a pause/squeeze at lockout.
**Special technique:** seat height so handles sit at nipple line · chest up / sternum high · wrists stacked · elbows mid-way between tucked and flared · deliberate scapular protraction at the end range · "creating friction on the handles" (isometric adduction into the handles).

## H. Important Variation Details
This is a **flat/horizontal** seated machine chest press. It is **not** a decline press (the old name), **not** an incline machine press, **not** a Smith machine press, and **not** a free-weight press. Two details separate it from a generic "chest press": the handles are set at **nipple line, not shoulder line**, and the intent is **converging** (squeeze the handles toward each other), not a straight forward push. Elbow angle is deliberately intermediate — neither the tucked triceps-style press nor a 90° flared press.

## I. Confidence
**HIGH CONFIDENCE:** seated machine chest press; horizontal press pattern; seat set so handles are at nipple line; elbows intermediate; wrists stacked; converging intent; capped stretch depth; slow eccentric.
**MODERATE CONFIDENCE:** back-pad recline ~15–25°; that video 02's machine is flat rather than a slight-incline lever press (the lockout arc rises noticeably); Tavor's machine being plate-loaded (inferred from `weightMode: perSide` + `usesPlates: true` + "25 kg per side").
**LOW CONFIDENCE:** whether the machine's arms are independent or linked; whether Tavor's machine is the same type as either video.
**UNKNOWN:** the machine brand/model in Tavor's gym; the lever's resistance curve; tempo/reps.

## J. Raw App Information — AFTER correction
**Description:** `subTarget: "חזה אמצעי-תחתון"`
**Instructions / cues:** 1) לכוון את גובה המושב כך שהידיות בגובה הפטמה 2) לדחוף מהחזה, לא מהכתפיים 3) לעצור רגע בנקודה הקצרה ולסחוט 4) לחזור לאט — 2 שניות בירידה
**Category:** `muscleGroup: 'chest'`, `equipment: 'machine'`
**Muscles:** primary `chest`; secondary `['triceps','shoulders']`
**Video assets:** `videos/decline-machine-press-01.mp4` (94.3 s), `-02.mp4` (47.3 s)
**Relevant metadata:** `weightMode: 'perSide'`, `weightIncrementKg: 2.5`, `targetReps: 8–12`, `usesPlates: true`, `barWeightKg: null`, `seedWeightKg: 25`, `libraryId`: none — documented reason: `lib-machine_chest_press` is the only candidate and **two catalog machines share the same Hebrew name**, so a link would send one of them to the wrong machine.
**Programs containing this exercise:** אימון A (position 2), פול באדי א׳ / F1 (position 2).

## K. Corrections Made
None. All four cues match the videos exactly (they are effectively a Hebrew summary of both clips).

## L. Video Assignment
| Video | What it actually shows | Final exercise assignment | Confidence |
|---|---|---|---|
| `decline-machine-press-01.mp4` | Fully captioned "STOP doing your Machine Chest Presses like this" — KORE seated chest press; seat height at nipple line, grip slightly wider than shoulders, stacked wrists, elbows on the force line, converging squeeze, allow scapular protraction | `decline-machine-press` | HIGH |
| `decline-machine-press-02.mp4` | Captioned "DON'T DO THIS! Machine Chest Press" — plate-loaded seated chest press; seat height, retract shoulders/chest up, distance from the handles, elbows neither tucked nor flared, wrists stacked, squeeze-pause-slow eccentric | `decline-machine-press` | HIGH |

---

# EXERCISE 3 — Decline Machine Pec Fly

## A. Identification
**App name after correction:** `פרפר במכונה בשיפוע שלילי` (unchanged)
**Previous app name:** `פקטורל במכונה שיפוע שלילי` (renamed in v3, cosmetic)
**Exercise ID / key:** `decline-pec-fly`
**Best standardized English name:** **Decline / Low-to-High-Reversed Machine Pec Fly (plate-loaded pec deck at a declined seat angle)** — *name inherited from Tavor's own list, NOT verified against any video.*
**Alternative/common names:** Decline Pec Deck · Machine Chest Fly (decline)
**Exercise category:** shoulder horizontal adduction (single-joint), machine
**Equipment:** plate-loaded pec-deck/fly machine, loaded per side (15 kg/side).

## B–G. Position, movement, mechanics, ROM, execution
**⚠ There is NO video for this exercise.** The source folder `04. פקטורל במכונה שיפוע שלילי` is empty, and Tavor's own verification document marks it `verified: false — אין סרטון, השם משוער בלבד`.
Everything that can be said comes from the record itself and is therefore **inference, not observation**:
- Seated in a pec-deck style machine, back supported, at a declined/downward seat or handle path.
- Contact through fixed handles/pads; elbows held in slight fixed flexion (cue 1: "מרפקים כפופים קלות וקבועים — התנועה מהכתף").
- Single joint: shoulder horizontal adduction only; scapulae held fixed (cue 4).
- Arc: handles open out to a stretch, then close toward the midline with a full-second squeeze (cue 2), returning slowly under control (cue 3).
- Resistance: plate-loaded machine lever, fixed arc. Path direction (high-to-low vs low-to-high) **cannot be established**.
All fields not covered above: **N/A / UNKNOWN — no evidence.**

## H. Important Variation Details
The only thing that distinguishes it in the catalog is the claimed **decline angle**, and that claim is unverified. It is a **fly (single-joint)** and not a press — that much is unambiguous from the name and cues. Whether the "decline" refers to a declined seat back, a downward handle path, or is simply a mis-remembered label is exactly what is open.

## I. Confidence
**HIGH CONFIDENCE:** it is a machine pec fly (single-joint shoulder horizontal adduction), plate-loaded, loaded per side.
**MODERATE CONFIDENCE:** the elbow is held in fixed slight flexion and scapulae are pinned (from the cues).
**LOW CONFIDENCE:** that the angle is genuinely *decline*.
**UNKNOWN:** everything observational — seat/torso angle, handle type and height, arc direction, ROM, machine type, brand. No video exists.

## J. Raw App Information — AFTER correction
**Description:** `subTarget: "חזה"`
**Instructions / cues:** 1) מרפקים כפופים קלות וקבועים — התנועה מהכתף 2) לסחוט את החזה בסוף, שנייה שלמה 3) לפתוח לאט, למתוח בלי לאבד שליטה 4) שכמות נשארות מקובעות
**Category:** `muscleGroup: 'chest'`, `equipment: 'machine'`
**Muscles:** primary `chest`; secondary `[]` (isolation — deliberately empty)
**Video assets:** none
**Relevant metadata:** `weightMode: 'perSide'`, `weightIncrementKg: 2.5`, `targetReps: 10–15`, `usesPlates: true`, `barWeightKg: null`, `seedWeightKg: 15`, `libraryId`: none — documented reason: all 12 chest records in the library are flat or incline; there is no decline content.
**Programs containing this exercise:** אימון A (position 4).

## K. Corrections Made
None — **deliberately**. There is no evidence to correct against, and changing an unverified name on a guess is exactly what the instructions forbid. Logged under ISSUES NOT AUTOMATICALLY FIXED.

## L. Video Assignment
| Video | What it actually shows | Final exercise assignment | Confidence |
|---|---|---|---|
| — | no video exists for this record | — | — |

---

# EXERCISE 4 — Machine Bench Press

## A. Identification
**App name after correction:** `לחיצת חזה במכונה` (unchanged)
**Previous app name:** `לחיצה במכונה בנץ` (renamed in v3, cosmetic)
**Exercise ID / key:** `bench-machine-press`
**Best standardized English name:** **Machine Bench Press — a second, lighter chest-press machine in the same gym** (10 kg/side vs 25 kg/side). *Not verified against any video.*
**Alternative/common names:** Machine Bench Press · Seated Press Machine
**Exercise category:** horizontal press, machine
**Equipment:** plate-loaded press machine, loaded per side (10 kg/side).

## B–G. Position, movement, mechanics, ROM, execution
**⚠ There is NO video for this exercise.** Source folder `05. לחיצה במכונה בנץ` is empty; Tavor's document marks it `verified: false`.
Inference only, from the cues:
- Seated in a fixed-path press machine ("מסלול קבוע"), pressing horizontally.
- Shoulders must not shrug toward the ears (cue 2).
- Full ROM, no half reps (cue 3).
- The machine's fixed path is explicitly treated as a *safety feature* enabling training to failure (cue 1) — which suggests a stable, well-supported machine rather than a free-arm lever.
All other fields: **N/A / UNKNOWN — no evidence.**

## H. Important Variation Details
Its only *documented* difference from `decline-machine-press` is a much lighter per-side load (10 vs 25 kg) and a different original Hebrew label ("בנץ"). **The two records currently share an identical display name in the app**, which is a real UX defect — but resolving it requires knowing which machine this actually is, which nothing in the project records.

## I. Confidence
**HIGH CONFIDENCE:** it is a seated fixed-path machine chest press, plate-loaded per side, and it is a **different machine** from `decline-machine-press` (different load, different original label, and Tavor's document explicitly keeps them separate).
**MODERATE CONFIDENCE:** it is a horizontal (not inclined) press — inferred from the name only.
**LOW CONFIDENCE:** everything about grip, handle type, arc, seat angle.
**UNKNOWN:** the machine's identity, converging/independent arms, ROM, brand. No video exists.

## J. Raw App Information — AFTER correction
**Description:** `subTarget: "חזה"`
**Instructions / cues:** 1) מסלול קבוע — לנצל את זה כדי לדחוף לכשל בבטחה 2) לא להרים את הכתפיים לכיוון האוזניים 3) טווח מלא, בלי חצי חזרות
**Category:** `muscleGroup: 'chest'`, `equipment: 'machine'`
**Muscles:** primary `chest`; secondary `['triceps','shoulders']`
**Video assets:** none
**Relevant metadata:** `weightMode: 'perSide'`, `weightIncrementKg: 2.5`, `targetReps: 10–15`, `usesPlates: true`, `barWeightKg: null`, `seedWeightKg: 10`, `libraryId`: none — documented reason: identical Hebrew name to the other machine press, so linking would send one of them to the wrong machine.
**Programs containing this exercise:** אימון A (position 5).

## K. Corrections Made
None — no evidence to correct against. The duplicate display name is logged under ISSUES NOT AUTOMATICALLY FIXED.

## L. Video Assignment
| Video | What it actually shows | Final exercise assignment | Confidence |
|---|---|---|---|
| — | no video exists for this record | — | — |

---

# EXERCISE 5 — Overhead Cable Triceps Extension

## A. Identification
**App name after correction:** `פשיטת מרפקים מעל הראש בכבל` (unchanged)
**Previous app name:** `יד אחורית עם מוט מעל הראש` — corrected in v3 ("it's a high cable, not a free bar"). The **source folder is still named "Overhead Barbell Triceps Extension"**, which is wrong; the app is right.
**Exercise ID / key:** `overhead-tricep-ext`
**Best standardized English name:** **Standing Bilateral Overhead Cable Triceps Extension, facing away from a high pulley, straight-bar attachment, staggered stance with a hip hinge**
**Alternative/common names:** Overhead Cable Extension · Overhead Rope/Bar Triceps Extension · French Press (cable)
**Exercise category:** elbow extension (single-joint) with the shoulder held in deep flexion
**Equipment:** cable machine / dual adjustable pulley, **pulley set high** (the video's first ❌/✅ pair is exactly the pulley-height setting), straight bar with a rotating swivel.

## B. Starting Position
**Body orientation:** standing, facing **away** from the machine; the cable runs from the high pulley behind and above the head down to the hands in front of the head.
**Torso angle:** hinged forward from the hips, roughly **40–50° from vertical**. The video's ❌ is a more upright torso; ✅ is the deeper hinge. A separate ❌/✅ pair highlights the hip with an arrow — push the hips back.
**Back position/support:** unsupported, neutral spine, braced.
**Shoulder position:** in deep flexion, upper arms alongside the head; the arm is held still.
**Elbow position:** high and fixed beside the head, pointing forward. The rear-view frame adds arrows pushing the elbows **inward** — do not let them flare.
**Hip position:** hinged back (the visual cue).
**Knee position:** soft.
**Foot position:** **staggered stance** — one foot stepped back. This is an explicit ❌/✅ pair with a highlighted shoe and arrow.

## C. Grip / Contact Position
**Grip type:** pronated, both hands on a straight bar.
**Grip width:** approximately shoulder-width.
**Hand position:** overhead in front of/above the head.
**Handle type:** straight bar with a rotating swivel attachment.
**Other body contact points:** none — free standing.

## D. Movement
**Starting position of resistance:** bar up near/behind the head, elbows flexed ~90°+ (the stretched position).
**End position:** elbows extended, bar driven forward-and-down away from the head while the elbows stay high.
**Main joint actions:** elbow extension only; the shoulder is held statically in flexion.
**Movement path:** the forearms rotate around fixed elbows; the bar sweeps from behind/above the head forward and down.
**Elbow path:** none by design — "מרפקים צמודים לראש ולא זזים". The green highlight stays on the elbow in the same spot in both frames.
**Shoulder/scapula behavior:** static; the hinge and staggered stance exist to hold that position under load.
**Hip/knee path:** static.

## E. Resistance Mechanics
**Resistance source:** cable (weight stack).
**Direction of resistance:** pulls the hands back and up toward the high pulley behind the lifter.
**Cable direction:** **high-to-low, from behind and above the head, over the shoulder.** This is the defining feature.
**Machine path:** N/A — cable, so the path is lifter-defined.
**Resistance relative to the body:** the cable line runs roughly along the humerus, which keeps tension on the triceps in the deep-stretch position rather than only at lockout. Stepping away from the machine (cue 3) is what preserves that.
**Machine classification:** cable/selectorized weight stack (not plate-loaded, not a lever).

## F. Range of Motion
**Approximate ROM:** deep elbow flexion behind the head → full extension.
**Deep stretch position:** bar lowest behind the head, shoulder flexed, elbow maximally flexed.
**Peak contraction position:** elbows locked, arms extended forward.
**Partial or full ROM:** full, with an emphasis on the deep stretch (cue 2).

## G. Execution Details
**Unilateral or bilateral:** bilateral · **simultaneous**
**Open or closed kinetic chain:** open.
**Tempo shown:** not determinable.
**Special technique:** high pulley setting · staggered stance · hip hinge with a ~40–50° forward torso · elbows fixed and squeezed inward · step away from the machine to keep tension.

## H. Important Variation Details
This is a **standing, bilateral, straight-bar, facing-away, high-pulley** overhead extension. It is **not** a rope overhead extension, **not** a kneeling or bench-seated version, **not** an EZ-bar or dumbbell overhead extension, and **not** a low-pulley version. The staggered stance and forward hip hinge are not incidental — they are two of the video's five explicit teaching points, and they set the shoulder-flexion angle that defines the exercise.

## I. Confidence
**HIGH CONFIDENCE:** cable (not barbell); pulley set high; facing away from the machine; straight-bar attachment; bilateral; elbows fixed and tucked; staggered stance; forward hip hinge; full ROM with deep stretch.
**MODERATE CONFIDENCE:** torso lean ~40–50° from vertical; grip approximately shoulder-width.
**LOW CONFIDENCE:** whether it is a single high pulley or one side of a dual-pulley/crossover station.
**UNKNOWN:** tempo, reps, exact pulley height setting in Tavor's gym.

## J. Raw App Information — AFTER correction
**Description:** `subTarget: "טריצפס — ראש ארוך"`
**Instructions / cues:** 1) מרפקים צמודים לראש ולא זזים — רק האמות נעות 2) למתוח עמוק מאחורי הראש, שם הראש הארוך עובד 3) להתרחק מהמכונה כדי לשמור מתח לאורך כל הטווח 4) לא לפשק מרפקים החוצה כשמתעייפים
**Category:** `muscleGroup: 'triceps'`, `equipment: 'cables'`
**Muscles:** primary `triceps`; secondary `[]` (isolation)
**Video assets:** `videos/overhead-tricep-ext-01.mp4` (11.9 s)
**Relevant metadata:** `weightMode: 'total'`, `weightIncrementKg: 5`, `targetReps: 10–15`, `usesPlates: false`, `barWeightKg: null`, `seedWeightKg: 52`, `libraryId: 'lib-overhead_triceps_extension'`
**Programs containing this exercise:** אימון A (position 6).

## K. Corrections Made
None. The cues are accurate; the staggered stance and hip hinge are additional detail the cues do not mention but do not contradict.

## L. Video Assignment
| Video | What it actually shows | Final exercise assignment | Confidence |
|---|---|---|---|
| `overhead-tricep-ext-01.mp4` | High-pulley setting ❌/✅, straight-bar grip close-up, staggered stance ❌/✅, hip hinge with arrow, torso-angle ❌/✅, rear view of elbows squeezed in, side views of the full rep | `overhead-tricep-ext` | HIGH |

---

# EXERCISE 6 — Cable Triceps Pushdown (Straight Bar)

## A. Identification
**App name after correction:** `פשיטת מרפקים בפולי עם מוט ישר` (unchanged)
**Previous app name:** `יד אחורית עם מוט בפולי`
**Exercise ID / key:** `cable-tricep-pushdown`
**Best standardized English name:** **Standing Straight-Bar Cable Triceps Pushdown, pronated thumbless grip, slight forward hip hinge**
**Alternative/common names:** Triceps Pushdown · Cable Pressdown · Straight-Bar Pushdown
**Exercise category:** elbow extension (single-joint), cable
**Equipment:** cable station, **high pulley**, short straight bar with a rotating swivel.

## B. Starting Position
**Body orientation:** standing, facing the machine.
**Torso angle:** **leaning forward from the hips, roughly 15–25°.** This is an explicit ❌/✅ pair — the ❌ frame draws a straight red vertical line down an upright back; the ✅ frame shows the forward hinge with the pecs/torso highlighted green.
**Back position/support:** unsupported, neutral spine.
**Shoulder position:** depressed. A separate ❌/✅ pair marks the upper traps in red (shoulders shrugged/rolled forward) vs green with a downward arrow.
**Elbow position:** pinned to the sides of the torso. The rear-view ❌ shows the elbows drifting outward (red lines angled away); the ✅ shows two vertical green lines tight to the ribs.
**Hip position:** hinged slightly back.
**Knee position:** soft. **Foot position:** roughly shoulder-width, both feet even.

## C. Grip / Contact Position
**Grip type:** **pronated, thumbless (false) grip** — the opening ❌/✅ pair is exactly this: red = thumb wrapped under the bar, green = thumb resting on top alongside the fingers.
**Grip width:** approximately shoulder-width on a short bar.
**Hand position:** wrist held straight; a later ❌ frame shows the wrist buckling.
**Handle type:** short straight bar with a rotating swivel.
**Other body contact points:** none.

## D. Movement
**Starting position of resistance:** bar at roughly chest/sternum height, elbows flexed ~90°.
**End position:** bar driven down to full elbow lockout near the thighs.
**Main joint actions:** elbow extension only.
**Movement path:** the bar travels straight down in front of the body in a shallow arc.
**Elbow path:** none — the elbow is the fixed pivot at the side of the torso.
**Shoulder/scapula behavior:** shoulders held down and back; no shrug, no forward roll.
**Hip/knee path:** static.

## E. Resistance Mechanics
**Resistance source:** cable (weight stack).
**Direction of resistance:** straight up toward the high pulley.
**Cable direction:** **high-to-low, from directly in front of and above the lifter.**
**Machine path:** N/A.
**Resistance relative to the body:** the cable line falls in front of the torso; the slight forward lean is what puts the elbow under the cable line so the resistance arm stays consistent through the range.
**Machine classification:** cable/selectorized weight stack.

## F. Range of Motion
**Approximate ROM:** ~90°+ elbow flexion → full lockout.
**Deep stretch position:** top, elbows flexed, forearms up.
**Peak contraction position:** bottom, elbows locked, with a squeeze (cue 2).
**Partial or full ROM:** full, with a controlled return (cue 4).

## G. Execution Details
**Unilateral or bilateral:** bilateral · **simultaneous**
**Open or closed kinetic chain:** open.
**Tempo shown:** not determinable; controlled eccentric emphasized.
**Special technique:** thumbless grip · elbows pinned to the ribs · shoulders depressed · deliberate slight forward hip hinge · full lockout with a squeeze.

## H. Important Variation Details
**Straight bar, not a rope** — no end-range hand separation/pronation. **Pronated thumbless**, not neutral. **Bilateral**, not single-arm. **Slight forward lean is correct here**, unlike the strict upright pushdown many cues describe — the video marks the upright version as the mistake. This is a high-cable pushdown, not an overhead extension, so the shoulder sits at ~0° flexion rather than in deep flexion (that is the mechanical distinction from `overhead-tricep-ext`).

## I. Confidence
**HIGH CONFIDENCE:** high-pulley cable pushdown; straight-bar attachment; pronated thumbless grip; elbows pinned; bilateral; forward torso lean taught as correct; full lockout.
**MODERATE CONFIDENCE:** lean magnitude ~15–25°; grip width ≈ shoulder-width.
**LOW CONFIDENCE:** none material.
**UNKNOWN:** tempo, reps, exact stack setting.

## J. Raw App Information — AFTER correction
**Description:** `subTarget: "טריצפס"`
**Instructions / cues:** 1) מרפקים נעולים לצדי הגוף 2) לנעול את המרפק בסוף התנועה ולסחוט 3) **הטיה קלה קדימה מהירך — לא לנדנד את הגוף כדי לדחוף** *(corrected)* 4) לחזור למעלה בשליטה, בלי לתת למשקל למשוך
**Category:** `muscleGroup: 'triceps'`, `equipment: 'cables'`
**Muscles:** primary `triceps`; secondary `[]`
**Video assets:** `videos/cable-tricep-pushdown-01.mp4` (17.4 s)
**Relevant metadata:** `weightMode: 'total'`, `weightIncrementKg: 5`, `targetReps: 10–15`, `usesPlates: false`, `barWeightKg: null`, `seedWeightKg: 51`, `libraryId: 'lib-triceps_pushdown'`
**Programs containing this exercise:** אימון A (position 7), פול באדי א׳ / F1 (position 6).

## K. Corrections Made
**Corrected instruction — cue 3**
**Before:** `לא להישען קדימה כדי לעזור עם משקל הגוף`
**After:** `הטיה קלה קדימה מהירך — לא לנדנד את הגוף כדי לדחוף`
**Reason:** the demo video marks a fully upright torso as the ❌ and a slight forward hip hinge as the ✅. The old cue forbade the position the video teaches. The rewrite keeps the original anti-cheating intent (don't use body English) while matching the demonstrated posture.
**Confidence:** HIGH (explicit red/green comparison in the video).
*(Propagated to installed devices via `CATALOG_FIXES_V10` + migration 10; the cue is only replaced if Tavor has not edited the cues himself.)*

## L. Video Assignment
| Video | What it actually shows | Final exercise assignment | Confidence |
|---|---|---|---|
| `cable-tricep-pushdown-01.mp4` | Straight-bar high-cable pushdown; grip ❌/✅ (thumb wrapped vs thumbless), torso ❌/✅ (upright vs slight hinge), rear-view elbow drift ❌/✅, shoulder shrug ❌/✅, wrist buckling ❌, lockout with triceps highlighted | `cable-tricep-pushdown` | HIGH |

---

# EXERCISE 7 — Cross-Body Cable Triceps Extension

## A. Identification
**App name after correction:** `פשיטת מרפק בכבל חוצה גוף` (unchanged)
**Previous app name:** `יד אחורית כבלים צולבים` ("crossed cables") — renamed in v3.
**Exercise ID / key:** `cross-cable-tricep`
**Best standardized English name:** **Single-Arm Cross-Body High-Pulley Cable Triceps Extension (arm abducted to match the cable line, torso leaning over the cable)**
**Alternative/common names:** Cable Cross Tricep Extension · Single-Arm Cross-Body Pushdown · Cross-Cable Kickback-style extension
**Exercise category:** elbow extension (single-joint), unilateral, cable
**Equipment:** cable machine, **pulley set high**, no attachment — the hand grips the bare snap-hook/clip (a small D-handle would serve identically).

## B. Starting Position
**Body orientation:** standing side-on to the pulley; the **opposite** hand takes the cable, so the cable crosses the front of the body.
**Torso angle:** upright but **leaning slightly over/toward the cable** — stated verbatim: "I'm leaning slightly over that cable."
**Back position/support:** unsupported, rigid — "I'm maintaining this rigid position the entire time."
**Shoulder position:** the working shoulder is held **abducted / flared out** so the cable line runs **straight through the shoulder joint** — this is called out as "the most important" point in the clip.
**Elbow position:** high and fixed, held out from the body at an angle that matches the cable — "I'm matching my arm angle to the cable angle."
**Hip position:** neutral/stable. **Knee position:** soft. **Foot position:** stable stance, not staggered in any marked way.

## C. Grip / Contact Position
**Grip type:** neutral-to-pronated on a bare clip; not a bar, not a rope.
**Grip width:** N/A — one hand.
**Hand position:** starts high across the body near the opposite shoulder, finishes low beside the near hip.
**Handle type:** bare carabiner / small single handle.
**Other body contact points:** the free hand often rests on the working triceps (visible in the clip) — a feel/positioning aid, not load-bearing.

## D. Movement
**Starting position of resistance:** hand up and across the body, elbow flexed, cable taut along the shoulder line.
**End position:** elbow fully extended, hand down beside the hip on the working side.
**Main joint actions:** elbow extension only; the shoulder is held statically in its abducted position.
**Movement path:** the forearm sweeps down and **across the body**, diagonally, along the cable line.
**Elbow path:** none by design — the elbow is the fixed pivot, held out at the cable angle.
**Shoulder/scapula behavior:** static and rigid; explicitly "not using any momentum or my shoulders."
**Hip/knee path:** static.

## E. Resistance Mechanics
**Resistance source:** cable (weight stack).
**Direction of resistance:** up and across, back toward the high pulley on the opposite side.
**Cable direction:** **high-to-low, diagonally across the body, from the opposite side, with the cable line passing through the working shoulder.**
**Machine path:** N/A.
**Resistance relative to the body:** the whole setup exists to keep the cable line collinear with the humerus, so the resistance arm at the elbow is maximal and the shoulder contributes nothing.
**Machine classification:** cable/selectorized weight stack.

## F. Range of Motion
**Approximate ROM:** elbow flexed with the hand across the body → full extension beside the hip.
**Deep stretch position:** hand highest across the body.
**Peak contraction position:** full lockout with the arm down and across.
**Partial or full ROM:** full; framed as a feel/finisher exercise (cue 4).

## G. Execution Details
**Unilateral or bilateral:** **unilateral** · **Alternating or simultaneous:** one arm at a time, then the other.
**Open or closed kinetic chain:** open.
**Tempo shown:** not determinable; strictly no momentum.
**Special technique:** cable line through the shoulder joint · arm held flared to match the cable angle · slight lean over the cable · rigid torso · free hand on the working triceps.

## H. Important Variation Details
**This is a one-arm-at-a-time exercise, not the two-cable "crossed cables" version** where you stand between two stacks with both arms crossed. The record's Hebrew name was already corrected to "cross-body" in an earlier pass, but the cue text still described the bilateral setup — that has now been fixed. Compared with `cable-tricep-pushdown` (same family): the cable comes **diagonally across the body from the opposite side**, the **humerus is abducted rather than pinned to the ribs**, and the torso **leans toward the cable**. Those three differences are what make it a distinct exercise rather than a grip variation.

## I. Confidence
**HIGH CONFIDENCE:** the video shows a **unilateral** cross-body high-pulley cable triceps extension; cable line through the shoulder; arm held out to match the cable; slight lean over the cable; fixed elbow; full lockout; no attachment/bare clip.
**MODERATE CONFIDENCE:** that **Tavor** performs the unilateral version rather than the two-cable bilateral one. The source folder is named "כבלים צולבים … 15 קילו כל יד" ("crossed cables … 15 kg per hand"), which reads bilateral; the demo video and the corrected name read unilateral. `weightMode: 'perSide'` is correct either way.
**LOW CONFIDENCE:** exact starting elbow angle; exact torso lean angle.
**UNKNOWN:** tempo, reps, pulley height in Tavor's gym, whether he uses a D-handle or the bare clip.

## J. Raw App Information — AFTER correction
**Description:** `subTarget: "טריצפס"`
**Instructions / cues:** 1) **יד אחת בכל פעם, על הפולי הנגדי — הכבל חוצה את הגוף דרך קו הכתף** *(corrected)* 2) מרפקים גבוהים וקבועים 3) **זווית הזרוע מיושרת עם הכבל, ורק האמה נפתחת עד נעילה** *(corrected)* 4) תרגיל גימור — לרדת במשקל ולהתמקד בתחושה
**Category:** `muscleGroup: 'triceps'`, `equipment: 'cables'`
**Muscles:** primary `triceps`; secondary `[]`
**Video assets:** `videos/cross-cable-tricep-01.mp4` (81.5 s)
**Relevant metadata:** `weightMode: 'perSide'`, `weightIncrementKg: 2.5`, `targetReps: 12–15`, `usesPlates: false`, `barWeightKg: null`, `seedWeightKg: 15`, `libraryId`: none — documented reason: the library contains no cross-body elbow-extension content at all.
**Programs containing this exercise:** אימון A (position 8), פול באדי ב׳ / F2 (position 6).

## K. Corrections Made
**Corrected instructions — cues 1 and 3**
**Before:** 1) `לעמוד במרכז, כבל אחד בכל יד, ידיים מוצלבות` · 3) `לפתוח לצדדים ולסחוט בסוף`
**After:** 1) `יד אחת בכל פעם, על הפולי הנגדי — הכבל חוצה את הגוף דרך קו הכתף` · 3) `זווית הזרוע מיושרת עם הכבל, ורק האמה נפתחת עד נעילה`
**Reason:** the cues described the **bilateral** crossed-cable setup; the demo video shows a **unilateral** cross-body extension throughout its 81 seconds, and the exercise's own name was already corrected to "cross-body" in an earlier pass — the cues simply never followed. The new cue 3 encodes the video's stated key point (arm angle matched to the cable line).
**Confidence:** HIGH that the video is unilateral; MODERATE that this is what Tavor performs — see ISSUES NOT AUTOMATICALLY FIXED.

## L. Video Assignment
| Video | What it actually shows | Final exercise assignment | Confidence |
|---|---|---|---|
| `cross-cable-tricep-01.mp4` | Captioned "STOP doing your Cable Cross Tricep Extensions like this" — single-arm, high pulley, opposite hand, cable through the shoulder, arm flared to match the cable, slight lean, rigid torso, no momentum | `cross-cable-tricep` | HIGH |

---

# EXERCISE 8 — Lat Pulldown

## A. Identification
**App name after correction:** `משיכת פולי עליון` (unchanged)
**Previous app name:** `פולי עליון`
**Exercise ID / key:** `lat-pulldown`
**Best standardized English name:** **Seated Wide-Grip Pronated Lat Pulldown to the Upper Chest (cambered lat bar, slight backward torso lean)**
**Alternative/common names:** Lat Pulldown · Wide-Grip Pulldown · Front Pulldown
**Exercise category:** vertical pull
**Equipment:** selectorized lat pulldown machine (**Precor** visible on the uprights in videos 01 and 03), cambered/angled lat bar, thigh pads.

## B. Starting Position
**Body orientation:** seated, thighs locked under the pads, facing the machine.
**Torso angle:** near-upright with a **slight backward lean, ~10–20°**. This is a marked ❌/✅ pair in video 03: red vertical line (bolt upright) vs green diagonal (slight lean back). The app cue says the same.
**Back position/support:** unsupported; chest lifted, neutral/slightly extended thoracic spine.
**Shoulder position:** the entire first half of video 01 is this single point — ❌ shoulders elevated toward the ears with the upper traps highlighted red vs ✅ shoulders depressed with the lats highlighted green. Scapular depression **initiates** the rep (app cue 1).
**Elbow position:** starts extended overhead, slightly outside the shoulder line.
**Hip position:** ~90°, seated. **Knee position:** ~90°, thighs under the pads. **Foot position:** flat on the floor.

## C. Grip / Contact Position
**Grip type:** **pronated (overhand)**, and video 03 marks a **thumbless (false) grip** as ✅ against a thumb-wrapped grip as ❌.
**Grip width:** **wide** — hands clearly outside the shoulders, on the angled outer section of the bar.
**Hand position:** on the cambered/bent portion of the bar.
**Handle type:** long cambered lat bar.
**Other body contact points:** seat and thigh pads (they anchor the body against the upward pull).

## D. Movement
**Starting position of resistance:** bar overhead at full arm extension, lats stretched, shoulders allowed to rise slightly.
**End position:** bar pulled to the **upper chest** (app cue 2), elbows down and slightly back.
**Main joint actions:** scapular depression + downward rotation, shoulder adduction/extension, elbow flexion.
**Movement path:** the bar travels down in front of the face to the upper chest.
**Elbow path:** elbows drive down and slightly back, staying roughly under the wrists.
**Shoulder/scapula behavior:** depress first, then pull; at the top, allow a full stretch and let the shoulders rise (app cue 4).
**Hip/knee path:** static — no leg drive, no swinging.

## E. Resistance Mechanics
**Resistance source:** cable over a high pulley, selectorized stack.
**Direction of resistance:** straight up toward the overhead pulley.
**Cable direction:** **high-to-low, from directly overhead and slightly in front.**
**Machine path:** N/A — the bar is free on the cable.
**Resistance relative to the body:** vertical from above; the slight backward lean moves the torso out of the cable line so the bar can reach the upper chest and the lats work through a longer range.
**Machine classification:** selectorized cable machine (Precor), not plate-loaded.

## F. Range of Motion
**Approximate ROM:** full overhead extension with a lat stretch → bar at the upper chest.
**Deep stretch position:** top, arms fully extended, shoulders slightly elevated.
**Peak contraction position:** bar at the upper chest, scapulae depressed.
**Partial or full ROM:** full, with the stretch explicitly emphasized (app cue 4).

## G. Execution Details
**Unilateral or bilateral:** bilateral · **simultaneous**
**Open or closed kinetic chain:** open (the bar moves, the body is anchored).
**Tempo shown:** not determinable.
**Special technique:** scapular depression initiates · thumbless pronated grip · wide hand placement · slight backward lean · chest up · pull to the upper chest, not behind the neck.

## H. Important Variation Details
**Wide pronated grip, pulled to the FRONT (upper chest)** — not behind the neck, not underhand, not neutral/close-grip, not a straight-arm pulldown. **Bilateral on a bar**, not a single-arm cable pulldown. The torso lean is deliberate and small (~10–20°), which is what separates it from a "pulldown row" done at 45°. ⚠ One of the three attached videos (`lat-pulldown-02`) demonstrates a **single-arm D-handle cable pulldown** instead — see section L and ISSUES.

## I. Confidence
**HIGH CONFIDENCE:** seated bilateral cable lat pulldown; wide pronated grip; cambered lat bar; pull to the upper chest; scapular depression first; slight backward lean; thigh pads anchoring; Precor selectorized machine in videos 01 and 03.
**MODERATE CONFIDENCE:** lean angle 10–20°; grip width as a multiple of shoulder width; thumbless grip being how Tavor actually grips it (it is the video's ✅, not necessarily his habit).
**LOW CONFIDENCE:** whether the bar is a straight lat bar or a cambered one on **his** machine.
**UNKNOWN:** tempo, reps, the exact machine in Tavor's gym.

## J. Raw App Information — AFTER correction
**Description:** `subTarget: "לטיסימוס"`
**Instructions / cues:** 1) להתחיל מהורדת השכמות, רק אחר כך לכופף מרפקים 2) למשוך את המוט לחלק העליון של החזה 3) חזה למעלה, הטיה קלה לאחור — לא להתנדנד 4) למעלה למתוח מלא ולהרגיש את הלט נפתח
**Category:** `muscleGroup: 'back'`, `equipment: 'cables'`
**Muscles:** primary `back`; secondary `['biceps','forearms','shoulders']`
**Video assets:** `videos/lat-pulldown-01.mp4` (7.7 s), `-02.mp4` (7.1 s), `-03.mp4` (10.1 s)
**Relevant metadata:** `weightMode: 'total'`, `weightIncrementKg: 5`, `targetReps: 8–12`, `usesPlates: false`, `barWeightKg: null`, `seedWeightKg: 78`, `libraryId: 'lib-lat_pulldown'`
**Programs containing this exercise:** אימון B (position 0), פול באדי א׳ / F1 (position 1).

## K. Corrections Made
None. The record and all four cues match videos 01 and 03 exactly. Video 02's variation mismatch is logged rather than acted on — see ISSUES.

## L. Video Assignment
| Video | What it actually shows | Final exercise assignment | Confidence |
|---|---|---|---|
| `lat-pulldown-01.mp4` | Precor lat pulldown, rear view, wide pronated grip on a cambered bar; ❌ shoulders elevated (traps red) vs ✅ depressed (lats green) | `lat-pulldown` | HIGH |
| `lat-pulldown-02.mp4` | **Single-arm cable lat pulldown with a D-handle**, side view; ❌ elbow out of the cable line vs ✅ humerus aligned with the cable | `lat-pulldown` (**unchanged — flagged, not moved**) | the *content* is HIGH; the *assignment* is MODERATE |
| `lat-pulldown-03.mp4` | Same Precor machine; grip ❌/✅ (thumb wrapped vs thumbless), traps-vs-lats ❌/✅, torso ❌/✅ (upright vs slight lean back), biceps-dominance ❌/✅ | `lat-pulldown` | HIGH |

---

# EXERCISE 9 — Machine Row (heavy)

## A. Identification
**App name after correction:** `חתירה במכונה` (unchanged)
**Previous app name:** `חתירה 60`
**Exercise ID / key:** `seated-row-heavy`
**Best standardized English name:** **Chest-Supported Plate-Loaded Seated Machine Row, close neutral grip, elbows tucked (lat-biased setting)**
**Alternative/common names:** Machine Row · Chest-Supported Row · Plate-Loaded Seated Row
**Exercise category:** horizontal pull
**Equipment:** plate-loaded chest-supported row machine with a vertical chest pad, an adjustable seat, and **two handle sets** — inner neutral (close) and outer wide.

## B. Starting Position
**Body orientation:** seated, chest against a vertical pad, facing the machine.
**Torso angle:** upright against the chest pad, essentially vertical.
**Back position/support:** **chest-supported** — the pad removes trunk and hip involvement entirely. App cue 1 states it and the video's second ✅ is "adjust seat" so the handles sit at the right height.
**Shoulder position:** protracted at the stretch, retracted at the finish. The video's ✅ setup includes seat height such that the handles are "in line with your nips".
**Elbow position:** for the close-grip setting the video shows "elbows tucked in"; for the wide setting "elbows flared".
**Hip position:** ~90° in the seat. **Knee position:** ~90°. **Foot position:** flat on the machine's footplates/floor.

## C. Grip / Contact Position
**Grip type:** **neutral** on the inner handles (the lat-biased option the app cues describe); pronated/wide on the outer handles.
**Grip width:** close (inner) for lat bias; wide (outer) for upper-back bias.
**Hand position:** at nipple/lower-chest height, set by the seat.
**Handle type:** fixed machine handles, dual sets.
**Other body contact points:** chest pad, seat, footplates. This is the defining contact of the exercise.

## D. Movement
**Starting position of resistance:** arms extended forward, scapulae protracted, plates at the bottom of the load path.
**End position:** handles pulled back toward the lower ribs/abdomen, elbows behind the torso, scapulae retracted.
**Main joint actions:** shoulder extension (close grip) or horizontal abduction (wide grip), elbow flexion, scapular retraction.
**Movement path:** handles travel back and slightly down along the machine's arc.
**Elbow path:** **close grip → elbows stay tucked to the sides**; **wide grip → elbows flare out at ~90°**. The app's cue 2 selects the tucked version.
**Shoulder/scapula behavior:** full protraction at the stretch, hard retraction with a squeeze at the finish (app cue 3).
**Hip/knee path:** none — the chest pad prevents body English (app cue 4).

## E. Resistance Mechanics
**Resistance source:** machine lever with plate loading (Olympic plates on horns, visible in the video).
**Direction of resistance:** pulls the handles forward/away, opposing the row.
**Cable direction:** N/A.
**Machine path:** **fixed arc**, chest-supported. Independent vs linked arms **not determinable**.
**Resistance relative to the body:** horizontal into the torso at nipple/lower-chest height; the chest pad takes the reaction force so the load lands on the pulling musculature and not on trunk stabilisation.
**Machine classification:** plate-loaded · fixed arc · chest-supported · arm linkage UNKNOWN.

## F. Range of Motion
**Approximate ROM:** full forward reach with scapular protraction → handles at the lower ribs with full retraction.
**Deep stretch position:** arms extended forward, scapulae protracted.
**Peak contraction position:** handles at the torso, scapulae squeezed.
**Partial or full ROM:** full, with the stretch reached by allowing protraction.

## G. Execution Details
**Unilateral or bilateral:** bilateral · **simultaneous**
**Open or closed kinetic chain:** open.
**Tempo shown:** not determinable.
**Special technique:** chest supported · seat height so handles are at nipple line · grip choice changes the elbow path and therefore the exercise's bias · no torso rocking.

## H. Important Variation Details
**Chest-supported and plate-loaded** — that removes the hip hinge and trunk isometric that a seated cable row or a barbell row involves, and it is the single biggest mechanical difference from `low-row-rack` (seated cable row) in the same program. Within this machine, the **close neutral grip with tucked elbows** (what the app cues specify) is a fundamentally different pull line from the **wide grip with flared elbows** — the video treats them as two separate options, so which one Tavor uses matters for any load-distribution analysis. It is a **horizontal** pull, unlike `lat-pulldown`.

## I. Confidence
**HIGH CONFIDENCE:** chest-supported plate-loaded seated row machine; two grip options exist on it; seat height set so handles reach the nipple line; bilateral; open chain; the app cues describe the **close/tucked** option.
**MODERATE CONFIDENCE:** that Tavor uses the close neutral grip (the cues say elbows tucked, but there is no footage of him).
**LOW CONFIDENCE:** whether the machine's arms are independent or linked.
**UNKNOWN:** brand/model; the resistance curve; tempo; whether his machine has both handle sets.

## J. Raw App Information — AFTER correction
**Description:** `subTarget: "לטיסימוס ואמצע גב"`
**Instructions / cues:** 1) חזה נשען, גב ניטרלי לאורך כל הסט 2) למשוך עם המרפקים אחורה וצמוד לגוף 3) לסחוט שכמות בסוף התנועה 4) לא לתת לגוף להתנדנד קדימה ואחורה
**Category:** `muscleGroup: 'back'`, `equipment: 'machine'`
**Muscles:** primary `back`; secondary `['biceps','forearms','shoulders']`
**Video assets:** `videos/seated-row-heavy-01.mp4` (20.8 s)
**Relevant metadata:** `weightMode: 'perSide'`, `weightIncrementKg: 2.5`, `targetReps: 8–12`, `usesPlates: true`, `barWeightKg: null`, `seedWeightKg: 60`, `libraryId`: none — documented reason: the library has no plate-loaded machine-row content (`lib-machine_row` holds a single clip about a cable archer-row trick).
**Programs containing this exercise:** אימון B (position 1), פול באדי ב׳ / F2 (position 1).

## K. Corrections Made
None. All four cues match the video, and cue 2 correctly selects the close/tucked option.

## L. Video Assignment
| Video | What it actually shows | Final exercise assignment | Confidence |
|---|---|---|---|
| `seated-row-heavy-01.mp4` | Captioned "Machine Row mistake ❌❌ / Adjust seat ✅✅ / In line with nipple / Where to grip it? / Close Grip (Lat Bias) — elbows tucked in / Wide Grip (Upper Back Bias) — elbows flared" on a plate-loaded chest-supported row machine | `seated-row-heavy` | HIGH |

---

# EXERCISE 10 — Machine Row (light)

## A. Identification
**App name after correction:** `חתירה במכונה` (unchanged)
**Previous app name:** `חתירה 50`
**Exercise ID / key:** `seated-row-light`
**Best standardized English name:** **Machine Row — a second horizontal-row machine (or a second grip/angle on the same machine), trained lighter (50 kg/side).** *The name is verified; the attached video is not of this exercise.*
**Alternative/common names:** Machine Row · Seated Row
**Exercise category:** horizontal pull
**Equipment:** plate-loaded row machine, loaded per side.

## B–G. Position, movement, mechanics, ROM, execution
**⚠ The attached video does NOT show this exercise.** It shows a single-arm underhand machine **lat pulldown** — a vertical pull. This is a long-standing documented mismatch (`VIDEO_MISMATCH`), confirmed here frame-by-frame and by the clip's own burned-in title.
What can be said about the record itself:
- It is a **horizontal row** on a machine, seated, plate-loaded, 50 kg per side — deliberately kept separate from `seated-row-heavy` (60 kg/side). Tavor's own verification document is explicit: *"B02 ו-B03 נשארים שני תרגילים נפרדים למרות שם זהה. הם נבדלים במשקל ובסרטון."*
- The cues describe it as the **second** row of the session, done with a **different grip or angle** from the first, through a **full range with a forward stretch between reps**, at a **slower tempo**.
- Everything else — seat, torso angle, handle type, grip, elbow path, machine arc — is **UNKNOWN**, because the only footage attached is of a different exercise.

## H. Important Variation Details
Its entire identity is "the row that is **not** the first row": a different grip or a different machine angle, lighter load, slower tempo, higher reps (10–12 vs 8–12). Without correct footage, the specific pull line cannot be pinned down — and that is exactly the detail a load-distribution analysis would need.

## I. Confidence
**HIGH CONFIDENCE:** it is a plate-loaded machine horizontal row, distinct from `seated-row-heavy`, trained lighter and slower; the attached video shows a different exercise.
**HIGH CONFIDENCE (about the video's content):** single-arm, underhand, plate-loaded **machine lat pulldown** with a chest pad, performed leaning back off the pad. Burned-in title: *"STOP doing your Underhand Lat Pulldowns like this."*
**MODERATE CONFIDENCE:** that it is a *different machine* rather than a different grip on the same machine.
**LOW CONFIDENCE / UNKNOWN:** grip type, grip width, handle type, seat/torso angle, elbow path, machine arc, brand — no valid footage.

## J. Raw App Information — AFTER correction
**Description:** `subTarget: "לטיסימוס ואמצע גב"`
**Instructions / cues:** 1) אחיזה או זווית שונה מהחתירה הראשונה 2) טווח מלא — למתוח קדימה בין החזרות 3) קצב איטי יותר, להרגיש את השריר
**Category:** `muscleGroup: 'back'`, `equipment: 'machine'`
**Muscles:** primary `back`; secondary `['biceps','forearms','shoulders']`
**Video assets:** `videos/seated-row-light-01.mp4` (92.6 s) — **flagged as mismatched**
**Relevant metadata:** `weightMode: 'perSide'`, `weightIncrementKg: 2.5`, `targetReps: 10–12`, `usesPlates: true`, `barWeightKg: null`, `seedWeightKg: 50`, `libraryId`: none — documented reason: no plate-loaded machine-row content in the library, and linking both rows to one library record is precisely the failure `libraryLinks.ts` warns against.
**Programs containing this exercise:** אימון B (position 2).

## K. Corrections Made
**Corrected the mismatch note (documentation only — the video was NOT moved)**
**Before:** `הסרטון מראה משיכת פולי עליון — משיכה אנכית, לא חתירה`
**After:** `הסרטון מראה משיכת פולי עליון ביד אחת במכונה, באחיזה תחתונה — משיכה אנכית חד-צדדית, לא חתירה אופקית`
**Reason:** the note was right but vague. The clip is specifically a **single-arm, underhand, plate-loaded machine** pulldown — which matters, because it means the clip does **not** belong under `lat-pulldown` either (that record is a bilateral wide-pronated cable pulldown).
**Confidence:** HIGH.
**Why the video was not moved:** moving it to `lat-pulldown` would violate the same rule that governs splitting — unilateral vs bilateral, machine vs cable, and underhand vs wide pronated are three separate variation differences. Creating a new exercise to host it would add a record to Tavor's catalog for an exercise there is no evidence he performs. Logged as `REVIEW_REQUIRED`.

## L. Video Assignment
| Video | What it actually shows | Final exercise assignment | Confidence |
|---|---|---|---|
| `seated-row-light-01.mp4` | Captioned "STOP doing your Underhand Lat Pulldowns like this" — single-arm underhand plate-loaded machine lat pulldown; seat height, lean back off the chest pad to change the machine's strength curve, drive the elbow down and "wrap it around your back", no twisting/jerking | `seated-row-light` (**unchanged — flagged `REVIEW_REQUIRED`**) | video content HIGH; assignment is knowingly wrong and marked as such in-app |

---

# CATALOG CHANGES SUMMARY

| Original Exercise | Final Exercise | Action | Videos Moved | New Exercise Created? | Confidence |
|---|---|---|---|---|---|
| `db-bench-press` — "לחיצת חזה במוט — שיפוע חיובי ושטוח" | `db-bench-press` — "לחיצת חזה במוט — ספסל שטוח" (Flat Barbell Bench Press) | **split** + rename + `usesPlates: false→true` + library link added | `db-bench-press-01.mp4` moved **out** to the new incline record | Yes — `incline-barbell-bench-press` | HIGH |
| *(same record)* | `incline-barbell-bench-press` — "לחיצת חזה במוט בשיפוע חיובי" (Incline Barbell Bench Press) | **created** | received `db-bench-press-01.mp4` | Yes | HIGH |
| `dips` | `dips` (name unchanged) | `muscleGroup: chest→triceps`, secondary `['triceps','shoulders']→['chest','shoulders']`, cues 3+4 rewritten | none | No | HIGH |
| `cable-tricep-pushdown` | same | cue 3 rewritten | none | No | HIGH |
| `cross-cable-tricep` | same | cues 1+3 rewritten | none | No | HIGH (video) / MODERATE (Tavor's own variation) |
| `seated-row-light` | same | mismatch note made precise | none — video **kept in place**, flagged | No | HIGH |
| `pushup`, `decline-machine-press`, `decline-pec-fly`, `bench-machine-press`, `overhead-tricep-ext`, `lat-pulldown`, `seated-row-heavy` | unchanged | verified, no change needed | none | No | — |

**Supporting code changes (not catalog content):**
- `scripts/import-videos.mjs` — the folder→exercise map now accepts `{ id, split }` so one source folder can feed two catalog records. Output **file names stay derived from the primary id**, deliberately: the file name is the media-DB key on the device, so renaming would force a re-download of a clip that has not changed.
- `src/db/catalogV10.ts` — new module holding the migration-10 field fixes and the incline-record insertion, reused by backup restore (same pattern as `calfMerge.ts`).
- `src/db/db.ts` — migration `version(10)`.
- `src/db/catalogFix.ts` — `CATALOG_FIXES_V10`.
- `src/db/backup.ts` — forward-fixes an old backup restored into a v10 database.
- `src/db/migration10.test.ts` — 6 new tests.
- Four existing tests had a hard-coded catalog size of `28`; replaced with `SEED_EXERCISES.length`.

---

# NEW EXERCISES CREATED

**Name:** `לחיצת חזה במוט בשיפוע חיובי` / **Incline Barbell Bench Press**
**ID:** `incline-barbell-bench-press`
**Why it was created:** the single record "Barbell Bench Press (Incline & Flat)" held four videos — three flat, one incline — and no set of cues could be correct for both: the bar is lowered to the **mid/lower chest** on flat and to the **upper chest** on incline, and the shoulder-flexion angle differs throughout the lift. It also blocked both library links, because the study library keeps flat and incline as two separate records and linking the merged record would have taught the wrong bar path half the time.
**Which videos were moved into it:** `videos/db-bench-press-01.mp4` (+ poster) — the only incline clip: incline bench inside a power rack, free Olympic barbell, ~30–40°, bar to the upper chest.
**Which program references point to it:** **none.** אימון A (position 1) and פול באדי ב׳ / F2 (position 2) still point at `db-bench-press` — see PROGRAM_MAPPING_REVIEW_REQUIRED below.
**Data safety:** the historical ID `db-bench-press` stayed with the **flat** record, so every set log, personal record, session and program item keeps working untouched. The new record starts empty.

---

# ISSUES NOT AUTOMATICALLY FIXED

### 1. `PROGRAM_MAPPING_REVIEW_REQUIRED` — which bench press does אימון A / F2 mean?
**Exercise:** `db-bench-press` / `incline-barbell-bench-press`
**Problem:** the program slot was created when one record covered both variations. After the split, both programs point at the **flat** record by default.
**Why uncertain:** Tavor's own verified source document lists A01 as a single slot — *"לחיצת חזה במוט — שיפוע חיובי ושטוח, 22.5 ק"ג כל צד"* — which reads as one slot in which he alternates. Nothing records which he does on a given day.
**What should be checked manually:** decide whether אימון A slot 1 and F2 slot 2 should stay on flat, move to incline, or hold both. It is a one-line change in the program editor; no code change needed.

### 2. `REVIEW_REQUIRED` — `seated-row-light`'s video is a different exercise
**Exercise:** `seated-row-light`
**Problem:** the attached clip is a single-arm underhand plate-loaded machine **lat pulldown**, not a row.
**Why uncertain:** the correct home does not exist. `lat-pulldown` is a bilateral wide-pronated **cable** pulldown — three variation differences away. Creating a record for it would put an exercise in the catalog that there is no evidence Tavor trains.
**What should be checked manually:** the real fix is to film or find a clip of the actual second row machine. Until then the in-app warning label is accurate and the clip stays visible (a wrong clip beats no clip, per the project's own stated policy).

### 3. `REVIEW_REQUIRED` — `lat-pulldown-02.mp4` shows a different variation
**Exercise:** `lat-pulldown`
**Problem:** two of the three clips are bilateral wide-grip bar pulldowns; the third is a **single-arm D-handle cable pulldown**.
**Why uncertain:** it is plausibly a deliberate teaching clip (its single point — keep the humerus in line with the cable — applies to the bilateral version too), rather than a mis-filed video. Also, the app's mismatch mechanism is keyed **per exercise, not per video**, so flagging it would wrongly slander the two correct clips.
**What should be checked manually:** decide whether to keep it as a teaching aid, or to replace it. Making `VIDEO_MISMATCH` per-video would be a small feature change, out of scope here.

### 4. `REVIEW_REQUIRED` — two catalog records share the display name "לחיצת חזה במכונה"
**Exercise:** `decline-machine-press` and `bench-machine-press`
**Problem:** identical Hebrew name in every list in the app; only `subTarget` and the weight differ. This also blocks both from linking to `lib-machine_chest_press`.
**Why uncertain:** `bench-machine-press` has **no video** and Tavor's document marks it `verified: false — השם משוער בלבד`. Renaming it would be inventing an identity.
**What should be checked manually:** one photo of the second machine settles it. Then it can be renamed (e.g. by machine type or brand) and one of them can take the library link.

### 5. `REVIEW_REQUIRED` — `decline-pec-fly` name is unverified
**Exercise:** `decline-pec-fly`
**Problem:** no video, and the "decline" angle is a remembered label.
**Why uncertain:** nothing in the project can confirm or refute the angle.
**What should be checked manually:** confirm whether the machine's seat/handle path really is declined, or whether it is a standard pec deck.

### 6. `REVIEW_REQUIRED` — is `cross-cable-tricep` unilateral for Tavor?
**Exercise:** `cross-cable-tricep`
**Problem:** the cues now describe the unilateral version (matching the video and the corrected name), but the source folder name reads "כבלים צולבים … 15 קילו כל יד", which suggests a two-cable bilateral setup.
**Why uncertain:** both readings fit `weightMode: 'perSide'` and 15 kg.
**What should be checked manually:** if Tavor actually stands between two stacks with both arms crossed, revert cue 1 — one line in the exercise editor.

### 7. Out of scope but documented — `leg-curl` ⇄ `leg-extension` videos are swapped
**Exercise:** `leg-curl` (C04) and `leg-extension` (C05) — **not in this batch**.
**Problem:** Tavor's own source document flags this as a mandatory fix: each exercise currently shows the other's video. Verification given there: the clip attached to `leg-extension` shows a machine labelled "Seated Leg Curl".
**Why not fixed:** outside the 10 records in this batch, and the instructions say not to change unrelated things.
**What should be checked manually:** nothing — it is already verified. It is a ready-made fix for the next batch.

---

# FINAL INTEGRITY CHECK

- [x] **All 10 exercises analyzed** — `pushup`, `decline-machine-press`, `decline-pec-fly`, `bench-machine-press`, `overhead-tricep-ext`, `cable-tricep-pushdown`, `cross-cable-tricep`, `lat-pulldown`, `seated-row-heavy`, `seated-row-light`.
- [x] **All of their videos checked** — 11 clips (8 of the 10 records have video; `decline-pec-fly` and `bench-machine-press` have none, which is itself documented in the project).
- [x] **No video moved on a guess** — exactly one video moved (`db-bench-press-01.mp4` → the new incline record), on the basis of direct frame observation. The two doubtful clips were flagged, not moved.
- [x] **Split record's references all updated** — `videoManifest.ts`, `muscleTags.ts`, `libraryLinks.ts` (link added, unlinked-note removed), `scripts/import-videos.mjs`, migration 10, backup restore.
- [x] **No duplicate IDs** — 29 exercises, 29 unique ids, orders 0…28 contiguous.
- [x] **No broken references** — every program and block item resolves to a catalog exercise.
- [x] **No broken video references** — every `src` and `poster` in both manifests exists on disk (`manifests.test.ts`); no manifest key without a catalog exercise.
- [x] **Programs still valid** — אימון A/B/C and F1/F2 all resolve; no program item was added, removed or repointed.
- [x] **build / typecheck / tests pass** — `tsc --noEmit`: clean · `vitest run`: **522 passed / 41 files** · `npm run build`: succeeds · `oxlint`: only one pre-existing unrelated warning.
- [x] **Every change made appears in this report** (sections K + CATALOG CHANGES SUMMARY).
