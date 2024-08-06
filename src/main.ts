
const PI = Math.PI;
const COEFFICIENT_UNIT = 2 / 360;
const PIXEL_PER_DEGREE = 800 / 60;
// const PIXEL_PER_DEGREE = 1;
let ShouldShowMap = true;

const MAP = [
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 1, 0, 1],
  [1, 1, 0, 0, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 1],
  [1, 1, 0, 0, 0, 1, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
];

const MAP_HEIGH_NUMBER = MAP.length, MAP_WIDTH_NUMBER = MAP[0].length;
const MAP_MAX_HEIGHT = 800, MAP_MAX_WIDTH = 800;
const MAP_EACH_HEIGHT = 100, MAP_EACH_WIDTH = 100;
const PersonHeight = 170; // 1.7m
const ObjectHeigh = 200;  // 2m


class Player {
  constructor(x: number = 0, y: number = 0) {
    this.X = x;
    this.Y = y;
  }

  X: number;
  Y: number;
  Coefficient: number = 0;  // min: 0, max: 2
  Velocity: number = 0;
  Turn: number = 0;

  static WALK_SPEED: number = 0.2;
  static RUN_SPEED: number = this.WALK_SPEED;
  static RUN_MAX_SPEED: number = 0.4;
  static ACCELERATION: number = 5;
  static TRUN_RATE: number = 0.0005;
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

  RegisterKeyboardEvents(player);
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
  for (let i = 0; i < MAP.length; i++) {
    for (let ii = 0; ii < MAP[i].length; ii++) {
      if (MAP[i][ii] == 0) {
        ctx.fillStyle = "ghostwhite";
      } else {
        ctx.fillStyle = "gray";
      }
      ctx.fillRect(ii * MAP_EACH_WIDTH, i * MAP_EACH_HEIGHT, MAP_EACH_WIDTH, MAP_EACH_HEIGHT);
    }
  }
  ctx.fillStyle = oldStyle;

  for (let i = 0; i <= MAP_HEIGH_NUMBER; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * MAP_EACH_HEIGHT);
    ctx.lineTo(MAP_WIDTH_NUMBER * MAP_EACH_WIDTH, i * MAP_EACH_HEIGHT);
    ctx.stroke();
  }

  for (let i = 0; i <= MAP_WIDTH_NUMBER; i++) {
    ctx.beginPath();
    ctx.moveTo(i * MAP_EACH_WIDTH, 0);
    ctx.lineTo(i * MAP_EACH_WIDTH, MAP_HEIGH_NUMBER * MAP_EACH_HEIGHT);
    ctx.stroke();
  }
}

function UpdateScreen(ctx: CanvasRenderingContext2D, keyStatus: Set<string>, player: Player, oldDate: number) {
  ctx.clearRect(0, 0, MAP_MAX_WIDTH, MAP_MAX_HEIGHT);

  const date = Date.now();
  const dt = date - oldDate;

  ValidatePlayer(player, dt);

  DrawWorld(ctx, player);

  // Show the FPS.
  ctx.fillText(`FPS: ${Math.trunc(1000 / dt)}`, 10, 10);

  requestAnimationFrame(() => {
    UpdateScreen(ctx, keyStatus, player, date);
  });
}

function RotatePoint(x: number, y: number, coefficient: number): { X: number, Y: number } {
  let newX = x * Math.cos(PI * coefficient) - y * Math.sin(PI * coefficient);
  let newY = x * Math.sin(PI * coefficient) + y * Math.cos(PI * coefficient);
  return { X: newX, Y: newY };
}

function DrawPlayer(ctx: CanvasRenderingContext2D, player: Player) {
  let oldStyle = ctx.strokeStyle;
  let oldWidth = ctx.lineWidth;

  ctx.beginPath();
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 8;

  let left = RotatePoint(0, -20, player.Coefficient);
  let right = RotatePoint(0, 20, player.Coefficient);
  ctx.moveTo(left.X + player.X, left.Y + player.Y);
  ctx.lineTo(right.X + player.X, right.Y + player.Y);
  ctx.stroke();
  right = RotatePoint(25, 0, player.Coefficient);
  ctx.moveTo(player.X, player.Y);
  ctx.lineTo(right.X + player.X, right.Y + player.Y);
  ctx.stroke();

  ctx.strokeStyle = oldStyle;
  ctx.lineWidth = oldWidth;
}

function FixCoefficient(coefficient: number): number {
  if (coefficient > 2) {
    return coefficient - 2;
  } else if (coefficient < 0) {
    return coefficient + 2;
  } else {
    return coefficient;
  }
}

function Distance(x: number, y: number, coefficient: number): number {
  return Math.cos(PI * coefficient) * x + Math.sin(PI * coefficient) * y;
}

function Distance1(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2));
}

