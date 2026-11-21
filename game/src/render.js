// The Quiet Gallery — everything drawn on the canvas, from the floor to the HUD.

import { TILE, TUNING } from './config.js';
import { GUARD_STATES } from './guard.js';

const COLORS = {
  floorLight: '#2b3242',
  floorDark: '#262d3b',
  floorShadow: '#1c2230',
  floorShadowDark: '#181e2a',
  wall: '#4a4238',
  wallTop: '#6b5f4c',
  crate: '#7a5a34',
  crateEdge: '#5d4426',
  statue: '#8d94a3',
  statueBase: '#6e7484',
  caseGlass: '#3f6d8e',
  caseGold: '#c9a227',
  artifact: '#ffd94d',
  exit: '#39d98a',
  exitDark: '#1e7a4c',
  playerCloak: '#3b2d5c',
  playerHood: '#241a3d',
  guardUniform: '#2c4a6b',
  guardCap: '#1d3247',
  coneCalm: 'rgba(255, 214, 90, 0.20)',
  coneSuspicious: 'rgba(255, 150, 50, 0.28)',
  coneAlarm: 'rgba(255, 60, 60, 0.30)',
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawVisionCone(ctx, guard) {
  const range = TUNING.visionRange;
  const color =
    guard.state === GUARD_STATES.CHASE
      ? COLORS.coneAlarm
      : guard.state === GUARD_STATES.SUSPICIOUS || guard.state === GUARD_STATES.SEARCH
        ? COLORS.coneSuspicious
        : COLORS.coneCalm;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, range, guard.direction - TUNING.visionHalfAngle, guard.direction + TUNING.visionHalfAngle);
  ctx.closePath();
  ctx.fill();
  // A thin bright edge so the cone reads at a glance, even shrunk.
  ctx.strokeStyle = color.replace(/0\.\d+\)/, '0.55)');
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawFloor(ctx, world) {
  for (let row = 0; row < world.rows; row++) {
    for (let col = 0; col < world.cols; col++) {
      const tile = world.tiles[row][col];
      const x = col * TILE;
      const y = row * TILE;
      if (tile === '#') {
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = COLORS.wallTop;
        ctx.fillRect(x, y, TILE, 6);
        continue;
      }
      const shadow = tile === ',';
      const checker = (row + col) % 2 === 0;
      ctx.fillStyle = shadow
        ? checker
          ? COLORS.floorShadow
          : COLORS.floorShadowDark
        : checker
          ? COLORS.floorLight
          : COLORS.floorDark;
      ctx.fillRect(x, y, TILE, TILE);
      if (shadow) {
        // Cross-hatch the dark floor so it reads as a hiding place, not a hole.
        ctx.strokeStyle = 'rgba(120, 140, 180, 0.10)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 6, y + TILE - 6);
        ctx.lineTo(x + TILE - 6, y + 6);
        ctx.moveTo(x + 6, y + 6);
        ctx.lineTo(x + TILE - 6, y + TILE - 6);
        ctx.stroke();
      }
    }
  }
}

