/* ═══════════════════════════════════════════════════════
   effects.js – Advanced Visual Effects
   Scroll reveal, counter animation, floating particles,
   cursor trail, scroll-based indicator hide, etc.
   ═══════════════════════════════════════════════════════ */
"use strict";

(function () {

  // ── Scroll Reveal (Intersection Observer) ──────────────
  function initScrollReveal() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    document.querySelectorAll(".reveal-on-scroll").forEach((el) => {
      observer.observe(el);
    });
  }

  // ── Counter Animation ──────────────────────────────────
  function initCounters() {
    const counters = document.querySelectorAll(".counter[data-target]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.dataset.target);
            animateCounter(el, 0, target, 1500);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((c) => observer.observe(c));
  }

  function animateCounter(el, start, end, duration) {
    const startTime = performance.now();
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      el.textContent = current;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // ── Floating Particles ─────────────────────────────────
  function initFloatingParticles() {
    const container = document.getElementById("floatingParticles");
    if (!container) return;

    const count = 25;
    for (let i = 0; i < count; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.left = Math.random() * 100 + "%";
      particle.style.animationDuration = (Math.random() * 15 + 8) + "s";
      particle.style.animationDelay = (Math.random() * 10) + "s";
      particle.style.width = (Math.random() * 4 + 2) + "px";
      particle.style.height = particle.style.width;
      particle.style.opacity = (Math.random() * 0.3 + 0.1).toString();

      // Random colors
      const colors = [
        "rgba(0, 229, 255, 0.5)",
        "rgba(79, 110, 247, 0.4)",
        "rgba(124, 58, 237, 0.3)",
        "rgba(56, 189, 248, 0.4)",
      ];
      particle.style.background = colors[Math.floor(Math.random() * colors.length)];

      container.appendChild(particle);
    }
  }

  // ── Scroll Indicator Hide ──────────────────────────────
  function initScrollIndicatorHide() {
    const indicator = document.getElementById("scrollIndicator");
    if (!indicator) return;

    let hidden = false;
    window.addEventListener("scroll", () => {
      if (!hidden && window.scrollY > 200) {
        indicator.style.opacity = "0";
        indicator.style.transform = "translateY(20px)";
        indicator.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        hidden = true;
      }
    });
  }

  // ── Smooth Page Link Transitions ───────────────────────
  function initPageTransitions() {
    document.querySelectorAll('a[href$=".html"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        if (href && !href.startsWith("http") && !href.startsWith("#")) {
          e.preventDefault();
          document.body.style.opacity = "0";
          document.body.style.transform = "translateY(-10px)";
          document.body.style.transition = "opacity 0.3s ease, transform 0.3s ease";
          setTimeout(() => {
            window.location.href = href;
          }, 300);
        }
      });
    });
  }

  // ── Tilt Effect on Cards ───────────────────────────────
  function initTiltEffect() {
    const cards = document.querySelectorAll(".wlc-feature-card, .wlc-step-card, .tech-card");
    cards.forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -3;
        const rotateY = ((x - centerX) / centerX) * 3;
        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
        card.style.transition = "transform 0.4s ease";
      });

      card.addEventListener("mouseenter", () => {
        card.style.transition = "transform 0.1s ease";
      });
    });
  }

  // ── Demo Question Rotation ─────────────────────────────
  function initDemoRotation() {
    const demoQ = document.getElementById("demoQuestion");
    if (!demoQ) return;

    const questions = [
      "Explain the advantages of using a microservices architecture over a monolithic architecture for your project, and discuss the trade-offs you considered.",
      "How does your RAG pipeline retrieve and rank relevant document chunks for question generation?",
      "Why did you choose SQLite over PostgreSQL for this application? What are the limitations?",
      "Describe how the FAISS vector index is built and queried during a viva session.",
      "What authentication and authorization strategies would you implement to secure this API?",
      "How would you handle concurrent viva sessions without degrading performance?",
    ];

    let idx = 0;
    const topics = ["SYSTEM DESIGN", "RAG PIPELINE", "DATABASE DESIGN", "VECTOR SEARCH", "API SECURITY", "SCALABILITY"];
    const topicEl = document.querySelector(".demo-topic");

    setInterval(() => {
      idx = (idx + 1) % questions.length;
      demoQ.style.opacity = "0";
      demoQ.style.transform = "translateY(10px)";
      setTimeout(() => {
        demoQ.textContent = questions[idx];
        if (topicEl) topicEl.textContent = topics[idx];
        demoQ.style.opacity = "1";
        demoQ.style.transform = "translateY(0)";
      }, 400);
    }, 5000);

    demoQ.style.transition = "opacity 0.4s ease, transform 0.4s ease";
  }

  // ── Toast Utility (global) ─────────────────────────────
  window.toast = function (msg, type = "info", duration = 4000) {
    const icons = { success: "✅", error: "❌", info: "ℹ️", warn: "⚠️" };
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.innerHTML = `<span class="toast-icon">${icons[type] || "ℹ️"}</span>
                    <span class="toast-msg">${msg}</span>`;
    container.appendChild(el);
    setTimeout(() => el.remove(), duration);
  };

  // ── Init All ───────────────────────────────────────────
  function initAll() {
    initScrollReveal();
    initCounters();
    initFloatingParticles();
    initScrollIndicatorHide();
    initPageTransitions();
    initTiltEffect();
    initDemoRotation();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
