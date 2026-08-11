#!/usr/bin/env bash
#
# פריסה ל-GitHub Pages, דרך ענף gh-pages.
#
# למה לא דרך Actions: שלב actions/deploy-pages על האתר הזה חרג דרך קבע
# מהטיימאאוט שלו — הארטיפקט כולל 32MB של סרטוני הדגמה — ואז ביטל את הפריסה
# והשאיר את האתר על גרסה ישנה. דחיפה של תיקיית ה-build כענף רגיל לוקחת שניות
# ולא תלויה בתור ה-runner-ים.
#
# הסקריפט לא מסתפק בדחיפה: הוא ממתין ל-Pages ומאמת שהקובץ החדש באמת מוגש.
# בלי זה ✓ היה מתפרסם גם כשהאתר נשאר על גרסה קודמת — וזה בדיוק מה שקרה.
#
# הרצה: npm run deploy   ·   על עץ עבודה מלוכלך: npm run deploy -- --allow-dirty
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BRANCH="gh-pages"
WORKTREE=".deploy"
SITE="https://tavorsharf-lang.github.io/tavor-gym/"
REPO="tavorsharf-lang/tavor-gym"
ALLOW_DIRTY=0
[ "${1:-}" = "--allow-dirty" ] && ALLOW_DIRTY=1

cleanup() {
  git worktree remove "$WORKTREE" --force 2>/dev/null || true
  rm -rf "$ROOT/$WORKTREE"
}
trap cleanup EXIT

