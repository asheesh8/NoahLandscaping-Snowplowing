/* Noah's — interactions. No dependencies, no CDN. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- theme (light / dark) ---------- */
  const setTheme = (t) => {
    root.dataset.theme = t;
    try { localStorage.setItem('noah-theme', t); } catch (e) {}
  };
  $('#theme-toggle')?.addEventListener('click', () =>
    setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));
  // follow the OS only while the user hasn't chosen
  matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', e => {
    let chosen = null;
    try { chosen = localStorage.getItem('noah-theme'); } catch (err) {}
    if (!chosen) root.dataset.theme = e.matches ? 'light' : 'dark';
  });

  /* ---------- season (green / white) ---------- */
  const setSeason = (s) => {
    root.dataset.season = s;
    $$('[data-season-btn]').forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.seasonBtn === s)));
    $$('[data-when]').forEach(el => { el.hidden = el.dataset.when !== s; });
    const v = $('.hero-media video');
    if (v) s === 'white' ? v.pause() : v.play().catch(() => {});
    try { localStorage.setItem('noah-season', s); } catch (e) {}
  };
  $$('[data-season-btn]').forEach(b =>
    b.addEventListener('click', () => setSeason(b.dataset.seasonBtn)));
  setSeason(root.dataset.season || 'green');

  /* ---------- mobile menu ---------- */
  const menu = $('#mobile-menu'), mBtn = $('#menu-toggle');
  mBtn?.addEventListener('click', () => {
    const open = menu.hidden;
    menu.hidden = !open;
    mBtn.setAttribute('aria-expanded', String(open));
  });

  /* ---------- split headlines ---------- */
  $$('.split').forEach(el => {
    let i = 0;
    $$('[data-line]', el).forEach(line => {
      const txt = line.textContent;
      line.textContent = '';
      [...txt].forEach(c => {
        const s = document.createElement('span');
        s.className = 'ch';
        s.textContent = c === ' ' ? ' ' : c;
        s.style.setProperty('--i', i++);
        line.appendChild(s);
      });
    });
  });

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((es) => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
  $$('.rv,.split,.panel-media,.dist').forEach(el => io.observe(el));

  /* ---------- count-up ---------- */
  const cio = new IntersectionObserver((es) => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, to = parseFloat(el.dataset.count);
      const dec = (el.dataset.count.split('.')[1] || '').length;
      cio.unobserve(el);
      if (reduce) { el.textContent = to.toFixed(dec); return; }
      const t0 = performance.now(), dur = 1400;
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = (to * (1 - Math.pow(1 - p, 3))).toFixed(dec);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---------- nav background ---------- */
  const nav = $('.nav');
  const onScroll = () => nav.classList.toggle('stuck', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- review filtering ---------- */
  const list = $('#rev-list');
  if (list) {
    const cards = $$('.rev', list);
    const count = $('#rev-count');
    const apply = (f) => {
      let n = 0;
      cards.forEach(c => {
        const on = f === 'all' || c.dataset.rating === f;
        c.hidden = !on;
        if (on) n++;
      });
      if (count) count.textContent = `${n} shown`;
    };
    $$('.chip').forEach(chip => chip.addEventListener('click', () => {
      $$('.chip').forEach(c => c.classList.toggle('is-on', c === chip));
      apply(chip.dataset.filter);
    }));
    apply('all');
  }

  /* ---------- Vermont map ---------- */
  const read = $('#map-read');
  const pins = $$('.pin');
  if (pins.length && read) {
    const base = read.textContent;
    const show = (p) => {
      pins.forEach(q => q.classList.toggle('is-on', q === p));
      read.innerHTML = `<b>${p.dataset.town}</b> — ${p.dataset.note}`;
    };
    const clear = () => { pins.forEach(q => q.classList.remove('is-on')); read.textContent = base; };
    pins.forEach(p => {
      p.addEventListener('mouseenter', () => show(p));
      p.addEventListener('focus', () => show(p));
      p.addEventListener('click', () => show(p));
      p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(p); } });
    });
    $('.vtmap')?.addEventListener('mouseleave', clear);
  }

  /* ---------- custom cursor ---------- */
  if (!matchMedia('(pointer:coarse)').matches && !reduce) {
    const cur = document.createElement('div');
    cur.className = 'cursor';
    document.body.appendChild(cur);
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; }, { passive: true });
    (function loop() {
      cx += (x - cx) * 0.18; cy += (y - cy) * 0.18;
      cur.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener('mouseover', e => {
      if (e.target.closest('a,button,.tile,.pin')) cur.classList.add('is-lg');
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest('a,button,.tile,.pin')) cur.classList.remove('is-lg');
    });
  }

  /* ---------- parallax ---------- */
  if (!reduce) {
    const items = $$('[data-par]');
    let ticking = false;
    const run = () => {
      const vh = innerHeight;
      items.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const p = (r.top + r.height / 2 - vh / 2) / vh;
        const img = el.querySelector('img');
        if (img) img.style.transform =
          `scale(1.12) translateY(${(p * (parseFloat(el.dataset.par) || 18)).toFixed(2)}px)`;
      });
      ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
    run();
  }
})();

/* ============================================================
   Estimate form
   Submits to CONFIG.endpoint when one is set (Formspree / Web3Forms /
   Netlify — anything that accepts a JSON POST). Always also writes the
   lead into localStorage so the admin CRM can pick it up.
   ============================================================ */
