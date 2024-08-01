const MAP_MAX_HEIGHT = 800, MAP_MAX_WIDTH = 800;
const MAP_EACH_HEIGHT = 100, MAP_EACH_WIDTH = 100;
const PI = Math.PI;
const ONE_SECOND_PI = Math.PI / 2;
const TWO_THIRD_PI = Math.PI * 3 / 2;
const TWO_PI = Math.PI * 2;
let ShouldShowMap = true;

const map = [
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 1, 0, 1],
  [1, 1, 0, 0, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 1],
  [1, 1, 0, 0, 0, 1, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
];

class Player {
  constructor(x: number = 0, y: number = 0) {
    this.X = x;
    this.Y = y;
  }

  X: number;
  Y: number;
  Angle: number = 0;  // min: 0, max: 2
  Velocity: number = 0;
  Turn: number = 0;

  static WALK_SPEED: number = 0.2;
  static RUN_SPEED: number = this.WALK_SPEED;
  static RUN_MAX_SPEED: number = 0.4;
  static ACCELERATION: number = 5;
  static TRUN_RATE: number = 0.0001;
}

(() => {
  let ctx = GetCanvasContext();
  if (ctx == null) {
    let errPrompt = document.createElement("p");
    errPrompt.textContent = "Don't find a canvas. Try again!"
    document.body.appendChild(errPrompt);
    return;
  }
  const player = new Player(400, 400);
  const keyStatus = new Set<string>();

  RegisterEvents(player);
  const date = Date.now();
  UpdateScreen(ctx, keyStatus, player, date);
})();

function GetCanvasContext() {
  let canvas = document.getElementById("app");
  if (canvas === null) {
    return null;
  }
  return (canvas as HTMLCanvasElement).getContext("2d");
}

function DrawMap(ctx: CanvasRenderingContext2D) {
  let oldStyle = ctx.fillStyle;
  ctx.beginPath();
  for (let i = 0; i < map.length; i++) {
    for (let ii = 0; ii < map[i].length; ii++) {
      if (map[i][ii] == 0) {
        ctx.fillStyle = "ghostwhite";
      } else {
        ctx.fillStyle = "gray";
      }
      ctx.fillRect(i * MAP_EACH_WIDTH, ii * MAP_EACH_HEIGHT, MAP_EACH_WIDTH, MAP_EACH_HEIGHT);
    }
  }
  ctx.fillStyle = oldStyle;

  for (let i = 0; i <= MAP_MAX_HEIGHT; i += MAP_EACH_HEIGHT) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(MAP_MAX_WIDTH, i);
    ctx.stroke();
  }

  for (let i = 0; i <= MAP_MAX_WIDTH; i += MAP_EACH_WIDTH) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, MAP_MAX_HEIGHT);
    ctx.stroke();
  }
}

function UpdateScreen(ctx: CanvasRenderingContext2D, keyStatus: Set<string>, player: Player, oldDate: number) {
  ctx.clearRect(0, 0, MAP_MAX_WIDTH, MAP_MAX_HEIGHT);

  const date = Date.now();
  const dt = date - oldDate;

  ValidatePlayer(player, dt);

  // Show fps firstly.
  ctx.fillText(`FPS: ${Math.trunc(1000 / dt)}`, 10, 10);

  if (ShouldShowMap) {
    ctx.scale(0.4, 0.4);
    ctx.translate(30, 30);

    DrawMap(ctx);
    DrawPlayer(ctx, player);

    ctx.resetTransform()
  }

  DrawWorld(ctx, player.X, player.Y, player.Angle);

  requestAnimationFrame(() => {
    UpdateScreen(ctx, keyStatus, player, date);
  });
}

function RotatePoint(x: number, y: number, angle: number): { X: number, Y: number } {
  let newX = x * Math.cos(PI * angle) - y * Math.sin(PI * angle);
  let newY = x * Math.sin(PI * angle) + y * Math.cos(PI * angle);
  return { X: newX, Y: newY };
}

function DrawPlayer(ctx: CanvasRenderingContext2D, player: Player) {
  let oldStyle = ctx.strokeStyle;
  let oldWidth = ctx.lineWidth;

  ctx.beginPath();
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 8;

  let left = RotatePoint(0, -20, player.Angle);
  let right = RotatePoint(0, 20, player.Angle);
  ctx.moveTo(left.X + player.X, left.Y + player.Y);
  ctx.lineTo(right.X + player.X, right.Y + player.Y);
  ctx.stroke();
  right = RotatePoint(25, 0, player.Angle);
  ctx.moveTo(player.X, player.Y);
  ctx.lineTo(right.X + player.X, right.Y + player.Y);
  ctx.stroke();

  ctx.strokeStyle = oldStyle;
  ctx.lineWidth = oldWidth;
}

