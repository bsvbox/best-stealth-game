// The Quiet Gallery — guard AI: patrols, vision cones, suspicion, chase, search.

import { TILE, TUNING } from './config.js';
import { playAlarm, playGuardStep, playSuspicious } from './audio.js';

export const GUARD_STATES = {
  PATROL: 'patrol',
  SUSPICIOUS: 'suspicious',
  CHASE: 'chase',
  SEARCH: 'search',
};

function angleDifference(a, b) {
  let diff = a - b;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class Guard {
  constructor(def) {
    this.waypoints = def.waypoints.map((point) => ({
      x: (point.x + 0.5) * TILE,
      y: (point.y + 0.5) * TILE,
    }));
    this.x = (def.spawn.x + 0.5) * TILE;
    this.y = (def.spawn.y + 0.5) * TILE;
    this.waypointIndex = 0;
    this.patrolDirection = 1; // ping-pong: reverse at the ends, never cut across walls
    this.direction = -Math.PI / 2;
    this.state = GUARD_STATES.PATROL;
    this.detection = 0; // 0..100, fills while the player is seen
    this.pauseTimer = 0;
    this.lastSeen = null;
    this.unseenTimer = 0;
    this.searchTimer = 0;
    this.searchTarget = null;
    this.stepTimer = 0;
    this.moving = false;
  }

  // How strongly this guard can see the player right now, 0 when not visible.
  visibilityOf(player, world) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance > TUNING.visionRange) return 0;
    const angleToPlayer = Math.atan2(dy, dx);
    if (Math.abs(angleDifference(angleToPlayer, this.direction)) > TUNING.visionHalfAngle) return 0;
    if (!world.hasLineOfSight(this.x, this.y, player.x, player.y)) return 0;
    let strength = 1 - distance / TUNING.visionRange;
    strength = 0.35 + strength * 0.65; // even at max range a glimpse counts
    if (world.isShadowAt(player.x, player.y)) strength *= 0.4;
    if (player.sneaking) strength *= 0.55;
    if (player.running) strength *= 1.5;
    if (world.isLitAt(player.x, player.y)) strength *= 1.3;
    return clamp(strength, 0, 1.6);
  }

  hearNoise(x, y, radius) {
    if (this.state === GUARD_STATES.CHASE) return;
    const distance = Math.hypot(x - this.x, y - this.y);
    if (distance > radius) return;
    this.lastSeen = { x, y };
    if (this.state === GUARD_STATES.PATROL) {
      this.state = GUARD_STATES.SUSPICIOUS;
      this.detection = Math.max(this.detection, TUNING.suspicionThreshold);
      playSuspicious();
    }
  }

  update(dt, player, world) {
    const visibility = this.visibilityOf(player, world);
    if (visibility > 0) {
      this.lastSeen = { x: player.x, y: player.y };
      this.unseenTimer = 0;
      // Detection fills faster up close and in the open, slower in shadow.
      this.detection += visibility * 55 * dt;
      if (this.detection >= TUNING.alarmThreshold) {
        this.detection = TUNING.alarmThreshold;
        if (this.state !== GUARD_STATES.CHASE) {
          this.state = GUARD_STATES.CHASE;
          playAlarm();
        }
      } else if (this.detection >= TUNING.suspicionThreshold && this.state === GUARD_STATES.PATROL) {
        this.state = GUARD_STATES.SUSPICIOUS;
        playSuspicious();
      }
    } else {
      this.unseenTimer += dt;
      this.detection = Math.max(0, this.detection - 14 * dt);
      if (this.state === GUARD_STATES.CHASE && this.unseenTimer > TUNING.loseSightSeconds) {
        this.state = GUARD_STATES.SEARCH;
        this.searchTimer = TUNING.searchSeconds;
        this.searchTarget = this.lastSeen
          ? { x: this.lastSeen.x, y: this.lastSeen.y }
          : { x: this.x, y: this.y };
      }
      if (this.state === GUARD_STATES.SUSPICIOUS && this.detection < TUNING.suspicionThreshold / 2) {
        this.state = GUARD_STATES.PATROL;
      }
    }

    this.moving = false;
    if (this.state === GUARD_STATES.PATROL) {
      this.patrol(dt, world);
    } else if (this.state === GUARD_STATES.SUSPICIOUS) {
      this.investigate(dt, world);
    } else if (this.state === GUARD_STATES.CHASE) {
      this.chase(dt, player, world);
    } else if (this.state === GUARD_STATES.SEARCH) {
      this.search(dt, world);
    }

    if (this.moving) {
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = 0.42;
        const distance = Math.hypot(player.x - this.x, player.y - this.y);
        const volume = clamp(1 - distance / 420, 0, 1);
        if (volume > 0.05) playGuardStep(volume);
      }
    }
  }

  // Walk toward a point; returns true when close enough to count as arrived.
  walkToward(target, speed, dt, world) {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 6) return true;
    this.direction = Math.atan2(dy, dx);
    const step = Math.min(distance, speed * dt);
    world.moveCircle(this, (dx / distance) * step, (dy / distance) * step, 13);
    this.moving = true;
    return false;
  }

  patrol(dt, world) {
    if (this.pauseTimer > 0) {
      this.pauseTimer -= dt;
      // Look around while pausing at a waypoint: scan left, then right.
      this.direction += Math.sin(Date.now() / 700) * 0.4 * dt;
      return;
    }
    const target = this.waypoints[this.waypointIndex];
    if (this.walkToward(target, TUNING.guardWalkSpeed, dt, world)) {
      // Reached a waypoint: pause, then walk the route back the way it came.
      const last = this.waypoints.length - 1;
      if (this.waypointIndex === last) this.patrolDirection = -1;
      else if (this.waypointIndex === 0) this.patrolDirection = 1;
      this.waypointIndex += this.patrolDirection;
      this.pauseTimer = 1.1;
    }
  }

  investigate(dt, world) {
    if (!this.lastSeen) {
      this.state = GUARD_STATES.PATROL;
      return;
    }
    if (this.walkToward(this.lastSeen, TUNING.guardInvestigateSpeed, dt, world)) {
      // Reached the spot, found nothing: look around, then give up.
      this.direction += dt * 1.6;
      if (this.detection <= 0) this.state = GUARD_STATES.PATROL;
    }
  }

  chase(dt, player, world) {
    this.walkToward(player, TUNING.guardChaseSpeed, dt, world);
  }

  search(dt, world) {
    this.searchTimer -= dt;
    if (this.searchTimer <= 0) {
      this.state = GUARD_STATES.PATROL;
      this.detection = 0;
      return;
    }
    if (this.searchTarget) {
      if (this.walkToward(this.searchTarget, TUNING.guardInvestigateSpeed, dt, world)) {
        this.direction += dt * 2.2; // sweep the area before moving on
      }
    }
  }

  catches(player) {
    return (
      this.state === GUARD_STATES.CHASE &&
      Math.hypot(player.x - this.x, player.y - this.y) < TUNING.catchDistance
    );
  }
}
