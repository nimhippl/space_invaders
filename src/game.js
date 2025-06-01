import Sprite from './sprite';
import Cannon from './cannon';
import Bullet from './bullet';
import Alien from './alien';
import InputHandler from './input-handler';
import { BunkerManager } from './bunker';

import assetPath from '../assets/invaders.png';

let assets;

const sprites = {
    aliens: [],
    cannon: null,
    bunker: null
};

const inputHandler = new InputHandler();

let canvasWidth;
let canvasHeight;

let enemyDirection = 1;
let enemySpeed = 30;
const dropDistance = 20;

let timeSinceLastAlienShot = 0;
let nextAlienShotInterval = 2000;

const gameState = {
    cannon:       null,
    bullets:      [],
    enemyBullets: [],
    aliens:       [],
    bunkerManager: null,

    lives:        3,
    score:        0,
    highScore:    0,
    level:        1,

    killStreak:   0,
    enraged:      false,
    enragedTimer: 0,

    playerReloadTime: 500,
    playerReloadTimer: 0,

    gameOver:     false,
    victory:      false
};

export function preload(onPreloadComplete) {
    assets = new Image();
    assets.src = assetPath;
    assets.addEventListener('load', () => {
        sprites.aliens = [
            [new Sprite(assets,  0,  0, 22, 16), new Sprite(assets,  0, 16, 22, 16)],
            [new Sprite(assets, 22,  0, 16, 16), new Sprite(assets, 22, 16, 16, 16)],
            [new Sprite(assets, 38,  0, 24, 16), new Sprite(assets, 38, 16, 24, 16)]
        ];
        sprites.cannon = new Sprite(assets, 62, 0, 22, 16);
        sprites.bunker = new Sprite(assets, 84, 8, 36, 24);
        onPreloadComplete();
    });
}

export function init(canvas) {
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;

    const savedHS = localStorage.getItem('siHighScore');
    gameState.highScore = savedHS ? parseInt(savedHS, 10) : 0;

    gameState.cannon = new Cannon(
        canvasWidth / 2 - sprites.cannon.w / 2,
        canvasHeight - sprites.cannon.h - 10,
        sprites.cannon
    );

    gameState.aliens = [];
    const rows = 5;
    const cols = 11;
    const hGap = 30;
    const vGap = 30;
    const offsetX = 50;
    const offsetY = 50;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
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

    gameState.lives        = 3;
    gameState.score        = 0;
    gameState.level        = 1;
    gameState.killStreak   = 0;
    gameState.enraged      = false;
    gameState.enragedTimer = 0;
    gameState.playerReloadTimer = 0;

    timeSinceLastAlienShot    = 0;
    nextAlienShotInterval     = getRandomRange(1000, 3000);

    gameState.gameOver = false;
    gameState.victory  = false;
}

function getRandomRange(min, max) {
    return min + Math.random() * (max - min);
}

function getAliveAliens() {
    return gameState.aliens.filter(a => a.isAlive);
}

function getAlienBounds() {
    const alive = getAliveAliens();
    if (alive.length === 0) return { minX: 0, maxX: 0 };
    const xs    = alive.map(a => a.x);
    const rights= alive.map(a => a.x + a.width);
    return {
        minX: Math.min(...xs),
        maxX: Math.max(...rights)
    };
}

export function update(dt) {
    if (gameState.gameOver || gameState.victory) {
        if (inputHandler.isPressed('Enter')) {
            init({ width: canvasWidth, height: canvasHeight });
        }
        return;
    }

    const dtSeconds = dt / 1000;

    if (inputHandler.isDown('ArrowLeft')) {
        gameState.cannon.moveLeft();
    } else if (inputHandler.isDown('ArrowRight')) {
        gameState.cannon.moveRight();
    } else {
        gameState.cannon.stop();
    }
    if (gameState.playerReloadTimer > 0) {
        gameState.playerReloadTimer -= dt;
        if (gameState.playerReloadTimer < 0) gameState.playerReloadTimer = 0;
    }
    if (inputHandler.isPressed('Space') && gameState.playerReloadTimer === 0) {
        shootPlayerBullet();
        gameState.playerReloadTimer = gameState.playerReloadTime;
    }

    gameState.cannon.update(dt, canvasWidth);

    gameState.bullets.forEach(b => b.update(dt));
    gameState.enemyBullets.forEach(b => b.update(dt));

    getAliveAliens().forEach(a => a.update(dt));
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
            localStorage.setItem('siHighScore', String(gameState.highScore));
        }
        return;
    }

    const bottomThreshold = canvasHeight - 100;
    if (aliveAliens.some(a => a.y + a.height >= bottomThreshold)) {
        gameState.gameOver = true;
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            localStorage.setItem('siHighScore', String(gameState.highScore));
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
    getAliveAliens().forEach(a => { a.x += dx; });
    const newBounds = getAlienBounds();
    if (newBounds.minX <= 0 || newBounds.maxX >= canvasWidth) {
        getAliveAliens().forEach(a => { a.x -= dx; });
        enemyDirection *= -1;
        getAliveAliens().forEach(a => { a.y += dropDistance; });
    }
}

