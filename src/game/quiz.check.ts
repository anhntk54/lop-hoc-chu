// Kiểm tra lõi game: npx tsx src/game/quiz.check.ts
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Classroom, LineBag, compactVi, plain, scramble } from './quiz';
import { parseBank, type Question } from './questions';
import { GAME } from './config';
import { LINES, PICK_TOPICS } from './loi-thoai';

const dir = path.join(import.meta.dirname, 'cau-hoi');
const BANK = parseBank(Object.fromEntries(fs.readdirSync(dir).map((f) => [f, fs.readFileSync(path.join(dir, f), 'utf8')])));
const mk = (answer: string, d: Question['difficulty'] = 'easy', id = answer): Question => ({ id, answer, clue: 'gợi ý', kind: 'Đây là thử.', category: 'x', difficulty: d });
const who = (i: number) => ({ username: `u${i}`, nickname: `Bạn ${i}`, spoken: `Bạn ${i}`, avatar: '' });
const chat = (c: Classroom, i: number, comment: string, createTime: number, now: number) => c.chat({ ...who(i), comment, createTime }, now);
let t = 1_000_000;

// ---------- chữ ----------
assert.equal(compactVi('  Bảng   Đen! '), 'bảngđen');
assert.equal(plain('Vào Lớp'), 'vaolop');
assert.equal(compactVi('Bảng đen'.normalize('NFD')), 'bảngđen'); // gõ kiểu tổ hợp dấu vẫn khớp
assert.equal(compactVi('hóa học'), compactVi('hoá học')); // dấu kiểu cũ/mới
assert.equal(compactVi('thủy tinh'), compactVi('thuỷ tinh'));
assert.notEqual(compactVi('hoàng'), compactVi('hoang'));
const s = scramble('BẢNG ĐEN', () => 0.3);
assert.deepEqual([...s].sort(), [...'BẢNGĐEN'].sort());
assert.notEqual(s.join(''), 'BẢNGĐEN');

