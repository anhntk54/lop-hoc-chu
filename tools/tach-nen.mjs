// Tách nền xám ảnh nhân vật bằng Node (máy không có Python), cách làm giống tools/tach-nen.py.
// Cần sharp (cài tạm ở thư mục khác rồi chỉ NODE_PATH tới):  node tools/tach-nen.mjs thay-giao thay
//   tham số 1: thư mục trong nhan-vat/   tham số 2: thư mục ra trong public/assets/nv/
// Mọi tư thế cắt chung 1 khung để chân đứng cùng chỗ khi đổi tư thế.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const [srcName, outName] = process.argv.slice(2);
if (!srcName || !outName) throw new Error('Cách dùng: node tools/tach-nen.mjs <thư mục nhan-vat> <thư mục ra>');
const SRC = path.join(ROOT, 'nhan-vat', srcName);
const OUT = path.join(ROOT, 'public', 'assets', 'nv', outName);
const TOL = 14; // lệch màu tối đa so với nền xám
const HOLE_MIN = 300; // vùng xám kín (giữa tay và thân) lớn hơn chừng này px mới coi là nền
const OUT_H = 560;

async function alphaOf(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const px = (i) => [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];
  // màu nền = trung vị viền ảnh
  const border = [];
  for (let x = 0; x < W; x++) border.push(px(x), px((H - 1) * W + x));
  for (let y = 0; y < H; y++) border.push(px(y * W), px(y * W + W - 1));
  const bg = [0, 1, 2].map((c) => border.map((p) => p[c]).sort((a, b) => a - b)[border.length >> 1]);
  const diff = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const p = px(i);
    diff[i] = Math.max(Math.abs(p[0] - bg[0]), Math.abs(p[1] - bg[1]), Math.abs(p[2] - bg[2]));
  }
  // gán nhãn các vùng sát màu nền
  const lab = new Int32Array(W * H);
  const isBg = new Uint8Array(W * H);
  let n = 0;
  const stack = [];
  for (let s = 0; s < W * H; s++) {
    if (lab[s] || diff[s] > TOL) continue;
    n++;
    lab[s] = n;
    stack.push(s);
    const members = [];
    let edge = false;
    let tight = 0;
    while (stack.length) {
      const i = stack.pop();
      members.push(i);
      if (diff[i] <= 6) tight++;
      const x = i % W, y = (i / W) | 0;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) edge = true;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
        if (j >= 0 && !lab[j] && diff[j] <= TOL) {
          lab[j] = n;
          stack.push(j);
        }
      }
    }
    if (edge || (members.length >= HOLE_MIN && tight / members.length > 0.9)) for (const i of members) isBg[i] = 1;
  }
  // viền mềm 2 px
  const alpha = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) alpha[i] = isBg[i] ? 0 : 255;
  let ring = isBg;
  for (let it = 0; it < 2; it++) {
    const grown = new Uint8Array(ring);
    for (let i = 0; i < W * H; i++) {
      if (ring[i]) continue;
      const x = i % W, y = (i / W) | 0;
      if ((x > 0 && ring[i - 1]) || (x < W - 1 && ring[i + 1]) || (y > 0 && ring[i - W]) || (y < H - 1 && ring[i + W])) grown[i] = 1;
    }
    ring = grown;
  }
  for (let i = 0; i < W * H; i++) if (ring[i] && !isBg[i]) alpha[i] = Math.round(Math.min(1, Math.max(0.35, (diff[i] - TOL) / 30)) * 255);
  // chỉ giữ khối lớn nhất (nhân vật): bỏ đốm lẻ ngoài người như dấu ✦ của máy vẽ ảnh ở góc
  const comp = new Int32Array(W * H);
  let best = 0, bestSize = 0, id = 0;
  for (let s = 0; s < W * H; s++) {
    if (!alpha[s] || comp[s]) continue;
    id++;
    comp[s] = id;
    stack.push(s);
    let size = 0;
    while (stack.length) {
      const i = stack.pop();
      size++;
      const x = i % W, y = (i / W) | 0;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
        if (j >= 0 && alpha[j] && !comp[j]) {
          comp[j] = id;
          stack.push(j);
        }
      }
    }
    if (size > bestSize) [best, bestSize] = [id, size];
  }
  for (let i = 0; i < W * H; i++) if (comp[i] !== best) alpha[i] = 0;
  return { data, alpha, W, H };
}

const files = fs.readdirSync(SRC).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort();
// thư mục chỉ có 1 ảnh (vd thầy giám thị): xuất ra 01-dung.webp cho game tìm được
const fileOut = (f) => (files.length === 1 ? '01-dung.webp' : f.replace(/\.(png|jpe?g)$/i, '.webp'));
const imgs = [];
let x0 = Infinity, y0 = Infinity, x1 = 0, y1 = 0;
for (const f of files) {
  const r = await alphaOf(path.join(SRC, f));
  for (let i = 0; i < r.W * r.H; i++) {
    if (!r.alpha[i]) continue;
    const x = i % r.W, y = (i / r.W) | 0;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  imgs.push({ f, ...r });
}
fs.mkdirSync(OUT, { recursive: true });
for (const { f, data, alpha, W, H } of imgs) {
  const rgba = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    rgba[i * 4] = data[i * 3];
    rgba[i * 4 + 1] = data[i * 3 + 1];
    rgba[i * 4 + 2] = data[i * 3 + 2];
    rgba[i * 4 + 3] = alpha[i];
  }
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: x0, top: y0, width: w, height: h })
    .resize({ height: OUT_H, kernel: 'lanczos3' })
    .webp({ quality: 90 })
    .toFile(path.join(OUT, fileOut(f)));
}
console.log(outName, files.length, 'tư thế, khung', [x0, y0, x1 + 1, y1 + 1]);
