/*
  People that walk on the grid: the player, the docent and visitors.
  A step reserves its destination tile at once (x, y), and the pixel
  position slides there over 1/speed seconds. No DOM.
*/
(function (root) {
  const T = 16;
  const WALK = 4.2;
  const RUN = 8;
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  function makeActor({ id, look, x, y, dir = "down", lines = null, wander = null, counter = false }) {
    return {
      id, look, x, y, dir, lines, wander, counter,
      px: x * T, py: y * T, fromX: x, fromY: y,
      moving: false, t: 0, speed: WALK, steps: 0, frame: 0,
      idle: 1 + Math.random() * 3
    };
  }

  function place(a, x, y, dir) {
    a.x = a.fromX = x;
    a.y = a.fromY = y;
    a.px = x * T;
    a.py = y * T;
    if (dir) a.dir = dir;
    a.moving = false;
    a.frame = 0;
  }

  function startStep(a, dir, speed = WALK) {
    const [dx, dy] = DIRS[dir];
    a.dir = dir;
    a.fromX = a.x;
    a.fromY = a.y;
    a.x += dx;
    a.y += dy;
    a.t = 0;
    a.speed = speed;
    a.moving = true;
    a.steps++;
  }

  // Advances a step. Returns true on the frame the step lands.
  function update(a, dt) {
    if (!a.moving) {
      a.frame = 0;
      return false;
    }
    a.t += dt * a.speed;
    if (a.t >= 1) {
      a.moving = false;
      a.px = a.x * T;
      a.py = a.y * T;
      a.frame = 0;
      return true;
    }
    a.px = (a.fromX + (a.x - a.fromX) * a.t) * T;
    a.py = (a.fromY + (a.y - a.fromY) * a.t) * T;
    a.frame = a.t < 0.55 ? (a.steps % 2 ? 1 : 2) : 0;
    return false;
  }

  function dirTo(from, to) {
    if (to.x > from.x) return "right";
    if (to.x < from.x) return "left";
    if (to.y > from.y) return "down";
    return "up";
  }

  const isNeighbour = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;

  const api = { T, WALK, RUN, DIRS, makeActor, place, startStep, update, dirTo, isNeighbour };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Actors = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
