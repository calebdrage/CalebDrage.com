# Project evidence and limits

Reviewed October 3, 2026. This document records why the case studies make their claims. It contains no account sessions, application records, student identifiers, environment values, or private project source.

## Boca Chesed House

Inspected the local project README, package manifest, `src/pages/HomePage.tsx`, `ApplyPage.tsx`, `StaffAccessPage.tsx`, and these files:

- `src/components/StayDatePicker.tsx`: React DayPicker range selection, past-date disabling, later-departure validation, clear/done controls, mobile month count, and focus restoration.
- `src/components/StaffStayCalendar.tsx` and `ApplicationStayCalendar.tsx`: status-based highlights, per-date matching stays, disclosure, and links to application details.
- `src/lib/stayRanges.ts`: inclusive overlap boundaries; only other approved stays warn; calendar matches include approved/pending/legacy waitlisted statuses.
- `src/components/ApplicationDetails.tsx`: refreshed approved ranges before approval, conflict choices, notes, confirmation, and status-update RPC calls.
- `src/lib/applicationStatus.ts`: Pending, Approved, Denied, Spam; legacy waitlisted values normalize to Pending in the current interface.
- `supabase/migrations/202609240003_reconcile_staff_authorization.sql`: authorized status update and history write; RLS; no direct browser status mutation.

The website preview URL comes from `PREVIEW.md` and was opened successfully during review. Its homepage was captured without using staff login or loading applicant information. The launch runbook has uncompleted production gates: **do not describe this as a launched production application**. The calendars visualize stays and conflicts; they do not establish room capacity or guarantee availability.

The portfolio demo is a simplified, browser-only adaptation of the inclusive overlap calculation, date inspection, and confirmed status actions. It omits staff authentication, notes, persistence, notifications, and backend operations. Its dates and records are fictional. An overlapping Pending request offers Keep Pending/Deny in the real app; approval refresh may produce a separate override-confirmation path. The demo exposes both paths together for exploration.

## Instagram Follow Checker

Inspected the local development README, manifest, `index.html`, `renderer.js`, `scraper.js`, `main.js`, `preload.js`, `result-view.js`, and tests. Development snapshot: `9946a37` plus the working source inspected during this review.

- `index.html`/`renderer.js`: manual login → profile → Followers → Following → results; collection counts, cancel/retry controls; result actions and settings.
- `scraper.js`: `compareUsernameSets`, deduplicated observations, sorted set difference, optional verified filtering, quoted CSV serialization.
- `main.js`: context isolation enabled, Node integration disabled, named IPC handlers, native CSV save dialog, clipboard actions.
- `result-view.js`: derives the displayed usernames from a completed unfiltered result.
- `package.json`: Electron, Playwright, Node.js, Electron Builder; installer and portable build targets.

The public [distribution repository](https://github.com/calebdrage/Instagram-Follow-Checker-Download) explicitly says it contains the compiled app, not original source. The [v2.2.0 release](https://github.com/calebdrage/Instagram-Follow-Checker-Download/releases/tag/v2.2.0) exists with its Windows installer. Label the link **Windows release**, never **Source code**. Original source remains private.

The screenshot renders the original local HTML/CSS home screen without Electron APIs or account data. The portfolio demo represents only sorted set difference and CSV formatting. Its counts are sample-data counts; it does not perform authentication or scraping. No CSVs from Documents were opened or copied.

## Scavenger Hunt

Inspected the local downloaded coursework project's README, Xcode project references, `Models/Task.swift`, `Task List/TaskListViewController.swift`, `Task Detail/TaskDetailViewController.swift`, `TaskAnnotationView.swift`, and `PhotoViewController.swift`.

- Task completion derives from an attached image. Task objects hold state in memory.
- The list reloads on return from a detail screen.
- The photo picker only permits one image and requires the selected Photos asset to have location metadata before attaching it.
- MapKit centers on that coordinate and uses a custom photo annotation.
- `PhotoViewController.swift`, attributed to Caleb in its header, displays the attached image with aspect-fit sizing.

The app includes coursework starter code with another author's headers. Do not claim the whole architecture was written from scratch. The Xcode file points to the root compose controller, which is a stub; **task creation is not claimed**, even though another compose implementation exists elsewhere in the folder. There is no established task persistence.

The local walkthrough shows task navigation and attachment UI, not a completed photo/map flow. The case study's map/photo claims come from code. Frame 33 is used because it has no student ID. The original GIF/README are excluded from public assets. No public source URL has been confirmed.

## Introduce Yourself / IOS102 Prework

Public repository: [Cdrage2022/IOS102Prework](https://github.com/Cdrage2022/IOS102Prework), inspected tree `68c6221b52b0d53e42a308af614725ea46b0b983`.

- README verifies Caleb's submission and lists the controls.
- `IOS102Prework/ViewController.swift` verifies the text fields, segmented year, stepper count update, switch, and `UIAlertController` introduction.
- The checked-in simulator GIF demonstrates those controls and the alert. Frame 16 is the still preview; the unchanged original GIF plays only on explicit request and can be stopped. Example values in the recording are not biographical claims.

No networking, storage, advanced validation, or other app is inferred from the coursework label. These two apps are presented separately; additional apps require their own source evidence.

## Asset review

All four previews come from the real interface or original recordings. No generated screenshots, fake results, stock photos, or private applicant/account screenshots are added. The Boca welcome-sign image is part of its actual site interface, not a new portfolio stock image. Local extraction/capture files stay in ignored `.qa/`.
