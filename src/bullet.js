export default class Bullet {
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
        if (this.isDead) return;
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