function handleAlienShooting(dt) {
    timeSinceLastAlienShot += dt;
    const interval = gameState.enraged ? 1000 : nextAlienShotInterval;
    if (timeSinceLastAlienShot < interval) return;
    timeSinceLastAlienShot = 0;
    nextAlienShotInterval = getRandomRange(1000, 3000) / (gameState.enraged ? 2 : 1);

    const bottomAliensMap = {};
    getAliveAliens().forEach(a => {
        if (!bottomAliensMap[a.col] || a.row > bottomAliensMap[a.col].row) {
            bottomAliensMap[a.col] = a;
        }
    });
    const candidates = Object.values(bottomAliensMap);
    if (candidates.length === 0) return;

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
        vx = (dx / dist) * speed;
        vy = (dy / dist) * speed;
        color = gameState.enraged ? 'orange' : 'yellow';
    } else {
        const speed = gameState.enraged ? 0.2 : 0.1;
        vx = 0;
        vy = speed;
        color = gameState.enraged ? 'yellow' : 'red';
    }

    gameState.enemyBullets.push(
        new Bullet(bx, by, vx, vy, 4, 8, color, 'enemy')
    );
}

function handleCollisions() {
    gameState.bullets.forEach(bullet => {
        if (bullet.isDead) return;
        getAliveAliens().forEach(alien => {
            if (!alien.isAlive) return;
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

    gameState.enemyBullets.forEach(bullet => {
        if (bullet.isDead) return;
        if (
            rectIntersect(bullet.getBoundingBox(), gameState.cannon.getBoundingBox()) &&
            gameState.cannon.canBeHit()
        ) {
            bullet.markAsDead();
            gameState.lives--;
            gameState.killStreak = 0;
            gameState.cannon.markAsHit();
            if (gameState.lives <= 0) {
                gameState.gameOver = true;
                if (gameState.score > gameState.highScore) {
                    gameState.highScore = gameState.score;
                    localStorage.setItem('siHighScore', String(gameState.highScore));
                }
            }
        }
    });

    gameState.aliens = gameState.aliens.filter(a => a.isAlive);
}

function shootPlayerBullet() {
    const bx = gameState.cannon.x + gameState.cannon.width / 2;
    const by = gameState.cannon.y;
    gameState.bullets.push(new Bullet(bx, by, 0, -0.2, 4, 8, 'white', 'player'));
}

function rectIntersect(a, b) {
    return !(
        a.right < b.left ||
        a.left > b.right ||
        a.bottom < b.top ||
        a.top > b.bottom
    );
}

function enterEnragedMode() {
    gameState.enraged = true;
    gameState.enragedTimer = 5000;
}

function makeNeighborsAngry(row, col) {
    gameState.aliens.forEach(a => {
        if (!a.isAlive) return;
        if (a.row === row && Math.abs(a.col - col) === 1) {
            a.becomeAngry();
        }
    });
}

function cleanupBullets() {
    gameState.bullets = gameState.bullets.filter(b => !b.isDead && b.y + b.h >= 0);
    gameState.enemyBullets = gameState.enemyBullets.filter(
        b => !b.isDead && b.y <= canvasHeight
    );
}

export function draw(canvas, time) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    getAliveAliens().forEach(a => a.draw(ctx, time));
    gameState.bunkerManager.drawAll(ctx);
    gameState.cannon.draw(ctx, time);

    gameState.bullets.forEach(b => b.draw(ctx));
    gameState.enemyBullets.forEach(b => b.draw(ctx));

    ctx.fillStyle = 'white';
    ctx.font = '20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${gameState.score}`, 10, 25);
    ctx.textAlign = 'center';
    ctx.fillText(`HI: ${gameState.highScore}`, canvasWidth / 2, 25);

    const lifeIcon = sprites.cannon;
    const iconScale = 0.6;
    const iconW = lifeIcon.w * iconScale;
    const iconH = lifeIcon.h * iconScale;
    for (let i = 0; i < gameState.lives; i++) {
        const ix = 10 + i * (iconW + 8);
        const iy = canvasHeight - iconH - 10;
        ctx.drawImage(
            lifeIcon.img,
            lifeIcon.x, lifeIcon.y, lifeIcon.w, lifeIcon.h,
            ix, iy, iconW, iconH
        );
    }

    if (gameState.gameOver || gameState.victory) {
        drawEndOverlay(ctx);
    }
}

function drawEndOverlay(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.fillStyle = '#00FF00';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    const titleText = gameState.victory ? 'YOU WIN' : 'GAME OVER';
    ctx.fillText(titleText, canvasWidth / 2, canvasHeight / 2 - 80);

    ctx.fillStyle = '#AAAAFF';
    ctx.font = '24px monospace';
    ctx.fillText(`Score: ${gameState.score}`, canvasWidth / 2, canvasHeight / 2 - 30);
    ctx.fillText(`High Score: ${gameState.highScore}`, canvasWidth / 2, canvasHeight / 2 + 10);

    const btnWidth = 200;
    const btnHeight = 50;
    const btnX = (canvasWidth - btnWidth) / 2;
    const btnY = canvasHeight / 2 + 50;

    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);

    ctx.fillStyle = '#00FF00';
    ctx.font = '28px monospace';
    ctx.fillText('RESTART', canvasWidth / 2, btnY + btnHeight / 2 + 10);
}
