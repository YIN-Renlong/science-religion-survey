#!/usr/bin/env bash
set -euo pipefail

OWNER="YIN-Renlong"
REPO_NAME="science-religion-survey"
REPO="$OWNER/$REPO_NAME"
HTTPS_URL="https://github.com/${REPO}.git"
PROJECT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

for program in python3 git gh; do
  if ! command -v "$program" >/dev/null 2>&1; then
    echo "ERROR: $program is required. Install it, then rerun this script."
    exit 1
  fi
done
[ -f "$PROJECT/.survey-project.json" ] || { echo "ERROR: project marker missing."; exit 1; }
cd "$PROJECT"
python3 scripts/validate_data.py
gh auth status -h github.com || gh auth login --hostname github.com --git-protocol https --web
gh auth setup-git

if [ -d .git ]; then
  if ! git diff --cached --quiet; then
    echo "ERROR: existing staged changes found. Finish or unstage them before publishing; nothing was committed."
    exit 1
  fi
  CURRENT_BRANCH="$(git symbolic-ref --quiet --short HEAD || true)"
  if [ -n "$CURRENT_BRANCH" ] && [ "$CURRENT_BRANCH" != main ]; then
    echo "ERROR: the project is on branch $CURRENT_BRANCH, not main. No branch was renamed."
    exit 1
  fi
else
  git init
  git branch -M main
fi

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$HTTPS_URL"
else
  git remote add origin "$HTTPS_URL"
fi

REPO_EXISTS=0
if gh repo view "$REPO" >/dev/null 2>&1; then
  REPO_EXISTS=1
  if git ls-remote --exit-code origin HEAD >/dev/null 2>&1; then
    if ! gh api "repos/$REPO/contents/.survey-project.json?ref=main" --jq '.content' | python3 -c 'import sys,json,base64; d=json.loads(base64.b64decode(sys.stdin.read())); sys.exit(0 if d.get("project")=="science-religion-survey" and d.get("owner")=="YIN-Renlong" else 1)'; then
      echo "ERROR: the existing remote is not identified as this project on main. Nothing was pushed."
      exit 1
    fi
  fi
  if git ls-remote --exit-code origin refs/heads/main >/dev/null 2>&1; then
    git fetch origin main
    if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
      echo "ERROR: GitHub already has main history, but this local project has none. No remote history was overwritten."
      echo "Clone the existing repository into the project folder before rerunning the installer."
      exit 1
    fi
    if ! git merge-base --is-ancestor origin/main HEAD; then
      echo "ERROR: remote main contains commits missing locally. Reconcile the histories before rerunning; no force push was attempted."
      exit 1
    fi
  fi
fi

if ! git var GIT_AUTHOR_IDENT >/dev/null 2>&1; then
  ACCOUNT_NAME="$(gh api user --jq '.name // .login')"
  ACCOUNT_LOGIN="$(gh api user --jq '.login')"
  ACCOUNT_ID="$(gh api user --jq '.id')"
  git config --local user.name "$ACCOUNT_NAME"
  git config --local user.email "${ACCOUNT_ID}+${ACCOUNT_LOGIN}@users.noreply.github.com"
fi

git add -- .survey-project.json .gitignore .nojekyll index.html README.md DATA_NOTES.md VALIDATION.md CHANGELOG.md assets/css/styles.css assets/js/main.js assets/js/report.js assets/js/visuals.js assets/js/insights.js assets/js/data.js data/survey.json data/survey.csv scripts/extract_data.py scripts/validate_data.py scripts/validate_insights.cjs scripts/validate_report.cjs scripts/publish.sh package.json package-lock.json vite.config.js
if git diff --cached --quiet; then
  echo "No changes to commit."
else
  git commit -m "Update survey dashboard to v1.5 with contextual readings and wider presentation"
fi

if [ "$REPO_EXISTS" -eq 0 ]; then
  gh repo create "$REPO" --public --description "Interactive visualisation of the published Theos–Faraday–YouGov science and religion survey (2021)"
fi
git push -u origin main

PAGES_OK=1
if gh api "repos/$REPO/pages" >/dev/null 2>&1; then
  gh api --method PUT "repos/$REPO/pages" -f 'build_type=legacy' -f 'source[branch]=main' -f 'source[path]=/' >/dev/null || PAGES_OK=0
else
  gh api --method POST "repos/$REPO/pages" -f 'build_type=legacy' -f 'source[branch]=main' -f 'source[path]=/' >/dev/null || gh api --method PUT "repos/$REPO/pages" -f 'build_type=legacy' -f 'source[branch]=main' -f 'source[path]=/' >/dev/null || PAGES_OK=0
fi

echo ""
echo "Project: $PROJECT"
echo "Repository: https://github.com/$REPO"
echo "Local preview: http://localhost:8000 (run python3 -m http.server 8000 from the project folder)"
echo "Git status:"
git status --short
if [ "$PAGES_OK" -eq 1 ]; then
  echo "GitHub Pages configured: main /"
  echo "Pages URL: https://yin-renlong.github.io/$REPO_NAME/"
  echo "The initial Pages build may take a few minutes."
  BUILD_STATUS="$(gh api "repos/$REPO/pages/builds/latest" --jq '.status' 2>/dev/null || true)"
  if [ -n "$BUILD_STATUS" ]; then echo "Latest reported Pages build status: $BUILD_STATUS"; fi
else
  echo "The repository push succeeded, but Pages configuration failed."
  echo "Review the GitHub error above; rerunning this script will retry without creating an empty commit."
  exit 2
fi
