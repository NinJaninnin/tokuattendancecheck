/**
 * Particle & Visual Effects Engine for Gacha & Celebrations
 */
class ParticleEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animId = null;
    this.lastTime = 0;
  }

  init(container = document.body) {
    if (this.canvas) return;

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'fx-canvas';
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '9999';
    container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.loop();
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  loop(timestamp = 0) {
    const dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.update(dt || 0.016);
        p.draw(this.ctx);
        if (p.isDead()) {
          this.particles.splice(i, 1);
        }
      }
    }

    this.animId = requestAnimationFrame((t) => this.loop(t));
  }

  // 출석체크 코인 폭포 연출 (Coin Shower)
  spawnCoinShower(count = 60) {
    this.init();
    const w = this.canvas.width;
    for (let i = 0; i < count; i++) {
      const x = Math.random() * w;
      const y = -20 - Math.random() * 200;
      this.particles.push(new CoinParticle(x, y));
    }
  }

  // 가챠 등급별 스파크 폭발 연출
  spawnBurst(x, y, rank = 'N', count = 40) {
    this.init();
    const colors = {
      UR: ['#ff007f', '#ff00ff', '#00f0ff', '#ffe600', '#ffffff'],
      SSR: ['#ffd700', '#ffae00', '#fff4a3', '#ffffff', '#ff8400'],
      SR: ['#b300ff', '#8000ff', '#d980ff', '#ffffff'],
      R: ['#00a2ff', '#00d0ff', '#70e0ff', '#ffffff'],
      N: ['#a0b0c0', '#c8d8e8', '#ffffff', '#7a8a9a']
    };

    const palette = colors[(rank || 'N').toUpperCase()] || colors.N;
    const actualCount = rank === 'UR' ? count * 2 : (rank === 'SSR' ? count * 1.5 : count);

    for (let i = 0; i < actualCount; i++) {
      this.particles.push(new SparkParticle(x, y, palette));
    }
  }

  // 화면 전체 축하 컨페티 (Confetti)
  spawnConfetti(count = 80) {
    this.init();
    const w = this.canvas.width;
    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ffd700'];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * w;
      const y = -10 - Math.random() * 100;
      this.particles.push(new ConfettiParticle(x, y, colors));
    }
  }
}

class CoinParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 80;
    this.vy = 250 + Math.random() * 350;
    this.radius = 8 + Math.random() * 6;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = 5 + Math.random() * 8;
    this.alpha = 1;
    this.life = 2.5 + Math.random();
    this.maxLife = this.life;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.rotSpeed * dt;
    this.life -= dt;
    this.alpha = Math.max(0, this.life / this.maxLife);
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    const scaleX = Math.cos(this.rotation);
    ctx.scale(scaleX, 1);

    // 금화 외곽
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();

    // 금화 내부
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();

    // 'P' 심볼
    if (Math.abs(scaleX) > 0.3) {
      ctx.fillStyle = '#d97706';
      ctx.font = `bold ${Math.round(this.radius)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('P', 0, 0);
    }

    ctx.restore();
  }

  isDead() {
    return this.life <= 0 || this.y > window.innerHeight + 50;
  }
}

class SparkParticle {
  constructor(x, y, palette) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 120 + Math.random() * 380;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.drag = 0.94;
    this.color = palette[Math.floor(Math.random() * palette.length)];
    this.radius = 2 + Math.random() * 4;
    this.life = 0.6 + Math.random() * 0.8;
    this.maxLife = this.life;
  }

  update(dt) {
    this.vx *= this.drag;
    this.vy *= this.drag;
    this.vy += 80 * dt; // 미세 중력
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  isDead() {
    return this.life <= 0;
  }
}

class ConfettiParticle {
  constructor(x, y, colors) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 120;
    this.vy = 100 + Math.random() * 200;
    this.w = 8 + Math.random() * 8;
    this.h = 4 + Math.random() * 6;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeedX = (Math.random() - 0.5) * 8;
    this.rotSpeedY = (Math.random() - 0.5) * 8;
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.life = 3.5 + Math.random() * 2;
    this.maxLife = this.life;
  }

  update(dt) {
    this.x += this.vx * dt + Math.sin(this.y * 0.02) * 1.5;
    this.y += this.vy * dt;
    this.rotation += this.rotSpeedX * dt;
    this.life -= dt;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    ctx.restore();
  }

  isDead() {
    return this.life <= 0 || this.y > window.innerHeight + 50;
  }
}

window.particles = new ParticleEngine();
