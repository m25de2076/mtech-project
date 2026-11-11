#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET="$ROOT_DIR/backend/assets/models/random_forest_final.joblib"

if [ $# -lt 1 ]; then
  echo "Usage: ./setup_model.sh /full/path/to/random_forest_final.joblib"
  exit 1
fi

SOURCE="$1"
if [ ! -f "$SOURCE" ]; then
  echo "Model file not found: $SOURCE"
  exit 1
fi

mkdir -p "$(dirname "$TARGET")"
cp "$SOURCE" "$TARGET"
echo "Model installed at: $TARGET"
