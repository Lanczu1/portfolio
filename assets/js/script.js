/**
 * Premium Portfolio Animations & Logic
 * Owner: Lance Aron Oboza
 * Inspired by: Awwwards, GSAP, Framer Motion
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- INITS & UTILITIES ---
  lucide.createIcons();
  gsap.registerPlugin(ScrollTrigger);

  // --- MOBILE NAV MENU ---
  const mobileToggle = document.querySelector('.mobile-nav-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-menu a');

  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('active');
      const isActive = mobileMenu.classList.contains('active');
      // Transform hamburger into an 'X'
      const lines = mobileToggle.querySelectorAll('.hamburger-line');
      if (isActive) {
        gsap.to(lines[0], { rotate: 45, y: 7, duration: 0.2 });
        gsap.to(lines[1], { opacity: 0, duration: 0.2 });
        gsap.to(lines[2], { rotate: -45, y: -7, duration: 0.2 });
      } else {
        gsap.to(lines[0], { rotate: 0, y: 0, duration: 0.2 });
        gsap.to(lines[1], { opacity: 1, duration: 0.2 });
        gsap.to(lines[2], { rotate: 0, y: 0, duration: 0.2 });
      }
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        const lines = mobileToggle.querySelectorAll('.hamburger-line');
        gsap.to(lines[0], { rotate: 0, y: 0, duration: 0.2 });
        gsap.to(lines[1], { opacity: 1, duration: 0.2 });
        gsap.to(lines[2], { rotate: 0, y: 0, duration: 0.2 });
      });
    });
  }

  // --- CUSTOM CURSOR ---
  const cursorRing = document.querySelector('.custom-cursor');
  const cursorDot = document.querySelector('.custom-cursor-dot');
  let mouse = { x: -100, y: -100 };
  let ringPos = { x: -100, y: -100 };

  // --- SMOOTH SCROLL FOR NAV LINKS ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        
        // Account for fixed header height
        const headerOffset = 80;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
  
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    
    // Immediate dot update
    gsap.set(cursorDot, { x: mouse.x, y: mouse.y });
  });

  // Smooth follow for the outer ring using GSAP ticker (lerp)
  gsap.ticker.add(() => {
    const dt = 1.0 - Math.pow(1.0 - 0.15, gsap.ticker.deltaRatio());
    ringPos.x += (mouse.x - ringPos.x) * dt;
    ringPos.y += (mouse.y - ringPos.y) * dt;
    gsap.set(cursorRing, { x: ringPos.x, y: ringPos.y });
  });

  // Hover states for cursor
  const hoverElements = document.querySelectorAll('a, button, .btn, .video-card, .tech-card, .roadmap-card, .contact-card, .social-circle');
  hoverElements.forEach(el => {
    el.addEventListener('mouseenter', () => cursorRing.classList.add('hovered'));
    el.addEventListener('mouseleave', () => cursorRing.classList.remove('hovered'));
  });

  // --- TYPING ANIMATION ---
  const words = [
    "Creative Web Developer",
    "Creative Video Editor",
    "Aspiring Gaming Content Creator",
    "Tech Support"
  ];
  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  const typingSpan = document.getElementById('typing-text');

  function typeEffect() {
    if (!typingSpan) return;
    const currentWord = words[wordIndex];
    
    if (isDeleting) {
      typingSpan.textContent = currentWord.substring(0, charIndex - 1);
      charIndex--;
    } else {
      typingSpan.textContent = currentWord.substring(0, charIndex + 1);
      charIndex++;
    }
    
    let typeSpeed = isDeleting ? 30 : 60;
    
    if (!isDeleting && charIndex === currentWord.length) {
      typeSpeed = 2000; // Pause at end of word
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      typeSpeed = 500; // Pause before typing next word
    }
    
    setTimeout(typeEffect, typeSpeed);
  }
  
  if (typingSpan) {
    typeEffect();
  }

  // --- MOUSE FOLLOW GLOW CARD ---
  const glowCards = document.querySelectorAll('.mouse-glow-card');
  glowCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // --- 3D TILT EFFECT ---
  const tiltCards = document.querySelectorAll('.glass-card');
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Calculate rotation degree (max 8 degrees)
      const rotateX = ((centerY - y) / centerY) * 8;
      const rotateY = ((x - centerX) / centerX) * 8;
      
      gsap.to(card, {
        rotateX: rotateX,
        rotateY: rotateY,
        transformPerspective: 1000,
        ease: 'power2.out',
        duration: 0.3
      });
    });
    
    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        transformPerspective: 1000,
        ease: 'power2.out',
        duration: 0.5
      });
    });
  });

  // --- INTERACTIVE CANVAS BACKGROUND PARTICLES ---
  const canvas = document.getElementById('particle-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let particleCount = 70;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.baseAlpha = Math.random() * 0.3 + 0.1;
        this.alpha = this.baseAlpha;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Bounce/Wrap boundaries
        if (this.x < 0 || this.x > width) this.speedX *= -1;
        if (this.y < 0 || this.y > height) this.speedY *= -1;

        // Interaction with mouse
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.hypot(dx, dy);
        const repelRadius = 150;
        
        if (distance < repelRadius) {
          const force = (repelRadius - distance) / repelRadius;
          const angle = Math.atan2(dy, dx);
          // Push away gently
          this.x -= Math.cos(angle) * force * 1.5;
          this.y -= Math.sin(angle) * force * 1.5;
          this.alpha = Math.min(0.8, this.baseAlpha + force * 0.5);
        } else {
          // Return to normal opacity slowly
          if (this.alpha > this.baseAlpha) {
            this.alpha -= 0.01;
          }
        }
      }

      draw() {
        ctx.fillStyle = `rgba(34, 197, 94, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Connect particles with network lines
    function connectParticles() {
      const maxDistance = 120;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const dist = Math.hypot(dx, dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.08;
            ctx.strokeStyle = `rgba(34, 197, 94, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    }

    // Canvas Animation Loop
    function animate() {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      
      connectParticles();
      requestAnimationFrame(animate);
    }
    animate();
  }

  // --- MAGNETIC BUTTONS ---
  const magneticBtns = document.querySelectorAll('.btn-primary, .btn-secondary, .btn-accent, .back-to-top, .social-circle');
  magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      gsap.to(btn, {
        x: x * 0.35,
        y: y * 0.35,
        duration: 0.3,
        ease: 'power2.out'
      });
    });
    
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.4)'
      });
    });
  });

  // --- BUTTON RIPPLE EFFECT ---
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ripple = document.createElement('span');
      ripple.style.position = 'absolute';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.transform = 'translate(-50%, -50%) scale(0)';
      ripple.style.width = '300px';
      ripple.style.height = '300px';
      ripple.style.borderRadius = '50%';
      ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
      ripple.style.pointerEvents = 'none';
      ripple.style.transition = 'transform 0.6s ease-out, opacity 0.6s ease-out';
      
      btn.appendChild(ripple);
      
      // Trigger animation frame
      requestAnimationFrame(() => {
        ripple.style.transform = 'translate(-50%, -50%) scale(1)';
        ripple.style.opacity = '0';
      });
      
      setTimeout(() => ripple.remove(), 600);
    });
  });

  // --- SCROLL BAR & INDICATOR ---
  const scrollBar = document.querySelector('.scroll-progress-bar');
  if (scrollBar) {
    window.addEventListener('scroll', () => {
      const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      scrollBar.style.width = `${scrolled}%`;
    });
  }

  // --- BACK TO TOP BUTTON ---
  const backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        gsap.to(backToTopBtn, { opacity: 1, scale: 1, duration: 0.3, pointerEvents: 'auto' });
      } else {
        gsap.to(backToTopBtn, { opacity: 0, scale: 0, duration: 0.3, pointerEvents: 'none' });
      }
    });

    backToTopBtn.addEventListener('click', () => {
      gsap.to(window, { scrollTo: 0, duration: 1.2, ease: 'power4.inOut' });
    });
  }

  // --- PRELOADER COUNTER & HERO ENTRANCE TRIGGER ---
  const preloader = document.getElementById('preloader');
  const bar = document.querySelector('.preloader-bar');
  const counter = document.querySelector('.preloader-counter');
  const preloaderLogo = document.querySelector('.preloader-logo');

  // --- SLOW-MOTION NAME ENTRANCE ---
  // Animate each letter rising up slowly with a stagger
  gsap.to('.preloader-letter', {
    y: '0%',
    opacity: 1,
    duration: 1.4,
    stagger: 0.07,
    ease: 'power3.out',
    onComplete: () => {
      if (preloaderLogo) preloaderLogo.classList.add('revealed');
    }
  });

  let currentPercent = 0;
  const interval = setInterval(() => {
    // Fast mock load speed
    currentPercent += Math.floor(Math.random() * 8) + 2;
    if (currentPercent >= 100) {
      currentPercent = 100;
      clearInterval(interval);
      
      // Update UI to 100%
      if (bar) bar.style.width = `100%`;
      if (counter) counter.textContent = `100%`;
      
      setTimeout(startHeroEntrance, 400);
    } else {
      if (bar) bar.style.width = `${currentPercent}%`;
      if (counter) counter.textContent = `${currentPercent}%`;
    }
  }, 40);

  function startHeroEntrance() {
    // 1. Fade out preloader
    const preloaderTimeline = gsap.timeline({
      onComplete: () => {
        if (preloader) preloader.style.display = 'none';
        // Re-enable scroll once preloader is gone
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
      }
    });

    // Disable scrolling during preloader
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    preloaderTimeline
      .to('.preloader-letter', { y: '-110%', opacity: 0, duration: 0.5, stagger: 0.04, ease: 'power4.in' })
      .to('.preloader-bar-wrap', { scaleX: 0, opacity: 0, duration: 0.3 }, '<0.2')
      .to('.preloader-counter', { opacity: 0, duration: 0.3 }, '<')
      .to(preloader, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)', duration: 0.8, ease: 'power4.inOut' });

    // 2. Animate Hero entrance
    const heroTimeline = gsap.timeline();
    
    heroTimeline
      .from('.navbar', { y: -80, opacity: 0, duration: 1, ease: 'power4.out' }, '>-0.2')
      .from('.hero-subtitle', { x: -30, opacity: 0, duration: 0.8, ease: 'power3.out' }, '<0.2')
      .from('.hero-title span', { y: 60, rotateX: -15, opacity: 0, duration: 1, stagger: 0.15, ease: 'power4.out' }, '<0.1')
      .from('.hero-tagline', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' }, '<0.3')
      .from('.hero-ctas .btn', { y: 20, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'back.out(1.5)' }, '<0.2')
      .from('.profile-sphere-wrap', { scale: 0.8, rotate: -5, opacity: 0, duration: 1.2, ease: 'power4.out' }, '<-0.3')
      .from('.floating-badge', { scale: 0, opacity: 0, stagger: 0.15, duration: 0.8, ease: 'back.out(1.7)' }, '<0.4');
  }

  // --- SCROLLTRIGGER SECTION REVEALS ---
  const sections = document.querySelectorAll('section');
  sections.forEach(sec => {
    // Header trigger
    const header = sec.querySelector('.section-header');
    if (header) {
      gsap.from(header.querySelectorAll('.section-label, .section-title, .section-desc'), {
        scrollTrigger: {
          trigger: header,
          start: 'top 85%',
          toggleActions: 'play none none none'
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out'
      });
    }
  });

  // About stats counter trigger
  const statNumbers = document.querySelectorAll('.stat-number span');
  statNumbers.forEach(span => {
    const parent = span.closest('.stat-box');
    const finalVal = parseInt(span.getAttribute('data-val'), 10);
    
    gsap.fromTo(span, 
      { textContent: '0' },
      {
        scrollTrigger: {
          trigger: parent,
          start: 'top 85%',
          toggleActions: 'play none none none'
        },
        textContent: finalVal,
        duration: 2,
        ease: 'power2.out',
        snap: { textContent: 1 },
        stagger: 0.1
      }
    );
  });

  // Animated Skill progress bars trigger
  const progressFills = document.querySelectorAll('.progress-fill');
  progressFills.forEach(fill => {
    const val = fill.getAttribute('data-progress');
    gsap.to(fill, {
      scrollTrigger: {
        trigger: fill,
        start: 'top 90%',
        toggleActions: 'play none none none'
      },
      width: val,
      duration: 1.5,
      ease: 'power4.out'
    });
  });

  // Service Cards reveal trigger removed to prevent opacity conflict

  // Why Choose Me Cards reveal trigger
  const whyCards = document.querySelectorAll('.why-card');
  if (whyCards.length > 0) {
    gsap.from(whyCards, {
      scrollTrigger: {
        trigger: '.why-grid',
        start: 'top 85%',
        toggleActions: 'play none none none'
      },
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out'
    });
  }

  // Tech Cards reveal trigger
  const techCards = document.querySelectorAll('.tech-card');
  if (techCards.length > 0) {
    gsap.from(techCards, {
      scrollTrigger: {
        trigger: '.tech-grid',
        start: 'top 85%',
        toggleActions: 'play none none none'
      },
      scale: 0.85,
      opacity: 0,
      duration: 0.5,
      stagger: 0.05,
      ease: 'power2.out'
    });
  }

  // Project Items timeline trigger
  const projectItems = document.querySelectorAll('.project-item');
  projectItems.forEach(item => {
    const info = item.querySelector('.project-info');
    const visuals = item.querySelector('.project-visuals');
    
    gsap.from(info, {
      scrollTrigger: {
        trigger: item,
        start: 'top 80%',
        toggleActions: 'play none none none'
      },
      x: -50,
      opacity: 0,
      duration: 1,
      ease: 'power3.out'
    });

    gsap.from(visuals, {
      scrollTrigger: {
        trigger: item,
        start: 'top 80%',
        toggleActions: 'play none none none'
      },
      x: 50,
      opacity: 0,
      duration: 1,
      ease: 'power3.out'
    });
  });

  // Video Cards grid trigger
  const videoCards = document.querySelectorAll('.video-card');
  if (videoCards.length > 0) {
    gsap.from(videoCards, {
      scrollTrigger: {
        trigger: '.video-grid',
        start: 'top 85%',
        toggleActions: 'play none none none'
      },
      y: 60,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out'
    });
  }

  // Web Dev Cards grid trigger
  const webdevCards = document.querySelectorAll('.webdev-card');
  if (webdevCards.length > 0) {
    gsap.from(webdevCards, {
      scrollTrigger: {
        trigger: '.webdev-grid',
        start: 'top 85%',
        toggleActions: 'play none none none'
      },
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out'
    });
  }

  // Mobile Dev reveal trigger
  const mobileDevTrigger = document.querySelector('.mobile-dev-wrap');
  if (mobileDevTrigger) {
    gsap.from('.mobile-dev-details', {
      scrollTrigger: {
        trigger: mobileDevTrigger,
        start: 'top 85%',
        toggleActions: 'play none none none'
      },
      x: -50,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    });

    gsap.from('.mobile-dev-mockups', {
      scrollTrigger: {
        trigger: mobileDevTrigger,
        start: 'top 85%',
        toggleActions: 'play none none none'
      },
      x: 50,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    });
  }

  // Workflow Timeline Item triggers
  const timelineItems = document.querySelectorAll('.timeline-item');
  timelineItems.forEach(item => {
    const content = item.querySelector('.timeline-content');
    const dot = item.querySelector('.timeline-dot');
    
    gsap.from(dot, {
      scrollTrigger: {
        trigger: item,
        start: 'top 85%',
        toggleActions: 'play none none none'
      },
      scale: 0,
      duration: 0.5,
      ease: 'back.out(2)'
    });

    gsap.from(content, {
      scrollTrigger: {
        trigger: item,
        start: 'top 85%',
        toggleActions: 'play none none none'
      },
      y: 40,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    });
  });

  // Roadmap list reveal trigger
  const roadmapCards = document.querySelectorAll('.roadmap-card');
  if (roadmapCards.length > 0) {
    gsap.from(roadmapCards, {
      scrollTrigger: {
        trigger: '.roadmap-wrap',
        start: 'top 85%',
        toggleActions: 'play none none none'
      },
      x: -40,
      opacity: 0,
      duration: 0.6,
      stagger: 0.15,
      ease: 'power3.out'
    });
  }

  // Contact items reveal trigger
  const contactTrigger = document.querySelector('.contact-grid');
  if (contactTrigger) {
    gsap.from('.contact-info', {
      scrollTrigger: {
        trigger: contactTrigger,
        start: 'top 85%',
        toggleActions: 'play none none none'
      },
      x: -50,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    });

    gsap.from('.contact-form', {
      scrollTrigger: {
        trigger: contactTrigger,
        start: 'top 85%',
        toggleActions: 'play none none none'
      },
      x: 50,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    });
  }

  // --- IMAGE MODAL LOGIC ---
  const modal = document.getElementById('image-modal');
  const modalImg = document.getElementById('modal-img');
  const closeModalBtn = document.querySelector('.close-modal');
  
  if (modal && modalImg && closeModalBtn) {
    // Select all clickable images (project screens + any with modal-trigger class)
    const projectImages = document.querySelectorAll('.browser-screen img, .phone-screen img, .modal-trigger');
    
    projectImages.forEach(img => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        modalImg.src = img.src;
        // Force flex display then opacity transition
        modal.style.display = 'flex';
        requestAnimationFrame(() => {
          modal.style.opacity = '1';
        });
        document.body.style.overflow = 'hidden';
      });
    });

    // Close modal function
    const closeModal = () => {
      modal.style.opacity = '0';
      setTimeout(() => {
        modal.style.display = 'none';
        modalImg.src = '';
      }, 300);
      document.body.style.overflow = 'auto';
    };

    closeModalBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
        closeModal();
      }
    });
  }
});

// --- GLOBAL UTILS ---
window.copyToClipboard = function(text, element) {
  navigator.clipboard.writeText(text).then(() => {
    const feedback = element.querySelector('.copy-feedback');
    if (feedback) {
      feedback.style.display = 'inline';
      setTimeout(() => {
        feedback.style.display = 'none';
      }, 2000);
    }
  }).catch(err => {
    console.error('Failed to copy: ', err);
  });
};

  // --- WEB3FORMS CONTACT FORM SUBMISSION ---
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(event) {
      event.preventDefault();
      
      const form = event.target;
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Sending... <i data-lucide="loader" style="width: 18px; height: 18px; animation: spin 2s linear infinite;"></i>';
      submitBtn.disabled = true;

      const formData = new FormData(form);
      formData.append("access_key", "157cdebc-7525-4fd3-9496-5b433cf2f39c");
      
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      })
      .then(async (response) => {
        let json = await response.json();
        if (response.status === 200) {
          alert('Message successfully sent!');
          form.reset();
        } else {
          alert(json.message || 'Failed to send message.');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while sending the message.');
      })
      .finally(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        if (window.lucide) { lucide.createIcons(); }
      });
    });
  }