(() => {
  const form = document.getElementById('estimate-form');
  if (!form) return;
  const status = document.getElementById('form-status');
  const ENDPOINT = window.NOAH_FORM_ENDPOINT || ''; // ← set to go live

  const say = (msg, cls) => { status.textContent = msg; status.className = 'f-status ' + (cls || ''); };

  const validate = () => {
    let bad = null;
    ['name', 'phone', 'town'].forEach(n => {
      const el = form.elements[n];
      const ok = el.value.trim().length > 1;
      el.setAttribute('aria-invalid', String(!ok));
      if (!ok && !bad) bad = el;
    });
    const email = form.elements.email;
    if (email.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) {
      email.setAttribute('aria-invalid', 'true'); bad = bad || email;
    } else email.setAttribute('aria-invalid', 'false');

    const picked = [...form.querySelectorAll('.pickers:not([hidden]) input:checked')];
    if (!picked.length) { say('Pick at least one service so we know what to quote.', 'bad'); return null; }
    if (bad) { say('Check the highlighted fields — we need a name, phone and town.', 'bad'); bad.focus(); return null; }
    return picked.map(p => p.value);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.elements.company.value) return;           // honeypot
    const services = validate();
    if (!services) return;

    const lead = {
      id: 'L' + Date.now().toString(36).toUpperCase(),
      name: form.elements.name.value.trim(),
      phone: form.elements.phone.value.trim(),
      email: form.elements.email.value.trim(),
      town: form.elements.town.value.trim(),
      address: form.elements.address.value.trim(),
      services,
      urgency: form.elements.urgency.value,
      message: form.elements.message.value.trim(),
      season: document.documentElement.dataset.season,
      source: 'Website form',
      status: 'new',
      value: 0,
      createdAt: new Date().toISOString(),
      notes: []
    };

    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true; say('Sending…');

    try { // hand off to the CRM store regardless of endpoint
      const key = 'noah-crm';
      const db = JSON.parse(localStorage.getItem(key) || '{}');
      db.leads = [lead, ...(db.leads || [])];
      localStorage.setItem(key, JSON.stringify(db));
    } catch (err) {}

    if (ENDPOINT) {
      try {
        const r = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(lead)
        });
        if (!r.ok) throw new Error('HTTP ' + r.status);
      } catch (err) {
        btn.disabled = false;
        say('Could not send — please call (802) 735-5975 instead.', 'bad');
        return;
      }
      form.reset();
      say('Sent. Noah will get back to you — usually same day.', 'ok');
    } else {
      form.reset();
      say('Saved locally — no delivery endpoint is configured yet, so this has NOT been emailed. See site/README.md.', 'bad');
    }
    btn.disabled = false;
  });
})();

/* ============================================================
   Reviews — masonry rows + expandable long quotes
   CSS columns read down-then-across, which is wrong for a list, so the
   grid is row-spanned in JS instead. Recomputed on resize, filter and expand.
   ============================================================ */
(() => {
  const list = document.getElementById('rev-list');
  if (!list) return;
  const GAP = 8;

  const layout = () => {
    if (getComputedStyle(list).gridTemplateColumns.split(' ').length < 2) {
      list.classList.remove('masonry');
      [...list.children].forEach(c => c.style.gridRowEnd = '');
      return;
    }
    list.classList.add('masonry');
    const gap = parseFloat(getComputedStyle(list).rowGap) || 0;
    [...list.children].forEach(card => {
      if (card.hidden) { card.style.gridRowEnd = ''; return; }
      card.style.gridRowEnd = 'span ' + Math.ceil((card.getBoundingClientRect().height + gap) / (GAP + gap));
    });
  };

  list.addEventListener('click', (e) => {
    const b = e.target.closest('.rev-more');
    if (!b) return;
    const body = b.previousElementSibling;
    const open = body.classList.toggle('open');
    b.textContent = open ? 'Show less' : 'Read more';
    layout();
  });

  let t;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(layout, 120); }, { passive: true });
  document.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => setTimeout(layout, 30)));
  if (document.fonts?.ready) document.fonts.ready.then(layout);
  addEventListener('load', layout);
  setTimeout(layout, 60);
  window.__revLayout = layout;
})();

/* ============================================================
   Before / after sliders
   A range input sits invisibly over the stage so it works with mouse,
   touch, and keyboard for free. The "before" image is width-locked to the
   stage so it doesn't squash as its clip container narrows.
   ============================================================ */
(() => {
  const stages = document.querySelectorAll('[data-ba]');
  if (!stages.length) return;

  stages.forEach(fig => {
    const stage = fig.querySelector('.ba-stage');
    const clip  = fig.querySelector('.ba-clip');
    const grip  = fig.querySelector('.ba-handle');
    const range = fig.querySelector('.ba-range');

    const sizeBefore = () => stage.style.setProperty('--stage-w', stage.clientWidth + 'px');
    const apply = (v) => {
      clip.style.width = v + '%';
      grip.style.left  = v + '%';
    };

    range.addEventListener('input', () => apply(range.value));
    // dragging anywhere on the stage should move it, not just the thumb
    const fromEvent = (e) => {
      const r = stage.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      const v = Math.max(0, Math.min(100, (x / r.width) * 100));
      range.value = v; apply(v);
    };
    let down = false;
    stage.addEventListener('pointerdown', e => { down = true; stage.setPointerCapture(e.pointerId); fromEvent(e); });
    stage.addEventListener('pointermove', e => { if (down) fromEvent(e); });
    stage.addEventListener('pointerup',   () => { down = false; });
    stage.addEventListener('pointercancel', () => { down = false; });
    // keyboard on the figure itself
    fig.addEventListener('keydown', e => {
      const step = e.shiftKey ? 10 : 4;
      if (e.key === 'ArrowLeft')  { e.preventDefault(); range.value = Math.max(0, +range.value - step); apply(range.value); }
      if (e.key === 'ArrowRight') { e.preventDefault(); range.value = Math.min(100, +range.value + step); apply(range.value); }
    });

    sizeBefore(); apply(50);
    new ResizeObserver(sizeBefore).observe(stage);
  });
})();
