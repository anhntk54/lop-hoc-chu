// Kiểm tra lõi game: npx tsx src/game/quiz.check.ts
import assert from 'node:assert/strict';
import { Classroom, compactVi, plain, scramble } from './quiz';
import { QUESTIONS, type Question } from './questions';
import { GAME } from './config';

const Q: Question[] = [{ id: 't1', category: 'x', difficulty: 'easy', answer: 'BẢNG ĐEN', clue: 'c' }];
const who = (i: number) => ({ username: `u${i}`, nickname: `Bạn ${i}`, spoken: `Bạn ${i}`, avatar: '' });
let t = 1_000_000;

// chuẩn hoá
assert.equal(compactVi('  Bảng   Đen! '), 'bảngđen');
assert.equal(plain('Vào Lớp'), 'vaolop');
assert.equal(compactVi('Bảng đen'.normalize('NFD')), 'bảngđen'); // gõ kiểu tổ hợp dấu vẫn khớp
const s = scramble('BẢNG ĐEN', () => 0.3);
assert.deepEqual([...s].sort(), [...'BẢNGĐEN'].sort());
assert.notEqual(s.join(''), 'BẢNGĐEN');

// bộ câu: không trùng id, đáp án có chữ
assert.equal(new Set(QUESTIONS.map((x) => x.id)).size, QUESTIONS.length);
for (const x of QUESTIONS) assert.ok(compactVi(x.answer).length >= 2, x.id);

// 1 câu, 1000 người: 300 đúng, tới lệch thứ tự
const c = new Classroom(Q, t);
c.tick((t += GAME.introSec * 1000));
assert.equal(c.phase, 'question');
assert.deepEqual(c.slots(), [null, null, null, null, ' ', null, null, null]);

// nói chuyện thường không bị tính là trả lời sai
c.chat({ ...who(9999), comment: 'khó quá', createTime: t }, t);
c.chat({ ...who(9999), comment: 'bảng đen', createTime: t + 9000 }, t);
assert.equal(c.correct.length, 1);

// gõ sai trước thì không được trả lời lại
c.chat({ ...who(5000), comment: 'bảng đên', createTime: t }, t);
c.chat({ ...who(5000), comment: 'bảng đen', createTime: t }, t);
assert.ok(!c.correct.some((a) => a.username === 'u5000'));
// không dấu không tính
c.chat({ ...who(5001), comment: 'bang den', createTime: t }, t);
assert.ok(!c.correct.some((a) => a.username === 'u5001'));

for (let i = 0; i < 1000; i++) {
  const right = i < 300;
  // createTime giảm dần: người tới SAU lại gửi TRƯỚC -> phải xếp theo createTime
  c.chat({ ...who(i), comment: right ? 'Bảng Đen' : 'xin chào cô', createTime: t + 5000 - i }, t + 10);
}
assert.equal(c.correct.length, 301);
assert.equal(c.correct[0].username, 'u299', 'người có createTime sớm nhất phải đứng đầu');
assert.equal(c.correct[0].points, 10);
assert.equal(c.correct[1].points, 7);
assert.equal(c.correct[2].points, 5);
assert.equal(c.correct[9].points, 3);
assert.equal(c.correct[10].points, 1);

// hết giờ thì chốt, cộng điểm, chỗ ngồi theo điểm
c.tick((t += GAME.questionSec * 1000 + 50));
assert.equal(c.phase, 'reveal');
assert.equal(c.students.get('u299')!.score, 10);
assert.equal(c.seats()[0].username, 'u299');
assert.equal(c.seats().length, GAME.seats);
assert.equal(c.slots(true).join(''), 'BẢNG ĐEN');

// hết bộ câu (chỉ 1 câu) -> tổng kết -> ván mới xoá điểm
c.tick((t += GAME.revealSec * 1000));
assert.equal(c.phase, 'results');
c.tick((t += GAME.resultsSec * 1000));
assert.equal(c.phase, 'intro');
assert.equal(c.students.get('u299')!.score, 0);

// không ai đúng: mở 1 chữ + thêm giờ, rồi mới hiện đáp án
c.tick((t += GAME.introSec * 1000));
c.tick((t += GAME.questionSec * 1000));
assert.equal(c.phase, 'bonus');
assert.equal(c.revealed.size, 1);
c.tick((t += GAME.bonusSec * 1000));
assert.equal(c.phase, 'reveal');

// quà to mở chữ, không mở quá (số chữ - 2)
const g = new Classroom(Q, t);
g.tick((t += GAME.introSec * 1000));
for (let i = 0; i < 20; i++) g.gift(who(1), GAME.hintGiftCoins, t);
assert.equal(g.revealed.size, 7 - GAME.keepHiddenLetters);
assert.equal(g.flowers, 20);

// chuỗi 3 câu đúng liền được thưởng
const many: Question[] = ['MÈO', 'CHÓ', 'GÀ', 'VỊT'].map((a, i) => ({ id: `s${i}`, category: 'x', difficulty: 'easy', answer: a, clue: 'c' }));
const st = new Classroom(many, t);
st.tick((t += GAME.introSec * 1000));
for (let k = 0; k < 3; k++) {
  st.chat({ ...who(1), comment: st.q!.answer, createTime: t }, t);
  st.tick((t += GAME.questionSec * 1000 + 1));
  st.tick((t += GAME.revealSec * 1000));
}
assert.equal(st.students.get('u1')!.score, 30 + GAME.streakBonus);

console.log('quiz.check: tất cả đều đúng');
