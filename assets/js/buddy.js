/* Lance guide + theme toggle.
   - A full-body pixel Lance stands bottom-right; for each section you scroll into he switches
     emote (point, think, idea…), hops and says a line.
   - Clicking him opens a chat-style contact panel (email, phone, résumé, socials, form link).
   - The nav button switches light/dark and remembers the choice. */

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Theme toggle ---------------- */
  const root = document.documentElement;
  const toggle = $('#theme-toggle');
  const themeMeta = $('meta[name="theme-color"]');

  const applyTheme = (t, animate) => {
    if (animate && !reduce) {
      root.classList.add('theme-anim');
      clearTimeout(applyTheme._t);
      applyTheme._t = setTimeout(() => root.classList.remove('theme-anim'), 500);
    }
    root.setAttribute('data-theme', t);
    const next = t === 'dark' ? 'light' : 'dark';
    if (toggle) {
      toggle.setAttribute('aria-label', `Switch to ${next} mode`);
      toggle.title = `Switch to ${next} mode`;
    }
    if (themeMeta) themeMeta.setAttribute('content', t === 'dark' ? '#0d1015' : '#fafaf8');
  };
  applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light', false);

  if (toggle) {
    toggle.addEventListener('click', () => {
      const t = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(t, true);
      try { localStorage.setItem('lo-theme', t); } catch { /* storage blocked: still switches */ }
    });
  }

  // Follow the system setting until the visitor picks one themselves
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onSystem = (e) => {
    let saved = null;
    try { saved = localStorage.getItem('lo-theme'); } catch { /* ignore */ }
    if (!saved) applyTheme(e.matches ? 'dark' : 'light', true);
  };
  if (mq.addEventListener) mq.addEventListener('change', onSystem);

  /* ---------------- Guide ---------------- */
  const buddy = $('#buddy');
  const btn = $('#buddy-btn');
  const img = $('#buddy-img');
  const bubble = $('#buddy-bubble');
  const panel = $('#buddy-panel');
  if (!buddy || !btn || !panel) return;

  // full-body emote for each section (assets/images/lance/full-<pose>.png)
  const POSE = (n) => `assets/images/lance/full-${n}.png`;
  const scenes = [
    { id: 'home',           pose: 'present', say: "Hi! I'm Lance. Click me to get in touch." },
    { id: 'about',          pose: 'left',    say: "That's me: a 4th-year BS IT student and developer." },
    { id: 'skills',         pose: 'think',   say: 'Web, mobile, IT support, design and video. Here\'s what I can help with.' },
    { id: 'projects',       pose: 'left',    say: 'Some things I\'ve built. Start with EcoBud!' },
    { id: 'video-editing',  pose: 'right',   say: 'I edit short-form videos in CapCut too.' },
    { id: 'workflow',       pose: 'idea',    say: 'How I take a project from brief to release.' },
    { id: 'background',     pose: 'up',      say: 'My education and TESDA training.' },
    { id: 'certifications', pose: 'present', say: '15 verified badges. Tap any one to check it on Credly.' },
    { id: 'contact',        pose: 'down',    say: 'Send me a message below, or tap me for quick contacts.' }
  ].map((s) => ({ ...s, el: document.getElementById(s.id) })).filter((s) => s.el);

  // Preload every emote so the swap never flashes
  [...new Set(scenes.map((s) => s.pose))].forEach((p) => { const i = new Image(); i.src = POSE(p); });
  const setPose = (p) => { if (!img.src.endsWith(POSE(p))) img.src = POSE(p); };

  let current = null;
  let talkTimer;
  const talk = (text, ms = 3800) => {
    bubble.textContent = text;
    buddy.classList.add('is-talking');
    clearTimeout(talkTimer);
    talkTimer = setTimeout(() => buddy.classList.remove('is-talking'), ms);
  };

  const setScene = (s, quiet) => {
    if (!s || s === current) return;
    current = s;
    setPose(s.pose);
    if (quiet) return;
    // new section: switch emote, hop, and say a line
    img.classList.remove('is-swap');
    void img.offsetWidth; // restart the hop
    img.classList.add('is-swap');
    if (!buddy.classList.contains('is-open')) talk(s.say);
  };
  img.addEventListener('animationend', (e) => { if (e.animationName === 'buddy-hop') img.classList.remove('is-swap'); });

  const sceneAt = () => {
    const line = window.scrollY + window.innerHeight * 0.45;
    let hit = scenes[0];
    scenes.forEach((s) => { if (s.el.getBoundingClientRect().top + window.scrollY <= line) hit = s; });
    return hit;
  };

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; setScene(sceneAt()); });
  }, { passive: true });

  // Greet once the intro has played
  setScene(sceneAt(), true);
  setTimeout(() => { if (current) talk(current.say, 4500); }, 1800);

  /* ---------------- Contact panel ---------------- */
  const close = (focusBack) => {
    if (panel.hidden) return;
    panel.hidden = true;
    panel.classList.remove('is-in');
    buddy.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    if (focusBack) btn.focus();
  };
  const open = () => {
    panel.hidden = false;
    panel.classList.remove('is-in');
    void panel.offsetWidth;
    panel.classList.add('is-in');
    buddy.classList.add('is-open');
    buddy.classList.remove('is-talking');
    btn.setAttribute('aria-expanded', 'true');
    const first = panel.querySelector('.bp-row');
    if (first) first.focus({ preventScroll: true });
  };

  btn.addEventListener('click', () => (panel.hidden ? open() : close(true)));
  bubble.addEventListener('click', open);
  $('#buddy-close').addEventListener('click', () => close(true));
  $('#buddy-form').addEventListener('click', () => close(false));

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(true); });
  document.addEventListener('pointerdown', (e) => {
    if (!panel.hidden && !panel.contains(e.target) && !buddy.contains(e.target)) close(false);
  });
})();
