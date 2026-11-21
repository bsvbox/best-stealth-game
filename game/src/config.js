// The Quiet Gallery — level data and tuning constants.
// Tile legend: # wall · . floor · , shadow floor · C crate · S statue · D display case
//               P player start · E exit · A artifact · G guard spawn · L lamp (set below)

export const TILE = 40;

export const TUNING = {
  walkSpeed: 150,
  sneakSpeed: 78,
  runSpeed: 235,
  guardWalkSpeed: 62,
  guardChaseSpeed: 168,
  guardInvestigateSpeed: 105,
  visionRange: 225,
  visionHalfAngle: 0.61, // ~35 degrees
  hearingRunRadius: 140,
  hearingWalkRadius: 46,
  coinNoiseRadius: 175,
  catchDistance: 26,
  suspicionThreshold: 35, // meter 0..100: above this the guard investigates
  alarmThreshold: 100, // meter full: the guard chases
  loseSightSeconds: 4, // alarmed guard gives up and searches after this long unseen
  searchSeconds: 5,
};

export const LEVELS = [
  {
    name: 'Level 1 — The Quiet Gallery',
    hint: 'Collect both relics, then reach the green exit. Stay out of the yellow cones.',
    coins: 3,
    lamps: [
      { x: 12, y: 2 },
      { x: 5, y: 9 },
      { x: 19, y: 5 },
    ],
    guards: [
      {
        spawn: { x: 11, y: 8 },
        waypoints: [
          { x: 11, y: 8 },
          { x: 11, y: 11 },
          { x: 14, y: 11 },
          { x: 14, y: 8 },
        ],
      },
      {
        spawn: { x: 19, y: 10 },
        waypoints: [
          { x: 19, y: 10 },
          { x: 19, y: 13 },
          { x: 21, y: 13 },
          { x: 21, y: 10 },
        ],
      },
    ],
    map: [
      '########################',
      '#......#.......#.......#',
      '#.P....#...A.......E...#',
      '#......#.......#.......#',
      '#..C............S......#',
      '#......#.......#.......#',
      '###.####...#####.#######',
      '#......#.......#.......#',
      '#..A...#...G...#...C...#',
      '#......#.......#.......#',
      '#..S...D.......#...G...#',
      '#......#.......#.......#',
      '#,,,,,,#,,,,,,,#,,,,,,,#',
      '#,,,,,,#,,,,,,,#,,,,,,,#',
      '########################',
    ],
  },
  {
    name: 'Level 2 — The Vault Hall',
    hint: 'Three relics, three guards. The dark floor hides you — move slowly there.',
    coins: 4,
    lamps: [
      { x: 4, y: 2 },
      { x: 11, y: 5 },
      { x: 20, y: 9 },
    ],
    guards: [
      {
        spawn: { x: 10, y: 8 },
        waypoints: [
          { x: 10, y: 8 },
          { x: 10, y: 11 },
          { x: 13, y: 11 },
          { x: 13, y: 8 },
        ],
      },
      {
        spawn: { x: 18, y: 8 },
        waypoints: [
          { x: 18, y: 8 },
          { x: 18, y: 11 },
          { x: 21, y: 11 },
          { x: 21, y: 8 },
        ],
      },
      {
        spawn: { x: 3, y: 11 },
        waypoints: [
          { x: 3, y: 11 },
          { x: 3, y: 9 },
          { x: 5, y: 9 },
          { x: 5, y: 11 },
        ],
      },
    ],
    map: [
      '########################',
      '#..A...#......#....A...#',
      '#......#..C...#........#',
      '#.P....D......S....E...#',
      '#......#......#........#',
      '#......#..A...#...C....#',
      '###.#####.######.#######',
      '#......#......#........#',
      '#..S...D..G...#...G....#',
      '#......#......#........#',
      '#...........C.......S..#',
      '#..G...#......#........#',
      '#,,,,,,#,,,,,,,#,,,,,,,#',
      '#,,,,,,#,,,,,,,#,,,,,,,#',
      '########################',
    ],
  },
  {
    name: 'Level 3 — The Grand Atrium',
    hint: 'Four guards on long patrols. Toss a coin to pull one away, then slip past.',
    coins: 5,
    lamps: [
      { x: 12, y: 1 },
      { x: 5, y: 7 },
      { x: 20, y: 3 },
      { x: 12, y: 12 },
    ],
    guards: [
      {
        spawn: { x: 5, y: 4 },
        waypoints: [
          { x: 5, y: 4 },
          { x: 9, y: 4 },
          { x: 9, y: 10 },
          { x: 5, y: 10 },
        ],
      },
      {
        spawn: { x: 18, y: 4 },
        waypoints: [
          { x: 18, y: 4 },
          { x: 17, y: 4 },
          { x: 17, y: 10 },
          { x: 18, y: 10 },
        ],
      },
      {
        spawn: { x: 12, y: 8 },
        waypoints: [
          { x: 12, y: 8 },
          { x: 12, y: 12 },
          { x: 13, y: 12 },
          { x: 13, y: 8 },
        ],
      },
      {
        spawn: { x: 21, y: 12 },
        waypoints: [
          { x: 21, y: 12 },
          { x: 17, y: 12 },
          { x: 17, y: 9 },
          { x: 21, y: 9 },
        ],
      },
    ],
    map: [
      '########################',
      '#...A......#......A....#',
      '#.P........#...........#',
      '#..C....S.......C.....E#',
      '#....G.....#.....G.....#',
      '#..........#...........#',
      '###.#####.#######.######',
      '#..S.......#......C....#',
      '#....D.....#G.A........#',
      '#..........#...........#',
      '#..C.......#....S......#',
      '#..........#...........#',
      '#,,,,,,#,,,,,,,#,,,,,G,#',
      '#,,,,,,#,,,,,,,#,,,,,,,#',
      '########################',
    ],
  },
];