function DrawWorld(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number): void {
  /**
   * dx, dy
   *    ------
   *     \   |
   *      \  |
   *       \ |
   *        \|  x, y 
   */

  let dh = 0;
  let dv = 0;

  // Check the horizontal line
  let cot = 1 / Math.tan(PI * angle);
  let dy = 0, dx = 0, dxMax = 0, dyMax = 0;
  let direction = Math.sin(PI * angle);
  let i = Math.trunc(y / MAP_EACH_HEIGHT);
  if (direction > 0) { // look down
    dy = i * MAP_EACH_HEIGHT + MAP_EACH_HEIGHT;
    dx = (dy - y) * cot + x;
    dyMax = MAP_EACH_HEIGHT;
    dxMax = dyMax * cot;
    i = 0;
  } else if (direction < 0) { // look up
    dy = i * MAP_EACH_HEIGHT - 0.0001;
    dx = (dy - y) * cot + x;
    dyMax = -MAP_EACH_HEIGHT;
    dxMax = dyMax * cot;
    i = 0;
  } else {
    dy = y, dx = x; i = 8;
  }

  console.log(y, dy, dy - y, cot, x, dx);
  while (i < 8) {
    if (dx > 0 && dx < MAP_MAX_WIDTH && dy > 0 && dy < MAP_MAX_WIDTH) {
      let indices = CoordianceToIndex(dx, dy);
      if (map[indices.I][indices.II] == 1) {
        break;
      }
    }

    dx += dxMax, dy += dyMax;
    i++;
  }

  let oldStyle = ctx.strokeStyle;
  ctx.scale(0.4, 0.4);
  ctx.translate(30, 30);
  ctx.beginPath()
  ctx.strokeStyle = "green";
  ctx.moveTo(x, y);
  ctx.lineTo(dx, dy);
  ctx.stroke();
  ctx.strokeStyle = oldStyle;
  ctx.resetTransform();
  // Check hte vertical line
}

function ValidatePlayer(player: Player, dt: number) {
  let displacement = player.Velocity * dt;
  let vx = displacement * Math.cos(PI * player.Angle);
  let vy = displacement * Math.sin(PI * player.Angle);

  // collision detection
  let indices = CoordianceToIndex(player.X + vx, player.Y);
  if (map[indices.I][indices.II] == 0) {
    player.X += vx;
  }

  indices = CoordianceToIndex(player.X, player.Y + vy);
  if (map[indices.I][indices.II] == 0) {
    player.Y += vy;
  }

  player.Angle += player.Turn * dt;
  if (player.Angle < 0) {
    player.Angle += 2;
  }
  if (player.Angle > 2) {
    player.Angle -= 2;
  }
}

function CoordianceToIndex(x: number, y: number): { I: number, II: number } {
  return { I: Math.trunc(x / MAP_EACH_WIDTH), II: Math.trunc(y / MAP_EACH_HEIGHT) };
}

// TODO: Should we implement this function?
function IndexToCoordiance(i: number, ii: number): { X: number, Y: number } {
  throw new Error("Not Implemented!");
}

function RegisterEvents(player: Player) {
  document.addEventListener('keydown', (event: KeyboardEvent) => {
    switch (event.key) {
      case 'w':
        player.Velocity = Player.WALK_SPEED;
        break;
      case 's':
        player.Velocity = -Player.WALK_SPEED;
        break;
      case 'a':
        player.Turn = -Player.TRUN_RATE;
        break;
      case 'd':
        player.Turn = Player.TRUN_RATE;
        break;
      case 'm':
        ShouldShowMap = !ShouldShowMap;
        break;
    }
  });

  document.addEventListener('keyup', (event: KeyboardEvent) => {
    switch (event.key) {
      case 'w':
        player.Velocity = 0;
        break;
      case 's':
        player.Velocity = 0;
        break;
      case 'a':
        player.Turn = 0;
        break;
      case 'd':
        player.Turn = 0;
        break;
      case 'm':
        // ShouldShowMap = !ShouldShowMap;
        break;
    }
  });
}
