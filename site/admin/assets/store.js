/* ============================================================
   Noah's CRM — data layer
   localStorage-backed. Single `noah-crm` key, shared with the public
   estimate form so website leads land straight in the inbox.

   NOTE ON SEED DATA: every customer, job and invoice below is INVENTED
   for demonstration. Real reviewer names from the Google scrape are
   deliberately NOT used as CRM records — fabricating job values and
   invoices against real named people would be inventing records about
   real individuals. The Reviews view reads the genuine scrape instead.
   ============================================================ */
const KEY = 'noah-crm';

const uid = (p) => p + Math.random().toString(36).slice(2, 8).toUpperCase();
const iso = (d) => new Date(d).toISOString();
const daysFromNow = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

export const SERVICES = {
  green: ['Mowing', 'Trimming & edging', 'Mulch & beds', 'Cleanup', 'Overgrown clearing', 'Hardscape'],
  white: ['Driveway plowing', 'Shovelling', 'Sanding', 'Storm call', 'Season contract']
};
export const STAGES = [
  { id: 'new',       label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'quoted',    label: 'Quoted' },
  { id: 'won',       label: 'Won' },
  { id: 'lost',      label: 'Lost' }
];
const TOWNS = ['Fairfax', 'Fletcher', 'Cambridge', 'Georgia', 'Westford', 'Milton', 'St. Albans', 'Underhill', 'Jericho'];

function seed() {
  const cust = [
    ['Dana Whitcomb',  'Fairfax',   '212 Buck Hollow Rd',  ['Weekly mow', 'Season plow'], 'Gate code 4417. Dog is friendly but bolts.'],
    ['Roy Pelletier',  'Fletcher',  '58 Cambridge Rd',     ['Biweekly mow'],              'Steep bank at the back — walk-behind only.'],
    ['Marta Quinn',    'Fairfax',   '7 Hunt St',           ['Weekly mow', 'Beds'],        'Beds mulched every May. Prefers dark bark.'],
    ['Ellis Warner',   'Georgia',   '1490 Ballard Rd',     ['Season plow'],               'Wants drive cleared before 6am.'],
    ['Priya Raman',    'Westford',  '33 Brookside Ln',     ['Weekly mow', 'Cleanup'],     'New build — irrigation heads near the drive.'],
    ['Curtis Boyle',   'Milton',    '806 Lake Rd',         ['Commercial mow'],            'Invoice to the property manager, net 30.'],
    ['Hannah Osgood',  'Cambridge', '19 Pleasant Valley',  ['Biweekly mow', 'Beds'],      'Bees in the north bed — leave 2ft.'],
    ['Theo Marchand',  'Fairfax',   '441 Fletcher Rd',     ['Season plow', 'Sanding'],    'Long dirt drive, ruts badly in March.']
  ].map(([name, town, address, tags, notes], i) => ({
    id: uid('C'), name, town, address, tags, notes,
    phone: `(802) 555-0${100 + i}`,
    email: name.toLowerCase().replace(/[^a-z]/g, '.') + '@example.com',
    since: iso(daysFromNow(-420 + i * 37)),
    createdAt: iso(daysFromNow(-420 + i * 37))
  }));

  const leads = [
    ['Wes Duguay',    'Fairfax',   ['Mowing'],                    'new',       'This week', 'Lawn has got away from me, about half an acre.'],
    ['Nina Cormier',  'Fletcher',  ['Mulch & beds'],              'new',       'Flexible',  'Want the front beds edged and mulched before July.'],
    ['Sam Beaudry',   'Georgia',   ['Overgrown clearing'],        'contacted', 'Urgent',    'Back lot has not been cut in two years.'],
    ['Ruth Lariviere','Fairfax',   ['Driveway plowing'],          'quoted',    'Next season','Booking ahead for winter. Steep drive.'],
    ['Owen Tatro',    'Underhill', ['Mowing', 'Trimming & edging'],'quoted',   'This week', 'Weekly through the season if the price works.'],
    ['Bea Chandler',  'Jericho',   ['Cleanup'],                   'won',       'Flexible',  'Fall cleanup, lots of maple leaf.'],
    ['Cal Nadeau',    'Milton',    ['Mowing'],                    'lost',      'Flexible',  'Went with a cheaper quote.']
  ].map(([name, town, services, status, urgency, message], i) => ({
    id: uid('L'), name, town, services, status, urgency, message,
    phone: `(802) 555-0${200 + i}`,
    email: name.toLowerCase().replace(/[^a-z]/g, '.') + '@example.com',
    address: `${20 + i * 13} ${TOWNS[i % TOWNS.length]} Rd`,
    value: [0, 0, 1800, 640, 2400, 380, 0][i],
    season: services.some(s => SERVICES.white.includes(s)) ? 'white' : 'green',
    source: i % 3 === 0 ? 'Website form' : i % 3 === 1 ? 'Google' : 'Referral',
    createdAt: iso(daysFromNow(-i * 2 - 1)),
    notes: []
  }));

  const jobs = [];
  cust.forEach((c, i) => {
    for (let w = -3; w <= 2; w++) {
      const green = !c.tags.some(t => /plow|sand/i.test(t));
      jobs.push({
        id: uid('J'), customerId: c.id,
        date: iso(daysFromNow(w * 7 + (i % 5))),
        time: ['07:30', '09:00', '10:30', '13:00', '14:30'][i % 5],
        type: green ? 'Mowing' : 'Plowing',
        season: green ? 'green' : 'white',
        status: w < 0 ? 'done' : 'scheduled',
        price: green ? 65 + (i % 4) * 15 : 55 + (i % 3) * 20,
        notes: ''
      });
    }
  });

  const invoices = cust.slice(0, 6).map((c, i) => {
    const amount = [520, 260, 745, 390, 610, 1180][i];
    const st = ['paid', 'paid', 'sent', 'overdue', 'paid', 'draft'][i];
    return {
      id: uid('I'), customerId: c.id, number: `2026-${String(101 + i)}`,
      issued: iso(daysFromNow(-30 + i * 4)),
      due: iso(daysFromNow(-30 + i * 4 + 21)),
      amount, status: st, jobIds: []
    };
  });

  return {
    leads, customers: cust, jobs, invoices,
    settings: {
      business: "Noah's Landscaping & Snowplowing LLC",
      phone: '(802) 735-5975',
      address: '384 Fletcher Rd, Fairfax VT 05454',
      formEndpoint: '',
      rates: { mow: 65, plow: 55, mulchYard: 95, hourly: 75 }
    },
    seededAt: iso(new Date())
  };
}

