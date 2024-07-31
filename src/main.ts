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
    this.Direction = 0;
    this.Velocity = 0;
    this.Turn = 0;
  }

  X: number;
  Y: number;
  Direction: number;  // min: 0, max: 2
  Velocity: number;
  Turn: number;

  static WALK_SPEED: number = 0.2;
  static RUN_SPEED: number = this.WALK_SPEED;
  static RUN_MAX_SPEED: number = 0.4;
  static ACCELERATION: number = 5;
  static TRUN_RATE: number = 0.001;
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

function DrawMap(ctx: CanvasRenderingContext2D, player: Player) {
  let oldStyle = ctx.fillStyle;
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

  // Show fps firstly.
  ctx.fillText(`FPS: ${Math.trunc(1000 / dt)}`, 10, 10);

  if (ShouldShowMap) {
    ctx.scale(0.4, 0.4);
    ctx.translate(30, 30);

    DrawMap(ctx, player);
    ValidatePlayer(player, dt);
    DrawPlayer(ctx, player);

    ctx.resetTransform()
  }




  requestAnimationFrame(() => {
    UpdateScreen(ctx, keyStatus, player, date);
  });
}

function RotatePoint(x: number, y: number, direction: number): { X: number, Y: number } {
  let newX = x * Math.cos(PI * direction) - y * Math.sin(PI * direction);
  let newY = x * Math.sin(PI * direction) + y * Math.cos(PI * direction);
  return { X: newX, Y: newY };
}

function DrawPlayer(ctx: CanvasRenderingContext2D, player: Player) {
  ctx.beginPath();
  let oldStyle = ctx.strokeStyle;
  let oldWidth = ctx.lineWidth;
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 8;
  let left = RotatePoint(0, -20, player.Direction);
  let right = RotatePoint(0, 20, player.Direction);
  ctx.moveTo(left.X + player.X, left.Y + player.Y);
  ctx.lineTo(right.X + player.X, right.Y + player.Y);
  ctx.stroke();
  right = RotatePoint(25, 0, player.Direction);
  ctx.moveTo(player.X, player.Y);
  ctx.lineTo(right.X + player.X, right.Y + player.Y);
  ctx.stroke();
  ctx.strokeStyle = oldStyle;
  ctx.lineWidth = oldWidth;
}

function ValidatePlayer(player: Player, dt: number) {
  let displacement = player.Velocity * dt;
  let point = RotatePoint(displacement, 0, player.Direction);
  player.Direction += player.Turn * dt;

  // collision detection
  let indices = CoordianceToIndex(player.X + point.X, player.Y);
  if (map[indices.I][indices.II] == 0) {
    player.X += point.X;
  }

  indices = CoordianceToIndex(player.X, player.Y + point.Y);
  if (map[indices.I][indices.II] == 0) {
    player.Y += point.Y;
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
