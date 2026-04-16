#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/var/www/sertifikasifit.com"
BRANCH="${1:-main}"

cd "$REPO_DIR"

git pull --rebase --autostash origin "$BRANCH"
apache2ctl -t
systemctl reload apache2

echo "Deploy complete for $REPO_DIR on branch $BRANCH"
