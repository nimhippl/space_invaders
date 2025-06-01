export class Bunker {
    constructor(x, y, sprite, rows = 4, cols = 6, brickW = 6, brickH = 6) {
        this.x = x;
        this.y = y;
        this.sprite = sprite;
        this.rows = rows;
        this.cols = cols;
        this.brickW = brickW;
        this.brickH = brickH;

        this.bricks = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
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
        this.bricks.forEach(brick => {
            if (!brick.isDead) {
                ctx.drawImage(
                    this.sprite.img,
                    brick.spriteOffsetX, brick.spriteOffsetY,
                    this.brickW, this.brickH,
                    brick.worldX, brick.worldY,
                    this.brickW, this.brickH
                );
            }
        });
    }

    handleBulletHits(bulletsArray) {
        let destroyedCount = 0;
        bulletsArray.forEach(bullet => {
            if (bullet.isDead) return;
            const bBox = bullet.getBoundingBox();
            this.bricks.forEach(brick => {
                if (brick.isDead) return;
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
        this.bricks = this.bricks.filter(brick => !brick.isDead);
    }

    static rectIntersect(a, b) {
        return !(
            a.right < b.left ||
            a.left > b.right ||
            a.bottom < b.top ||
            a.top > b.bottom
        );
    }
}

export class BunkerManager {
    constructor(canvasWidth, canvasHeight, count = 4, offsetY = 120, bunkerSprite) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.bunkerSprite = bunkerSprite;
        this.bunkers = [];

        const totalSlots = count + 1;
        const spacing = canvasWidth / totalSlots;
        for (let i = 1; i <= count; i++) {
            const bunkerX = Math.floor(spacing * i - this.bunkerSprite.w / 2);
            const bunkerY = offsetY;
            const bunker = new Bunker(
                bunkerX,
                bunkerY,
                this.bunkerSprite,
                4,
                6,
                6,
                6
            );
            this.bunkers.push(bunker);
        }
    }

    drawAll(ctx) {
        this.bunkers.forEach(bunker => bunker.draw(ctx));
    }

    update(dt) {
    }

    handleAllBulletHits(bulletsArray) {
        let totalDestroyed = 0;
        this.bunkers.forEach(bunker => {
            totalDestroyed += bunker.handleBulletHits(bulletsArray);
        });
        return totalDestroyed;
    }

    cleanupAll() {
        this.bunkers.forEach(bunker => bunker.cleanup());
        this.bunkers = this.bunkers.filter(bunker => bunker.bricks.length > 0);
    }
}