function drawLampPools(ctx, world) {
  for (const lamp of world.lamps) {
    const gradient = ctx.createRadialGradient(lamp.x, lamp.y, 8, lamp.x, lamp.y, lamp.radius);
    gradient.addColorStop(0, 'rgba(255, 196, 110, 0.20)');
    gradient.addColorStop(1, 'rgba(255, 196, 110, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, lamp.radius, 0, Math.PI * 2);
    ctx.fill();
    // The lamp itself: a small brass fixture on the wall line.
    ctx.fillStyle = COLORS.caseGold;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe9b0';
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCover(ctx, world) {
  for (let row = 0; row < world.rows; row++) {
    for (let col = 0; col < world.cols; col++) {
      const tile = world.tiles[row][col];
      const x = col * TILE;
      const y = row * TILE;
      if (tile === 'C') {
        ctx.fillStyle = COLORS.crate;
        roundRect(ctx, x + 4, y + 4, TILE - 8, TILE - 8, 4);
        ctx.fill();
        ctx.strokeStyle = COLORS.crateEdge;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 4);
        ctx.lineTo(x + TILE - 4, y + TILE - 4);
        ctx.moveTo(x + TILE - 4, y + 4);
        ctx.lineTo(x + 4, y + TILE - 4);
        ctx.stroke();
      } else if (tile === 'S') {
        ctx.fillStyle = COLORS.statueBase;
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + TILE / 2 + 6, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.statue;
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + TILE / 2 - 2, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#aab1c0';
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + TILE / 2 - 12, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (tile === 'D') {
        ctx.fillStyle = COLORS.caseGlass;
        roundRect(ctx, x + 3, y + 3, TILE - 6, TILE - 6, 3);
        ctx.fill();
        ctx.strokeStyle = COLORS.caseGold;
        ctx.lineWidth = 2;
        roundRect(ctx, x + 3, y + 3, TILE - 6, TILE - 6, 3);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillRect(x + 10, y + 6, 4, TILE - 12);
      }
    }
  }
}

function drawArtifacts(ctx, world, time) {
  for (const artifact of world.artifacts) {
    if (artifact.taken) continue;
    const bob = Math.sin(time * 2 + artifact.x) * 3;
    const glow = ctx.createRadialGradient(artifact.x, artifact.y + bob, 2, artifact.x, artifact.y + bob, 26);
    glow.addColorStop(0, 'rgba(255, 217, 77, 0.55)');
    glow.addColorStop(1, 'rgba(255, 217, 77, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(artifact.x, artifact.y + bob, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.artifact;
    ctx.beginPath();
    ctx.moveTo(artifact.x, artifact.y + bob - 11);
    ctx.lineTo(artifact.x + 8, artifact.y + bob);
    ctx.lineTo(artifact.x, artifact.y + bob + 11);
    ctx.lineTo(artifact.x - 8, artifact.y + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.moveTo(artifact.x, artifact.y + bob - 6);
    ctx.lineTo(artifact.x + 4, artifact.y + bob);
    ctx.lineTo(artifact.x, artifact.y + bob + 6);
    ctx.lineTo(artifact.x - 4, artifact.y + bob);
    ctx.closePath();
    ctx.fill();
  }
}

function drawExit(ctx, world, time, open) {
  const exit = world.exit;
  const pulse = open ? 0.75 + Math.sin(time * 4) * 0.25 : 0.35;
  const glow = ctx.createRadialGradient(exit.x, exit.y, 4, exit.x, exit.y, 44);
  glow.addColorStop(0, `rgba(57, 217, 138, ${0.5 * pulse})`);
  glow.addColorStop(1, 'rgba(57, 217, 138, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(exit.x, exit.y, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = open ? COLORS.exit : COLORS.exitDark;
  roundRect(ctx, exit.x - 14, exit.y - 16, 28, 32, 4);
  ctx.fill();
  ctx.fillStyle = '#0d2b1c';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(open ? 'EXIT' : 'LOCK', exit.x, exit.y + 1);
  ctx.fillStyle = open ? COLORS.exit : '#5a6b60';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText(open ? 'GO!' : 'NEED RELICS', exit.x, exit.y + 28);
}

function drawPlayer(ctx, player, time) {
  const crouch = player.sneaking ? 0.8 : 1;
  // Soft shadow under the thief.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 9, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Cloak: a hooded figure, drawn facing the movement direction.
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.direction);
  ctx.fillStyle = COLORS.playerCloak;
  ctx.beginPath();
  ctx.moveTo(14 * crouch, 0);
  ctx.lineTo(-9, 10);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-9, -10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = COLORS.playerHood;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 8 * crouch + 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8dcc0';
  ctx.beginPath();
  ctx.arc(player.x + Math.cos(player.direction) * 4, player.y + Math.sin(player.direction) * 4, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Detection ring: shows how close the nearest guard is to spotting you.
  if (player.nearestDetection > 0.02) {
    const frac = player.nearestDetection / 100;
    ctx.strokeStyle = frac > 0.7 ? '#ff5040' : '#ffd65a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 20, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.stroke();
  }
}

function drawGuard(ctx, guard, time) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(guard.x, guard.y + 9, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(guard.x, guard.y);
  ctx.rotate(guard.direction);
  ctx.fillStyle = COLORS.guardUniform;
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-9, 10);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-9, -10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = COLORS.guardCap;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d7dee8';
  ctx.fillRect(guard.x - 8, guard.y - 3, 6, 6);
  // State marker: ? while suspicious, ! while chasing or searching.
  const marker =
    guard.state === GUARD_STATES.CHASE
      ? { text: '!', color: '#ff5040' }
      : guard.state === GUARD_STATES.SUSPICIOUS || guard.state === GUARD_STATES.SEARCH
        ? { text: '?', color: '#ffb03a' }
        : null;
  if (marker) {
    const bob = Math.sin(time * 6) * 2;
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = marker.color;
    ctx.fillText(marker.text, guard.x, guard.y - 24 + bob);
  }
  // Thin detection bar over a guard who is starting to notice you.
  if (guard.detection > 1 && guard.state !== GUARD_STATES.CHASE) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(guard.x - 14, guard.y - 20, 28, 4);
    ctx.fillStyle = guard.detection > TUNING.suspicionThreshold ? '#ffb03a' : '#ffd65a';
    ctx.fillRect(guard.x - 14, guard.y - 20, 28 * (guard.detection / 100), 4);
  }
}

function drawCoin(ctx, coin) {
  const lift = coin.landed ? 0 : Math.sin(coin.flight * Math.PI) * 18;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(coin.x, coin.y + 4, 6, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8c33a';
  ctx.beginPath();
  ctx.arc(coin.x, coin.y - lift, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff0a8';
  ctx.beginPath();
  ctx.arc(coin.x, coin.y - lift, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawNoiseRing(ctx, player, noiseRadius, time) {
  if (!noiseRadius) return;
  const pulse = 0.5 + Math.sin(time * 5) * 0.2;
  ctx.strokeStyle = `rgba(255, 120, 90, ${0.35 * pulse})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.arc(player.x, player.y, noiseRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function renderGame(ctx, state) {
  const { world, player, guards, coins, time } = state;
  ctx.clearRect(0, 0, world.width, world.height);
  drawFloor(ctx, world);
  drawLampPools(ctx, world);
  drawCover(ctx, world);
  drawArtifacts(ctx, world, time);
  drawExit(ctx, world, time, world.remainingArtifacts() === 0);
  for (const guard of guards) drawVisionCone(ctx, guard);
  for (const coin of coins) drawCoin(ctx, coin);
  drawNoiseRing(ctx, player, state.noiseRadius, time);
  for (const guard of guards) drawGuard(ctx, guard, time);
  drawPlayer(ctx, player, time);
}

// --- HUD and screens, drawn on the same canvas above the game ---

export function renderHud(ctx, state) {
  const { world, player, level, levelIndex, totalLevels, elapsed, message } = state;
  ctx.fillStyle = 'rgba(8, 10, 16, 0.88)';
  ctx.fillRect(0, 0, world.width, 44);
  ctx.fillStyle = '#e8e4d8';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(level.name, 14, 22);
  ctx.textAlign = 'right';
  const collected = world.artifacts.length - world.remainingArtifacts();
  ctx.fillStyle = '#ffd94d';
  ctx.fillText(`Relics ${collected}/${world.artifacts.length}`, world.width - 320, 22);
  ctx.fillStyle = '#e8c33a';
  ctx.fillText(`Coins ${player.coins}`, world.width - 210, 22);
  ctx.fillStyle = '#e8e4d8';
  const minutes = Math.floor(elapsed / 60);
  const seconds = Math.floor(elapsed % 60).toString().padStart(2, '0');
  ctx.fillText(`${minutes}:${seconds}`, world.width - 110, 22);
  ctx.fillStyle = '#9fb2cc';
  ctx.fillText(`Level ${levelIndex + 1}/${totalLevels}`, world.width - 14, 22);
  // Global alert banner when any guard is alarmed.
  const alarmed = state.guards.some((guard) => guard.state === GUARD_STATES.CHASE);
  const suspicious = state.guards.some((guard) => guard.state === GUARD_STATES.SUSPICIOUS);
  if (alarmed || suspicious) {
    ctx.fillStyle = alarmed ? '#ff5040' : '#ffb03a';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(alarmed ? 'SPOTTED — RUN!' : 'Something heard you…', world.width / 2, 64);
  }
  if (message) {
    ctx.fillStyle = 'rgba(8, 10, 16, 0.75)';
    const width = ctx.measureText(message).width + 28;
    roundRect(ctx, (world.width - width) / 2, world.height - 52, width, 30, 6);
    ctx.fill();
    ctx.fillStyle = '#e8e4d8';
    ctx.font = '14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(message, world.width / 2, world.height - 36);
  }
}

function overlayPanel(ctx, world, title, lines, accent) {
  ctx.fillStyle = 'rgba(6, 8, 14, 0.78)';
  ctx.fillRect(0, 0, world.width, world.height);
  ctx.fillStyle = 'rgba(20, 24, 36, 0.95)';
  roundRect(ctx, world.width / 2 - 330, world.height / 2 - 190, 660, 380, 12);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  roundRect(ctx, world.width / 2 - 330, world.height / 2 - 190, 660, 380, 12);
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, world.width / 2, world.height / 2 - 140);
  ctx.fillStyle = '#e8e4d8';
  ctx.font = '16px system-ui, sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, world.width / 2, world.height / 2 - 92 + i * 30);
  });
}

export function renderTitle(ctx, world) {
  overlayPanel(
    ctx,
    world,
    'THE QUIET GALLERY',
    [
      'A night at the museum. Relics to steal. Guards on patrol. One exit.',
      '',
      'WASD / Arrows — move      Shift — run (loud!)      C — sneak',
      'Click — toss a coin to distract a guard      Space — pick up',
      'Hide in the dark floor. Stay out of the yellow cones.',
      '',
      'Press ENTER to begin.   M — mute      P — pause      R — restart',
    ],
    '#c9a227',
  );
}

export function renderCaught(ctx, world) {
  overlayPanel(
    ctx,
    world,
    'CAUGHT!',
    ['A guard caught you in the lamplight.', '', 'Press R to try the level again.'],
    '#ff5040',
  );
}

export function renderLevelClear(ctx, world, levelName, elapsed) {
  overlayPanel(
    ctx,
    world,
    'CLEAN GETAWAY',
    [`${levelName} — cleared in ${Math.floor(elapsed)}s, unseen.`, '', 'Press ENTER for the next gallery.'],
    '#39d98a',
  );
}

export function renderVictory(ctx, world, totalTime, caughtCount) {
  overlayPanel(
    ctx,
    world,
    'THE LAST RELIC IS YOURS',
    [
      `All three galleries cleared in ${Math.floor(totalTime)}s.`,
      caughtCount === 0
        ? 'A perfect ghost run — no guard ever laid a hand on you.'
        : `Caught ${caughtCount} time${caughtCount === 1 ? '' : 's'} along the way.`,
      '',
      'Press ENTER to play again.',
    ],
    '#ffd94d',
  );
}

export function renderPaused(ctx, world) {
  overlayPanel(ctx, world, 'PAUSED', ['Take a breath. The guards wait.', '', 'Press P to keep sneaking.'], '#9fb2cc');
}
