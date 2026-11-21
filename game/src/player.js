// The Quiet Gallery — the thief: movement, stance, footsteps, tossed coins.

import { TUNING } from './config.js';
import { playCoinLand, playCoinToss, playFootstep } from './audio.js';

export class Player {
  constructor(start, coinCount) {
    this.x = start.x;
    this.y = start.y;
    this.radius = 13;
    this.direction = -Math.PI / 2;
    this.sneaking = false;
    this.running = false;
    this.coins = coinCount;
    this.stepTimer = 0;
    this.stepAlternator = 0;
  }

  // keys: {up, down, left, right, sneak, run} — returns the noise radius this step made.
  update(dt, keys, world) {
    let dx = 0;
    let dy = 0;
    if (keys.up) dy -= 1;
    if (keys.down) dy += 1;
    if (keys.left) dx -= 1;
    if (keys.right) dx += 1;

    this.sneaking = !!keys.sneak;
    this.running = !!keys.run && !this.sneaking;
    const speed = this.sneaking
      ? TUNING.sneakSpeed
      : this.running
        ? TUNING.runSpeed
        : TUNING.walkSpeed;

    let noiseRadius = 0;
    if (dx !== 0 || dy !== 0) {
      const length = Math.hypot(dx, dy);
      dx /= length;
      dy /= length;
      this.direction = Math.atan2(dy, dx);
      world.moveCircle(this, dx * speed * dt, dy * speed * dt, this.radius);
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = this.sneaking ? 0.55 : this.running ? 0.26 : 0.38;
        this.stepAlternator = 1 - this.stepAlternator;
        playFootstep(this.running, 1);
      }
      noiseRadius = this.sneaking
        ? 0
        : this.running
          ? TUNING.hearingRunRadius
          : TUNING.hearingWalkRadius;
    }
    return noiseRadius;
  }

  // Throw a coin at a floor point. It lands with a clink guards can hear.
  tossCoin(targetX, targetY, world, onLand) {
    if (this.coins <= 0) return null;
    this.coins -= 1;
    playCoinToss();
    const coin = {
      x: this.x,
      y: this.y,
      startX: this.x,
      startY: this.y,
      targetX,
      targetY,
      flight: 0,
      landed: false,
    };
    coin.update = (dt) => {
      if (coin.landed) {
        coin.age = (coin.age || 0) + dt;
        return;
      }
      coin.flight += dt * 2.4;
      if (coin.flight >= 1) {
        coin.flight = 1;
        coin.landed = true;
        coin.x = coin.targetX;
        coin.y = coin.targetY;
        playCoinLand();
        onLand(coin.x, coin.y, TUNING.coinNoiseRadius);
      } else {
        coin.x = coin.startX + (coin.targetX - coin.startX) * coin.flight;
        coin.y = coin.startY + (coin.targetY - coin.startY) * coin.flight;
      }
    };
    return coin;
  }
}
