import * as S from './store.js';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstElementChild; };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const money = (n) => '$' + Number(n || 0).toLocaleString('en-US');
const initials = (n) => n.split(/\s+/).map(x => x[0]).slice(0, 2).join('').toUpperCase();
const dayName = (d) => d.toLocaleDateString('en-US', { weekday: 'short' });
const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
const ago = (iso) => {
  const h = (Date.now() - new Date(iso)) / 36e5;
  if (h < 1) return 'just now';
  if (h < 24) return Math.floor(h) + 'h ago';
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : d + 'd ago';
};

const db = S.load();
const root = document.documentElement;
let toastT;
const toast = (m) => {
  const t = $('#toast'); t.textContent = m; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2200);
};

/* ── theme + season ─────────────────────────────────────────── */
const setTheme = (t) => { root.dataset.theme = t; try { localStorage.setItem('noah-theme', t); } catch (e) {} };
const setSeason = (s) => {
  root.dataset.season = s;
  $$('[data-season-btn]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.seasonBtn === s)));
  try { localStorage.setItem('noah-season', s); } catch (e) {}
  render();
};

/* ── drawer ─────────────────────────────────────────────────── */
function drawer(title, sub, bodyHTML, footHTML) {
  $('#drawer-title').textContent = title;
  $('#drawer-sub').textContent = sub || '';
  $('#drawer-body').innerHTML = bodyHTML;
  $('#drawer-foot').innerHTML = footHTML || '';
  $('#drawer').classList.add('on'); $('#scrim').classList.add('on');
}
const closeDrawer = () => { $('#drawer').classList.remove('on'); $('#scrim').classList.remove('on'); };

/* ── views ──────────────────────────────────────────────────── */
const VIEWS = {};

VIEWS.dashboard = () => {
  const season = root.dataset.season;
  const newLeads = db.leads.filter(l => l.status === 'new');
  const today = db.jobs.filter(j => sameDay(j.date, new Date()));
  const unpaid = db.invoices.filter(i => i.status === 'sent' || i.status === 'overdue');
  const unpaidTotal = unpaid.reduce((s, i) => s + i.amount, 0);
  const paidMonth = db.invoices.filter(i => i.status === 'paid' &&
    new Date(i.issued).getMonth() === new Date().getMonth()).reduce((s, i) => s + i.amount, 0);
  const pipeline = db.leads.filter(l => !['won', 'lost'].includes(l.status)).reduce((s, l) => s + (l.value || 0), 0);
  const overdue = db.invoices.filter(i => i.status === 'overdue');

  return `
  ${newLeads.length ? `<div class="banner"><b>●</b><div><b>${newLeads.length} new lead${newLeads.length > 1 ? 's' : ''}</b> waiting — the fastest callback wins the job. <a href="#leads" style="color:var(--accent)">Open the pipeline →</a></div></div>` : ''}
  <div class="grid g4" style="margin-bottom:1.2rem">
    <div class="card kpi"><div class="n">${newLeads.length}</div><div class="l lbl">New leads</div><div class="sub">${db.leads.length} in pipeline</div></div>
    <div class="card kpi"><div class="n">${today.length}</div><div class="l lbl">Jobs today</div><div class="sub">${season === 'white' ? 'Plow route' : 'Mow route'}</div></div>
    <div class="card kpi"><div class="n">${money(unpaidTotal)}</div><div class="l lbl">Outstanding</div><div class="sub">${overdue.length} overdue</div></div>
    <div class="card kpi"><div class="n">${money(paidMonth)}</div><div class="l lbl">Paid this month</div><div class="sub">${money(pipeline)} in pipeline</div></div>
  </div>

  <div class="grid g2">
    <div class="card">
      <div class="pad sec-t"><h2>Today's route</h2><span class="lbl">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span></div>
      <div style="padding:0 1.1rem 1.1rem">
        ${today.length ? today.sort((a, b) => a.time.localeCompare(b.time)).map(j => {
          const c = S.customerById(j.customerId) || {};
          return `<div class="job" data-job="${j.id}"><div class="row between"><b>${esc(c.name || '—')}</b><span class="t">${j.time}</span></div>
            <div class="mut" style="font-size:.72rem;margin-top:.15rem">${esc(c.address || '')}, ${esc(c.town || '')} · ${esc(j.type)}</div></div>`;
        }).join('') : `<div class="empty"><p>Nothing scheduled today.</p></div>`}
      </div>
    </div>

    <div class="card">
      <div class="pad sec-t"><h2>Latest leads</h2><a class="lbl" href="#leads" style="color:var(--accent)">All →</a></div>
      <div style="padding:0 1.1rem 1.1rem">
        ${db.leads.slice(0, 6).map(l => `
          <div class="job" data-lead="${l.id}" style="border-left-color:${l.status === 'new' ? 'var(--accent)' : 'var(--line)'}">
            <div class="row between"><b>${esc(l.name)}</b><span class="t">${ago(l.createdAt)}</span></div>
            <div class="mut" style="font-size:.72rem;margin-top:.15rem">${esc(l.town)} · ${l.services.map(esc).join(', ')}</div>
          </div>`).join('')}
      </div>
    </div>
  </div>`;
};

VIEWS.leads = () => {
  const q = ($('#q')?.value || '').toLowerCase();
  const shown = db.leads.filter(l => !q || (l.name + l.town + l.services.join(' ')).toLowerCase().includes(q));
  return `<div class="board">${S.STAGES.map(st => {
    const items = shown.filter(l => l.status === st.id);
    const val = items.reduce((s, l) => s + (l.value || 0), 0);
    return `<div class="col" data-stage="${st.id}">
      <div class="col-h"><b>${st.label}</b><span class="lbl">${items.length}${val ? ' · ' + money(val) : ''}</span></div>
      ${items.map(l => `
        <div class="lead" draggable="true" data-lead="${l.id}">
          <b>${esc(l.name)}</b>
          <div class="mut" style="font-size:.74rem">${esc(l.town)} · ${ago(l.createdAt)}</div>
          <div class="meta">${l.services.slice(0, 2).map(s => `<span class="tag">${esc(s)}</span>`).join('')}
            ${l.value ? `<span class="val">${money(l.value)}</span>` : ''}</div>
        </div>`).join('') || `<div class="mut" style="padding:.6rem .35rem;font-size:.76rem">—</div>`}
    </div>`;
  }).join('')}</div>`;
};

VIEWS.customers = () => {
  const q = ($('#q')?.value || '').toLowerCase();
  const rows = db.customers.filter(c => !q || (c.name + c.town + c.address).toLowerCase().includes(q));
  return `<div class="card"><table><thead><tr>
    <th>Customer</th><th>Town</th><th>Services</th><th>Jobs</th><th>Billed</th></tr></thead><tbody>
    ${rows.map(c => {
      const js = S.jobsFor(c.id), inv = S.invoicesFor(c.id);
      const billed = inv.reduce((s, i) => s + i.amount, 0);
      return `<tr data-customer="${c.id}">
        <td><div class="row"><span class="av">${initials(c.name)}</span><div><b>${esc(c.name)}</b>
          <div class="mut" style="font-size:.75rem">${esc(c.phone)}</div></div></div></td>
        <td>${esc(c.town)}</td>
        <td>${c.tags.slice(0, 2).map(t => `<span class="tag">${esc(t)}</span>`).join(' ')}</td>
        <td class="mono">${js.length}</td><td class="mono">${money(billed)}</td></tr>`;
    }).join('')}
  </tbody></table>${rows.length ? '' : '<div class="empty"><p>No customers match.</p></div>'}</div>`;
};

VIEWS.schedule = () => {
  const season = root.dataset.season;
  const start = new Date(); start.setDate(start.getDate() - start.getDay());
  const days = [...Array(7)].map((_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
  const inSeason = db.jobs.filter(j => j.season === season);
  return `
  <div class="sec-t"><h2>This week · ${season === 'white' ? 'plow route' : 'mow route'}</h2>
    <span class="lbl">${inSeason.length} ${season} jobs on file</span></div>
  <div class="week">${days.map(d => {
    const js = inSeason.filter(j => sameDay(j.date, d)).sort((a, b) => a.time.localeCompare(b.time));
    return `<div class="day ${sameDay(d, new Date()) ? 'today' : ''}">
      <div class="day-h"><b>${dayName(d)}</b><span class="lbl">${d.getDate()}</span></div>
      ${js.map(j => { const c = S.customerById(j.customerId) || {};
        return `<div class="job ${j.status === 'done' ? 'done' : ''}" data-job="${j.id}">
          <div class="t">${j.time}</div><b>${esc(c.name || '—')}</b>
          <div class="mut" style="font-size:.7rem">${esc(c.town || '')}</div></div>`; }).join('')
        || `<div class="mut" style="font-size:.72rem">—</div>`}
    </div>`;
  }).join('')}</div>`;
};

VIEWS.invoices = () => {
  const tone = { paid: 'ok', sent: 'info', overdue: 'bad', draft: '' };
  const tot = (st) => db.invoices.filter(i => i.status === st).reduce((s, i) => s + i.amount, 0);
  return `
  <div class="grid g4" style="margin-bottom:1.2rem">
    <div class="card kpi"><div class="n">${money(tot('paid'))}</div><div class="l lbl">Paid</div></div>
    <div class="card kpi"><div class="n">${money(tot('sent'))}</div><div class="l lbl">Awaiting payment</div></div>
    <div class="card kpi"><div class="n">${money(tot('overdue'))}</div><div class="l lbl">Overdue</div></div>
    <div class="card kpi"><div class="n">${money(tot('draft'))}</div><div class="l lbl">Draft</div></div>
  </div>
  <div class="card"><table><thead><tr><th>Invoice</th><th>Customer</th><th>Issued</th><th>Amount</th><th>Status</th></tr></thead><tbody>
  ${db.invoices.map(i => { const c = S.customerById(i.customerId) || {};
    return `<tr data-invoice="${i.id}"><td class="mono">#${i.number}</td><td>${esc(c.name || '—')}</td>
      <td class="mut">${new Date(i.issued).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
      <td class="mono">${money(i.amount)}</td>
      <td><span class="tag ${tone[i.status]}">${i.status}</span></td></tr>`; }).join('')}
  </tbody></table></div>`;
};

VIEWS.reviews = () => `
  <div id="rv-wrap" class="card pad"><p class="mut">Loading reviews…</p></div>`;

async function hydrateReviews() {
  const wrap = $('#rv-wrap'); if (!wrap) return;
  try {
    const d = await (await fetch('../../reviews.json')).json();
    const rs = d.reviews.filter(r => r.text);
    const dist = {}; d.reviews.forEach(r => dist[r.rating] = (dist[r.rating] || 0) + 1);
    wrap.classList.remove('pad');
    wrap.innerHTML = `
      <div class="pad row between wrap-g" style="border-bottom:1px solid var(--line)">
        <div class="row" style="gap:1.4rem">
          <div><div style="font-size:1.8rem;font-weight:800;color:var(--accent);line-height:1">${d.business.rating}</div>
            <div class="lbl">${d.business.review_count} reviews</div></div>
          <div style="min-width:170px">${[5,4,3,2,1].map(s => `
            <div class="row" style="gap:.5rem;font-size:.66rem"><span class="mono mut">${s}★</span>
              <span class="bar" style="flex:1"><i style="width:${(dist[s]||0)/d.reviews.length*100}%"></i></span>
              <span class="mono">${dist[s]||0}</span></div>`).join('')}</div>
        </div>
        <div><span class="tag">${rs.filter(r => r.owner_response).length} replied</span>
          <span class="tag warn">${rs.filter(r => !r.owner_response).length} no reply</span></div>
      </div>
      <div style="padding:1.1rem;display:grid;gap:.7rem;max-height:64vh;overflow-y:auto">
        ${rs.map(r => `<div class="card pad" style="background:var(--bg)">
          <div class="row between"><div class="row"><span class="av">${initials(r.author)}</span>
            <div><b>${esc(r.author)}</b><div class="lbl">${esc(r.date_relative)}</div></div></div>
            <span style="color:var(--accent);font-size:.72rem">${'★'.repeat(r.rating)}</span></div>
          <p style="margin:.7rem 0 0;font-size:.86rem">${esc(r.text)}</p>
          ${r.owner_response
            ? `<div class="note" style="margin-top:.7rem"><div class="lbl">Noah replied</div>${esc(r.owner_response)}</div>`
            : `<div class="row" style="margin-top:.7rem"><span class="tag warn">Needs a reply</span></div>`}
        </div>`).join('')}
      </div>`;
  } catch (e) {
    wrap.innerHTML = `<p class="mut">Could not load <code>reviews.json</code> — serve the site over http (not file://).</p>`;
  }
}

VIEWS.settings = () => {
  const s = db.settings;
  return `<div class="grid g2">
    <div class="card pad">
      <div class="sec-t"><h2>Business</h2></div>
      <div class="f">
        <label><span class="lbl">Name</span><input id="set-biz" value="${esc(s.business)}"></label>
        <label><span class="lbl">Phone</span><input id="set-phone" value="${esc(s.phone)}"></label>
        <label><span class="lbl">Address</span><input id="set-addr" value="${esc(s.address)}"></label>
        <label><span class="lbl">Website form endpoint</span>
          <input id="set-endpoint" placeholder="https://formspree.io/f/xxxx" value="${esc(s.formEndpoint)}"></label>
        <p class="mut" style="font-size:.75rem;margin:0">Until this is set, website enquiries are stored locally and <b>not emailed</b>.</p>
        <button class="btn" id="save-settings">Save</button>
      </div>
    </div>
    <div class="card pad">
      <div class="sec-t"><h2>Default rates</h2></div>
      <div class="f f2">
        <label><span class="lbl">Mow (per visit)</span><input id="r-mow" type="number" value="${s.rates.mow}"></label>
        <label><span class="lbl">Plow (per push)</span><input id="r-plow" type="number" value="${s.rates.plow}"></label>
        <label><span class="lbl">Mulch (per yard)</span><input id="r-mulch" type="number" value="${s.rates.mulchYard}"></label>
        <label><span class="lbl">Hourly</span><input id="r-hour" type="number" value="${s.rates.hourly}"></label>
      </div>
      <div class="sec-t" style="margin-top:1.4rem"><h2>Data</h2></div>
      <div class="row wrap-g">
        <button class="btn gh sm" id="exp-json">Export backup</button>
        <button class="btn gh sm" id="exp-leads">Leads CSV</button>
        <button class="btn gh sm" id="exp-cust">Customers CSV</button>
        <button class="btn gh sm" id="reset" style="border-color:color-mix(in srgb,var(--bad) 45%,transparent);color:var(--bad)">Reset demo data</button>
      </div>
    </div>
  </div>`;
};

/* ── render ─────────────────────────────────────────────────── */
const TITLES = { dashboard: 'Dashboard', leads: 'Pipeline', customers: 'Customers', schedule: 'Schedule', invoices: 'Invoices', reviews: 'Reviews', settings: 'Settings' };
let view = 'dashboard';

function render() {
  $('#view').innerHTML = VIEWS[view]();
  $('#title').textContent = TITLES[view];
  $$('.rail nav a').forEach(a => a.classList.toggle('on', a.dataset.view === view));
  $('#c-leads').textContent = db.leads.filter(l => l.status === 'new').length || '';
  if (view === 'reviews') hydrateReviews();
  if (view === 'leads') wireBoard();
  if (view === 'settings') wireSettings();
}

/* ── interactions ───────────────────────────────────────────── */
function leadDrawer(id) {
  const l = db.leads.find(x => x.id === id); if (!l) return;
  drawer(l.name, `${l.town} · ${l.source} · ${ago(l.createdAt)}`, `
    <dl class="kv">
      <dt>Phone</dt><dd><a href="tel:${esc(l.phone)}" style="color:var(--accent)">${esc(l.phone)}</a></dd>
      <dt>Email</dt><dd>${esc(l.email) || '—'}</dd>
      <dt>Address</dt><dd>${esc(l.address) || '—'}</dd>
      <dt>Needs</dt><dd>${l.services.map(s => `<span class="tag acc">${esc(s)}</span>`).join(' ')}</dd>
      <dt>Urgency</dt><dd>${esc(l.urgency)}</dd>
      <dt>Stage</dt><dd><select id="d-stage" class="f">${S.STAGES.map(s => `<option value="${s.id}" ${s.id === l.status ? 'selected' : ''}>${s.label}</option>`).join('')}</select></dd>
      <dt>Quote</dt><dd><input id="d-value" type="number" value="${l.value || ''}" placeholder="0" style="width:120px"></dd>
    </dl>
    ${l.message ? `<div><div class="lbl" style="margin-bottom:.35rem">Their message</div><div class="note">${esc(l.message)}</div></div>` : ''}
    <div><div class="lbl" style="margin-bottom:.35rem">Notes</div>
      <div id="d-notes">${(l.notes || []).map(n => `<div class="note"><div class="lbl">${new Date(n.at).toLocaleDateString()}</div>${esc(n.text)}</div>`).join('') || '<p class="mut" style="font-size:.8rem;margin:0">No notes yet.</p>'}</div>
      <div class="row" style="margin-top:.5rem"><input id="d-note" placeholder="Add a note…" style="flex:1;background:var(--bg);border:1px solid var(--line);border-radius:5px;padding:.45rem .6rem;font-size:.84rem">
      <button class="btn gh sm" id="d-note-add">Add</button></div></div>`,
    `<button class="btn" id="d-convert">Convert to customer</button>
     <button class="btn gh" id="d-save">Save</button>
     <button class="btn gh sm" id="d-del" style="margin-left:auto;color:var(--bad);border-color:color-mix(in srgb,var(--bad) 40%,transparent)">Delete</button>`);

  $('#d-save').onclick = () => {
    S.updateLead(id, { status: $('#d-stage').value, value: Number($('#d-value').value) || 0 });
    closeDrawer(); render(); toast('Lead updated');
  };
  $('#d-note-add').onclick = () => {
    const t = $('#d-note').value.trim(); if (!t) return;
    l.notes = l.notes || []; l.notes.push({ at: new Date().toISOString(), text: t }); S.save();
    leadDrawer(id); toast('Note added');
  };
  $('#d-convert').onclick = () => {
    const c = S.convertLead(id);
    closeDrawer(); render(); toast(`${c.name} added as a customer`);
  };
  $('#d-del').onclick = () => { S.removeLead(id); closeDrawer(); render(); toast('Lead deleted'); };
}

function customerDrawer(id) {
  const c = S.customerById(id); if (!c) return;
  const js = S.jobsFor(id), inv = S.invoicesFor(id);
  drawer(c.name, `${c.town} · customer since ${new Date(c.since).getFullYear()}`, `
    <dl class="kv">
      <dt>Phone</dt><dd><a href="tel:${esc(c.phone)}" style="color:var(--accent)">${esc(c.phone)}</a></dd>
      <dt>Email</dt><dd>${esc(c.email)}</dd>
      <dt>Address</dt><dd>${esc(c.address)}, ${esc(c.town)}</dd>
      <dt>Services</dt><dd>${c.tags.map(t => `<span class="tag acc">${esc(t)}</span>`).join(' ')}</dd>
      <dt>Billed</dt><dd class="mono">${money(inv.reduce((s, i) => s + i.amount, 0))}</dd>
    </dl>
    <div><div class="lbl" style="margin-bottom:.35rem">Property notes</div>
      <textarea id="c-notes" rows="3" style="width:100%;background:var(--bg);border:1px solid var(--line);border-radius:5px;padding:.5rem .6rem;font-size:.84rem">${esc(c.notes)}</textarea></div>
    <div><div class="lbl" style="margin-bottom:.35rem">Job history (${js.length})</div>
      ${js.slice(0, 8).map(j => `<div class="job ${j.status === 'done' ? 'done' : ''}">
        <div class="row between"><b>${esc(j.type)}</b><span class="mono">${money(j.price)}</span></div>
        <div class="t">${new Date(j.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${j.status}</div></div>`).join('')}</div>`,
    `<button class="btn" id="c-save">Save notes</button>
     <a class="btn gh" href="tel:${esc(c.phone)}">Call</a>`);
  $('#c-save').onclick = () => { S.updateCustomer(id, { notes: $('#c-notes').value }); closeDrawer(); toast('Notes saved'); };
}

function wireBoard() {
  let dragId = null;
  $$('.lead').forEach(card => {
    card.addEventListener('dragstart', e => { dragId = card.dataset.lead; card.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; });
    card.addEventListener('dragend', () => card.classList.remove('drag'));
  });
  $$('.col').forEach(col => {
    col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('over'); });
    col.addEventListener('dragleave', () => col.classList.remove('over'));
    col.addEventListener('drop', e => {
      e.preventDefault(); col.classList.remove('over');
      if (!dragId) return;
      const st = col.dataset.stage;
      S.updateLead(dragId, { status: st });
      render(); toast('Moved to ' + S.STAGES.find(s => s.id === st).label);
      dragId = null;
    });
  });
}

function wireSettings() {
  $('#save-settings').onclick = () => {
    Object.assign(db.settings, {
      business: $('#set-biz').value, phone: $('#set-phone').value,
      address: $('#set-addr').value, formEndpoint: $('#set-endpoint').value,
      rates: { mow: +$('#r-mow').value, plow: +$('#r-plow').value, mulchYard: +$('#r-mulch').value, hourly: +$('#r-hour').value }
    });
    S.save(); toast('Settings saved');
  };
  const dl = (name, text, type) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; a.click(); URL.revokeObjectURL(a.href);
  };
  $('#exp-json').onclick = () => dl('noah-crm-backup.json', S.exportJSON(), 'application/json');
  $('#exp-leads').onclick = () => dl('leads.csv', S.exportCSV(db.leads, ['name', 'phone', 'email', 'town', 'status', 'value', 'urgency', 'createdAt']), 'text/csv');
  $('#exp-cust').onclick = () => dl('customers.csv', S.exportCSV(db.customers, ['name', 'phone', 'email', 'town', 'address', 'since']), 'text/csv');
  $('#reset').onclick = () => { if (confirm('Wipe all CRM data and reload the demo set?')) { S.reset(); location.reload(); } };
}

/* ── global wiring ──────────────────────────────────────────── */
document.addEventListener('click', (e) => {
  const nav = e.target.closest('[data-view]');
  if (nav) { e.preventDefault(); view = nav.dataset.view; location.hash = view; render(); $('.rail').classList.remove('on'); return; }
  const l = e.target.closest('[data-lead]'); if (l) return leadDrawer(l.dataset.lead);
  const c = e.target.closest('[data-customer]'); if (c) return customerDrawer(c.dataset.customer);
  const j = e.target.closest('[data-job]');
  if (j) { const job = db.jobs.find(x => x.id === j.dataset.job); if (job) customerDrawer(job.customerId); }
});
$('#scrim').onclick = closeDrawer;
$('#drawer-x').onclick = closeDrawer;
addEventListener('keydown', e => {
  if (e.key === 'Escape') closeDrawer();
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); $('#q').focus(); }
});
$('#q').addEventListener('input', () => { if (['leads', 'customers'].includes(view)) render(); });
$('#theme-b').onclick = () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
$$('[data-season-btn]').forEach(b => b.onclick = () => setSeason(b.dataset.seasonBtn));
$('#menu-b').onclick = () => $('.rail').classList.toggle('on');
addEventListener('hashchange', () => { const h = location.hash.slice(1); if (VIEWS[h]) { view = h; render(); } });

const h0 = location.hash.slice(1);
if (VIEWS[h0]) view = h0;
try { setTheme(localStorage.getItem('noah-theme') || 'dark'); } catch (e) { setTheme('dark'); }
try { root.dataset.season = localStorage.getItem('noah-season') || 'green'; } catch (e) {}
$$('[data-season-btn]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.seasonBtn === root.dataset.season)));
render();