# ── שער 1: מה בדיוק נפרס ──
# הסקריפט בונה מהדיסק, לא מ-HEAD. עץ מלוכלך פירושו שהאתר מקבל קוד שלא נמצא
# בשום קומיט, והתווית על הפריסה תשקר.
#
# git status --porcelain ולא git diff: האחרון משווה רק קבצים *מנוטרים*, ולכן
# מסך חדש שלא עבר git add היה נבנה מהדיסק, נפרס, ומתויג ב-SHA שלא מכיל אותו —
# בדיוק התרחיש שהשער הזה קיים כדי למנוע. .deploy כבר ב-gitignore.
if [ "$ALLOW_DIRTY" -eq 0 ] && [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  echo "✗ יש שינויים לא מקובעים (כולל קבצים חדשים שלא נוספו)." >&2
  echo "  עשה commit, או הרץ: npm run deploy -- --allow-dirty" >&2
  git status --short >&2
  exit 1
fi

echo "▸ בדיקות"
npm test

echo "▸ בנייה"
npm run build

# כאן ולא רק ידנית: הכשל שהבדיקה תופסת הוא קובץ שנשמט מה-precache *בשקט*, והוא
# מתגלה רק כשמנסים להתאמן במצב טיסה — כלומר אחרי שהגרסה כבר באוויר.
echo "▸ משקל ההתקנה"
npm run check:size

# בלי הקובץ הזה Jekyll של GitHub מעבד את התיקייה ומתעלם מקבצים שמתחילים ב-_
touch dist/.nojekyll

BUNDLE="$(basename "$(ls dist/assets/index-*.js | head -1)")"

echo "▸ הכנת ענף $BRANCH"
git worktree remove "$WORKTREE" --force 2>/dev/null || true
rm -rf "$WORKTREE"

# ls-remote מחזיר 2 כשהענף לא קיים, וכל קוד אחר הוא תקלת רשת או הרשאה.
# בלי ההבחנה הזו נפילת רשת הייתה נראית כמו "אין ענף" ומייצרת ענף יתום חדש.
set +e
git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1
RC=$?
set -e

if [ "$RC" -eq 0 ]; then
  git fetch --quiet origin "$BRANCH"
  git worktree add --quiet "$WORKTREE" -B "$BRANCH" "origin/$BRANCH"
elif [ "$RC" -eq 2 ]; then
  # פעם ראשונה — ענף יתום, בלי היסטוריית הקוד. הענף מכיל רק תוצר בנייה.
  git worktree add --quiet --detach "$WORKTREE"
  git -C "$WORKTREE" checkout --quiet --orphan "$BRANCH"
  git -C "$WORKTREE" rm --quiet -rf . 2>/dev/null || true
else
  echo "✗ לא הצלחתי להגיע ל-origin (קוד $RC) — בדוק רשת או הרשאות" >&2
  exit 1
fi

echo "▸ העתקת dist"
# מנקה הכל חוץ מ-.git כדי שקבצים שנמחקו מהבנייה יימחקו גם מהאתר
find "$WORKTREE" -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
cp -R dist/. "$WORKTREE"/

SHA="$(git rev-parse --short HEAD)"
SUBJECT="$(git log -1 --pretty=%s)"
[ "$ALLOW_DIRTY" -eq 1 ] && SUBJECT="$SUBJECT (+ שינויים לא מקובעים)"

(
  cd "$WORKTREE"
  git add -A
  if git diff --cached --quiet; then
    # קומיט ריק בכוונה: Pages בונה רק בתגובה לדחיפה, ולפעמים צריך לעורר בנייה
    # מחדש אחרי בנייה שנתקעה — בלי לשנות ולו בית אחד בתוצר.
    git -c user.name="Tavor Sharf" -c user.email="tavorsharf@gmail.com" \
      commit --quiet --allow-empty -m "פריסה מחדש מ-$SHA"
  else
    git -c user.name="Tavor Sharf" -c user.email="tavorsharf@gmail.com" \
      commit --quiet -m "פריסה מ-$SHA — $SUBJECT"
  fi
  git push --quiet --force origin "$BRANCH"
)
PUSHED_SHA="$(git -C "$ROOT/$WORKTREE" rev-parse HEAD)"
echo "▸ נדחף ל-$BRANCH ($PUSHED_SHA)"

# ── שער 2: פורסם באמת? ──
#
# דחיפה מוצלחת אינה פרסום. Pages בונה מהענף, והבנייה הזו כבר נתקעה ונכשלה.
#
# לולאה אחת ולא שתיים, וזה תיקון של באג ולא סידור:
#   • קודם היו שתי לולאות בסדרה. הראשונה שאלה את ה-API והשנייה בדקה את הקובץ.
#     בתרחיש הכישלון המוכר — בנייה איטית — ה-API החזיר 'built' של הבנייה
#     ה*קודמת*, הלולאה הראשונה נשברה מיד, וכל ההמתנה האמיתית נפלה על השנייה:
#     חמש דקות בלבד, ואז ✗ שקרי ששולח להריץ שוב לחינם.
#   • וכש-gh לא מותקן או לא מחובר, הלולאה הראשונה שרפה עשר דקות שלמות לפני
#     שמישהו בכלל ניסה לגשת לאתר — גם כשהוא כבר עודכן.
#
# הסדר כאן הפוך ומכוון: הקובץ שהשרת מגיש הוא האמת הסופית, וה-API הוא רק
# מקור לזיהוי כישלון מוקדם.
DEADLINE=$(( $(date +%s) + 1800 ))  # 30 דקות
GH_OK=1
command -v gh >/dev/null 2>&1 || GH_OK=0

echo "▸ ממתין לפרסום (עד 30 דקות)"
while :; do
  if curl -sf -o /dev/null "$SITE/assets/$BUNDLE"; then
    echo "✓ פורסם — $SITE"
    exit 0
  fi

  if [ "$GH_OK" -eq 1 ]; then
    BUILD="$(gh api "repos/$REPO/pages/builds/latest" --jq '.status + " " + (.commit // "")' 2>/dev/null || echo '?')"
    STATUS="${BUILD%% *}"
    BUILD_SHA="${BUILD#* }"
    #
    # 'errored' מפיל רק אם הוא שייך לדחיפה *הזו*.
    #
    # ‎builds/latest מחזיר את הבנייה האחרונה שהסתיימה, לא בהכרח את זו שנוצרה
    # לפני שנייה. אחרי בנייה קודמת שנכשלה — בדיוק התרחיש שהקובץ הזה קיים
    # בשבילו — האיטרציה הראשונה הייתה קוראת את הכישלון הישן ומפילה פריסה
    # תקינה תוך שנייה, בלי לתת ל-Pages בכלל להתחיל.
    if [ "$STATUS" = "errored" ] && [ "$BUILD_SHA" = "$PUSHED_SHA" ]; then
      echo "✗ בניית Pages נכשלה. הרץ שוב — קומיט חדש לענף בדרך כלל מעורר בנייה תקינה." >&2
      exit 1
    fi
    # gh קיים אבל לא מחובר / אין הרשאה — מפסיקים לשאול במקום לשאול לשווא
    if [ "$STATUS" = "?" ]; then GH_OK=0; fi
  fi

  if [ "$(date +%s)" -ge "$DEADLINE" ]; then
    echo "✗ עברו 30 דקות והאתר עדיין מגיש גרסה קודמת. $SITE" >&2
    echo "  בדוק את מצב הבנייה: https://github.com/$REPO/deployments" >&2
    exit 1
  fi
  sleep 10
done
