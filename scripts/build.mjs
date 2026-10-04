import { readFile, writeFile, mkdir, cp, access, rm } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const c = JSON.parse(await readFile(resolve(root, 'content.json'), 'utf8'));
const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const safeUrl = value => { if (!value) return null; const url = new URL(value); if (url.protocol !== 'https:') throw new Error('External links must use HTTPS'); return url.href; };
async function asset(path) {
  if (!path || path.startsWith('/') || path.includes('\\')) throw new Error('Assets must use relative paths');
  const full = resolve(root, 'public', path);
  const rel = relative(resolve(root, 'public'), full);
  if (rel.startsWith('..') || rel.includes(`${sep}..${sep}`)) throw new Error('Asset is outside public directory');
  await access(full);
  return './' + path.split('/').map(encodeURIComponent).join('/');
}
if (!c.name || !Array.isArray(c.projects) || !Array.isArray(c.skills)) throw new Error('Invalid portfolio content');
if (c.email && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(c.email)) throw new Error('Invalid contact email');
const links = [c.github && ['GitHub',safeUrl(c.github)], c.linkedin && ['LinkedIn',safeUrl(c.linkedin)]].filter(Boolean);
const resume = c.resume ? await asset(c.resume) : null;
if (c.resume && !c.resume.toLowerCase().endsWith('.pdf')) throw new Error('Resume must be a PDF');
const siteUrl = safeUrl(process.env.SITE_URL || c.siteUrl);
const external = (label,url) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>`;
const projects = await Promise.all(c.projects.map(async (p,i) => {
  const image = p.screenshot ? await asset(p.screenshot) : null;
  if (image && !p.screenshotAlt) throw new Error('Screenshots need descriptive alt text');
  const demo = safeUrl(p.demo), source = safeUrl(p.source);
  return `<article class="project">
    <div class="project-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</div>
    <div class="project-body"><p class="eyebrow">${esc(p.category)}</p><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p>
    ${p.purpose ? `<dl><dt>Purpose</dt><dd>${esc(p.purpose)}</dd>${p.contribution ? `<dt>My contribution</dt><dd>${esc(p.contribution)}</dd>` : ''}</dl>` : p.contribution ? `<dl><dt>My contribution</dt><dd>${esc(p.contribution)}</dd></dl>` : ''}
    ${p.technologies.length ? `<ul class="tags" aria-label="Project technologies">${p.technologies.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>` : ''}
    ${demo || source ? `<div class="project-links">${demo ? external('Live demo',demo) : ''}${source ? external('Source code',source) : ''}</div>` : ''}
    ${image ? `<figure><img src="${esc(image)}" alt="${esc(p.screenshotAlt)}" width="1200" height="750" loading="lazy" decoding="async"></figure>` : ''}</div>
    <span class="project-type" aria-hidden="true">${['WEB','iOS','APP'][i] || 'DEV'}</span></article>`;
}));
const description = `${c.name}, ${c.title} at ${c.university}, graduating ${c.graduation}. ${c.availability}.`;
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(c.name)} — ${esc(c.title)}</title><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#142322"><link rel="icon" type="image/svg+xml" href="./favicon.svg"><link rel="stylesheet" href="./styles.css">
<meta property="og:type" content="website"><meta property="og:locale" content="en_US"><meta property="og:title" content="${esc(c.name)} — Portfolio"><meta property="og:description" content="${esc(description)}"><meta property="og:site_name" content="${esc(c.name)}"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="${esc(c.name)} — Portfolio"><meta name="twitter:description" content="${esc(description)}">${siteUrl ? `<link rel="canonical" href="${esc(siteUrl)}"><meta property="og:url" content="${esc(siteUrl)}">` : ''}
</head><body><a class="skip" href="#main">Skip to content</a>
<header class="header"><a class="brand" href="#home" aria-label="${esc(c.name)} home">CD<span aria-hidden="true">.</span></a><nav aria-label="Main navigation"><a href="#about">About</a><a href="#projects">Projects</a><a href="#skills">Skills</a><a href="#resume">Resume</a><a href="#contact">Contact <span aria-hidden="true">↗</span></a></nav></header>
<main id="main"><section class="hero" id="home" aria-labelledby="intro-heading"><div class="hero-copy"><p class="eyebrow"><span class="status-dot" aria-hidden="true"></span> ${esc(c.title)} · FAU</p><h1 id="intro-heading">${esc(c.name.split(' ')[0])}<br><span>${esc(c.name.split(' ').slice(1).join(' '))}.</span></h1><p class="intro">${esc(c.intro)}</p><a class="button" href="#projects">Explore my projects <span aria-hidden="true">↘</span></a><p class="availability">${esc(c.availability)}</p></div><aside class="hero-card" aria-label="Education"><div class="card-monogram" aria-hidden="true">cd<span>_</span></div><div class="card-bottom"><p class="eyebrow">The next chapter</p><p class="card-title">Computer Science<br>${esc(c.graduation)}</p><p>${esc(c.university)}</p></div><span class="card-corner" aria-hidden="true">↗</span></aside><div class="hero-footer"><span>Web · iOS · Desktop</span><a href="#about">Get to know me <span aria-hidden="true">↓</span></a></div></section>
<section class="section about" id="about" aria-labelledby="about-heading"><div><p class="eyebrow">01 / About</p><h2 id="about-heading">A little<br>about me.</h2></div><div class="section-content"><p class="about-copy">${esc(c.about)}</p><dl class="facts"><div><dt>Education</dt><dd>Computer Science<br>${esc(c.university)}</dd></div><div><dt>Graduation</dt><dd>${esc(c.graduation)}</dd></div></dl></div></section>
<section class="section work" id="projects" aria-labelledby="projects-heading"><div class="section-heading"><div><p class="eyebrow">02 / Selected work</p><h2 id="projects-heading">Featured projects.</h2></div><p class="section-note">Websites, coursework,<br>and desktop software.</p></div><div class="projects">${projects.join('')}</div></section>
<section class="section skills" id="skills" aria-labelledby="skills-heading"><div><p class="eyebrow">03 / Skills</p><h2 id="skills-heading">My toolkit.</h2></div><div class="section-content">${c.skills.length ? `<ul class="skill-list">${c.skills.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>` : '<p class="body-large">Project technologies</p><ul class="skill-list">${[...new Set(c.projects.flatMap(p=>p.technologies))].map(t=>`<li>${esc(t)}</li>`).join('')}</ul>'}</div></section>
<section class="section resume" id="resume" aria-labelledby="resume-heading"><div><p class="eyebrow">04 / Resume</p><h2 id="resume-heading">The essentials.</h2></div><div class="section-content"><p class="body-large">${esc(c.title)}<br>${esc(c.university)}</p><p>Expected graduation: ${esc(c.graduation)}</p>${resume ? `<a class="button button-light" href="${esc(resume)}" download="Caleb-Drage-Resume.pdf">Download resume <span aria-hidden="true">↓</span><span class="sr-only"> (PDF)</span></a>` : ''}</div></section>
<section class="contact" id="contact" aria-labelledby="contact-heading"><p class="eyebrow">05 / Contact</p><h2 id="contact-heading">Let's connect<span>.</span></h2><p>${esc(c.availability)}.</p><div class="contact-links">${c.email ? `<a class="email" href="mailto:${esc(c.email)}">${esc(c.email)} <span aria-hidden="true">↗</span></a>` : ''}${links.map(([label,url])=>external(label,url)).join('')}</div></section></main>
<footer class="footer"><span>© ${new Date().getUTCFullYear()} ${esc(c.name)}</span><span>Computer Science · Florida Atlantic University</span><a href="#home">Back to top ↑</a></footer></body></html>`;
const dist = resolve(root, 'dist');
await rm(dist, {recursive:true, force:true});
await mkdir(dist,{recursive:true});
await cp(resolve(root,'public'),dist,{recursive:true});
await writeFile(resolve(dist,'index.html'),html);
await writeFile(resolve(dist,'.nojekyll'),'');
await writeFile(resolve(dist,'404.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found — Caleb Drage</title><body style="font-family:system-ui;padding:10%;background:#f6f4ed;color:#142322"><h1>Page not found.</h1><p>Return to <a href="${siteUrl ? esc(siteUrl) : './'}">Caleb's portfolio</a>.</p></body></html>`);
if (siteUrl) await writeFile(resolve(dist,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${esc(siteUrl)}</loc></url></urlset>`);
console.log(`Built ${c.projects.length} projects to dist. Contact: ${Boolean(c.email)}. Resume: ${Boolean(resume)}. Canonical URL: ${siteUrl || 'unset'}.`);
