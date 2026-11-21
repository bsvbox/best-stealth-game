// The Quiet Gallery — game loop, input, states, and the screenshot hooks.

import { LEVELS, TILE } from './config.js';
import { World } from './world.js';
import { Guard, GUARD_STATES } from './guard.js';
import { Player } from './player.js';
import {
  ensureAudio,
  isMuted,
  playCaught,
  playLevelClear,
  playPickup,
  playWin,
  toggleMute,
} from './audio.js';
import {
  renderCaught,
  renderGame,
  renderHud,
  renderLevelClear,
  renderPaused,
  renderTitle,
  renderVictory,
} from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot'); // title | play | alert | win — sets up a scene for screenshots

const game = {
  state: 'title', // title | playing | paused | caught | levelClear | victory
  levelIndex: 0,
  world: null,
  player: null,
  guards: [],
  coins: [],
  keys: { up: false, down: false, left: false, right: false, sneak: false, run: false },
  time: 0,
  elapsed: 0,
  totalTime: 0,
  caughtCount: 0,
  noiseRadius: 0,
  message: '',
  messageTimer: 0,
};

function showMessage(text, seconds = 3) {
  game.message = text;
  game.messageTimer = seconds;
}

function loadLevel(index) {
  const level = LEVELS[index];
  game.levelIndex = index;
  game.world = new World(level);
  game.player = new Player(game.world.playerStart, level.coins);
  game.player.nearestDetection = 0;
  game.guards = level.guards.map((def) => new Guard(def));
  game.coins = [];
  game.elapsed = 0;
  game.noiseRadius = 0;
  canvas.width = game.world.width;
  canvas.height = game.world.height + 44; // 44px HUD strip on top
  showMessage(level.hint, 5);
}

function startGame() {
  ensureAudio();
  game.totalTime = 0;
  game.caughtCount = 0;
  loadLevel(0);
  game.state = 'playing';
}

function nextLevel() {
  if (game.levelIndex + 1 >= LEVELS.length) {
    game.state = 'victory';
    playWin();
    return;
  }
  loadLevel(game.levelIndex + 1);
  game.state = 'playing';
}

function restartLevel() {
  game.caughtCount += 1;
  loadLevel(game.levelIndex);
  game.state = 'playing';
}

// --- Input: keyboard moves the thief, the mouse tosses coins ---

const KEYMAP = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  KeyC: 'sneak',
  ControlLeft: 'sneak',
  ShiftLeft: 'run',
  ShiftRight: 'run',
};

window.addEventListener('keydown', (event) => {
  if (event.repeat) return;
  const action = KEYMAP[event.code];
  if (action) {
    game.keys[action] = true;
    event.preventDefault();
    return;
  }
  if (event.code === 'Enter') {
    if (game.state === 'title') startGame();
    else if (game.state === 'levelClear') nextLevel();
    else if (game.state === 'victory') startGame();
  } else if (event.code === 'KeyR') {
    if (game.state === 'caught' || game.state === 'playing') restartLevel();
  } else if (event.code === 'KeyP') {
    if (game.state === 'playing') game.state = 'paused';
    else if (game.state === 'paused') game.state = 'playing';
  } else if (event.code === 'KeyM') {
    const nowMuted = toggleMute();
    showMessage(nowMuted ? 'Sound off' : 'Sound on', 1.5);
  } else if (event.code === 'Space') {
    event.preventDefault();
    if (game.state === 'title') startGame();
  }
});

window.addEventListener('keyup', (event) => {
  const action = KEYMAP[event.code];
  if (action) game.keys[action] = false;
});

canvas.addEventListener('mousedown', (event) => {
  ensureAudio();
  if (game.state !== 'playing') return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const targetX = (event.clientX - rect.left) * scaleX;
  const targetY = (event.clientY - rect.top) * scaleY - 44; // HUD strip offset
  const coin = game.player.tossCoin(targetX, targetY, game.world, (x, y, radius) => {
    for (const guard of game.guards) guard.hearNoise(x, y, radius);
  });
  if (coin) game.coins.push(coin);
  else showMessage('No coins left', 1.5);
});

// --- Update ---

