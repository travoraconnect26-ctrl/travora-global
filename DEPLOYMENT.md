# Publish the current TRAVORA website

The repository now includes an automatic GitHub Pages workflow at `.github/workflows/pages.yml`.

One repository setting must be enabled by the repository owner:

1. Open the [TRAVORA repository settings](https://github.com/travoraconnect26-ctrl/travora-global/settings/pages).
2. Open **Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Save if GitHub shows a Save button.
5. Open the repository's **Actions** tab and check the **Deploy TRAVORA to GitHub Pages** workflow. It runs on pushes to `main`.
6. When the deployment succeeds, open https://travoraconnect26-ctrl.github.io/travora-global/.

The GitHub Pages settings cannot be changed through the connected repository file editor. If Pages is already set to GitHub Actions, no additional setting change is needed; check the Actions tab for the deployment result.

The workflow uploads the static site from the repository root. It does not create live booking integrations or external travel APIs.
