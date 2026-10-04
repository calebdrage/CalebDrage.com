import { approvedConflicts, staysOnDate, validStayRange, parseUsernames, compareUsernameSets, toCsv } from './demo-logic.mjs';

const data = JSON.parse(document.querySelector('#demo-data').textContent);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const labels = {pending:'Pending', approved:'Approved', denied:'Denied', spam:'Spam'};
const formatDate = date => new Date(date + 'T12:00:00').toLocaleDateString('en-US', {month:'short',day:'numeric'});
const rangeText = stay => `${formatDate(stay.arrival_date)} – ${formatDate(stay.departure_date)}`;

function initStayDemo(element, config) {
  const query = selector => element.querySelector(selector);
  const arrival = query('[name="arrival"]');
  const departure = query('[name="departure"]');
  const calendar = query('[data-calendar]');
  const confirm = query('[data-confirm]');
  let request = {...config.request};
  let nextStatus = null;
  let selected = null;
  const [year, month] = config.month.split('-').map(Number);
  const count = new Date(year, month, 0).getDate();
  const offset = new Date(year, month-1, 1).getDay();
  query('[data-month-heading]').textContent = new Date(year,month-1,1).toLocaleDateString('en-US',{month:'long',year:'numeric'});
  calendar.setAttribute('role','group');
  calendar.setAttribute('aria-label','Sample stay calendar. Use arrow keys to move between dates.');
  for (const stay of config.stays) {
    const p = document.createElement('p');
    p.className = 'sample-stay';
    const strong = document.createElement('strong');
    strong.textContent = stay.label;
    p.append(strong, document.createElement('br'), rangeText(stay));
    query('[data-approved-stays]').append(p);
  }
  function render() {
    const valid = validStayRange(request.arrival_date,request.departure_date);
    const conflicts = valid ? approvedConflicts(request, config.stays) : [];
    query('[data-request-status]').textContent = labels[request.status];
    query('[data-range-message]').textContent = valid ? `Requested: ${rangeText(request)}. Arrival and departure days are included.` : 'Choose a valid arrival date and a later departure date.';
    query('[data-conflict-message]').textContent = !valid ? 'Review actions are unavailable until the dates are valid.' : conflicts.length ? `Date conflict: overlaps ${conflicts.length} approved sample stay. This is a warning, not a capacity calculation.` : 'No approved sample stays overlap these dates.';
    query('[data-conflict-message]').classList.toggle('conflict',conflicts.length>0);
    for (const button of element.querySelectorAll('[data-status]')) button.disabled = !valid;
    query('[data-status="pending"]').textContent = request.status==='pending' ? 'Keep pending' : 'Return to pending';
    calendar.replaceChildren();
    for (let i=0;i<offset;i++) { const space=document.createElement('span'); space.setAttribute('aria-hidden','true'); calendar.append(space); }
    for (let day=1;day<=count;day++) {
      const key = `${config.month}-${String(day).padStart(2,'0')}`;
      const approved = staysOnDate(key,config.stays).length>0;
      const inRequest = valid && request.arrival_date<=key && key<=request.departure_date;
      const button = document.createElement('button');
      button.type='button'; button.dataset.day=key; button.textContent=day;
      button.className=`calendar-date${approved?' is-approved':''}${inRequest?' is-request':''}${approved&&inRequest?' is-overlap':''}`;
      button.setAttribute('aria-pressed',String(selected===key));
      button.setAttribute('aria-label',`${formatDate(key)}${approved?', approved stay':''}${inRequest?', this request':''}${approved&&inRequest?', date conflict':''}${!approved&&!inRequest?', no stays or requests':''}`);
      calendar.append(button);
    }
    if(selected) {
      const matches=staysOnDate(selected,[...config.stays,...(valid?[request]:[])]);
      query('[data-day-message]').textContent=`${formatDate(selected)}: ${matches.length ? matches.map(stay=>stay.id===request.id?`sample request (${labels[request.status]})`:stay.label).join('; ') : 'no stays or requests'}.`;
    }
  }
  function reset() {
    request={...config.request}; selected=null; nextStatus=null;
    arrival.value=request.arrival_date; departure.value=request.departure_date;
    confirm.hidden=true; query('[data-action-message]').textContent='';
    query('[data-day-message]').textContent='Choose a date to inspect the sample stays.';
    render();
  }
  function changeDates() {
    request={...request,arrival_date:arrival.value,departure_date:departure.value,status:'pending'};
    confirm.hidden=true; nextStatus=null;
    query('[data-action-message]').textContent='Dates changed. The sample request is Pending.';
    render();
  }
  arrival.addEventListener('input',changeDates);
  departure.addEventListener('input',changeDates);
  for(const button of element.querySelectorAll('[data-preset]')) button.addEventListener('click',()=>{
    const range=button.dataset.preset==='clear'?config.clearRange:config.request;
    arrival.value=range.arrival_date; departure.value=range.departure_date; changeDates();
  });
  query('[data-reset-stay]').addEventListener('click',reset);
  calendar.addEventListener('click',event=>{
    const button=event.target.closest('[data-day]'); if(!button)return;
    selected=button.dataset.day; render(); calendar.querySelector(`[data-day="${selected}"]`).focus();
  });
  calendar.addEventListener('keydown',event=>{
    const button=event.target.closest('[data-day]'); if(!button)return;
    const dates=[...calendar.querySelectorAll('[data-day]')];const index=dates.indexOf(button);
    const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[event.key];
    if(delta!==undefined){event.preventDefault();dates[Math.max(0,Math.min(dates.length-1,index+delta))].focus();}
  });
  for(const button of element.querySelectorAll('[data-status]')) button.addEventListener('click',()=>{
    const next=button.dataset.status;
    if(next==='pending'&&request.status==='pending') {confirm.hidden=true;nextStatus=null;query('[data-action-message]').textContent='Kept Pending. No status change was made.';return;}
    const conflict=next==='approved'&&approvedConflicts(request,config.stays).length>0;
    nextStatus=next;confirm.hidden=false;
    query('[data-confirm-text]').textContent=conflict?'These dates overlap an approved sample stay. Confirming will approve this sample request anyway.':`Change this sample request to ${labels[next]}?`;
    query('[data-confirm-yes]').textContent=conflict?'Approve anyway':'Confirm change';
    query('[data-confirm-cancel]').focus();
  });
  query('[data-confirm-cancel]').addEventListener('click',()=>{const prior=nextStatus;confirm.hidden=true;nextStatus=null;query('[data-action-message]').textContent='Canceled. No status change was made.';query(`[data-status="${prior}"]`)?.focus();});
  query('[data-confirm-yes]').addEventListener('click',()=>{
    if(!nextStatus||!validStayRange(arrival.value,departure.value))return;
    request.status=nextStatus;const prior=nextStatus;nextStatus=null;confirm.hidden=true;
    query('[data-action-message]').textContent=`Sample request changed to ${labels[request.status]}. Nothing was sent or saved to a server.`;
    render();query(`[data-status="${prior}"]`)?.focus();
  });
  reset();
}