function update(dt) {
  game.time += dt;
  game.elapsed += dt;
  if (game.messageTimer > 0) {
    game.messageTimer -= dt;
    if (game.messageTimer <= 0) game.message = '';
  }

  const noiseRadius = game.player.update(dt, game.keys, game.world);
  game.noiseRadius = noiseRadius;
  if (noiseRadius > 0) {
    for (const guard of game.guards) {
      guard.hearNoise(game.player.x, game.player.y, noiseRadius);
    }
  }
  for (const coin of game.coins) coin.update(dt);
  game.coins = game.coins.filter((coin) => !coin.landed || (coin.age || 0) < 8);

  let nearestDetection = 0;
  for (const guard of game.guards) {
    guard.update(dt, game.player, game.world);
    nearestDetection = Math.max(nearestDetection, guard.detection);
    if (guard.catches(game.player)) {
      game.state = 'caught';
      playCaught();
      return;
    }
  }
  game.player.nearestDetection = nearestDetection;

  const artifact = game.world.artifactAt(game.player.x, game.player.y, game.player.radius);
  if (artifact) {
    artifact.taken = true;
    playPickup();
    const left = game.world.remainingArtifacts();
    showMessage(
      left === 0 ? 'All relics taken — reach the green exit!' : `Relic taken. ${left} to go.`,
      2.5,
    );
  }

  const exit = game.world.exit;
  if (
    game.world.remainingArtifacts() === 0 &&
    Math.hypot(exit.x - game.player.x, exit.y - game.player.y) < 26
  ) {
    game.totalTime += game.elapsed;
    if (game.levelIndex + 1 >= LEVELS.length) {
      game.state = 'victory';
      playWin();
    } else {
      game.state = 'levelClear';
      playLevelClear();
    }
  }
}

// --- Render ---

function draw() {
  ctx.save();
  ctx.translate(0, 44); // HUD strip on top
  renderGame(ctx, {
    world: game.world,
    player: game.player,
    guards: game.guards,
    coins: game.coins,
    time: game.time,
    noiseRadius: game.noiseRadius,
  });
  ctx.restore();
  renderHud(ctx, {
    world: game.world,
    player: game.player,
    guards: game.guards,
    level: LEVELS[game.levelIndex],
    levelIndex: game.levelIndex,
    totalLevels: LEVELS.length,
    elapsed: game.elapsed,
    message: game.message,
  });
  if (game.state === 'title') renderTitle(ctx, game.world);
  else if (game.state === 'caught') renderCaught(ctx, game.world);
  else if (game.state === 'levelClear') {
    renderLevelClear(ctx, game.world, LEVELS[game.levelIndex].name, game.elapsed);
  } else if (game.state === 'victory') {
    renderVictory(ctx, game.world, game.totalTime, game.caughtCount);
  } else if (game.state === 'paused') renderPaused(ctx, game.world);
}

// --- Main loop ---

let lastTimestamp = 0;
function frame(timestamp) {
  const dt = Math.min(0.05, (timestamp - lastTimestamp) / 1000 || 0);
  lastTimestamp = timestamp;
  if (game.state === 'playing') update(dt);
  else game.time += dt; // keep the title screen's art gently animated
  draw();
  requestAnimationFrame(frame);
}

// --- Screenshot scenes: the same game code, posed for the camera ---

function applyShotScene() {
  if (!shot) return;
  loadLevel(0);
  if (shot === 'title') {
    game.state = 'title';
  } else if (shot === 'play') {
    game.state = 'playing';
    // Walk the thief halfway across the first gallery, guards on patrol.
    game.player.x = 9 * TILE + 20;
    game.player.y = 2 * TILE + 20;
    game.player.direction = 0;
  } else if (shot === 'alert') {
    game.state = 'playing';
    // The thief crouches behind a crate while a guard turns suspicious.
    game.player.x = 9 * TILE + 20;
    game.player.y = 8 * TILE + 20;
    game.player.sneaking = true;
    const guard = game.guards[0];
    guard.x = 11 * TILE + 20;
    guard.y = 8 * TILE + 20;
    guard.direction = Math.PI; // facing the thief
    guard.state = GUARD_STATES.SUSPICIOUS;
    guard.detection = 62;
    guard.lastSeen = { x: game.player.x, y: game.player.y };
    showMessage('Something heard you…', 99);
  } else if (shot === 'win') {
    game.state = 'levelClear';
    game.elapsed = 87;
    for (const artifact of game.world.artifacts) artifact.taken = true;
    game.player.x = game.world.exit.x - 30;
    game.player.y = game.world.exit.y;
    game.player.direction = 0;
  }
}

loadLevel(0);
applyShotScene();
document.title = `The Quiet Gallery — ${LEVELS[game.levelIndex].name}`;
requestAnimationFrame(frame);
