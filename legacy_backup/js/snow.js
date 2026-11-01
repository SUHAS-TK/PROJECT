/* ═══════════════════════════════════════════════════════
   snow.js – Beautiful Snowfall Effect
   Renders animated snowflakes on a canvas overlay
   ═══════════════════════════════════════════════════════ */
"use strict";

(function () {
  const canvas = document.getElementById("snowCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width, height;
  let snowflakes = [];
  let animFrameId;

  const MAX_FLAKES = 120;
  const WIND_SPEED = 0.3;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function createSnowflake() {
    return {
      x: Math.random() * width,
      y: Math.random() * -height,
      radius: Math.random() * 3.5 + 1,
      speed: Math.random() * 1.5 + 0.5,
      wind: Math.random() * WIND_SPEED - WIND_SPEED / 2,
      opacity: Math.random() * 0.6 + 0.2,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.02 + 0.005,
    };
  }

  function init() {
    resize();
    snowflakes = [];
    for (let i = 0; i < MAX_FLAKES; i++) {
      const flake = createSnowflake();
      flake.y = Math.random() * height; // Spread initial flakes across screen
      snowflakes.push(flake);
    }
  }

  function update() {
    for (const flake of snowflakes) {
      flake.wobble += flake.wobbleSpeed;
      flake.x += flake.wind + Math.sin(flake.wobble) * 0.5;
      flake.y += flake.speed;

      // Reset snowflake when it falls off screen
      if (flake.y > height + 10) {
        flake.y = -10;
        flake.x = Math.random() * width;
      }
      if (flake.x > width + 10) flake.x = -10;
      if (flake.x < -10) flake.x = width + 10;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const isDark = document.documentElement.getAttribute("data-theme") !== "light";

    for (const flake of snowflakes) {
      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);

      if (isDark) {
        ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
      } else {
        ctx.fillStyle = `rgba(100, 140, 200, ${flake.opacity * 0.5})`;
      }

      // Add subtle glow
      ctx.shadowBlur = flake.radius * 2;
      ctx.shadowColor = isDark
        ? `rgba(200, 220, 255, ${flake.opacity * 0.3})`
        : `rgba(100, 140, 200, ${flake.opacity * 0.2})`;

      ctx.fill();
    }

    ctx.shadowBlur = 0;
  }

  function animate() {
    update();
    draw();
    animFrameId = requestAnimationFrame(animate);
  }

  // Start
  init();
  animate();

  // Handle resize
  window.addEventListener("resize", () => {
    resize();
  });
})();
