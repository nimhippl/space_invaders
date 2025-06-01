// src/sprite.js
class Sprite {
  constructor(img, x, y, w, h) {
    this.img = img;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
}

// src/cannon.js
class Cannon {
  constructor(x, y, sprite) {
    this.x = x;
    this.y = y;
    this._sprite = sprite;
    this.width = sprite.w;
    this.height = sprite.h;
    this.speed = 200;
    this.vx = 0;
    this.hitTimer = 0;
    this.invulnTimer = 0;
  }
  moveLeft() {
    this.vx = -this.speed;
  }
  moveRight() {
    this.vx = this.speed;
  }
  stop() {
    this.vx = 0;
  }
  update(dt, canvasWidth) {
    this.x += this.vx * (dt / 1000);
    if (this.x < 0)
      this.x = 0;
    if (this.x + this.width > canvasWidth) {
      this.x = canvasWidth - this.width;
    }
    if (this.hitTimer > 0) {
      this.hitTimer -= dt;
      if (this.hitTimer < 0)
        this.hitTimer = 0;
    }
    if (this.invulnTimer > 0) {
      this.invulnTimer -= dt;
      if (this.invulnTimer < 0)
        this.invulnTimer = 0;
    }
  }
  draw(ctx, time) {
    if (this.hitTimer > 0) {
      const blinkPhase = Math.floor(this.hitTimer / 100) % 2;
      if (blinkPhase === 1) {
        return;
      }
    }
    ctx.drawImage(this._sprite.img, this._sprite.x, this._sprite.y, this._sprite.w, this._sprite.h, this.x, this.y, this._sprite.w, this._sprite.h);
  }
  markAsHit() {
    this.hitTimer = 800;
    this.invulnTimer = 800;
  }
  canBeHit() {
    return this.invulnTimer <= 0;
  }
  getBoundingBox() {
    return {
      left: this.x,
      top: this.y,
      right: this.x + this.width,
      bottom: this.y + this.height
    };
  }
}

// src/bullet.js
class Bullet {
  constructor(x, y, vx, vy, w, h, color, owner) {
    this.x = x;
    this.y = y;
    this.vx = vx || 0;
    this.vy = vy;
    this.w = w;
    this.h = h;
    this.color = color;
    this.owner = owner;
    this.isDead = false;
    this.prevX = x;
    this.prevY = y;
  }
  update(dt) {
    this.prevX = this.x;
    this.prevY = this.y;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
  draw(ctx) {
    if (this.isDead)
      return;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
  markAsDead() {
    this.isDead = true;
  }
  getBoundingBox() {
    return {
      left: this.x,
      top: this.y,
      right: this.x + this.w,
      bottom: this.y + this.h
    };
  }
}

// src/alien.js
class Alien {
  constructor(x, y, [spriteA, spriteB], row, col) {
    this.x = x;
    this.y = y;
    this._spriteA = spriteA;
    this._spriteB = spriteB;
    this.row = row;
    this.col = col;
    this.width = spriteA.w;
    this.height = spriteA.h;
    this.isAlive = true;
    this.animationTimer = 0;
    this.animationFrame = 0;
    this.anger = false;
    this.angerTimer = 0;
  }
  update(dt) {
    if (!this.isAlive)
      return;
    this.animationTimer += dt;
    if (this.animationTimer >= 500) {
      this.animationFrame = 1 - this.animationFrame;
      this.animationTimer = 0;
    }
    if (this.anger) {
      this.angerTimer -= dt;
      if (this.angerTimer <= 0) {
        this.anger = false;
      }
    }
  }
  draw(ctx, time) {
    if (!this.isAlive)
      return;
    const sp = this.animationFrame === 0 ? this._spriteA : this._spriteB;
    ctx.drawImage(sp.img, sp.x, sp.y, sp.w, sp.h, this.x, this.y, sp.w, sp.h);
  }
  markAsDead() {
    this.isAlive = false;
  }
  becomeAngry() {
    this.anger = true;
    this.angerTimer = 5000;
  }
  getBoundingBox() {
    return {
      left: this.x,
      top: this.y,
      right: this.x + this.width,
      bottom: this.y + this.height
    };
  }
}

// src/input-handler.js
class InputHandler {
  constructor() {
    this.down = {};
    this.pressed = {};
    document.addEventListener("keydown", (e) => {
      this.down[e.code] = true;
    });
    document.addEventListener("keyup", (e) => {
      delete this.down[e.code];
      delete this.pressed[e.code];
    });
  }
  isDown(code) {
    return this.down[code];
  }
  isPressed(code) {
    if (this.pressed[code]) {
      return false;
    } else if (this.down[code]) {
      return this.pressed[code] = true;
    }
    return false;
  }
}

// src/bunker.js
class Bunker {
  constructor(x, y, sprite, rows = 4, cols = 6, brickW = 6, brickH = 6) {
    this.x = x;
    this.y = y;
    this.sprite = sprite;
    this.rows = rows;
    this.cols = cols;
    this.brickW = brickW;
    this.brickH = brickH;
    this.bricks = [];
    for (let r = 0;r < rows; r++) {
      for (let c = 0;c < cols; c++) {
        const worldX = x + c * brickW;
        const worldY = y + r * brickH;
        const spriteOffsetX = sprite.x + c * brickW;
        const spriteOffsetY = sprite.y + r * brickH;
        this.bricks.push({
          worldX,
          worldY,
          spriteOffsetX,
          spriteOffsetY,
          isDead: false
        });
      }
    }
  }
  draw(ctx) {
    this.bricks.forEach((brick) => {
      if (!brick.isDead) {
        ctx.drawImage(this.sprite.img, brick.spriteOffsetX, brick.spriteOffsetY, this.brickW, this.brickH, brick.worldX, brick.worldY, this.brickW, this.brickH);
      }
    });
  }
  handleBulletHits(bulletsArray) {
    let destroyedCount = 0;
    bulletsArray.forEach((bullet) => {
      if (bullet.isDead)
        return;
      const bBox = bullet.getBoundingBox();
      this.bricks.forEach((brick) => {
        if (brick.isDead)
          return;
        const brickBox = {
          left: brick.worldX,
          top: brick.worldY,
          right: brick.worldX + this.brickW,
          bottom: brick.worldY + this.brickH
        };
        if (Bunker.rectIntersect(bBox, brickBox)) {
          brick.isDead = true;
          bullet.markAsDead();
          destroyedCount++;
        }
      });
    });
    return destroyedCount;
  }
  cleanup() {
    this.bricks = this.bricks.filter((brick) => !brick.isDead);
  }
  static rectIntersect(a, b) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }
}

class BunkerManager {
  constructor(canvasWidth, canvasHeight, count = 4, offsetY = 120, bunkerSprite) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.bunkerSprite = bunkerSprite;
    this.bunkers = [];
    const totalSlots = count + 1;
    const spacing = canvasWidth / totalSlots;
    for (let i = 1;i <= count; i++) {
      const bunkerX = Math.floor(spacing * i - this.bunkerSprite.w / 2);
      const bunkerY = offsetY;
      const bunker = new Bunker(bunkerX, bunkerY, this.bunkerSprite, 4, 6, 6, 6);
      this.bunkers.push(bunker);
    }
  }
  drawAll(ctx) {
    this.bunkers.forEach((bunker) => bunker.draw(ctx));
  }
  update(dt) {}
  handleAllBulletHits(bulletsArray) {
    let totalDestroyed = 0;
    this.bunkers.forEach((bunker) => {
      totalDestroyed += bunker.handleBulletHits(bulletsArray);
    });
    return totalDestroyed;
  }
  cleanupAll() {
    this.bunkers.forEach((bunker) => bunker.cleanup());
    this.bunkers = this.bunkers.filter((bunker) => bunker.bricks.length > 0);
  }
}

// assets/invaders.png
var invaders_default = "./invaders-01smhj7c.png";

// src/game.js
var assets;
var sprites = {
  aliens: [],
  cannon: null,
  bunker: null
};
var inputHandler = new InputHandler;
var canvasWidth;
var canvasHeight;
var enemyDirection = 1;
var enemySpeed = 30;
var dropDistance = 20;
var timeSinceLastAlienShot = 0;
var nextAlienShotInterval = 2000;
var gameState = {
  cannon: null,
  bullets: [],
  enemyBullets: [],
  aliens: [],
  bunkerManager: null,
  lives: 3,
  score: 0,
  highScore: 0,
  level: 1,
  killStreak: 0,
  enraged: false,
  enragedTimer: 0,
  playerReloadTime: 500,
  playerReloadTimer: 0,
  gameOver: false,
  victory: false
};
function preload(onPreloadComplete) {
  assets = new Image;
  assets.src = invaders_default;
  assets.addEventListener("load", () => {
    sprites.aliens = [
      [new Sprite(assets, 0, 0, 22, 16), new Sprite(assets, 0, 16, 22, 16)],
      [new Sprite(assets, 22, 0, 16, 16), new Sprite(assets, 22, 16, 16, 16)],
      [new Sprite(assets, 38, 0, 24, 16), new Sprite(assets, 38, 16, 24, 16)]
    ];
    sprites.cannon = new Sprite(assets, 62, 0, 22, 16);
    sprites.bunker = new Sprite(assets, 84, 8, 36, 24);
    onPreloadComplete();
  });
}
function init(canvas) {
  canvasWidth = canvas.width;
  canvasHeight = canvas.height;
  const savedHS = localStorage.getItem("siHighScore");
  gameState.highScore = savedHS ? parseInt(savedHS, 10) : 0;
  gameState.cannon = new Cannon(canvasWidth / 2 - sprites.cannon.w / 2, canvasHeight - sprites.cannon.h - 10, sprites.cannon);
  gameState.aliens = [];
  const rows = 5;
  const cols = 11;
  const hGap = 30;
  const vGap = 30;
  const offsetX = 50;
  const offsetY = 50;
  for (let r = 0;r < rows; r++) {
    for (let c = 0;c < cols; c++) {
      const type = Math.floor(r / 2);
      const x = offsetX + c * hGap + (type === 1 ? 3 : 0);
      const y = offsetY + r * vGap;
      const alien = new Alien(x, y, sprites.aliens[type], r, c);
      gameState.aliens.push(alien);
    }
  }
  gameState.bunkerManager = new BunkerManager(canvasWidth, canvasHeight, 4, canvasHeight - 150, sprites.bunker);
  gameState.bullets = [];
  gameState.enemyBullets = [];
  gameState.lives = 3;
  gameState.score = 0;
  gameState.level = 1;
  gameState.killStreak = 0;
  gameState.enraged = false;
  gameState.enragedTimer = 0;
  gameState.playerReloadTimer = 0;
  timeSinceLastAlienShot = 0;
  nextAlienShotInterval = getRandomRange(1000, 3000);
  gameState.gameOver = false;
  gameState.victory = false;
}
function getRandomRange(min, max) {
  return min + Math.random() * (max - min);
}
function getAliveAliens() {
  return gameState.aliens.filter((a) => a.isAlive);
}
function getAlienBounds() {
  const alive = getAliveAliens();
  if (alive.length === 0)
    return { minX: 0, maxX: 0 };
  const xs = alive.map((a) => a.x);
  const rights = alive.map((a) => a.x + a.width);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...rights)
  };
}
function update(dt) {
  if (gameState.gameOver || gameState.victory) {
    if (inputHandler.isPressed("Enter")) {
      init({ width: canvasWidth, height: canvasHeight });
    }
    return;
  }
  const dtSeconds = dt / 1000;
  if (inputHandler.isDown("ArrowLeft")) {
    gameState.cannon.moveLeft();
  } else if (inputHandler.isDown("ArrowRight")) {
    gameState.cannon.moveRight();
  } else {
    gameState.cannon.stop();
  }
  if (gameState.playerReloadTimer > 0) {
    gameState.playerReloadTimer -= dt;
    if (gameState.playerReloadTimer < 0)
      gameState.playerReloadTimer = 0;
  }
  if (inputHandler.isPressed("Space") && gameState.playerReloadTimer === 0) {
    shootPlayerBullet();
    gameState.playerReloadTimer = gameState.playerReloadTime;
  }
  gameState.cannon.update(dt, canvasWidth);
  gameState.bullets.forEach((b) => b.update(dt));
  gameState.enemyBullets.forEach((b) => b.update(dt));
  getAliveAliens().forEach((a) => a.update(dt));
  moveAliens(dtSeconds);
  handleAlienShooting(dt);
  handleCollisions();
  gameState.bunkerManager.handleAllBulletHits(gameState.bullets);
  gameState.bunkerManager.handleAllBulletHits(gameState.enemyBullets);
  cleanupBullets();
  gameState.bunkerManager.cleanupAll();
  const aliveAliens = getAliveAliens();
  if (aliveAliens.length === 0) {
    gameState.victory = true;
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
      localStorage.setItem("siHighScore", String(gameState.highScore));
    }
    return;
  }
  const bottomThreshold = canvasHeight - 100;
  if (aliveAliens.some((a) => a.y + a.height >= bottomThreshold)) {
    gameState.gameOver = true;
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
      localStorage.setItem("siHighScore", String(gameState.highScore));
    }
    return;
  }
  if (gameState.enraged) {
    gameState.enragedTimer -= dt;
    if (gameState.enragedTimer <= 0) {
      gameState.enraged = false;
    }
  }
}
function moveAliens(dtSeconds) {
  const bounds = getAlienBounds();
  const dx = enemySpeed * enemyDirection * dtSeconds;
  getAliveAliens().forEach((a) => {
    a.x += dx;
  });
  const newBounds = getAlienBounds();
  if (newBounds.minX <= 0 || newBounds.maxX >= canvasWidth) {
    getAliveAliens().forEach((a) => {
      a.x -= dx;
    });
    enemyDirection *= -1;
    getAliveAliens().forEach((a) => {
      a.y += dropDistance;
    });
  }
}
function handleAlienShooting(dt) {
  timeSinceLastAlienShot += dt;
  const interval = gameState.enraged ? 1000 : nextAlienShotInterval;
  if (timeSinceLastAlienShot < interval)
    return;
  timeSinceLastAlienShot = 0;
  nextAlienShotInterval = getRandomRange(1000, 3000) / (gameState.enraged ? 2 : 1);
  const bottomAliensMap = {};
  getAliveAliens().forEach((a) => {
    if (!bottomAliensMap[a.col] || a.row > bottomAliensMap[a.col].row) {
      bottomAliensMap[a.col] = a;
    }
  });
  const candidates = Object.values(bottomAliensMap);
  if (candidates.length === 0)
    return;
  const shooter = candidates[Math.floor(Math.random() * candidates.length)];
  const isAngryShooter = shooter.anger;
  if (isAngryShooter) {
    nextAlienShotInterval = nextAlienShotInterval / 2;
  }
  const bx = shooter.x + shooter.width / 2;
  const by = shooter.y + shooter.height;
  let vx, vy, color;
  if (isAngryShooter) {
    const cannonCenterX = gameState.cannon.x + gameState.cannon.width / 2;
    const cannonCenterY = gameState.cannon.y + gameState.cannon.height / 2;
    const dx = cannonCenterX - bx;
    const dy = cannonCenterY - by;
    const baseSpeed = gameState.enraged ? 0.2 : 0.1;
    const speed = baseSpeed * 1.5;
    const dist = Math.hypot(dx, dy) || 1;
    vx = dx / dist * speed;
    vy = dy / dist * speed;
    color = gameState.enraged ? "orange" : "yellow";
  } else {
    const speed = gameState.enraged ? 0.2 : 0.1;
    vx = 0;
    vy = speed;
    color = gameState.enraged ? "yellow" : "red";
  }
  gameState.enemyBullets.push(new Bullet(bx, by, vx, vy, 4, 8, color, "enemy"));
}
function handleCollisions() {
  gameState.bullets.forEach((bullet) => {
    if (bullet.isDead)
      return;
    getAliveAliens().forEach((alien) => {
      if (!alien.isAlive)
        return;
      if (rectIntersect(bullet.getBoundingBox(), alien.getBoundingBox())) {
        alien.markAsDead();
        bullet.markAsDead();
        gameState.score += 10;
        gameState.killStreak++;
        if (gameState.killStreak >= 3 && !gameState.enraged) {
          enterEnragedMode();
        }
        makeNeighborsAngry(alien.row, alien.col);
      }
    });
  });
  gameState.enemyBullets.forEach((bullet) => {
    if (bullet.isDead)
      return;
    if (rectIntersect(bullet.getBoundingBox(), gameState.cannon.getBoundingBox()) && gameState.cannon.canBeHit()) {
      bullet.markAsDead();
      gameState.lives--;
      gameState.killStreak = 0;
      gameState.cannon.markAsHit();
      if (gameState.lives <= 0) {
        gameState.gameOver = true;
        if (gameState.score > gameState.highScore) {
          gameState.highScore = gameState.score;
          localStorage.setItem("siHighScore", String(gameState.highScore));
        }
      }
    }
  });
  gameState.aliens = gameState.aliens.filter((a) => a.isAlive);
}
function shootPlayerBullet() {
  const bx = gameState.cannon.x + gameState.cannon.width / 2;
  const by = gameState.cannon.y;
  gameState.bullets.push(new Bullet(bx, by, 0, -0.2, 4, 8, "white", "player"));
}
function rectIntersect(a, b) {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}
function enterEnragedMode() {
  gameState.enraged = true;
  gameState.enragedTimer = 5000;
}
function makeNeighborsAngry(row, col) {
  gameState.aliens.forEach((a) => {
    if (!a.isAlive)
      return;
    if (a.row === row && Math.abs(a.col - col) === 1) {
      a.becomeAngry();
    }
  });
}
function cleanupBullets() {
  gameState.bullets = gameState.bullets.filter((b) => !b.isDead && b.y + b.h >= 0);
  gameState.enemyBullets = gameState.enemyBullets.filter((b) => !b.isDead && b.y <= canvasHeight);
}
function draw(canvas, time) {
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  getAliveAliens().forEach((a) => a.draw(ctx, time));
  gameState.bunkerManager.drawAll(ctx);
  gameState.cannon.draw(ctx, time);
  gameState.bullets.forEach((b) => b.draw(ctx));
  gameState.enemyBullets.forEach((b) => b.draw(ctx));
  ctx.fillStyle = "white";
  ctx.font = "20px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${gameState.score}`, 10, 25);
  ctx.textAlign = "center";
  ctx.fillText(`HI: ${gameState.highScore}`, canvasWidth / 2, 25);
  const lifeIcon = sprites.cannon;
  const iconScale = 0.6;
  const iconW = lifeIcon.w * iconScale;
  const iconH = lifeIcon.h * iconScale;
  for (let i = 0;i < gameState.lives; i++) {
    const ix = 10 + i * (iconW + 8);
    const iy = canvasHeight - iconH - 10;
    ctx.drawImage(lifeIcon.img, lifeIcon.x, lifeIcon.y, lifeIcon.w, lifeIcon.h, ix, iy, iconW, iconH);
  }
  if (gameState.gameOver || gameState.victory) {
    drawEndOverlay(ctx);
  }
}
function drawEndOverlay(ctx) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = "#00FF00";
  ctx.font = "48px monospace";
  ctx.textAlign = "center";
  const titleText = gameState.victory ? "YOU WIN" : "GAME OVER";
  ctx.fillText(titleText, canvasWidth / 2, canvasHeight / 2 - 80);
  ctx.fillStyle = "#AAAAFF";
  ctx.font = "24px monospace";
  ctx.fillText(`Score: ${gameState.score}`, canvasWidth / 2, canvasHeight / 2 - 30);
  ctx.fillText(`High Score: ${gameState.highScore}`, canvasWidth / 2, canvasHeight / 2 + 10);
  const btnWidth = 200;
  const btnHeight = 50;
  const btnX = (canvasWidth - btnWidth) / 2;
  const btnY = canvasHeight / 2 + 50;
  ctx.strokeStyle = "#00FF00";
  ctx.lineWidth = 2;
  ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);
  ctx.fillStyle = "#00FF00";
  ctx.font = "28px monospace";
  ctx.fillText("RESTART", canvasWidth / 2, btnY + btnHeight / 2 + 10);
}

// src/index.js
var canvas = document.getElementById("cnvs");
canvas.width = 600;
canvas.height = 590;
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const btnWidth = 200;
  const btnHeight = 50;
  const btnX = (canvas.width - btnWidth) / 2;
  const btnY = canvas.height / 2 + 50;
  if (mx >= btnX && mx <= btnX + btnWidth && my >= btnY && my <= btnY + btnHeight) {
    init(canvas);
  }
});
var lastTime = 0;
function run(timestamp) {
  if (!lastTime)
    lastTime = timestamp;
  const delta = timestamp - lastTime;
  update(delta);
  draw(canvas, timestamp);
  lastTime = timestamp;
  requestAnimationFrame(run);
}
preload(() => {
  init(canvas);
  requestAnimationFrame(run);
});
