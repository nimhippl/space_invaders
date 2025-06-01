export default class Alien {
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
    if (!this.isAlive) return;

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
    if (!this.isAlive) return;

    const sp = this.animationFrame === 0 ? this._spriteA : this._spriteB;
    ctx.drawImage(
        sp.img,
        sp.x, sp.y, sp.w, sp.h,
        this.x, this.y, sp.w, sp.h
    );
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
