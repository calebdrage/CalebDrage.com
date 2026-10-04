# Caleb Drage portfolio

A dependency-free static portfolio. Personal content lives in `content.json`;
the build generates HTML so the site works without client-side JavaScript.

## Edit the portfolio

1. Edit `content.json` to update your introduction, skills, contact links, or projects.
2. For each project, fill in `purpose`, `contribution`, `technologies`, `demo`, and `source` with verified details. Leave unavailable links as `null`.
3. Put approved screenshots in `public/images/` and set `screenshot` to `images/filename.png`, plus a descriptive `screenshotAlt`.
4. Put your public resume in `public/files/Caleb-Drage-Resume.pdf` and set `resume` to `files/Caleb-Drage-Resume.pdf`. Review its contact information before publishing it.
5. Run `npm run build`, then `npm run preview` and visit http://127.0.0.1:4173.
6. Commit and push to `main`. GitHub Actions rebuilds and deploys automatically.

No npm installation is needed. Use Node.js 22 or later. All local asset links are relative, so the site supports both a user site and a repository subpath.

## Initial free GitHub Pages setup

The browser must be signed in to the intended GitHub account. Create a **new public repository** named `portfolio` (or another unused name). Do not overwrite an existing repository or user site. Initialize it with a README if uploading through GitHub's browser.

From this directory, with GitHub CLI installed and authenticated:

```powershell
gh auth login
gh repo create portfolio --public --source=. --remote=origin
git push -u origin main
```

The CLI example assumes this directory has been initialized with Git and committed. Alternatively create the repository in the browser, then use `git remote add origin https://github.com/YOUR-USERNAME/portfolio.git` and push using Git's sign-in flow.

In the repository, open **Settings → Pages → Build and deployment → Source → GitHub Actions**. Then open **Actions → Deploy portfolio to GitHub Pages → Run workflow**, choosing `main`. The workflow's successful deployment links to the actual live URL, normally `https://YOUR-USERNAME.github.io/portfolio/`. Open that URL and verify it before sharing.

This setup uses public-repository GitHub Pages and requires no purchased domain or paid hosting. See [GitHub's Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Privacy

Only files intentionally placed in `public/` are copied into the deployed website. The repository itself is public: do not commit secrets, private documents, full private resumes, or credentials anywhere in it. `.env` files, generated output, and QA captures are ignored. There are no analytics, forms, external fonts, or third-party scripts.

## Content still needed

The initial content uses only the facts provided in the request. Contact URLs/email, resume, screenshots, project purposes/contributions/links, and a confirmed skills list can be added later. Missing links and unavailable resume/contact sections are omitted from the published page. Edit `content.json` and push to `main` to publish updates.
