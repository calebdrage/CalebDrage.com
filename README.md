# Caleb Drage portfolio

A static portfolio with four verified project case studies, real interface previews, native expandable details, and two browser-only demos. It uses HTML, CSS, JavaScript modules, and a small Node.js build script. No backend, paid service, analytics, external fonts, or npm dependencies are needed.

**Current live site:** https://calebdrage.github.io/CalebDrage.com/

**This upgrade is local and awaiting review. Do not push or deploy it until Caleb approves.** The existing public site remains unchanged. Work is on local branch `portfolio-case-studies-review`.

## Preview and checks

Use Node.js 22 or later. No `npm install` is needed.

```powershell
npm run check
npm run preview
```

Open http://127.0.0.1:4173. `check` runs the production build and automated tests; `preview` serves the generated `dist` folder. After editing, rerun `npm run build` and refresh the browser. Stop the preview with Ctrl+C.

Case-study text and images remain readable without JavaScript. JavaScript enables the optional demos and explicit GIF playback. Missing contact details and resumes are omitted; GitHub is linked using the verified account URL.

## Update a project

All personal text, project content, links, preview paths, and sample data live in **`content.json`**.

- Edit `description` for the short project-card summary.
- Edit `purpose` and `contribution` for the case study's goal and what Caleb built.
- Use `features` for implemented behavior and `details` for important code decisions or limitations.
- List technologies supported by the code in `technologies`. No skill percentages are used.
- Set a missing `demo`, `source`, or `release` to `null`. Label a distribution release as a release, not source code.
- `heroHeading` and `heroProjects` control the introduction and clickable screenshot collage.
- `demoData` holds only fictional examples. Never add real applicant or account information.

## Add a project

Copy an existing project object in the `projects` array, then replace its fields. Use a unique lowercase, hyphenated `id` such as `my-project`; this becomes its link target (`#my-project`). The card and expandable case study are generated automatically.

For a new project without a verified demo, set `interactiveDemo` to `null`. The existing values `stay-review` and `follow-comparison` are specific to those two implementations; adding a different demo requires JavaScript code and tests, not just a new label.

Do not invent missing features or claim ownership of coursework scaffolding. Confirm the code and record the relevant files in [the evidence notes](docs/project-evidence.md). Public links must be HTTPS. Private source is not copied into this repository or linked as if visitors can access it.

## Replace a screenshot

1. Capture the real interface using fictional data. Remove or avoid applicant names, emails, account lists, location details, student IDs, credentials, and other private information.
2. Save the image under `public/images/`, for example `public/images/my-project.jpg`.
3. Set `screenshot` to `images/my-project.jpg`, `screenshotAlt` to a useful description, and `previewCaption` to its provenance. Use `previewKind: "desktop"` for a browser/desktop view or `"phone"` for an iOS screen.
4. Set `walkthrough` to an approved relative GIF path if available, or `null`. A GIF never plays automatically; Play/Stop controls are in the case study, and closing it stops playback.
5. Run `npm run check` and inspect both phone and desktop layouts.

Set `screenshot` to `null` if no real image is available. The card shows a clearly marked screenshot slot. Avoid fabricated interface screenshots.

To add a resume later, put an approved PDF in `public/files/`, set `resume` to its relative path, then verify the download. Add only the contact information intended for public use in `email` and `linkedin`.

## What the demos represent

**Boca stay review:** inclusive arrival/departure overlap warnings, date inspection, and confirmed sample status changes. It is a simplified representation with fixed fictional stays; it does not claim room-capacity calculation, submit applications, contact staff, or write to a database. The real project's production launch is not established by its code or preview.

**Instagram comparison:** deduplicated username lists, sorted Following-minus-Followers results, and quoted CSV output. It does not sign in, scrape, or connect to Instagram. The exported filename begins with `sample-`. Editing a list invalidates the old export; compare again to generate a new link. CSV downloads use a standard browser download link with a local data URI and require no service.

The original Instagram interface screenshot is a local render of its HTML/CSS. The Boca image captures the actual public preview. Both iOS stills come from the original recordings. The Scavenger Hunt GIF is not published because it includes a student ID; only a safe detail-screen frame is used. Its photo flow requires location metadata and task state is in memory. Task creation is not claimed because the controller linked by Xcode is a stub.

## After review approval

GitHub Pages is already configured with **GitHub Actions** as its source. The existing `.github/workflows/deploy.yml` builds and deploys on pushes to `main`. No domain purchase or hosting payment is needed.

After the local changes are committed and approved, merge the review branch into `main`, then push `main`. Wait for the Actions deployment to succeed and open the actual live URL before sharing the update. Pushing `main` publishes immediately; do not do it during review.

The build gets its canonical URL from the deployment workflow and uses relative asset paths, so it works at the `/CalebDrage.com/` project subpath. Preview files and private code audits are not deployment inputs.

## Files

- `content.json`: editable portfolio content and fictional demo data
- `scripts/build.mjs`: validates assets/links and renders static HTML
- `public/styles.css`: responsive styling and reduced-motion overrides
- `public/app.mjs`: local demo controls and walkthrough playback
- `public/demo-logic.mjs`: tested date, comparison, and CSV calculations
- `public/images/`: approved interface captures and walkthrough assets
- `tests/`: boundary, export, navigation, build-output, and privacy checks
- `docs/project-evidence.md`: source evidence, attribution, and implementation limits

Only `public/` assets and generated pages go into `dist`. The source repository is public too, so keep secrets and private documents out of every tracked directory. `.env` files, generated output, and `.qa/` captures are ignored.
