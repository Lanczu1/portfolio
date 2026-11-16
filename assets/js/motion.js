/* Lance Aron Oboza — Motion graphics layer
   Runs after script.js. Adds: scroll progress + playback HUD, viewfinder cursor,
   magnetic buttons, hero parallax / light leak / "cut" glitch, per-letter type,
   lower-third wipes, decoding labels, kinetic type band, 3D project tilt. */

(() => {
  if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') return;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const pad = (n) => String(n).padStart(2, '0');
  // read live, so a light/dark switch is picked up
  const accent = () => getComputedStyle(document.documentElement).getPropertyValue('--sig').trim() || '#2648e6';

  /* ---------- Helpers ---------- */

  // Wrap every character of an element's text nodes in <span class="ch">, keeping child elements.
  function splitChars(el) {
    const out = [];
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          // keep each word together so lines only break at spaces
          child.textContent.split(/(\s+)/).forEach((word) => {
            if (!word) return;
            if (/^\s+$/.test(word)) { frag.appendChild(document.createTextNode(' ')); return; }
            const wrap = document.createElement('span');
            wrap.className = 'chw';
            [...word].forEach((c) => {
              const s = document.createElement('span');
              s.className = 'ch';
              s.textContent = c;
              wrap.appendChild(s);
              out.push(s);
            });
            frag.appendChild(wrap);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      });
    };
    walk(el);
    return out;
  }

  // Terminal-style decode: random glyphs settle into the real text left to right.
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#*+=<>';
  function scramble(el, duration = 0.9) {
    const text = el.dataset.text || el.textContent;
    el.dataset.text = text;
    const len = text.length;
    const o = { p: 0 };
    return gsap.to(o, {
      p: 1,
      duration,
      ease: 'none',
      onUpdate: () => {
        const settled = Math.floor(o.p * len);
        let html = '';
        for (let i = 0; i < len; i++) {
          const c = text[i];
          if (i < settled || c === ' ' || c === '·') html += c;
          else html += `<span class="sc">${GLYPHS[(Math.random() * GLYPHS.length) | 0]}</span>`;
        }
        el.innerHTML = html;
      },
      onComplete: () => { el.textContent = text; }
    });
  }

  /* ---------- 1. Scroll progress + playback HUD ---------- */
  const bar = $('#progress-bar');
  gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  const hud = $('#hud');
  const hudTC = $('#hud-tc');
  const hudNo = $('#hud-no');
  const hudName = $('#hud-name');
  const hudFill = $('#hud-fill');
  const hudHead = $('#hud-head');
  const track = $('.hud-track');

  // Treat the page as a 3-minute reel: scroll position maps to a timecode.
  const REEL_MS = 3 * 60 * 1000;
  const toTC = (ms, fps = 30) => {
    const frames = Math.floor((ms / 1000) * fps);
    const s = Math.floor(frames / fps);
    return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(frames % fps)}`;
  };

  const scenes = $$('main > section[id]').map((sec) => ({
    el: sec,
    no: (sec.querySelector('.sec-idx') || {}).textContent || '00',
    name: sec.dataset.scene || ((sec.querySelector('.sec-kicker') || {}).textContent || '').trim()
  }));

  let currentScene = null;
  const setScene = (s) => {
    if (!s || s === currentScene) return;
    currentScene = s;
    hudNo.textContent = s.no;
    if (reduce) { hudName.textContent = s.name; return; }
    gsap.timeline()
      .to(hudName, { yPercent: -100, duration: 0.2, ease: 'power2.in' })
      .add(() => { hudName.textContent = s.name; })
      .fromTo(hudName, { yPercent: 100 }, { yPercent: 0, duration: 0.35, ease: 'expo.out' });
    gsap.fromTo(hudNo, { opacity: 0.2 }, { opacity: 1, duration: 0.4 });
  };

  const placeMarkers = () => {
    $$('b', track).forEach((b) => b.remove());
    const max = ScrollTrigger.maxScroll(window) || 1;
    scenes.slice(1).forEach((s) => {
      const b = document.createElement('b');
      b.style.left = `${Math.min(100, (s.el.offsetTop / max) * 100)}%`;
      track.appendChild(b);
    });
  };

  // Work out the scene from scroll position directly, so fast jumps never leave it stale.
  const sceneAt = (y) => {
    const line = y + window.innerHeight * 0.5;
    let hit = scenes[0];
    scenes.forEach((s) => { if (s.el.offsetTop <= line) hit = s; });
    return hit;
  };
  setScene(scenes[0]);

  const footer = $('.footer');
  let scrubTimer;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const p = self.progress;
      const y = self.scroll();
      hudTC.textContent = toTC(p * REEL_MS);
      hudFill.style.transform = `scaleX(${p})`;
      hudHead.style.left = `calc(${(p * 100).toFixed(2)}% - 1px)`;
      setScene(sceneAt(y));
      // on after the hero, off once the footer comes in (it has its own back-to-top)
      const footerTop = footer ? footer.offsetTop : Infinity;
      hud.classList.toggle('is-on', y > window.innerHeight * 0.6 && y + window.innerHeight < footerTop + 40);
      hud.classList.add('is-scrubbing');
      clearTimeout(scrubTimer);
      scrubTimer = setTimeout(() => hud.classList.remove('is-scrubbing'), 180);
    }
  });
  ScrollTrigger.addEventListener('refresh', placeMarkers);

  /* ---------- 2. Viewfinder cursor ---------- */
  if (fine) {
    document.documentElement.classList.add('has-cursor');
    const cursor = $('#cursor');
    const dot = $('.cursor-dot', cursor);
    const ring = $('.cursor-ring', cursor);
    const label = $('#cursor-label');

    gsap.set([dot, ring], { x: -100, y: -100 });
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power3' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power3' });
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });

    // What the cursor says over different things
    $$('.zoomable').forEach((el) => { el.dataset.cursor = 'Zoom'; });
    $$('.badge').forEach((el) => { el.dataset.cursor = 'Verify'; });

    window.addEventListener('pointermove', (e) => {
      cursor.classList.remove('is-hidden');
      dotX(e.clientX); dotY(e.clientY);
      ringX(e.clientX); ringY(e.clientY);
    }, { passive: true });

    document.addEventListener('pointerover', (e) => {
      const lab = e.target.closest('[data-cursor]');
      const link = e.target.closest('a, button, .chip, label, input, textarea');
      if (lab) {
        label.textContent = lab.dataset.cursor;
        cursor.classList.add('is-label');
        cursor.classList.remove('is-link');
      } else {
        cursor.classList.remove('is-label');
        cursor.classList.toggle('is-link', !!link);
      }
    });

    // Leaving the window or entering an iframe (TikTok embed): hide ours.
    document.addEventListener('pointerout', (e) => { if (!e.relatedTarget) cursor.classList.add('is-hidden'); });
    window.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
    window.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
  }

  /* ---------- 3. Magnetic buttons ---------- */
  if (fine && !reduce) {
    $$('.btn, .nav-logo-mark, .to-top, .chip, .socials a, .nav-resume').forEach((el) => {
      el.classList.add('magnetic');
      const strength = el.classList.contains('btn') ? 0.35 : 0.25;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * strength;
        const y = (e.clientY - (r.top + r.height / 2)) * strength;
        gsap.to(el, { '--mgx': `${x}px`, '--mgy': `${y}px`, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
      });
      el.addEventListener('pointerleave', () => {
        gsap.to(el, { '--mgx': '0px', '--mgy': '0px', duration: 0.8, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
      });
    });
  }

  /* ---------- 4. Hero ---------- */
  const hero = $('#home');
  const vf = $('.viewfinder');
  const vfFrame = $('.vf-frame');
  const glows = $$('.hero-glow span');

  // Per-letter title: a wave runs through a line when you hover it
  const titleLines = $$('.hero-title .line > span');
  titleLines.forEach((line) => {
    const chars = splitChars(line).filter((c) => !c.closest('.hero-dot'));
    if (reduce) return;
    line.addEventListener('pointerenter', () => {
      const base = getComputedStyle(line).color;
      gsap.timeline()
        .to(chars, { yPercent: -16, color: accent(), duration: 0.22, stagger: 0.025, ease: 'power2.out', overwrite: 'auto' })
        .to(chars, { yPercent: 0, color: base, duration: 0.5, stagger: 0.025, ease: 'elastic.out(1, 0.45)', clearProps: 'color' }, 0.18);
    });
  });

  if (!reduce) {
    // Pointer parallax on the viewfinder layers + the light leak follows the pointer
    if (fine) {
      const glowX = glows.map((g) => gsap.quickTo(g, 'x', { duration: 2, ease: 'power3' }));
      const glowY = glows.map((g) => gsap.quickTo(g, 'y', { duration: 2, ease: 'power3' }));
      hero.addEventListener('pointermove', (e) => {
        const nx = (e.clientX / window.innerWidth) * 2 - 1;
        const ny = (e.clientY / window.innerHeight) * 2 - 1;
        gsap.to(vf, { '--mx': nx, '--my': ny, duration: 0.9, ease: 'power3.out', overwrite: 'auto' });
        glowX.forEach((fn, k) => fn(nx * (k ? -60 : 90)));
        glowY.forEach((fn, k) => fn(ny * (k ? -40 : 60)));
      });
    }

    // Light leak breathes on its own
    gsap.to(glows, { scale: 1.18, duration: 4, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 1.3 });

    // Scrolling out of the hero: copy lifts away, viewfinder pushes back
    gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 } })
      .to('.hero-copy', { yPercent: -18, opacity: 0.15, ease: 'none' }, 0)
      .to(vf, { yPercent: 10, scale: 0.92, opacity: 0.4, ease: 'none' }, 0)
      .to('.hero-glow', { opacity: 0, ease: 'none' }, 0);

  }

  /* ---------- 5. Section titles: lower-third wipe ---------- */
  $$('.sec-title, .contact-title').forEach((title) => {
    const wipe = document.createElement('span');
    wipe.className = 'wipe';
    wipe.setAttribute('aria-hidden', 'true');
    title.appendChild(wipe);
    if (reduce) { wipe.remove(); return; }
    gsap.timeline({ scrollTrigger: { trigger: title, start: 'top 85%' } })
      .set(wipe, { transformOrigin: 'left center' })
      .to(wipe, { scaleX: 1, duration: 0.45, ease: 'expo.inOut' })
      .set(wipe, { transformOrigin: 'right center' })
      .to(wipe, { scaleX: 0, duration: 0.55, ease: 'expo.inOut' });
  });

  /* ---------- 6. Mono labels decode in ---------- */
  if (!reduce) {
    $$('.sec-kicker, .project-kind, .did-label, .tk-group h4, .edu-top span:first-child, .objective-label').forEach((el) => {
      if (el.children.length) return;
      el.classList.add('scramble');
      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        once: true,
        onEnter: () => scramble(el, 0.5 + el.textContent.length * 0.025)
      });
    });
  }

  /* ---------- 7. About statement lights up word by word as you read ---------- */
  const statement = $('.about-statement');
  if (statement && !reduce) {
    gsap.fromTo($$('.w', statement), { opacity: 0.18 }, {
      opacity: 1,
      stagger: 0.1,
      ease: 'none',
      scrollTrigger: { trigger: statement, start: 'top 75%', end: 'bottom 40%', scrub: true }
    });
  }

  /* ---------- 8. Kinetic type band ---------- */
  if (!reduce) {
    $$('.kinetic-row').forEach((row) => {
      const dir = Number(row.dataset.dir) || 1;
      gsap.fromTo(row,
        { xPercent: dir < 0 ? 0 : -25 },
        { xPercent: dir < 0 ? -25 : 0, ease: 'none',
          scrollTrigger: { trigger: '.kinetic', start: 'top bottom', end: 'bottom top', scrub: 0.4 } });
    });
    // shapes between the words spin with the scroll
    gsap.to('.kinetic-row i', {
      rotation: '+=360', ease: 'none',
      scrollTrigger: { trigger: '.kinetic', start: 'top bottom', end: 'bottom top', scrub: 0.4 }
    });
  }

  /* ---------- 9. Project media: 3D tilt toward the pointer ---------- */
  if (fine && !reduce) {
    $$('.project-media:not(.video)').forEach((media) => {
      const browser = $('.device-browser', media);
      const phone = $('.device-phone', media);
      const bx = gsap.quickTo(browser, 'rotationY', { duration: 0.6, ease: 'power3' });
      const by = gsap.quickTo(browser, 'rotationX', { duration: 0.6, ease: 'power3' });
      const px = phone && gsap.quickTo(phone, 'x', { duration: 0.8, ease: 'power3' });
      const py = phone && gsap.quickTo(phone, 'rotationY', { duration: 0.8, ease: 'power3' });
      media.addEventListener('pointermove', (e) => {
        const r = media.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        bx(nx * 8); by(-ny * 6);
        if (phone) { px(nx * -24); py(nx * -10); }
      });
      media.addEventListener('pointerleave', () => {
        bx(0); by(0);
        if (phone) { px(0); py(0); }
      });
    });
  }

  /* ---------- 9b. EcoBud mascot pops onto its card and says hi ---------- */
  const mascot = $('#mascot');
  if (mascot) {
    const greet = () => {
      mascot.classList.add('is-greeting');
      gsap.delayedCall(2.6, () => mascot.classList.remove('is-greeting'));
    };
    if (reduce) {
      ScrollTrigger.create({ trigger: mascot, start: 'top 85%', once: true, onEnter: greet });
    } else {
      gsap.from(mascot, {
        yPercent: 60, scale: 0.4, rotation: -12, opacity: 0,
        duration: 1, ease: 'back.out(1.8)',
        scrollTrigger: { trigger: mascot, start: 'top 85%', once: true },
        onComplete: greet
      });
    }
  }

  /* ---------- 10. Editing monitor pushes in as it scrolls ---------- */
  if (!reduce) {
    const monitorImg = $('.monitor img');
    if (monitorImg) {
      gsap.fromTo(monitorImg, { scale: 1.12 }, {
        scale: 1, ease: 'none',
        scrollTrigger: { trigger: '.monitor', start: 'top bottom', end: 'center center', scrub: true }
      });
    }
  }

  /* ---------- 11. Footer name rises letter by letter ---------- */
  const mark = $('.footer-mark');
  if (mark) {
    const chars = splitChars(mark);
    if (!reduce) {
      gsap.fromTo(chars, { yPercent: 100, rotation: 8 }, {
        yPercent: 0, rotation: 0, ease: 'none', stagger: 0.05,
        scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: 0.6 }
      });
      if (fine) {
        chars.forEach((c) => c.addEventListener('pointerenter', () => {
          const base = getComputedStyle(mark).color;
          gsap.timeline()
            .to(c, { yPercent: -18, color: accent(), duration: 0.2, ease: 'power2.out', overwrite: 'auto' })
            .to(c, { yPercent: 0, color: base, duration: 0.7, ease: 'elastic.out(1, 0.4)', clearProps: 'color' });
        }));
      }
    }
  }

  // Layout changes above (split letters, wipes) can shift trigger positions
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
