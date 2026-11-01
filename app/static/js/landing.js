/**
 * landing.js — Project Viva Simulator Landing Page
 * Three.js particles + GSAP animations + parallax + mentor chat
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════
     THREE.JS BACKGROUND ANIMATION
  ══════════════════════════════════════════════════ */
  function initThreeBackground() {
    const canvas = document.getElementById('threeCanvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 80;

    // Create particle geometry
    const particleCount = 800;
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);

    const colorOptions = [
      [0, 0.96, 1],     // cyan
      [0.31, 0.56, 0.97], // blue
      [0.66, 0.33, 0.97], // purple
      [0.04, 0.96, 0.56]  // green
    ];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
      sizes[i] = Math.random() * 2 + 0.5;

      const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      colors[i * 3] = color[0];
      colors[i * 3 + 1] = color[1];
      colors[i * 3 + 2] = color[2];
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Add subtle connecting lines
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = [];
    const lineColors = [];

    for (let i = 0; i < 80; i++) {
      const x1 = (Math.random() - 0.5) * 150;
      const y1 = (Math.random() - 0.5) * 150;
      const z1 = (Math.random() - 0.5) * 50;
      const x2 = x1 + (Math.random() - 0.5) * 30;
      const y2 = y1 + (Math.random() - 0.5) * 30;
      const z2 = z1 + (Math.random() - 0.5) * 10;

      linePositions.push(x1, y1, z1, x2, y2, z2);
      lineColors.push(0, 0.96, 1, 0, 0.96, 1);
    }

    lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(lineColors), 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending,
    });

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // Mouse parallax
    let mouseX = 0, mouseY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Resize handler
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Animation loop
    let frame = 0;
    function animate() {
      requestAnimationFrame(animate);
      frame++;

      // Slow rotation
      particles.rotation.y += 0.0003;
      particles.rotation.x += 0.0001;
      lines.rotation.y += 0.0002;

      // Mouse parallax on camera
      camera.position.x += (mouseX * 15 - camera.position.x) * 0.02;
      camera.position.y += (mouseY * 10 - camera.position.y) * 0.02;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    }

    animate();
  }

  /* ══════════════════════════════════════════════════
     DOM PARTICLE FIELD
  ══════════════════════════════════════════════════ */
  function initDOMParticles() {
    const field = document.getElementById('particleField');
    if (!field) return;

    const count = window.innerWidth < 768 ? 20 : 40;

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.cssText = `
        left: ${Math.random() * 100}%;
        width: ${Math.random() * 2 + 1}px;
        height: ${Math.random() * 2 + 1}px;
        animation-duration: ${Math.random() * 20 + 15}s;
        animation-delay: ${Math.random() * 15}s;
        --drift: ${(Math.random() - 0.5) * 100}px;
        background: ${['#00f5ff', '#4f8ef7', '#a855f7', '#10f58e'][Math.floor(Math.random() * 4)]};
      `;
      field.appendChild(p);
    }
  }

  /* ══════════════════════════════════════════════════
     GSAP ANIMATIONS
  ══════════════════════════════════════════════════ */
  function initGSAPAnimations() {
    if (typeof gsap === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    // Navbar scroll effect
    ScrollTrigger.create({
      start: 'top -80px',
      onUpdate: (self) => {
        const nav = document.getElementById('fuiNavbar');
        if (nav) {
          nav.classList.toggle('scrolled', self.progress > 0);
        }
      }
    });

    // Feature cards stagger animation
    gsap.utils.toArray('.fui-feature-card').forEach((card, i) => {
      gsap.fromTo(card,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: (i % 4) * 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
    });

    // Journey steps
    gsap.utils.toArray('.fui-journey-step').forEach((step, i) => {
      gsap.fromTo(step,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          delay: i * 0.15,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: step,
            start: 'top 85%',
          }
        }
      );
    });

    // Format items
    gsap.utils.toArray('.fui-format-item').forEach((item, i) => {
      gsap.fromTo(item,
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.4,
          delay: i * 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 88%',
          }
        }
      );
    });

    // Mode cards
    gsap.utils.toArray('.fui-mode-card').forEach((card, i) => {
      gsap.fromTo(card,
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          delay: i * 0.12,
          ease: 'back.out(1.5)',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
          }
        }
      );
    });
  }

  /* ══════════════════════════════════════════════════
     SCROLL INDICATOR HIDE
  ══════════════════════════════════════════════════ */
  function initScrollIndicator() {
    const indicator = document.getElementById('scrollIndicator');
    if (!indicator) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 100) {
        indicator.style.opacity = '0';
        indicator.style.transform = 'translateX(-50%) translateY(20px)';
      }
    }, { passive: true });
  }

  /* ══════════════════════════════════════════════════
     STATS COUNTER ANIMATION
  ══════════════════════════════════════════════════ */
  function initCounters() {
    const nums = document.querySelectorAll('.fui-stat-num[data-target]');
    if (!nums.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);

        const el = entry.target;
        const target = parseInt(el.dataset.target);
        const duration = 1200;
        const start = performance.now();

        function update(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(eased * target);
          if (progress < 1) requestAnimationFrame(update);
        }

        requestAnimationFrame(update);
      });
    }, { threshold: 0.5 });

    nums.forEach(num => observer.observe(num));
  }

  /* ══════════════════════════════════════════════════
     3D HOLOGRAPHIC AI BRAIN (Three.js)
  ══════════════════════════════════════════════════ */
  function initParallax() {
    init3DBrain();
  }

  function init3DBrain() {
    const canvas = document.getElementById('brainCanvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const size = 360;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.z = 7;

    const brainGroup = new THREE.Group();
    scene.add(brainGroup);

    // 1. Outer Wireframe Neural Sphere
    const outerGeom = new THREE.IcosahedronGeometry(2.1, 2);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x00f5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const outerMesh = new THREE.Mesh(outerGeom, outerMat);
    brainGroup.add(outerMesh);

    // 2. Inner Pulsing Core
    const innerGeom = new THREE.IcosahedronGeometry(1.4, 2);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    });
    const innerMesh = new THREE.Mesh(innerGeom, innerMat);
    brainGroup.add(innerMesh);

    // 3. Glowing Synaptic Nodes (Point Cloud)
    const posAttr = outerGeom.attributes.position;
    const nodeCount = posAttr.count;
    const nodePositions = new Float32Array(nodeCount * 3);
    const nodeColors = new Float32Array(nodeCount * 3);

    for (let i = 0; i < nodeCount; i++) {
      nodePositions[i * 3] = posAttr.getX(i);
      nodePositions[i * 3 + 1] = posAttr.getY(i);
      nodePositions[i * 3 + 2] = posAttr.getZ(i);

      if (i % 3 === 0) {
        nodeColors[i * 3] = 0; nodeColors[i * 3 + 1] = 0.96; nodeColors[i * 3 + 2] = 1;
      } else if (i % 3 === 1) {
        nodeColors[i * 3] = 0.66; nodeColors[i * 3 + 1] = 0.33; nodeColors[i * 3 + 2] = 0.97;
      } else {
        nodeColors[i * 3] = 0.31; nodeColors[i * 3 + 1] = 0.56; nodeColors[i * 3 + 2] = 0.97;
      }
    }

    const nodeGeom = new THREE.BufferGeometry();
    nodeGeom.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
    nodeGeom.setAttribute('color', new THREE.BufferAttribute(nodeColors, 3));

    const nodeMat = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const nodes = new THREE.Points(nodeGeom, nodeMat);
    brainGroup.add(nodes);

    // 4. 3D Concentric Holographic Rings
    function makeRing(radius, tube, color, opacity) {
      const ringGeom = new THREE.TorusGeometry(radius, tube, 8, 80);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
      });
      return new THREE.Mesh(ringGeom, ringMat);
    }

    const ring1 = makeRing(2.6, 0.02, 0x00f5ff, 0.7);
    ring1.rotation.x = Math.PI / 3;
    brainGroup.add(ring1);

    const ring2 = makeRing(2.9, 0.018, 0xa855f7, 0.6);
    ring2.rotation.y = Math.PI / 4;
    brainGroup.add(ring2);

    const ring3 = makeRing(3.2, 0.015, 0x4f8ef7, 0.5);
    ring3.rotation.z = Math.PI / 6;
    brainGroup.add(ring3);

    // 5. Orbiting Data Sparks
    const sparkCount = 40;
    const sparkGeom = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 2.4 + Math.random() * 1.2;
      sparkPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      sparkPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      sparkPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    sparkGeom.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0x00f5ff,
      size: 0.08,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const sparks = new THREE.Points(sparkGeom, sparkMat);
    brainGroup.add(sparks);

    let targetRotX = 0;
    let targetRotY = 0;
    let isHovered = false;

    window.addEventListener('mousemove', (e) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      targetRotY = nx * 0.8;
      targetRotX = ny * 0.6;
    });

    canvas.addEventListener('mouseenter', () => { isHovered = true; });
    canvas.addEventListener('mouseleave', () => { isHovered = false; });
    canvas.addEventListener('click', () => {
      if (typeof gsap !== 'undefined') {
        gsap.to(brainGroup.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 0.15, yoyo: true, repeat: 1 });
      }
      setTimeout(() => { window.location.href = '/dashboard'; }, 250);
    });

    let clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      const speed = isHovered ? 1.8 : 1.0;
      outerMesh.rotation.y += 0.005 * speed;
      outerMesh.rotation.x += 0.002 * speed;
      innerMesh.rotation.y -= 0.008 * speed;
      innerMesh.rotation.z += 0.003 * speed;
      nodes.rotation.y += 0.005 * speed;
      nodes.rotation.x += 0.002 * speed;

      ring1.rotation.z += 0.007 * speed;
      ring2.rotation.x += 0.006 * speed;
      ring3.rotation.y -= 0.005 * speed;
      sparks.rotation.y += 0.003 * speed;

      const pulse = 1 + Math.sin(elapsed * 2.5) * 0.04;
      innerMesh.scale.set(pulse, pulse, pulse);

      brainGroup.rotation.y += (targetRotY - brainGroup.rotation.y) * 0.05;
      brainGroup.rotation.x += (targetRotX - brainGroup.rotation.x) * 0.05;

      renderer.render(scene, camera);
    }
    animate();
  }

  function initBrainClick() {
    // Handled in init3DBrain
  }

  /* ══════════════════════════════════════════════════
     EXPLORE FEATURES BTN
  ══════════════════════════════════════════════════ */
  function initButtons() {
    const exploreBtn = document.getElementById('exploreFeaturesBtn');
    if (exploreBtn) {
      exploreBtn.addEventListener('click', () => {
        const features = document.getElementById('featuresSection');
        if (features) {
          features.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }

  /* ══════════════════════════════════════════════════
     MOBILE MENU
  ══════════════════════════════════════════════════ */
  function initMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const links = document.querySelector('.fui-nav-links');
    if (!btn || !links) return;

    btn.addEventListener('click', () => {
      links.classList.toggle('open');
      const isOpen = links.classList.contains('open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', (e) => {
      if (!btn.contains(e.target) && !links.contains(e.target)) {
        links.classList.remove('open');
      }
    });
  }

  /* ══════════════════════════════════════════════════
     AI MENTOR CHAT FAB
  ══════════════════════════════════════════════════ */
  function initMentorChat() {
    const fab = document.getElementById('mentorFab');
    const panel = document.getElementById('mentorPanel');
    const closeBtn = document.getElementById('mentorClose');
    const sendBtn = document.getElementById('mentorSendBtn');
    const input = document.getElementById('mentorInput');
    const messages = document.getElementById('mentorMessages');

    if (!fab || !panel) return;

    let isOpen = false;
    let chatHistory = [];

    function togglePanel() {
      isOpen = !isOpen;
      panel.classList.toggle('open', isOpen);
    }

    fab.addEventListener('click', togglePanel);
    if (closeBtn) closeBtn.addEventListener('click', togglePanel);

    function addMessage(content, role) {
      const div = document.createElement('div');
      div.className = `mentor-msg ${role}`;
      const inner = document.createElement('div');
      inner.className = 'msg-content';
      inner.innerHTML = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
      div.appendChild(inner);
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    function addTypingIndicator() {
      const div = document.createElement('div');
      div.className = 'mentor-msg bot typing-indicator-wrap';
      div.id = 'typingIndicator';
      div.innerHTML = '<div class="msg-content" style="display:flex;gap:4px;align-items:center;padding:0.75rem 1rem"><span style="width:6px;height:6px;border-radius:50%;background:var(--neon-cyan);animation:pulse 0.8s ease-in-out infinite"></span><span style="width:6px;height:6px;border-radius:50%;background:var(--neon-cyan);animation:pulse 0.8s ease-in-out 0.2s infinite"></span><span style="width:6px;height:6px;border-radius:50%;background:var(--neon-cyan);animation:pulse 0.8s ease-in-out 0.4s infinite"></span></div>';
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    function removeTypingIndicator() {
      const t = document.getElementById('typingIndicator');
      if (t) t.remove();
    }

    async function sendMessage() {
      const msg = (input.value || '').trim();
      if (!msg) return;

      input.value = '';
      addMessage(msg, 'user');
      chatHistory.push({ role: 'user', content: msg });

      addTypingIndicator();

      try {
        const res = await fetch('/api/agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: msg,
            history: chatHistory.slice(-6),
          })
        });

        removeTypingIndicator();

        if (res.ok) {
          const data = await res.json();
          const reply = data.response || "I'm here to help with your viva preparation!";
          addMessage(reply, 'bot');
          chatHistory.push({ role: 'assistant', content: reply });
        } else {
          addMessage('⚠️ AI service is busy. Please try again shortly.', 'bot');
        }
      } catch (err) {
        removeTypingIndicator();
        addMessage('💡 **Tip:** Upload your project document on the Dashboard to get AI-powered viva preparation assistance!', 'bot');
      }
    }

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }
  }

  /* ══════════════════════════════════════════════════
     FEATURE CARD INTERSECTION OBSERVER (FALLBACK)
  ══════════════════════════════════════════════════ */
  function initIntersectionObserver() {
    if (typeof gsap !== 'undefined') return; // GSAP handles it

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fui-feature-card, .fui-journey-step').forEach(el => {
      observer.observe(el);
    });
  }

  /* ══════════════════════════════════════════════════
     THEME TOGGLE BUTTON
  ══════════════════════════════════════════════════ */
  function initThemeToggle() {
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;

    function updateBtn() {
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      const icon = btn.querySelector('.theme-icon');
      if (icon) icon.textContent = isDark ? '☀️' : '🌙';
    }

    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('viva-theme', next);
      updateBtn();
    });

    updateBtn();
  }

  /* ══════════════════════════════════════════════════
     INIT ALL
  ══════════════════════════════════════════════════ */
  function init() {
    // Small delay to let Three.js CDN load
    setTimeout(() => {
      initThreeBackground();
      init3DBrain();
    }, 100);

    initDOMParticles();
    initCounters();
    initParallax();
    initBrainClick();
    initButtons();
    initMobileMenu();
    initMentorChat();
    initIntersectionObserver();
    initThemeToggle();

    // GSAP with ScrollTrigger – slight delay
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      initGSAPAnimations();
    } else {
      // Wait for GSAP
      window.addEventListener('load', () => {
        if (typeof gsap !== 'undefined') initGSAPAnimations();
      });
    }

    initScrollIndicator();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

