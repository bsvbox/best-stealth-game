// The Quiet Gallery — the museum floor: tile map, collision, line of sight, light.

import { TILE } from './config.js';

export const WALL = '#';
export const FLOOR = '.';
export const SHADOW = ',';
export const CRATE = 'C';
export const STATUE = 'S';
export const CASE = 'D';

// Tiles that block walking and block a guard's line of sight.
export function blocksMovement(tile) {
  return tile === WALL || tile === CRATE || tile === STATUE || tile === CASE;
}

export function blocksSight(tile) {
  return tile === WALL || tile === CRATE || tile === STATUE || tile === CASE;
}

export class World {
  constructor(level) {
    this.cols = level.map[0].length;
    this.rows = level.map.length;
    this.width = this.cols * TILE;
    this.height = this.rows * TILE;
    this.tiles = level.map.map((row) => row.split(''));
    this.lamps = level.lamps.map((lamp) => ({
      x: (lamp.x + 0.5) * TILE,
      y: (lamp.y + 0.5) * TILE,
      radius: 3.2 * TILE,
    }));
    this.artifacts = [];
    this.exit = null;
    this.playerStart = null;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const tile = this.tiles[row][col];
        const cx = (col + 0.5) * TILE;
        const cy = (row + 0.5) * TILE;
        if (tile === 'P') {
          this.playerStart = { x: cx, y: cy };
          this.tiles[row][col] = FLOOR;
        } else if (tile === 'E') {
          this.exit = { x: cx, y: cy, col, row };
          this.tiles[row][col] = FLOOR;
        } else if (tile === 'A') {
          this.artifacts.push({ x: cx, y: cy, col, row, taken: false });
          this.tiles[row][col] = FLOOR;
        } else if (tile === 'G') {
          this.tiles[row][col] = FLOOR;
        }
      }
    }
  }

  tileAtPixel(x, y) {
    const col = Math.floor(x / TILE);
    const row = Math.floor(y / TILE);
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return WALL;
    return this.tiles[row][col];
  }

  isShadowAt(x, y) {
    return this.tileAtPixel(x, y) === SHADOW;
  }

  // True when the point stands inside a lamp's warm pool of light.
  isLitAt(x, y) {
    for (const lamp of this.lamps) {
      const dx = x - lamp.x;
      const dy = y - lamp.y;
      if (dx * dx + dy * dy < lamp.radius * lamp.radius) return true;
    }
    return false;
  }

  // Circle-vs-tile collision: try the move, sliding along one axis at a time.
  moveCircle(entity, dx, dy, radius) {
    const nextX = entity.x + dx;
    if (!this.circleHitsWall(nextX, entity.y, radius)) entity.x = nextX;
    const nextY = entity.y + dy;
    if (!this.circleHitsWall(entity.x, nextY, radius)) entity.y = nextY;
  }

  circleHitsWall(x, y, radius) {
    // A hair of inset keeps a circle exactly on a tile edge from counting
    // the tile beyond that edge as a hit (doorways are one tile wide).
    const eps = 0.01;
    const left = Math.floor((x - radius + eps) / TILE);
    const right = Math.floor((x + radius - eps) / TILE);
    const top = Math.floor((y - radius + eps) / TILE);
    const bottom = Math.floor((y + radius - eps) / TILE);
    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return true;
        if (blocksMovement(this.tiles[row][col])) return true;
      }
    }
    return false;
  }

  // Bresenham walk over the tiles between two points: any sight-blocking tile ends it.
  hasLineOfSight(x0, y0, x1, y1) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const distance = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(distance / (TILE / 4)));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const tile = this.tileAtPixel(x0 + dx * t, y0 + dy * t);
      if (blocksSight(tile)) return false;
    }
    return true;
  }

  artifactAt(x, y, radius) {
    for (const artifact of this.artifacts) {
      if (artifact.taken) continue;
      if (Math.hypot(artifact.x - x, artifact.y - y) < radius + 14) return artifact;
    }
    return null;
  }

  remainingArtifacts() {
    return this.artifacts.filter((artifact) => !artifact.taken).length;
  }
}
