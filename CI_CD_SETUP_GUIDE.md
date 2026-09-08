# 🚀 CI/CD Pipeline Setup & Verification Guide

This repository is equipped with an automated **CI/CD pipeline using GitHub Actions** ([.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml)).

---

## 🏗️ How It Works

```mermaid
flowchart TD
    A["Git Push / PR to master"] --> B["Stage 1: CI (Quality Gates)"]
    subgraph CI ["Automated Checks"]
        B1["Backend Jest Unit Tests (23 tests)"]
        B2["Frontend ESLint Validation"]
        B3["Frontend Vite Production Build"]
        B4["Backend Docker Container Build Check"]
    end
    B --> B1 & B2 & B3 & B4
    B1 & B2 & B3 & B4 --> C{"All Checks Pass?"}
    C -- No --> D["❌ Halt & Block Deployment"]
    C -- Yes --> E["🚀 Stage 2: Deploy Backend to Google Cloud Run"]
    C -- Yes --> F["🌐 Vercel: Auto-deploy Frontend via GitHub Integration"]
```

---

## 🔒 Security: Keyless Workload Identity Federation

Your Google Cloud project (`project-40dd357d-acda-45a7-a15`) is linked directly to your GitHub repository (`aaditya156/MiTime_Org1`). 

* **No `.json` secret keys required in GitHub!**
* Authentication uses short-lived, encrypted OIDC tokens.
* Only commits and builds from `aaditya156/MiTime_Org1` are authorized to deploy to your Cloud Run service `talent-iq-backend`.

---

## 🧪 Local Testing

You can run test suites locally at any time:

```bash
# Run all backend unit tests
npm test

# Run frontend linting
npm run lint

# Run frontend production build
npm run build
```

---

## 🚢 Triggering Your First Automated Deployment

To deploy your changes automatically:

```bash
git add .
git commit -m "feat: setup automated CI/CD with tests and Google Cloud Run deployment"
git push origin master
```

You can watch the automated pipeline execute in real time under the **Actions** tab of your GitHub repository.
