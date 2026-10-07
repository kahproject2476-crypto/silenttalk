const POSES = {
  HELLO: { t: 1, i: 1, m: 1, r: 1, p: 1, tilt: 12 },
  THANK_YOU: { t: 1, i: 1, m: 1, r: 1, p: 1, tilt: -8, y: -18 },
  YES: { t: 1, i: 0, m: 0, r: 0, p: 0, tilt: -18 },
  NO: { t: 0, i: 1, m: 0, r: 0, p: 1, tilt: 8 },
  PLEASE: { t: 1, i: 1, m: 1, r: 1, p: 1, tilt: 0 },
  SORRY: { t: 0, i: 0, m: 0, r: 0, p: 0, tilt: 16 },
  HELP: { t: 1, i: 1, m: 1, r: 1, p: 0, tilt: 0 },
  HOW: { t: 1, i: 1, m: 1, r: 0, p: 0, tilt: 10 },
  YOU: { t: 0, i: 1, m: 0, r: 0, p: 0, tilt: 0 },
  ME: { t: 0, i: 1, m: 0, r: 0, p: 0, tilt: -12, y: 10 },
  FINE: { t: 1, i: 1, m: 1, r: 1, p: 1, tilt: 6 },
  WHAT: { t: 1, i: 1, m: 1, r: 1, p: 1, tilt: -20 },
  NAME: { t: 0, i: 1, m: 1, r: 0, p: 0, tilt: 4 },
  BYE: { t: 1, i: 1, m: 1, r: 1, p: 1, tilt: 22 },
  WATER: { t: 0, i: 1, m: 1, r: 1, p: 0, tilt: 0 },
  FOOD: { t: 1, i: 1, m: 1, r: 0, p: 0, tilt: 0, y: -12 },
  HUNGRY: { t: 0, i: 1, m: 1, r: 1, p: 1, tilt: 0 },
  HOME: { t: 0, i: 1, m: 1, r: 0, p: 0, tilt: 14 },
  COME: { t: 0, i: 1, m: 0, r: 0, p: 0, tilt: 18 },
  GO: { t: 0, i: 1, m: 1, r: 0, p: 0, tilt: -14 },
  WAIT: { t: 1, i: 1, m: 1, r: 1, p: 1, tilt: 0 },
  DOCTOR: { t: 0, i: 1, m: 1, r: 0, p: 0, tilt: 0 },
  PAIN: { t: 0, i: 1, m: 0, r: 0, p: 0, tilt: -6 },
  GOOD: { t: 1, i: 1, m: 1, r: 0, p: 0, tilt: -10 },
  LOVE: { t: 1, i: 0, m: 0, r: 0, p: 1, tilt: 0 },
  WHERE: { t: 0, i: 1, m: 0, r: 0, p: 1, tilt: 12 },
  TOILET: { t: 0, i: 1, m: 0, r: 0, p: 0, tilt: 0 },
  A: { t: 0, i: 0, m: 0, r: 0, p: 0, tilt: 0 },
  B: { t: 0, i: 1, m: 1, r: 1, p: 1, tilt: 0 },
  C: { t: 1, i: 1, m: 1, r: 1, p: 1, tilt: 18 },
  D: { t: 0, i: 1, m: 0, r: 0, p: 0, tilt: 0 },
  I: { t: 0, i: 0, m: 0, r: 0, p: 1, tilt: 0 },
  L: { t: 1, i: 1, m: 0, r: 0, p: 0, tilt: 0 },
  V: { t: 0, i: 1, m: 1, r: 0, p: 0, tilt: 0 },
  W: { t: 0, i: 1, m: 1, r: 1, p: 0, tilt: 0 },
  Y: { t: 1, i: 0, m: 0, r: 0, p: 1, tilt: 0 },
  "1": { t: 0, i: 1, m: 0, r: 0, p: 0, tilt: 0 },
  "2": { t: 0, i: 1, m: 1, r: 0, p: 0, tilt: 0 },
  "3": { t: 1, i: 1, m: 1, r: 0, p: 0, tilt: 0 },
  "4": { t: 0, i: 1, m: 1, r: 1, p: 1, tilt: 0 },
  "5": { t: 1, i: 1, m: 1, r: 1, p: 1, tilt: 0 }
};

function lerp(a, b, n) {
  return a + (b - a) * n;
}

export function drawHand(ctx, pose, t = 0, w, h) {
  const p = pose || POSES.HELLO;
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2 + (p.y || 0);
  const wave = Math.sin(t / 180) * (p.tilt || 0);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((wave * Math.PI) / 180);

  ctx.fillStyle = "#e2b48c";
  ctx.strokeStyle = "#f7e6d4";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-36, 8);
  ctx.quadraticCurveTo(-48, 40, -28, 72);
  ctx.lineTo(22, 74);
  ctx.quadraticCurveTo(48, 38, 32, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const fingers = [
    { k: "t", x: -48, y: 10, openY: -28, closedY: 18, thick: 12 },
    { k: "i", x: -24, y: -8, openY: -86, closedY: -6, thick: 10 },
    { k: "m", x: -4, y: -12, openY: -96, closedY: -4, thick: 11 },
    { k: "r", x: 16, y: -8, openY: -88, closedY: -4, thick: 10 },
    { k: "p", x: 34, y: 4, openY: -70, closedY: 8, thick: 9 }
  ];

  for (const f of fingers) {
    const open = p[f.k];
    const y2 = open ? f.openY : f.closedY;
    ctx.strokeStyle = "#e7c3a1";
    ctx.lineWidth = f.thick;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(f.x, f.y);
    ctx.quadraticCurveTo(f.x + (open ? 4 : 10), lerp(f.y, y2, 0.5), f.x, y2);
    ctx.stroke();
    ctx.fillStyle = "#f0d0b0";
    ctx.beginPath();
    ctx.arc(f.x, y2, f.thick * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  ctx.fillStyle = "rgba(244,239,228,0.18)";
  ctx.fillRect(24, h - 36, w - 48, 8);
}

export function poseFor(sign) {
  if (POSES[sign]) return POSES[sign];
  if (/^[A-Z]$/.test(sign) && POSES[sign]) return POSES[sign];
  return POSES.HELLO;
}

export { POSES };

export class SignPlayer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.queue = [];
    this.index = 0;
    this.sign = "HELLO";
    this.running = false;
    this.t = 0;
    this.lastSwitch = 0;
    this.onChange = () => {};
  }

  play(signs) {
    this.queue = signs.length ? signs : ["HELLO"];
    this.index = 0;
    this.sign = this.queue[0];
    this.running = true;
    this.lastSwitch = performance.now();
    this.onChange(this.sign, this.index, this.queue);
  }

  tick() {
    this.t += 16;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = this.canvas.clientWidth || 400;
    const h = this.canvas.clientHeight || 280;
    if (this.canvas.width !== w * dpr) {
      this.canvas.width = w * dpr;
      this.canvas.height = h * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    drawHand(this.ctx, poseFor(this.sign), this.t, w, h);
    const now = performance.now();
    if (this.running && this.queue.length > 1 && now - this.lastSwitch > 1400) {
      this.lastSwitch = now;
      this.index = (this.index + 1) % this.queue.length;
      this.sign = this.queue[this.index];
      this.onChange(this.sign, this.index, this.queue);
    }
    requestAnimationFrame(() => this.tick());
  }
}
