/* Lance Aron Oboza — Portfolio interactions */

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  // Motion factor: 1 = full motion, 0 = the visitor asked the OS for reduced motion.
  // Reduced motion keeps fades and state changes but drops travel, spins and parallax.
  const D = reduce ? 0 : 1;

  const loader = $('#loader');
  const endLoading = () => {
    document.body.classList.remove('is-loading');
    if (loader) loader.remove();
  };

  // If the CDN fails, show the page without motion instead of a stuck loader.
  if (!hasGsap) {
    endLoading();
    initStatic();
    return;
  }

  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, Flip);
  gsap.defaults({ ease: 'power3.out' });

  initStatic();

  /* ---------------- Timecode helpers ---------------- */
  const pad = (n) => String(n).padStart(2, '0');
  const toTC = (ms, fps = 30) => {
    const totalFrames = Math.floor((ms / 1000) * fps);
    const f = totalFrames % fps;
    const s = Math.floor(totalFrames / fps);
    return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f)}`;
  };

  const liveTC = $$('#vf-tc, #monitor-tc');
  const t0 = performance.now();
  gsap.ticker.add(() => {
    const tc = toTC(performance.now() - t0);
    liveTC.forEach((el) => { el.textContent = tc; });
  });

  /* ---------------- Split headings into masked words ---------------- */
  function splitWords(el) {
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const inner = document.createElement('span');
            inner.textContent = p;
            w.appendChild(inner);
            frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      });
    };
    walk(el);
  }

  $$('.split').forEach(splitWords);

  /* ---------------- Preloader -> hero intro ---------------- */
  const loaderTC = $('#loader-tc');
  const loaderBar = $('#loader-bar');

  // The slate plays once per visit; reloads and page-to-page returns go straight in.
  let seenIntro = false;
  try {
    seenIntro = sessionStorage.getItem('lo-intro') === '1';
    sessionStorage.setItem('lo-intro', '1');
  } catch { /* storage blocked: just play it */ }

  if (seenIntro) {
    playIntro();
  } else {
    const prog = { v: 0 };
    gsap.timeline({ onComplete: playIntro })
      .from('.loader-inner', { opacity: 0, y: 20 * D, duration: 0.3 })
      .to(prog, {
        v: 1,
        duration: reduce ? 0.4 : 0.6,
        ease: 'power2.inOut',
        onUpdate: () => {
          loaderTC.textContent = toTC(prog.v * 2400);
          loaderBar.style.width = `${prog.v * 100}%`;
        }
      }, '<0.1')
      .to('.loader-inner', { opacity: 0, y: -16 * D, duration: 0.25, ease: 'power2.in' }, '+=0.05')
      .to(loader, reduce
        ? { opacity: 0, duration: 0.3 }
        : { clipPath: 'inset(0 0 100% 0)', duration: 0.55, ease: 'expo.inOut' }, '-=0.05');
  }

  function playIntro() {
    endLoading();
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.hero-title .line > span', reduce ? { opacity: 0, duration: 1, stagger: 0.15 } : { yPercent: 105, duration: 1.3, stagger: 0.1 })
      .from('.hero-meta span', { y: 12 * D, opacity: 0, duration: 0.8, stagger: 0.08 }, '<0.2')
      .from('.hero-role, .hero-lede', { y: 24 * D, opacity: 0, duration: 1, stagger: 0.1 }, '<0.15')
      .from('.hero-ctas > *', { y: 20 * D, opacity: 0, duration: 0.9, stagger: 0.07 }, '<0.2')
      .from('.nav', reduce ? { opacity: 0, duration: 0.8 } : { yPercent: -100, duration: 1, clearProps: 'transform' }, '<')
      .from('.vf-frame', reduce ? { opacity: 0, duration: 1 } : { clipPath: 'inset(0 0 100% 0)', duration: 1.3, ease: 'expo.inOut' }, 0.05)
      .from('.vf-top, .vf-bottom', { opacity: 0, duration: 0.6, stagger: 0.1 }, 0.6)
      .from('.vf-word', { yPercent: 40 * D, opacity: 0, duration: 1.4 }, 0.5)
      .from('.vf-subject', { y: 60 * D, opacity: 0, duration: 1.3 }, 0.6)
      .from('.vf-corner', { scale: reduce ? 1 : 2.2, opacity: 0, duration: 0.8, stagger: 0.05, ease: 'power4.out' }, 0.9)
      // autofocus lock
      .fromTo('.vf-focus', { opacity: 0, scale: reduce ? 1 : 1.8 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'power3.out' }, 1.3)
      .to('.vf-focus', { opacity: 0, duration: 0.15, repeat: 3, yoyo: true, ease: 'none' })
      .to('.vf-focus', { opacity: 0, duration: 0.3 })
      .from('.hero-scroll', { opacity: 0, duration: 0.8 }, 1.2);
  }

  /* ---------------- Hero role rotator ---------------- */
  const track = $('.rotator-track');
  if (track) {
    const items = $$('span', track);
    track.appendChild(items[0].cloneNode(true));
    const step = 100 / (items.length + 1);
    let i = 0;
    const next = () => {
      i += 1;
      if (reduce) {
        // crossfade instead of rolling
        gsap.to(track, { opacity: 0, duration: 0.3, onComplete: () => {
          if (i === items.length) i = 0;
          gsap.set(track, { yPercent: -step * i });
          gsap.to(track, { opacity: 1, duration: 0.3 });
        } });
        return;
      }
      gsap.to(track, {
        yPercent: -step * i,
        duration: 0.8,
        ease: 'expo.inOut',
        onComplete: () => {
          if (i === items.length) { i = 0; gsap.set(track, { yPercent: 0 }); }
        }
      });
    };
    gsap.delayedCall(4, function loop() { next(); gsap.delayedCall(2.4, loop); });
  }

  /* ---------------- Nav: scrolled / hide on scroll down / active link ---------------- */
  const nav = $('#nav');
  const toggle = $('#nav-toggle');
  const menu = $('#menu');
  let lastY = 0;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      nav.classList.toggle('is-scrolled', y > 20);
      const goingDown = y > lastY;
      nav.classList.toggle('is-hidden', goingDown && y > 700 && !menu.classList.contains('is-open'));
      lastY = y;
    }
  });

  $$('.nav-links a').forEach((a) => {
    const target = $(a.getAttribute('href'));
    if (!target) return;
    ScrollTrigger.create({
      trigger: target,
      start: 'top 45%',
      end: 'bottom 45%',
      onToggle: (self) => a.classList.toggle('is-active', self.isActive)
    });
  });

  /* ---------------- Mobile menu ---------------- */
  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      gsap.fromTo('.menu-links a', { yPercent: 60 * D, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.05, delay: 0.2, ease: 'expo.out' });
    }
  };
  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));

  /* ---------------- Smooth anchor scrolling ---------------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id === '#') { e.preventDefault(); return; }
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      if (menu.classList.contains('is-open')) setMenu(false);
      gsap.to(window, { duration: reduce ? 0 : 1.1, scrollTo: { y: target, offsetY: id === '#home' ? 0 : 70, autoKill: true }, ease: 'expo.inOut' });
    });
  });

  $('#to-top').addEventListener('click', () => {
    gsap.to(window, { duration: reduce ? 0 : 1.4, scrollTo: 0, ease: 'expo.inOut' });
  });

  /* ---------------- Ticker leans with scroll velocity ---------------- */
  if (!reduce) {
    const skew = gsap.quickTo('.ticker-track', 'skewX', { duration: 0.5, ease: 'power3' });
    ScrollTrigger.create({
      onUpdate: (self) => skew(gsap.utils.clamp(-8, 8, self.getVelocity() / -300))
    });
  }

  /* ---------------- Generic reveals ---------------- */
  $$('.split').forEach((el) => {
    gsap.from($$('.w > span', el), {
      ...(reduce ? { opacity: 0 } : { yPercent: 110 }),
      duration: 1.1,
      stagger: 0.045,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });

  $$('.sec-head').forEach((head) => {
    gsap.from(head.querySelectorAll('.sec-idx, .sec-kicker'), {
      opacity: 0,
      x: -16 * D,
      duration: 0.8,
      stagger: 0.08,
      scrollTrigger: { trigger: head, start: 'top 88%' }
    });
  });

  $$('[data-reveal]').forEach((el) => {
    gsap.from(el, { y: 50 * D, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  $$('[data-stagger]').forEach((list) => {
    gsap.from(list.children, {
      y: 24 * D,
      opacity: 0,
      duration: 0.8,
      stagger: 0.05,
      ease: 'expo.out',
      scrollTrigger: { trigger: list, start: 'top 85%' }
    });
  });

  $$('.service').forEach((s, idx) => {
    gsap.from(s.querySelectorAll('li'), {
      opacity: 0, x: -10 * D, duration: 0.5, stagger: 0.04, delay: 0.2 + (idx % 2) * 0.1,
      scrollTrigger: { trigger: s, start: 'top 80%' }
    });
  });

  // Projects: media wipes in, info rises
  $$('.project:not(.project-text)').forEach((p) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: p, start: 'top 78%' } });
    const phone = p.querySelector('.project-media .device-phone');
    tl.from(p.querySelector('.project-bar'), { opacity: 0, duration: 0.6 })
      .from(p.querySelector('.project-title'), { yPercent: 40 * D, opacity: 0, duration: 1, ease: 'expo.out' }, '<0.1')
      .from(p.querySelectorAll('.project-info > :not(.project-title)'), { y: 20 * D, opacity: 0, duration: 0.8, stagger: 0.07 }, '<0.15')
      .from(p.querySelector('.device-browser, .tiktok-frame'),
        reduce ? { opacity: 0, duration: 1 } : { clipPath: 'inset(0 100% 0 0)', duration: 1.2, ease: 'expo.inOut' }, 0.1);

    // phone slides up, then drifts with a light parallax
    if (phone) {
      tl.from(phone, { opacity: 0, duration: 0.9 }, 0.6);
      if (!reduce) gsap.to(phone, { yPercent: -14, ease: 'none', scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: true } });
    }
  });

  gsap.from('.monitor-notes li', {
    opacity: 0, y: 14 * D, duration: 0.6, stagger: 0.08,
    scrollTrigger: { trigger: '.monitor-notes', start: 'top 92%' }
  });

  gsap.from('.footer-mark', {
    yPercent: 50 * D, opacity: 0, duration: 1.4, ease: 'expo.out',
    scrollTrigger: { trigger: '.footer', start: 'top 90%' }
  });

  gsap.from('.contact-row, .socials li', {
    opacity: 0, y: 16 * D, duration: 0.7, stagger: 0.06,
    scrollTrigger: { trigger: '.contact-info', start: 'top 85%' }
  });

  // Toolkit: the three "intermediate" skills rise in one by one
  gsap.from('.tk-strong .tk-list li', {
    opacity: 0, y: 30 * D, duration: 0.9, stagger: 0.1, ease: 'expo.out',
    scrollTrigger: { trigger: '.toolkit', start: 'top 85%' }
  });

  initTimeline();
  initBadges();

  /* ---------------- Workflow: scrubbing playhead ---------------- */
  function initTimeline() {
    const tlEl = $('#timeline');
    if (!tlEl) return;
    const clips = $$('.tl-clip', tlEl);
    const label = $('#tl-tc');
    const update = (p) => {
      tlEl.style.setProperty('--p', p.toFixed(4));
      tlEl.style.setProperty('--wave', `${(p * 100).toFixed(2)}%`);
      const secs = Math.round(p * 60);
      label.textContent = `${pad(Math.floor(secs / 60))}:${pad(secs % 60)}`;
      clips.forEach((c, idx) => c.classList.toggle('is-live', p > 0.001 && p >= idx / clips.length));
    };
    update(0);
    ScrollTrigger.create({
      trigger: tlEl,
      start: 'top 70%',
      end: 'bottom 30%',
      scrub: 0.6,
      onUpdate: (self) => update(self.progress)
    });
    gsap.from(clips, {
      opacity: 0, y: 30 * D, duration: 0.8, stagger: 0.06, ease: 'expo.out',
      scrollTrigger: { trigger: tlEl, start: 'top 85%' }
    });
  }

  /* ---------------- Certifications ---------------- */
  function initBadges() {
    const grid = $('#badge-grid');
    if (!grid) return;
    const badges = $$('.badge', grid);
    const numEl = $('.certs-num');

    // Mask the sheen to each badge's own silhouette
    badges.forEach((b) => {
      const img = $('img', b);
      // absolute URL: a relative url() in a custom property resolves against the stylesheet
      b.style.setProperty('--mask', `url("${img.src}")`);
    });

    // Cursor tilt + spotlight
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    // pointer-driven, so it stays on even with reduced motion
    if (fine) {
      badges.forEach((b) => {
        const medal = $('.badge-medal', b);
        b.addEventListener('pointermove', (e) => {
          const r = b.getBoundingClientRect();
          b.style.setProperty('--mx', `${e.clientX - r.left}px`);
          b.style.setProperty('--my', `${e.clientY - r.top}px`);
          const m = medal.getBoundingClientRect();
          const dx = (e.clientX - (m.left + m.width / 2)) / r.width;
          const dy = (e.clientY - (m.top + m.height / 2)) / r.height;
          b.style.setProperty('--ry', `${(dx * 36).toFixed(2)}deg`);
          b.style.setProperty('--rx', `${(-dy * 30).toFixed(2)}deg`);
        });
        b.addEventListener('pointerleave', () => {
          b.style.setProperty('--rx', '0deg');
          b.style.setProperty('--ry', '0deg');
        });
      });
    }

    const countTo = (n, d = 0.8) => {
      const o = { v: parseInt(numEl.textContent, 10) || 0 };
      gsap.to(o, { v: n, duration: d, ease: 'power2.out', onUpdate: () => { numEl.textContent = Math.round(o.v); } });
    };

    // Summary: count-up, breakdown bar grows
    numEl.textContent = '0';
    gsap.timeline({ scrollTrigger: { trigger: '.certs-summary', start: 'top 80%' } })
      .add(() => countTo(15, 1.6))
      .from('.certs-bar span', { scaleX: 0, duration: 1.1, stagger: 0.15, ease: 'expo.out' }, 0)
      .from('.certs-filters .chip', { opacity: 0, y: 12, duration: 0.6, stagger: 0.06 }, 0.2);

    // Entrance: cards rise, medals spin in like a coin and "unlock"
    const reveal = (els) => {
      const tl = gsap.timeline();
      els.forEach((card, k) => {
        if (card.dataset.in) return;
        card.dataset.in = '1';
        const medal = $('.badge-medal', card);
        const at = k * 0.09;
        tl.to(card, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' }, at)
          .fromTo(medal,
            reduce ? { scale: 0.85, opacity: 0 } : { rotationY: -540, scale: 0.4, transformPerspective: 700 },
            { rotationY: 0, scale: 1, opacity: 1, duration: reduce ? 0.8 : 1.4, ease: 'expo.out', clearProps: 'transform',
              onComplete: () => {
                card.classList.add('unlocked');
                const sheen = $('.badge-sheen', card);
                sheen.animate(
                  [{ backgroundPosition: '120% 0' }, { backgroundPosition: '-40% 0' }],
                  { duration: 900, easing: 'cubic-bezier(.2,.8,.2,1)' }
                );
              } }, at + 0.05)
          .from(card.querySelectorAll('.badge-meta, .badge-name, .badge-skills, .badge-foot'),
            { opacity: 0, y: 10 * D, duration: 0.6, stagger: 0.06 }, at + 0.35);
      });
      return tl;
    };

    gsap.set(badges, { opacity: 0, y: 60 * D });
    ScrollTrigger.batch(badges, {
      start: 'top 88%',
      onEnter: (batch) => reveal(batch)
    });

    bindFilters(!reduce);

    function bindFilters(animated) {
      const chips = $$('.chip[data-filter]');
      chips.forEach((chip) => {
        chip.addEventListener('click', () => {
          if (chip.classList.contains('is-active')) return;
          chips.forEach((c) => c.classList.toggle('is-active', c === chip));
          const f = chip.dataset.filter;
          const matches = (b) => f === 'all' || b.dataset.issuer === f;
          const count = badges.filter(matches).length;

          // anything not yet revealed should just appear
          badges.forEach((b) => {
            if (!b.dataset.in) {
              b.dataset.in = '1';
              gsap.set(b, { opacity: 1, y: 0 });
              b.classList.add('unlocked');
            }
          });

          countTo(count, 0.6);
          gsap.to('.certs-bar span', {
            opacity: (k, el) => (f === 'all' || el.classList.contains(f === 'certiport' ? 'cb-cert' : `cb-${f}`)) ? 1 : 0.18,
            duration: 0.4
          });

          if (!animated) {
            // reduced motion: swap the set and crossfade, no travelling cards
            badges.forEach((b) => b.classList.toggle('is-hidden', !matches(b)));
            gsap.fromTo(badges.filter(matches), { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.03 });
            return;
          }

          const state = Flip.getState(badges);
          badges.forEach((b) => b.classList.toggle('is-hidden', !matches(b)));
          Flip.from(state, {
            duration: 0.7,
            ease: 'expo.inOut',
            stagger: 0.025,
            absolute: true,
            nested: false,
            onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6, stagger: 0.04, delay: 0.15, ease: 'expo.out' }),
            onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.35, ease: 'power2.in' }),
            onComplete: () => ScrollTrigger.refresh()
          });
        });
      });
    }
  }

  /* ---------------- Things that work without GSAP ---------------- */
  function initStatic() {
    // Lightbox
    const box = $('#lightbox');
    const boxImg = $('img', box);
    const open = (src, alt) => {
      boxImg.src = src;
      boxImg.alt = alt || '';
      box.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    };
    const close = () => {
      box.classList.remove('is-open');
      document.body.style.overflow = '';
    };
    $$('.zoomable').forEach((img) => img.addEventListener('click', () => open(img.src, img.alt)));
    box.addEventListener('click', (e) => { if (e.target !== boxImg) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && box.classList.contains('is-open')) close(); });

    // Copy to clipboard
    $$('[data-copy]').forEach((btn) => {
      const msg = $('.cr-msg', btn);
      btn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(btn.dataset.copy);
          btn.classList.add('copied');
          msg.textContent = 'Copied';
        } catch {
          msg.textContent = 'Press Ctrl+C';
        }
        clearTimeout(btn._t);
        btn._t = setTimeout(() => { btn.classList.remove('copied'); msg.textContent = 'Copy'; }, 1800);
      });
    });

    // Contact form (Web3Forms)
    const form = $('#contact-form');
    const status = $('#form-status');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        let ok = true;
        $$('input, textarea', form).forEach((field) => {
          const bad = !field.checkValidity();
          field.closest('.field').classList.toggle('invalid', bad);
          if (bad) ok = false;
        });
        if (!ok) {
          status.className = 'form-status err';
          status.textContent = 'Please fill in every field with a valid email.';
          return;
        }

        const btn = $('button[type="submit"]', form);
        const label = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = 'Sending…';
        status.className = 'form-status';
        status.textContent = '';

        const data = new FormData(form);
        data.append('access_key', 'f62eb756-b6ef-417b-a599-87ee08bddde9');
        data.append('from_name', 'Portfolio Contact Form');

        try {
          const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: data });
          const json = await res.json().catch(() => ({}));
          if (res.ok) {
            status.className = 'form-status ok';
            status.textContent = "Message sent. I'll get back to you soon.";
            form.reset();
          } else {
            status.className = 'form-status err';
            status.textContent = json.message || 'Could not send. Try emailing me directly.';
          }
        } catch {
          status.className = 'form-status err';
          status.textContent = 'Network error. Try emailing me directly.';
        } finally {
          btn.disabled = false;
          btn.innerHTML = label;
        }
      });

      $$('input, textarea', form).forEach((f) =>
        f.addEventListener('input', () => f.closest('.field').classList.remove('invalid'))
      );
    }
  }
})();