// ---------- lời thoại: đủ nhiều, không trùng, bốc hết xấp mới lặp ----------
for (const [key, list] of Object.entries(LINES)) {
  assert.ok(list.length >= 2, `${key}: ít nhất 2 câu`);
  const texts = (list as unknown[]).map((l) => (typeof l === 'function' ? (l as (...a: string[]) => string)('A', 'B') : l));
  assert.equal(new Set(texts).size, texts.length, `${key}: có câu trùng`);
  for (const x of texts as string[]) assert.ok(!/[—–]/.test(x), `${key}: có gạch ngang: ${x}`);
}
assert.ok(PICK_TOPICS.length >= 20);
const bag = new LineBag(() => 0.42);
const seen = new Set<number>();
for (let i = 0; i < 10; i++) seen.add(bag.pick('k', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
assert.equal(seen.size, 10, 'đọc hết 10 câu mới được lặp');
let prev = -1;
for (let i = 0; i < 200; i++) {
  const x = bag.pick('k2', [0, 1, 2, 3]);
  assert.notEqual(x, prev, 'không lặp ngay câu vừa đọc');
  prev = x;
}

// ---------- 1 câu, 1000 người, tới lệch thứ tự ----------
{
  const c = new Classroom([mk('BẢNG ĐEN')], t);
  c.newRound(t);
  c.tick((t += GAME.introSec * 1000));
  assert.equal(c.phase, 'question');
  assert.deepEqual(c.slots(), [null, null, null, null, ' ', null, null, null]);
  chat(c, 9999, 'khó quá', t, t); // nói chuyện thường không bị tính sai
  chat(c, 9999, 'bảng đen', t + 9000, t);
  assert.equal(c.correct.length, 1);
  chat(c, 5000, 'bảng đên', t, t); // sai trước thì không được trả lời lại
  chat(c, 5000, 'bảng đen', t, t);
  assert.ok(!c.correct.some((a) => a.username === 'u5000'));
  chat(c, 5001, 'bang den', t, t); // không dấu không tính
  assert.ok(!c.correct.some((a) => a.username === 'u5001'));
  for (let i = 0; i < 1000; i++) chat(c, i, i < 300 ? 'Bảng Đen' : 'xin chào cô', t + 5000 - i, t + 10);
  assert.equal(c.correct.length, 301);
  assert.equal(c.correct[0].username, 'u299', 'createTime sớm nhất đứng đầu');
  assert.deepEqual(c.correct.slice(0, 4).map((a) => a.points), [10, 7, 5, 3]);
  assert.equal(c.correct[10].points, 1);
  c.tick((t += GAME.questionSec * 1000 + 50));
  assert.equal(c.phase, 'reveal');
  assert.equal(c.students.get('u299')!.score, 10);
  assert.equal(c.students.get('u299')!.session, 10);
  assert.equal(c.seats()[0].username, 'u299');
  assert.equal(c.weekDelta.get('u299')!.points, 10);
  assert.equal(c.slots(true).join(''), 'BẢNG ĐEN');
  // hết câu (bộ chỉ 1 câu) -> tổng kết -> ra chơi -> tiết mới xoá điểm tiết, giữ điểm buổi
  c.tick((t += GAME.revealSec * 1000));
  assert.equal(c.phase, 'results');
  c.tick((t += GAME.resultsSec * 1000));
  assert.equal(c.phase, 'recess');
  for (let k = 0; k < 3 && c.phase === 'recess'; k++) c.tick((t += 40_000));
  assert.equal(c.phase, 'intro');
  assert.equal(c.students.get('u299')!.score, 0);
  assert.ok(c.students.get('u299')!.session >= 10);
}

// ---------- không ai đúng: mở 1 chữ + thêm giờ ----------
{
  const c = new Classroom([mk('BẢNG ĐEN')], t);
  c.newRound(t);
  c.tick((t += GAME.introSec * 1000));
  c.tick((t += GAME.questionSec * 1000));
  assert.equal(c.phase, 'bonus');
  assert.equal(c.revealed.size, 1);
  c.tick((t += GAME.bonusSec * 1000));
  assert.equal(c.phase, 'reveal');
  // quà to mở chữ, không mở quá (số chữ - 2)
  const g = new Classroom([mk('BẢNG ĐEN')], t);
  g.newRound(t);
  g.tick((t += GAME.introSec * 1000));
  for (let i = 0; i < 20; i++) g.gift(who(1), GAME.hintGiftCoins, t);
  assert.equal(g.revealed.size, 7 - GAME.keepHiddenLetters);
  assert.equal(g.flowers, 20);
}

// ---------- tiết thật: 3 dễ, 4 vừa, 3 khó; câu 10 nhân đôi; chuỗi 3 câu ----------
{
  const c = new Classroom(BANK, t);
  c.newRound(t);
  c.tick((t += GAME.introSec * 1000));
  const diffs: string[] = [];
  const cats: string[] = [];
  for (let k = 0; k < GAME.questionsPerRound; k++) {
    assert.equal(c.phase, 'question');
    diffs.push(c.q!.difficulty);
    cats.push(c.q!.category);
    if (k === GAME.questionsPerRound - 1) assert.ok(c.golden, 'câu 10 là câu hỏi vàng');
    chat(c, 1, c.q!.answer, t, t);
    if (k === GAME.questionsPerRound - 1) assert.equal(c.correct[0].points, 20);
    c.tick((t += GAME.questionSec * 1000 + 1));
    c.tick((t += GAME.revealSec * 1000));
  }
  assert.deepEqual(diffs, [...GAME.roundPlan]);
  for (let i = 1; i < cats.length; i++) assert.notEqual(cats[i], cats[i - 1], 'không 2 câu liền cùng chủ đề');
  // 9 câu x 10 + câu vàng 20 + 3 lần chuỗi (câu 3, 6, 9) x 5
  assert.equal(c.students.get('u1')!.score, 9 * 10 + 20 + 3 * GAME.streakBonus);
  assert.equal(c.phase, 'results');
  assert.equal(c.usedLog.length, GAME.questionsPerRound);
}

// ---------- không hỏi lại câu đã hỏi gần đây ----------
{
  const history: Record<string, number> = {};
  const c = new Classroom(BANK, t, Math.random, history);
  const asked = new Set<string>();
  const rounds = Math.floor(BANK.filter((q) => q.difficulty === 'easy').length / 3) - 2; // chưa tới lúc hết câu dễ
  for (let r = 0; r < rounds; r++) {
    c.newRound((t += 1000));
    for (const id of c.usedLog.splice(0)) {
      assert.ok(!asked.has(id), `câu ${id} bị hỏi lại ở tiết ${r + 1}`);
      asked.add(id);
    }
  }
  // buổi live sau (đọc sổ cũ) cũng không hỏi lại
  const next = new Classroom(BANK, t, Math.random, { ...history });
  next.newRound(t);
  const fresh = next.usedLog.filter((id) => !asked.has(id)).length;
  assert.equal(fresh, next.usedLog.length, 'buổi sau vẫn ưu tiên câu chưa hỏi');
  console.log(`  ${rounds} tiết liền (${asked.size} câu) không lặp câu nào`);
}

// ---------- giờ ra chơi ----------
const recessOf = (game: 'rps' | 'callup' | 'pick' | 'roll' | 'heart', seed = 0.1) => {
  const c = new Classroom([mk('MÈO'), mk('CHÓ', 'easy', 'cho')], t, () => seed);
  c.newRound(t);
  for (let i = 0; i < 5; i++) chat(c, i, 'chào cô', t, t); // vào lớp, vừa hoạt động
  c.forceRecess(game, t);
  return c;
};
{
  // oẳn tù tì: cô ra theo rand; thắng cô +2 điểm buổi, không đụng điểm tiết
  const c = recessOf('rps', 0.1); // rand 0.1 -> cô ra "búa"
  chat(c, 1, 'bao', t, t);
  chat(c, 2, 'Kéo', t, t);
  chat(c, 1, 'kéo', t, t); // đổi ý không tính
  c.tick((t += GAME.recessPlaySec.rps * 1000));
  assert.equal(c.view(t).recess!.teacher, 'búa');
  assert.equal(c.students.get('u1')!.session, GAME.rpsPoints);
  assert.equal(c.students.get('u1')!.score, 0);
  assert.equal(c.students.get('u2')!.session, 0);
  c.tick((t += GAME.recessResultSec * 1000));
  assert.equal(c.recess!.stage, 'board');
  c.tick((t += GAME.recessBoardSec * 1000));
  assert.equal(c.phase, 'intro');
}
{
  // kiểm tra miệng: chỉ bạn được gọi mới được trả lời, đúng +5, chốt ngay
  const c = recessOf('callup');
  assert.equal(c.recess!.game, 'callup');
  const target = c.recess!.callTarget!;
  const answer = c.recess!.callQ!.answer;
  const other = [...c.students.values()].find((u) => u.username !== target.username)!;
  c.chat({ ...other, comment: answer, createTime: t }, t);
  assert.equal(c.recess!.callResult, '');
  c.chat({ ...target, comment: answer, createTime: t }, t);
  assert.equal(c.recess!.callResult, 'right');
  c.tick(t);
  assert.equal(c.students.get(target.username)!.session, GAME.callUpPoints);
}
{
  // chọn phe: đếm 1/2, mỗi người 1 phiếu
  const c = recessOf('pick');
  chat(c, 1, '1', t, t);
  chat(c, 2, '2', t, t);
  chat(c, 3, '1', t, t);
  chat(c, 1, '2', t, t);
  assert.deepEqual(c.view(t).recess!.votes, [2, 1]);
  const out = c.tick((t += GAME.recessPlaySec.pick * 1000));
  assert.ok(out.some((l) => l.text.includes('67')), 'đọc phần trăm phe thắng');
}
{
  // điểm danh: 10 bạn gõ "có mặt" sớm nhất (theo giờ TikTok) +3
  const c = recessOf('roll');
  for (let i = 0; i < 15; i++) chat(c, 100 + i, 'Có mặt!', t + 100 - i, t);
  c.tick((t += GAME.recessPlaySec.roll * 1000));
  assert.equal(c.students.get('u114')!.session, GAME.rollPoints);
  assert.equal(c.students.get('u100')!.session, 0);
}
{
  // thả tim: đủ mốc thì ai vừa hoạt động +1
  const c = recessOf('heart');
  c.like(GAME.heartTarget, t, false);
  c.tick((t += GAME.recessPlaySec.heart * 1000));
  assert.equal(c.students.get('u1')!.session, 1);
}

// ---------- lớp trưởng: đổi người thì cô thông báo ----------
{
  const c = new Classroom([mk('MÈO'), mk('CHÓ', 'easy', 'cho'), mk('GÀ', 'easy', 'ga')], t);
  c.newRound(t);
  c.tick((t += GAME.introSec * 1000));
  const said: string[] = [];
  const step = () => {
    said.push(...c.tick((t += GAME.questionSec * 1000 + 1)).map((l) => l.text));
    c.tick((t += GAME.revealSec * 1000));
  };
  chat(c, 1, c.q!.answer, t, t);
  step();
  chat(c, 2, c.q!.answer, t, t);
  chat(c, 1, c.q!.answer, t + 1, t);
  step();
  chat(c, 2, c.q!.answer, t, t);
  said.push(...c.tick((t += GAME.questionSec * 1000 + 1)).map((l) => l.text));
  assert.equal(c.view(t).seats.find((x) => x.username === 'u2')!.title, 'lop-truong');
  assert.ok(said.some((l) => l.includes('Bạn 2') && /lớp trưởng/i.test(l)), 'cô báo lớp trưởng mới');
}

console.log('quiz.check: tất cả đều đúng');