let db = null;

export function load() {
  if (db) return db;
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  if (!raw || !raw.customers) {
    const fresh = seed();
    // keep any leads the public form already captured
    if (raw && Array.isArray(raw.leads) && raw.leads.length) fresh.leads = [...raw.leads, ...fresh.leads];
    db = fresh; save();
  } else db = raw;
  return db;
}
export function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }
export function reset() { try { localStorage.removeItem(KEY); } catch (e) {} db = null; return load(); }

/* --- mutations --- */
export const addLead     = (l) => { db.leads.unshift({ id: uid('L'), createdAt: iso(new Date()), status: 'new', notes: [], ...l }); save(); };
export const updateLead  = (id, patch) => { const l = db.leads.find(x => x.id === id); if (l) Object.assign(l, patch); save(); return l; };
export const removeLead  = (id) => { db.leads = db.leads.filter(x => x.id !== id); save(); };
export const addCustomer = (c) => { const n = { id: uid('C'), createdAt: iso(new Date()), since: iso(new Date()), tags: [], notes: '', ...c }; db.customers.unshift(n); save(); return n; };
export const updateCustomer = (id, patch) => { const c = db.customers.find(x => x.id === id); if (c) Object.assign(c, patch); save(); return c; };
export const addJob      = (j) => { db.jobs.push({ id: uid('J'), status: 'scheduled', ...j }); save(); };
export const updateJob   = (id, patch) => { const j = db.jobs.find(x => x.id === id); if (j) Object.assign(j, patch); save(); return j; };
export const addInvoice  = (i) => { const n = { id: uid('I'), status: 'draft', issued: iso(new Date()), ...i }; db.invoices.unshift(n); save(); return n; };
export const updateInvoice = (id, patch) => { const v = db.invoices.find(x => x.id === id); if (v) Object.assign(v, patch); save(); return v; };

/* convert a won lead into a customer + first job */
export function convertLead(id) {
  const l = db.leads.find(x => x.id === id);
  if (!l) return null;
  const c = addCustomer({
    name: l.name, phone: l.phone, email: l.email, town: l.town,
    address: l.address, tags: l.services.slice(0, 2), notes: l.message
  });
  updateLead(id, { status: 'won', convertedTo: c.id });
  return c;
}

export const customerById = (id) => db.customers.find(c => c.id === id);
export const jobsFor = (id) => db.jobs.filter(j => j.customerId === id).sort((a, b) => new Date(b.date) - new Date(a.date));
export const invoicesFor = (id) => db.invoices.filter(i => i.customerId === id);

export function exportJSON() { return JSON.stringify(db, null, 2); }
export function exportCSV(rows, cols) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [cols.map(esc).join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n');
}