function DrawWorld(ctx: CanvasRenderingContext2D, player: Player): void {
  let oldStrokeStyle = ctx.strokeStyle;
  let oldLineWidth = ctx.lineWidth;
  let oldFillStyle = ctx.fillStyle;
  let x = player.X;
  let y = player.Y;
  let coefficient = player.Coefficient;
  let dh = 0;
  let dv = 0;
  let dxMin = 0;
  let dyMin = 0;
  let drawIndicator = 0;
  let color = "";
  let rays: [number, number, string][] = [];

  for (let cof = coefficient - 30 * COEFFICIENT_UNIT; cof < coefficient + 30 * COEFFICIENT_UNIT; cof += COEFFICIENT_UNIT / 10) {
    // --- Check the horizontal line. ---
    let cot = 1 / Math.tan(PI * cof);
    let dy = 0, dx = 0, dxMax = 0, dyMax = 0;
    let direction = Math.sin(PI * cof);
    let i = Math.trunc(y / MAP_EACH_HEIGHT);
    if (direction > 0) { // look down
      dy = i * MAP_EACH_HEIGHT + MAP_EACH_HEIGHT;
      dx = (dy - y) * cot + x;
      dyMax = MAP_EACH_HEIGHT;
      dxMax = dyMax * cot;
      i = 8 - i;
    } else if (direction < 0) { // look up
      dy = i * MAP_EACH_HEIGHT - 0.0001;
      dx = (dy - y) * cot + x;
      dyMax = -MAP_EACH_HEIGHT;
      dxMax = dyMax * cot;
    } else {
      dy = y, dx = x; i = 8;
    }

    while (i-- > 0) {
      if (dx > 0 && dx < MAP_MAX_WIDTH && dy > 0 && dy < MAP_MAX_WIDTH) {
        let indices = CoordianceToIndex(dx, dy);
        if (MAP[indices.I][indices.II] == 1) {
          break;
        }
      }

      dx += dxMax, dy += dyMax;
    }

    dh = Distance(dx - x, dy - y, cof);
    // dh = Distance1(x, y, dx, dy);
    dxMin = dx;
    dyMin = dy;

    // --- Check the vertical line. ---
    dx = 0, dy = 0, dxMax = 0, dyMax = 0;
    direction = Math.cos(PI * cof);
    let tan = Math.tan(PI * cof);
    i = Math.trunc(x / MAP_EACH_WIDTH);
    if (direction > 0) { // look right
      dx = i * MAP_EACH_WIDTH + MAP_EACH_WIDTH;
      dy = (dx - x) * tan + y;
      dxMax = MAP_EACH_WIDTH;
      dyMax = dxMax * tan;
      i = 8 - i;
    } else if (direction < 0) { // look left
      dx = i * MAP_EACH_WIDTH - 0.0001;
      dy = (dx - x) * tan + y;
      dxMax = -MAP_EACH_WIDTH;
      dyMax = dxMax * tan;
    } else {
      dy = y, dx = x; i = 8;
    }

    while (i-- > 0) {
      if (dx > 0 && dx < MAP_MAX_WIDTH && dy > 0 && dy < MAP_MAX_WIDTH) {
        let indices = CoordianceToIndex(dx, dy);
        if (MAP[indices.I][indices.II] == 1) {
          break;
        }
      }

      dx += dxMax, dy += dyMax;
    }

    dv = Distance(dx - x, dy - y, cof);
    // dv = Distance1(x, y, dx, dy);

    color = "rgb(0  230  0)";
    ctx.fillStyle = "rgb(0  0  230)";
    if (dv < dh) {
      dxMin = dx;
      dyMin = dy;
      color = "rgb(0  189  0)";
      ctx.fillStyle = "rgb(0  0  189)";
      dh = dv;
    }

    rays.push([dxMin, dyMin, color]);

    // --- Draw the 3D wall. ---
    dh = dh * Math.cos(PI * FixCoefficient(coefficient - cof));

    let lineHeight = 800 * 80 / dh;
    ctx.fillRect(drawIndicator * PIXEL_PER_DEGREE / 10, -lineHeight / 2 + 800 / 2, Math.ceil(PIXEL_PER_DEGREE / 10), lineHeight);

    // Move the horizontal line up.
    // let start = 400 - 30 * (Math.tan(PI / 6) / dh) * 800;
    // let end = 400 + 170 * (Math.tan(PI / 6) / dh) * 800;
    // ctx.fillRect(drawIndicator * PIXEL_PER_DEGREE, start, PIXEL_PER_DEGREE, end - start);
    drawIndicator++;
  }

  ctx.lineWidth = oldLineWidth;
  ctx.fillStyle = oldFillStyle;

  if (ShouldShowMap) {
    ctx.scale(0.4, 0.4);
    ctx.translate(30, 30);

    DrawMap(ctx);
    DrawPlayer(ctx, player);

    for (let ray of rays) {
      ctx.beginPath()
      ctx.strokeStyle = ray[2];
      ctx.moveTo(x, y);
      ctx.lineTo(ray[0], ray[1]);
      ctx.stroke();
    }

    ctx.strokeStyle = oldStrokeStyle;
    rays = [];

    ctx.resetTransform();
  }

}

function ValidatePlayer(player: Player, dt: number) {
  let displacement = player.Velocity * dt;
  let vx = displacement * Math.cos(PI * player.Coefficient);
  let vy = displacement * Math.sin(PI * player.Coefficient);

  // collision detection
  let indices = CoordianceToIndex(player.X + vx, player.Y);
  if (MAP[indices.I][indices.II] == 0) {
    player.X += vx;
  }

  indices = CoordianceToIndex(player.X, player.Y + vy);
  if (MAP[indices.I][indices.II] == 0) {
    player.Y += vy;
  }

  player.Coefficient += player.Turn * dt;
  if (player.Coefficient < 0) {
    player.Coefficient += 2;
  }
  if (player.Coefficient > 2) {
    player.Coefficient -= 2;
  }
}

function CoordianceToIndex(x: number, y: number): { I: number, II: number } {
  return { I: Math.trunc(y / MAP_EACH_HEIGHT), II: Math.trunc(x / MAP_EACH_WIDTH) };
}

// TODO: Should we implement this function?
function IndexToCoordiance(i: number, ii: number): { X: number, Y: number } {
  throw new Error("Not Implemented!");
}

function RegisterKeyboardEvents(player: Player) {
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
