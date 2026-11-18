# kasramalih.github.io

## Updating the CV

Edit the CV in its private Overleaf project. The `Sync CV from Overleaf`
workflow checks for changes every six hours and updates
`assets/Kasra_Malihi_CV.pdf` after a successful build. To publish sooner,
open **Actions → Sync CV from Overleaf → Run workflow** on `main`.

In **Settings → Secrets and variables → Actions**, configure these repository secrets:

- `OVERLEAF_PROJECT_ID` — the last component of the URL in Overleaf’s **Integrations → Git** dialog.
- `OVERLEAF_GIT_TOKEN` — a Git authentication token generated in Overleaf.

The default compiler is pdfLaTeX. The workflow uses `main.tex` if present,
or finds the single `.tex` file declaring a document class. For another
configuration, set the Actions **variables** `OVERLEAF_MAIN_FILE` (a path
relative to the project root) and/or `OVERLEAF_ENGINE` (`pdflatex`,
`xelatex`, or `lualatex`) to match the Overleaf project.

The private checkout and compiler log stay on the temporary runner. The
workflow publishes the PDF at its existing URL and checks the served file.
