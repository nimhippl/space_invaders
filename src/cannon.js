export default class Cannon {

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

    if (this.x < 0) this.x = 0;
    if (this.x + this.width > canvasWidth) {
      this.x = canvasWidth - this.width;
    }

    if (this.hitTimer > 0) {
      this.hitTimer -= dt;
      if (this.hitTimer < 0) this.hitTimer = 0;
    }
    if (this.invulnTimer > 0) {
      this.invulnTimer -= dt;
      if (this.invulnTimer < 0) this.invulnTimer = 0;
    }
  }


  draw(ctx, time) {
    if (this.hitTimer > 0) {
      const blinkPhase = Math.floor(this.hitTimer / 100) % 2;
      if (blinkPhase === 1) {
        return;
      }
    }

    ctx.drawImage(
        this._sprite.img,
        this._sprite.x, this._sprite.y, this._sprite.w, this._sprite.h,
        this.x, this.y, this._sprite.w, this._sprite.h
    );
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
