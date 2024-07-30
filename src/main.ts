const MAP_MAX_HEIGHT = 800, MAP_MAX_WIDTH = 800;
const MAP_EACH_HEIGHT = 100, MAP_EACH_WIDTH = 100;
const PI = Math.PI;
const ONE_SECOND_PI = Math.PI / 2;
const TWO_THIRD_PI = Math.PI * 3 / 2;
const TWO_PI = Math.PI * 2;
let ShouldShowMap = true;

class Player {
  constructor(x: number = 0, y: number = 0) {
    this.X = x;
    this.Y = y;
    this.Direction = 1;
  }

  X: number;
  Y: number;
  Direction: number;  // min: 0, max: 2
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

  RegisterEvents(keyStatus);

  UpdateScreen(ctx, keyStatus, player);
})();

function GetCanvasContext() {
  let canvas = document.getElementById("app");
  if (canvas === null) {
    return null;
  }
  return (canvas as HTMLCanvasElement).getContext("2d");
}

function DrawMap(ctx: CanvasRenderingContext2D, player: Player) {
  ctx.scale(0.4, 0.4);
  ctx.translate(30, 30);
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

  DrawPlayer(ctx, player);
  ctx.resetTransform()
}

function UpdateScreen(ctx: CanvasRenderingContext2D, keyStatus: Set<string>, player: Player) {
  ctx.clearRect(0, 0, MAP_MAX_WIDTH, MAP_MAX_HEIGHT);
  if (ShouldShowMap) {
    DrawMap(ctx, player);
  }

  EventHandler(keyStatus, player);
  requestAnimationFrame(() => {
    UpdateScreen(ctx, keyStatus, player);
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
  let left = RotatePoint(-27, 0, player.Direction);
  let right = RotatePoint(27, 0, player.Direction);
  ctx.moveTo(left.X + player.X, left.Y + player.Y);
  ctx.lineTo(right.X + player.X, right.Y + player.Y);
  ctx.stroke();
  right = RotatePoint(0, 25, player.Direction);
  ctx.moveTo(player.X, player.Y);
  ctx.lineTo(right.X + player.X, right.Y + player.Y);
  ctx.stroke();
  ctx.strokeStyle = oldStyle;
  ctx.lineWidth = oldWidth;
}

function ValidatePlayer(player: Player) {
  if (player.X < 0) {
    player.X = 0;
  } else if (player.X > MAP_MAX_WIDTH) {
    player.X = MAP_MAX_WIDTH;
  }

  if (player.Y < 0) {
    player.Y = 0;
  } else if (player.Y > MAP_MAX_HEIGHT) {
    player.Y = MAP_MAX_HEIGHT;
  }

  if (player.Direction < 0) {
    player.Direction += 2;
  } else if (player.Direction > 2) {
    player.Direction -= 2;
  }
}

function RegisterEvents(keyStatus: Set<string>) {
  document.addEventListener('keydown', (event: KeyboardEvent) => {
    keyStatus.add(event.key);
  });

  document.addEventListener('keyup', (event: KeyboardEvent) => {
    keyStatus.delete(event.key);
  });
}

function EventHandler(keyStatus: Set<string>, player: Player) {
  for (let k of keyStatus) {
    switch (k) {
      case 'w': {
        let point = RotatePoint(0, 1, player.Direction);
        player.X += point.X;
        player.Y += point.Y;
      }
        break;
      case 's': {
        let point = RotatePoint(0, -1, player.Direction);
        player.X += point.X;
        player.Y += point.Y;
      }
        break;
      case 'a': {
        player.Direction -= 0.01;
      }
        break;
      case 'd': {
        player.Direction += 0.01;
      }
        break;
      case 'm': {
        ShouldShowMap = !ShouldShowMap;
      }
        break;
    }
  }
  ValidatePlayer(player);
}