function initComparison(element, config) {
  const query=selector=>element.querySelector(selector);
  const followers=query('[name="followers"]'), following=query('[name="following"]');
  const message=query('[data-comparison-message]'), list=query('[data-result-list]'), exportButton=query('[data-export]');
  let results=null;
  function reset() {
    followers.value=config.followers.join('\n');following.value=config.following.join('\n');
    results=null;exportButton.hidden=true;exportButton.removeAttribute('href');list.replaceChildren();message.textContent='Compare the sample lists to see the result.';
  }
  query('[data-comparison-form]').addEventListener('submit',event=>{
    event.preventDefault();list.replaceChildren();results=null;exportButton.hidden=true;exportButton.removeAttribute('href');
    try {
      const a=parseUsernames(followers.value),b=parseUsernames(following.value);results=compareUsernameSets(a,b);
      message.textContent=`Sample results: ${a.size} followers · ${b.size} following · ${results.length} not following back.${results.length?'':' Everyone in Following also appears in Followers.'}`;
      for(const name of results){const item=document.createElement('li');item.textContent=name;list.append(item);}
      exportButton.href='data:text/csv;charset=utf-8,'+encodeURIComponent(toCsv(results));exportButton.hidden=false;
    }catch(error){message.textContent=error.message;}
  });
  for(const field of [followers,following])field.addEventListener('input',()=>{
    results=null;exportButton.hidden=true;exportButton.removeAttribute('href');list.replaceChildren();message.textContent='Lists changed. Compare again to update the result.';
  });
  query('[data-reset-follow]').addEventListener('click',reset);
  exportButton.addEventListener('click',()=>{
    if(results===null)return;
    message.textContent=`Demo CSV prepared with ${results.length} sample result${results.length===1?'':'s'}.`;
  });
  reset();
}

for(const element of document.querySelectorAll('[data-demo]')) {
  if(element.dataset.demo==='stay-review')initStayDemo(element,data.stayReview);
  else if(element.dataset.demo==='follow-comparison')initComparison(element,data.followComparison);
}
for(const walkthrough of document.querySelectorAll('.walkthrough')) {
  const image=walkthrough.querySelector('[data-walkthrough-image]');const button=walkthrough.querySelector('[data-walkthrough-button]');
  function stop(){image.src=image.dataset.poster;button.textContent='Play walkthrough';button.setAttribute('aria-pressed','false');}
  button.addEventListener('click',()=>{
    if(button.getAttribute('aria-pressed')==='true'){stop();return;}
    image.src=image.dataset.animation;button.textContent='Stop walkthrough';button.setAttribute('aria-pressed','true');
  });
  walkthrough.closest('details').addEventListener('toggle',event=>{if(!event.target.open)stop();});
  reducedMotion.addEventListener('change',event=>{if(event.matches)stop();});
}
for(const enhanced of document.querySelectorAll('[data-enhance]'))enhanced.hidden=false;
