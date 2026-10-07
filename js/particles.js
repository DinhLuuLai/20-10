// particles.js - Canvas Particle Engine siêu mượt 60FPS với nhiều hiệu ứng VIP

class ParticleEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    this.particles = [];
    this.fireworks = [];
    this.mode = "golden-dust"; // golden-dust | rose-petals | glowing-hearts
    this.isRunning = false;
    this.mouse = { x: -1000, y: -1000, radius: 100 };

    this.resize();
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("mousemove", (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    window.addEventListener("touchmove", (e) => {
      if (e.touches && e.touches[0]) {
        this.mouse.x = e.touches[0].clientX;
        this.mouse.y = e.touches[0].clientY;
      }
    }, { passive: true });
    window.addEventListener("touchstart", (e) => {
      if (e.touches && e.touches[0]) {
        this.mouse.x = e.touches[0].clientX;
        this.mouse.y = e.touches[0].clientY;
      }
    }, { passive: true });
    window.addEventListener("touchend", () => {
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    }, { passive: true });

    this.start();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
    this.initParticles();
  }

  setMode(mode) {
    this.mode = mode;
    this.initParticles();
  }

  initParticles() {
    this.particles = [];
    const count = window.innerWidth < 768 ? 40 : 85;

    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle() {
    const base = {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: Math.random() * 0.8 + 0.3,
      size: Math.random() * 4 + 1.5,
      alpha: Math.random() * 0.7 + 0.3,
      color: "#ffd700",
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.04,
      oscillationSpeed: Math.random() * 0.02 + 0.01,
      oscillationPhase: Math.random() * Math.PI * 2,
    };

    if (this.mode === "golden-dust") {
      base.vy = -(Math.random() * 0.6 + 0.2); // Bay lên lấp lánh
      base.size = Math.random() * 3 + 1;
      base.color = Math.random() > 0.3 ? "#ffd700" : "#fff8db";
    } else if (this.mode === "rose-petals") {
      base.vy = Math.random() * 1.2 + 0.6; // Rơi xuống bồng bềnh
      base.vx = Math.sin(Math.random() * 10) * 0.5;
      base.size = Math.random() * 10 + 6;
      base.aspect = Math.random() * 0.4 + 0.5; // Elip cánh hoa
      base.color = Math.random() > 0.4 ? "#e63946" : "#ff758f";
    } else if (this.mode === "glowing-hearts") {
      base.vy = -(Math.random() * 0.9 + 0.4);
      base.size = Math.random() * 8 + 6;
      base.color = Math.random() > 0.5 ? "#ff3366" : "#ff70a6";
    }

    return base;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.loop();
  }

  loop() {
    if (!this.isRunning) return;
    requestAnimationFrame(() => this.loop());

    this.ctx.clearRect(0, 0, this.width, this.height);

    // Render continuous ambient particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Update movement
      p.oscillationPhase += p.oscillationSpeed;
      p.x += p.vx + Math.sin(p.oscillationPhase) * 0.5;
      p.y += p.vy;
      p.rot += p.vRot;

      // Mouse repulsion / attraction micro-effect
      const dx = this.mouse.x - p.x;
      const dy = this.mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.mouse.radius) {
        const force = (this.mouse.radius - dist) / this.mouse.radius;
        p.x -= (dx / dist) * force * 2;
        p.y -= (dy / dist) * force * 2;
      }

      // Recycle when off-screen
      if (p.y < -20 || p.y > this.height + 20 || p.x < -20 || p.x > this.width + 20) {
        Object.assign(p, this.createParticle());
        if (this.mode === "golden-dust" || this.mode === "glowing-hearts") {
          p.y = this.height + 10;
        } else {
          p.y = -10;
        }
      }

      // Draw particle according to mode
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rot);
      this.ctx.globalAlpha = p.alpha;

      if (this.mode === "golden-dust") {
        // Glowing star / stardust
        this.ctx.fillStyle = p.color;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = p.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        this.ctx.fill();
        // Cross sparkle on larger ones
        if (p.size > 2.5) {
          this.ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
          this.ctx.lineWidth = 0.8;
          this.ctx.beginPath();
          this.ctx.moveTo(-p.size * 2, 0);
          this.ctx.lineTo(p.size * 2, 0);
          this.ctx.moveTo(0, -p.size * 2);
          this.ctx.lineTo(0, p.size * 2);
          this.ctx.stroke();
        }
      } else if (this.mode === "rose-petals") {
        // Realistic Rose Petal
        this.ctx.fillStyle = p.color;
        this.ctx.shadowBlur = 4;
        this.ctx.shadowColor = "rgba(0,0,0,0.3)";
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, p.size, p.size * (p.aspect || 0.6), 0, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (this.mode === "glowing-hearts") {
        // Glowing Floating Heart
        this.drawHeart(0, 0, p.size, p.color);
      }

      this.ctx.restore();
    }

    // Render Fireworks
    this.renderFireworks();
  }

  drawHeart(x, y, size, color) {
    this.ctx.fillStyle = color;
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = color;
    this.ctx.beginPath();
    const topCurveHeight = size * 0.3;
    this.ctx.moveTo(x, y + topCurveHeight);
    // top left curve
    this.ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
    // bottom left curve
    this.ctx.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + (size + topCurveHeight) / 1.4, x, y + size);
    // bottom right curve
    this.ctx.bezierCurveTo(x, y + (size + topCurveHeight) / 1.4, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
    // top right curve
    this.ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
    this.ctx.closePath();
    this.ctx.fill();
  }

  // Trigger high-celebration fireworks burst!
  burst(x = window.innerWidth / 2, y = window.innerHeight / 2, count = 60) {
    const colors = ["#ffd700", "#ff3366", "#00ffff", "#ff9900", "#ffffff", "#e056fd"];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
      const speed = Math.random() * 6 + 2;
      this.fireworks.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 3 + 2,
        decay: Math.random() * 0.02 + 0.015,
        gravity: 0.1,
      });
    }
  }

  renderFireworks() {
    for (let i = this.fireworks.length - 1; i >= 0; i--) {
      const f = this.fireworks[i];
      f.x += f.vx;
      f.y += f.vy;
      f.vy += f.gravity;
      f.vx *= 0.98;
      f.alpha -= f.decay;

      if (f.alpha <= 0) {
        this.fireworks.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = f.alpha;
      this.ctx.fillStyle = f.color;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = f.color;
      this.ctx.beginPath();
      this.ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }
}

window.ParticleEngine = ParticleEngine;
