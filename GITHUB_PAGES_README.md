# Portfolio Website — GitHub Pages Deployment Guide

## What's Included

- **Home** — Hero, highlights, featured projects
- **Projects** — Active Directory Home Lab, Cloud Infrastructure Lab, PowerShell Automation Scripts
- **Experience** — Best Buy, Staples, South Shore Charter Public School internship
- **Skills** — Categorized by Systems, Networking, Tools, Cloud, Scripting, IT Support
- **About** — Bio and learning goals
- **Contact** — Email, LinkedIn, GitHub

---

## Quick Start: Deploy to GitHub Pages

### Option A: Automatic Deployment (Recommended)

This project includes a GitHub Actions workflow that deploys automatically when you push to `main`.

1. **Create a new GitHub repository** (e.g., `gavinzola.github.io` for a root domain, or any repo name for a project page)

2. **Copy the contents of this folder** into your new repository root

3. **Enable GitHub Pages** in your repository settings:
   - Go to Settings → Pages
   - Under "Source", select **GitHub Actions**

4. **Push to the `main` branch** — the workflow will build and deploy automatically

5. Your site will be live at:
   - `https://<your-username>.github.io` (if repo is named `<username>.github.io`)
   - `https://<your-username>.github.io/<repo-name>/` (for any other repo name)

---

### Option B: Manual Build + Upload

If you prefer not to use GitHub Actions:

1. Install Node.js 20+ and pnpm: `npm install -g pnpm`

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Build for GitHub Pages:
   ```bash
   pnpm run build:github
   ```

4. Copy `index.html` to `404.html` (for SPA routing):
   ```bash
   cp dist-github/index.html dist-github/404.html
   ```

5. Upload the contents of `dist-github/` to GitHub Pages using the "Deploy from a branch" option (usually the `gh-pages` branch)

---

## Updating Content

All resume content lives in one file:

```
src/data/resume.ts
```

Edit this file to:
- Update job experience, dates, or bullet points
- Add real project details when you complete them
- Update your email, GitHub URL, and LinkedIn URL
- Add or remove skills

After editing, commit and push — the site deploys automatically.

---

## Project Structure

```
src/
├── data/
│   └── resume.ts          ← All your content lives here
├── pages/
│   ├── home.tsx
│   ├── projects.tsx
│   ├── experience.tsx
│   ├── skills.tsx
│   ├── about.tsx
│   └── contact.tsx
├── components/
│   └── Nav.tsx
└── App.tsx
```

---

## Notes

- **SPA Routing**: The `404.html` trick is used so GitHub Pages serves the React app for all routes (e.g., `/projects`, `/skills`). The GitHub Actions workflow handles this automatically.
- **No backend required**: This is a fully static site — no server, no database, no API keys.
- **Mobile-friendly**: The layout is responsive and works on all screen sizes.
