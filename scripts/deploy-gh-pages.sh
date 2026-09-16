#!/usr/bin/env bash
# FALLBACK ONLY. The supported deploy is .github/workflows/deploy.yml (actions/deploy-pages,
# Pages source: GitHub Actions). Use this script only if Pages is switched to the branch
# source; running both mechanisms against one repository will make them overwrite each other.
#
# Builds and force-publishes dist/ to the gh-pages branch.
set -euo pipefail
cd "$(dirname "$0")/.."
# vite.config.ts defaults BASE_PATH to "/" (the custom domain). Do not pass it through the
# environment from Git Bash on Windows: MSYS rewrites "/..." values into Windows paths.
npm run build
rm -rf .gh-pages-tmp && mkdir .gh-pages-tmp && cp -r dist/. .gh-pages-tmp/ && touch .gh-pages-tmp/.nojekyll
cd .gh-pages-tmp && git init -q -b gh-pages && git add -A && git -c user.name="$(git -C .. config user.name)" -c user.email="$(git -C .. config user.email)" commit -q -m "Publish $(git -C .. rev-parse --short HEAD)" && git -c credential.helper= -c "credential.helper=!gh auth git-credential" push -f "$(git -C .. remote get-url origin)" gh-pages:gh-pages
cd .. && rm -rf .gh-pages-tmp
