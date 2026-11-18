#!/usr/bin/env bash
set -euo pipefail

source_dir="$RUNNER_TEMP/cv-source"
output_dir="$RUNNER_TEMP/cv-output"
mkdir -m 700 "$source_dir" "$output_dir"
git --git-dir="$RUNNER_TEMP/cv.git" archive HEAD | tar -x -C "$source_dir"
cd "$source_dir"

main_file="${MAIN_FILE:-}"
if [[ -z "$main_file" ]]; then
  if [[ -f main.tex ]]; then
    main_file=main.tex
  else
    mapfile -d '' -t documents < <(grep -rIlZ --include='*.tex' '^[[:space:]]*\\documentclass' .)
    if [[ ${#documents[@]} != 1 ]]; then
      echo "::error::Set the OVERLEAF_MAIN_FILE Actions variable to the project's main .tex path."
      exit 1
    fi
    main_file="${documents[0]}"
  fi
fi
if [[ "$(realpath -e -- "$main_file" 2>/dev/null || true)" != "$source_dir/"* || ! -f "$main_file" ]]; then
  echo "::error::The main .tex file must exist inside the Overleaf project."
  exit 1
fi

case "$ENGINE" in
  pdflatex) mode=-pdf ;;
  xelatex)  mode=-xelatex ;;
  lualatex) mode=-lualatex ;;
  *) echo "::error::Set OVERLEAF_ENGINE to pdflatex, xelatex or lualatex."; exit 1 ;;
esac

epoch=$(git --git-dir="$RUNNER_TEMP/cv.git" log -1 --format=%ct)
docker pull "$TEX_IMAGE" --quiet
# The compiler sees only the source tree and a fresh output directory. Its log
# can include private document text, so keep it off the public Actions console.
if ! docker run --rm --network none --user "$(id -u):$(id -g)" \
  -e HOME=/tmp -e TZ=UTC -e SOURCE_DATE_EPOCH="$epoch" -e FORCE_SOURCE_DATE=1 \
  -v "$source_dir:/work" -v "$output_dir:/out" -w /work "$TEX_IMAGE" \
  latexmk "$mode" -interaction=nonstopmode -halt-on-error -outdir=/out \
    -jobname=portfolio-cv "./$main_file" >/dev/null 2>&1; then
  echo "::error::CV compilation failed. Check the main file, compiler and compilation in Overleaf."
  exit 1
fi

pdf="$output_dir/portfolio-cv.pdf"
if ! command -v pdfdetach >/dev/null; then
  sudo apt-get -qq update
  sudo apt-get -qq install -y poppler-utils
fi
if [[ ! -s "$pdf" || -L "$pdf" ]] || ! pdfinfo "$pdf" >/dev/null 2>&1 ||
   [[ "$(LC_ALL=C pdfdetach -list "$pdf" 2>/dev/null)" != '0 embedded files' ]]; then
  echo "::error::Expected a readable CV PDF without embedded attachments."
  exit 1
fi
