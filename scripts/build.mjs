import { readFile, writeFile, mkdir, cp, access, rm } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const c = JSON.parse(await readFile(resolve(root, 'content.json'), 'utf8'));
const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const safeUrl = value => {
  if (!value) return null;
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('External links must use HTTPS without credentials');
  return url.href;
};
async function asset(path) {
  if (!path || path.startsWith('/') || path.includes('\\')) throw new Error('Assets must use relative paths');
  const publicDir = resolve(root, 'public');
  const full = resolve(publicDir, path);
  if (relative(publicDir, full).startsWith('..')) throw new Error('Asset is outside public directory');
  await access(full);
  return './' + path.split('/').map(encodeURIComponent).join('/');
}
if (!c.name || !Array.isArray(c.projects) || !Array.isArray(c.skills) || !Array.isArray(c.heroHeading)) throw new Error('Invalid portfolio content');
if (c.email && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(c.email)) throw new Error('Invalid contact email');
const ids = new Set();
for (const p of c.projects) {
  if (!/^[a-z][a-z0-9-]*$/.test(p.id) || ids.has(p.id)) throw new Error('Projects need unique lowercase IDs');
  ids.add(p.id);
  if (!Array.isArray(p.technologies) || !Array.isArray(p.features) || !Array.isArray(p.details)) throw new Error(`Invalid case study: ${p.id}`);
  if (p.interactiveDemo && !['stay-review', 'follow-comparison'].includes(p.interactiveDemo)) throw new Error(`Unknown demo: ${p.interactiveDemo}`);
}
const contactLinks = [c.github && ['GitHub',safeUrl(c.github)], c.linkedin && ['LinkedIn',safeUrl(c.linkedin)]].filter(Boolean);
const resume = c.resume ? await asset(c.resume) : null;
if (resume && !c.resume.toLowerCase().endsWith('.pdf')) throw new Error('Resume must be a PDF');
const siteUrl = safeUrl(process.env.SITE_URL || c.siteUrl);
const external = (label,url) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>`;
const tags = values => `<ul class="tags" aria-label="Technologies">${values.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;

function demo(type, id) {
  const heading = type === 'stay-review' ? 'When do dates conflict?' : 'Who is not following back?';
  const body = type === 'stay-review'
    ? 'Try the inclusive date-overlap rule from the staff review flow. All stays are fictional; status changes affect only this page.'
    : 'Try the real set-comparison rule on example usernames. This demo never connects to Instagram or collects account data.';
  const interfaceHtml = type === 'stay-review' ? `
    <div class="demo-toolbar"><button type="button" data-preset="overlap">Overlapping request</button><button type="button" data-preset="clear">Clear dates</button><button type="button" data-reset-stay>Reset demo</button></div>
    <div class="stay-demo-layout"><div><div class="date-fields"><label for="${id}-arrival">Arrival<input id="${id}-arrival" name="arrival" type="date" required></label><label for="${id}-departure">Departure<input id="${id}-departure" name="departure" type="date" required></label></div>
    <p class="demo-message" data-range-message role="status"></p><div class="demo-calendar"><h5 data-month-heading></h5><div class="calendar-weekdays" aria-hidden="true">${['S','M','T','W','T','F','S'].map(d=>`<span>${d}</span>`).join('')}</div><div class="calendar-grid" data-calendar></div></div>
    <div class="calendar-legend"><span><i class="legend-approved" aria-hidden="true"></i>Approved stay</span><span><i class="legend-request" aria-hidden="true"></i>Request</span><span><i class="legend-overlap" aria-hidden="true"></i>Overlap</span></div><p class="demo-day" data-day-message role="status">Choose a date to inspect the sample stays.</p></div>
    <div class="review-pane"><p class="eyebrow">Sample application</p><h5>Stay request</h5><p class="status-line">Status: <strong data-request-status>Pending</strong></p><div data-approved-stays></div><p class="demo-message" data-conflict-message role="status"></p>
    <div class="demo-actions"><button type="button" data-status="pending">Keep pending</button><button type="button" data-status="denied">Deny request</button><button type="button" data-status="approved">Review approval</button><button type="button" data-status="spam">Mark as spam</button></div>
    <div class="demo-confirm" data-confirm hidden><p data-confirm-text></p><div class="demo-actions"><button type="button" data-confirm-yes>Confirm change</button><button type="button" data-confirm-cancel>Cancel</button></div></div><p data-action-message role="status" class="demo-day"></p></div></div>` : `
    <form data-comparison-form><div class="comparison-inputs"><label for="${id}-followers">Followers<textarea id="${id}-followers" name="followers" rows="5" maxlength="8000" spellcheck="false" autocapitalize="none"></textarea></label><label for="${id}-following">Following<textarea id="${id}-following" name="following" rows="5" maxlength="8000" spellcheck="false" autocapitalize="none"></textarea></label></div>
    <p class="demo-hint">One username per line. Duplicate entries are counted once.</p><div class="demo-actions"><button type="submit" class="demo-primary">Compare lists</button><button type="button" data-reset-follow>Reset sample lists</button><a data-export download="sample-not-following-back.csv" hidden>Export demo CSV ↓</a></div></form>
    <div class="comparison-result"><p role="status" data-comparison-message>Compare the sample lists to see the result.</p><ul data-result-list aria-label="Not Following Back results"></ul></div>`;
  return `<section class="interactive-demo" aria-labelledby="${id}-demo-title" data-demo="${type}"><div class="demo-heading"><span class="demo-badge">Interactive demo · sample data</span><h4 id="${id}-demo-title">${heading}</h4><p>${body}</p></div><noscript><p>Enable JavaScript to try this optional demo. The full case study is available above.</p></noscript><div data-enhance hidden>${interfaceHtml}</div></section>`;
}

const screenshots = new Map();
const cards = await Promise.all(c.projects.map(async (p, i) => {
  const image = p.screenshot ? await asset(p.screenshot) : null;
  if (image && !p.screenshotAlt) throw new Error('Screenshots need descriptive alt text');
  screenshots.set(p.id, image);
  const walkthrough = p.walkthrough ? await asset(p.walkthrough) : null;
  const links = [[p.demoLabel || 'Live demo',safeUrl(p.demo)], ['Source code',safeUrl(p.source)], [p.releaseLabel || 'Release',safeUrl(p.release)]].filter(([,url])=>url);
  return `<article class="project-card ${p.previewKind === 'phone' ? 'project-phone' : ''}" id="${esc(p.id)}" aria-labelledby="${p.id}-title">
    <div class="project-intro"><div class="project-topline"><p class="eyebrow">${esc(p.category)}</p><span class="project-index" aria-hidden="true">${String(i+1).padStart(2,'0')}</span></div><h3 id="${p.id}-title">${esc(p.name)}</h3><p class="project-label">${esc(p.label)}</p><p class="project-description">${esc(p.description)}</p>${tags(p.technologies.slice(0,4))}</div>
    <figure class="project-preview">${image ? `<div class="preview-stage"><img src="${image}" alt="${esc(p.screenshotAlt)}" width="${p.previewKind === 'phone' ? '800' : '1200'}" height="${p.previewKind === 'phone' ? '1739' : '800'}" loading="lazy" decoding="async"></div>` : '<div class="preview-placeholder">Screenshot to be added</div>'}<figcaption>${esc(p.previewCaption || 'Screenshot to be added.')}</figcaption></figure>
    <details class="case-study" id="${p.id}-case"><summary><span>Explore project<span class="sr-only">: ${esc(p.name)}</span></span><span class="summary-meta">${p.interactiveDemo ? 'Case study + demo' : 'Case study'} <i aria-hidden="true">+</i></span></summary><div class="case-content"><div class="case-lead"><div><p class="eyebrow">The goal</p><p>${esc(p.purpose)}</p></div><div><p class="eyebrow">What I built</p><p>${esc(p.contribution)}</p></div></div><h4>Working features</h4><ul class="feature-list">${p.features.map(f=>`<li>${esc(f)}</li>`).join('')}</ul><h4>Under the surface</h4><div class="implementation-list">${p.details.map(d=>`<section><h5>${esc(d.title)}</h5><p>${esc(d.body)}</p></section>`).join('')}</div><h4>Technologies</h4>${tags(p.technologies)}${links.length ? `<div class="project-links">${links.map(([label,url])=>external(label,url)).join('')}</div>` : ''}
    ${walkthrough ? `<section class="walkthrough" aria-labelledby="${p.id}-walkthrough-title"><h4 id="${p.id}-walkthrough-title">From controls to introduction</h4><p>The original simulator recording. Playback starts only when you choose it.</p><img data-walkthrough-image src="${image}" data-poster="${image}" data-animation="${walkthrough}" alt="Original ${esc(p.name)} simulator walkthrough" width="800" height="1739" loading="lazy"><button type="button" data-walkthrough-button data-enhance hidden aria-pressed="false">Play walkthrough</button></section>` : ''}${p.interactiveDemo ? demo(p.interactiveDemo,p.id) : ''}</div></details></article>`;
}));
const description = `${c.name}, ${c.title} at ${c.university}, graduating ${c.graduation}. Web, desktop, and iOS project case studies.`;
const toolkit = c.skills.length ? c.skills : [...new Set(c.projects.flatMap(p=>p.technologies))];
const findProject = id => c.projects.find(p=>p.id===id);
const heroProjects = (c.heroProjects || []).map(id=>findProject(id)).filter(p=>p&&screenshots.get(p.id));
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(c.name)} — Software portfolio</title><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#142322"><link rel="icon" type="image/svg+xml" href="./favicon.svg"><link rel="stylesheet" href="./styles.css">
<meta property="og:type" content="website"><meta property="og:locale" content="en_US"><meta property="og:title" content="${esc(c.name)} — Software portfolio"><meta property="og:description" content="${esc(description)}"><meta property="og:site_name" content="${esc(c.name)}"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="${esc(c.name)} — Software portfolio"><meta name="twitter:description" content="${esc(description)}">${siteUrl ? `<link rel="canonical" href="${esc(siteUrl)}"><meta property="og:url" content="${esc(siteUrl)}">` : ''}
<script type="module" src="./app.mjs"></script></head><body><a class="skip" href="#main">Skip to content</a>
<header class="header"><a class="brand" href="#home" aria-label="${esc(c.name)} home">cd<span>.</span><span class="brand-name">${esc(c.name)}</span></a><nav aria-label="Main navigation"><a href="#projects">Work</a><a href="#about">About</a><a href="#skills">Technologies</a>${resume ? '<a href="#resume">Resume</a>' : ''}${c.email || contactLinks.length ? '<a href="#contact">Connect ↗</a>' : ''}</nav></header>
<main id="main" tabindex="-1"><section class="hero" id="home" aria-labelledby="intro-heading"><div class="hero-copy"><p class="eyebrow"><span class="status-dot" aria-hidden="true"></span>${esc(c.name)} / ${esc(c.title)}</p><h1 id="intro-heading">${c.heroHeading.map((line,i)=>`<span${i===1?' class="hero-italic"':''}>${esc(line)}</span>`).join('')}</h1><p class="intro">${esc(c.intro)}</p><a class="button" href="#projects">Explore the work <span aria-hidden="true">↘</span></a><p class="availability">${esc(c.availability)}</p></div><div class="work-collage" aria-label="Actual project interfaces">${heroProjects.map(p=>`<a class="collage-item collage-${p.id}" href="#${p.id}" aria-label="Explore ${esc(p.name)}"><img src="${screenshots.get(p.id)}" alt="" width="${p.previewKind==='phone'?'800':'1200'}" height="${p.previewKind==='phone'?'1739':'800'}" fetchpriority="${p.id==='boca'?'high':'auto'}"><span>${esc(p.name)} <i aria-hidden="true">↗</i></span></a>`).join('')}<p class="collage-caption">Real interfaces. Explore a project.</p></div></section>
<div class="intro-strip"><span>Web · Desktop · iOS</span><span>${esc(c.university)} / ${esc(c.graduation)}</span></div>
<section class="section work" id="projects" aria-labelledby="projects-heading"><div class="section-heading"><div><p class="eyebrow">01 / Selected work</p><h2 id="projects-heading">The work,<br><em>and the decisions.</em></h2></div><p class="section-note">Open a case study.<br>See the details. Try the logic.</p></div><div class="project-grid">${cards.join('')}</div></section>
<section class="section about" id="about" aria-labelledby="about-heading"><div><p class="eyebrow">02 / About</p><h2 id="about-heading">Caleb,<br><em>in context.</em></h2></div><div class="section-content"><p class="about-copy">${esc(c.about)}</p><dl class="facts"><div><dt>Education</dt><dd>Computer Science<br>${esc(c.university)}</dd></div><div><dt>Graduation</dt><dd>${esc(c.graduation)}</dd></div></dl></div></section>
<section class="section skills" id="skills" aria-labelledby="skills-heading"><div><p class="eyebrow">03 / Technologies</p><h2 id="skills-heading">Used in<br><em>these projects.</em></h2></div><div class="section-content"><p class="section-note">${c.skills.length ? 'My toolkit.' : 'Technologies represented in the project code.'}</p><ul class="skill-list">${toolkit.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></div></section>
${resume ? `<section class="section resume" id="resume" aria-labelledby="resume-heading"><div><p class="eyebrow">Resume</p><h2 id="resume-heading">The essentials.</h2></div><div class="section-content"><a class="button" href="${resume}" download="${esc(c.name.replaceAll(' ','-'))}-Resume.pdf">Download resume (PDF) ↓</a></div></section>` : ''}
${c.email || contactLinks.length ? `<section class="contact" id="contact" aria-labelledby="contact-heading"><div><p class="eyebrow">The next project</p><h2 id="contact-heading">Let's connect<span>.</span></h2><p>${esc(c.availability)}.</p></div><div class="contact-links">${c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)} ↗</a>` : ''}${contactLinks.map(([label,url])=>external(label,url)).join('')}</div></section>` : ''}</main>
<footer class="footer"><span>© ${new Date().getUTCFullYear()} ${esc(c.name)}</span><span>Built with HTML, CSS & JavaScript.</span><a href="#home">Back to top ↑</a></footer><script type="application/json" id="demo-data">${JSON.stringify(c.demoData).replace(/</g,'\\u003c')}</script></body></html>`;

const dist = resolve(root, 'dist');
// dist is a fixed, generated directory inside this checkout, never user-supplied.
await rm(dist, {recursive:true, force:true});
await mkdir(dist,{recursive:true});
await cp(resolve(root,'public'),dist,{recursive:true});
await writeFile(resolve(dist,'index.html'),html);
await writeFile(resolve(dist,'.nojekyll'),'');
await writeFile(resolve(dist,'404.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found — ${esc(c.name)}</title></head><body><h1>Page not found.</h1><p>Return to <a href="${siteUrl ? esc(siteUrl) : './'}">${esc(c.name)}'s portfolio</a>.</p></body></html>`);
if (siteUrl) await writeFile(resolve(dist,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${esc(siteUrl)}</loc></url></urlset>`);
console.log(`Built ${c.projects.length} verified case studies. Demo types: ${c.projects.filter(p=>p.interactiveDemo).map(p=>p.interactiveDemo).join(', ')}. Resume: ${Boolean(resume)}.`);
