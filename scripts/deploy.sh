#!/usr/bin/env bash
#
# פריסה ידנית ל-GitHub Pages, דרך ענף gh-pages.
#
# למה לא דרך Actions: שלב actions/deploy-pages על האתר הזה חרג דרך קבע
# מהטיימאאוט שלו — הארטיפקט כולל 32MB של סרטוני הדגמה — ואז ביטל את הפריסה
# והשאיר את האתר על גרסה ישנה. דחיפה של תיקיית ה-build כענף רגיל לוקחת שניות
# ולא תלויה בתור ה-runner-ים.
#
# הבדיקות והבנייה הן השער: אם משהו מהם נכשל, שום דבר לא נדחף.
#
# הרצה: npm run deploy
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BRANCH="gh-pages"
WORKTREE=".deploy"

echo "▸ בדיקות"
npm test

echo "▸ בנייה"
npm run build

# בלי הקובץ הזה Jekyll של GitHub מעבד את התיקייה ומתעלם מקבצים שמתחילים ב-_
touch dist/.nojekyll

echo "▸ הכנת ענף $BRANCH"
git worktree remove "$WORKTREE" --force 2>/dev/null || true
rm -rf "$WORKTREE"

if git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
  git fetch --quiet origin "$BRANCH"
  git worktree add --quiet "$WORKTREE" -B "$BRANCH" "origin/$BRANCH"
else
  # פעם ראשונה — ענף יתום, בלי היסטוריית הקוד. הענף הזה מכיל רק תוצר בנייה.
  git worktree add --quiet --detach "$WORKTREE"
  git -C "$WORKTREE" checkout --quiet --orphan "$BRANCH"
  git -C "$WORKTREE" rm --quiet -rf . 2>/dev/null || true
fi

echo "▸ העתקת dist"
# מנקה הכל חוץ מ-.git כדי שקבצים שנמחקו מהבנייה יימחקו גם מהאתר
find "$WORKTREE" -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
cp -R dist/. "$WORKTREE"/

SHA="$(git rev-parse --short HEAD)"
SUBJECT="$(git log -1 --pretty=%s)"

cd "$WORKTREE"
git add -A
if git diff --cached --quiet; then
  echo "▸ אין שינוי בתוצר הבנייה — אין מה לפרוס"
else
  git -c user.name="Tavor Sharf" -c user.email="tavorsharf@gmail.com" \
    commit --quiet -m "פריסה מ-$SHA — $SUBJECT"
  git push --quiet --force origin "$BRANCH"
  echo "▸ נדחף ל-$BRANCH"
fi
cd "$ROOT"

git worktree remove "$WORKTREE" --force
echo "✓ https://tavorsharf-lang.github.io/tavor-gym/"
