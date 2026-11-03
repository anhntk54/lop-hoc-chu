import { GAME } from './config';
import type { Question } from './questions';

/**
 * Lõi game Lớp Học Chữ: không đụng React, không đụng giọng đọc, chạy theo đồng hồ truyền vào.
 * Trang stage gọi chat/gift/tick rồi đọc các câu trả về; test ở quiz.check.ts.
 */

export type Phase = 'intro' | 'question' | 'bonus' | 'reveal' | 'results';

export interface Student {
  username: string;
  nickname: string; // đã lọc từ cấm
  spoken: string; // tên để đọc
  avatar: string;
  girl: boolean;
  score: number;
  reachedAt: number; // lúc đạt điểm hiện tại (hòa điểm: ai đạt trước xếp trên)
  streak: number;
  lastActive: number;
  joinedAt: number;
}

export interface Answerer {
  username: string;
  nickname: string;
  avatar: string;
  createTime: number; // giờ TikTok gắn lúc người xem gửi comment
  seq: number; // thứ tự bot nhận (phụ khi trùng giờ)
  points: number;
}

export interface Say {
  text: string;
  priority?: boolean;
}

export interface ChatIn {
  username: string;
  nickname: string;
  spoken: string;
  avatar: string;
  comment: string;
  createTime: number;
}

// Thường hoá: chuẩn Unicode, chữ thường, bỏ khoảng trắng và dấu câu, GIỮ dấu tiếng Việt
export const compactVi = (s: string) =>
  s.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
// Bỏ cả dấu: "Vào Lớp" -> "vaolop"
export const plain = (s: string) =>
  compactVi(s).normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd');

/** Điểm theo thứ hạng trả lời đúng (0 = nhanh nhất) */
export function pointsForRank(rank: number) {
  return GAME.rankPoints[rank] ?? GAME.latePoints;
}

/** Xáo chữ cái của đáp án (bỏ khoảng trắng), chắc chắn khác thứ tự gốc nếu được */
export function scramble(answer: string, rand = Math.random): string[] {
  const letters = [...answer.normalize('NFC').toUpperCase().replace(/\s+/g, '')];
  if (new Set(letters).size < 2) return letters;
  let out = letters;
  for (let tries = 0; tries < 10 && out.join('') === letters.join(''); tries++) {
    out = [...letters];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
  }
  return out;
}

const hash = (s: string) => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
};

export class Classroom {
  phase: Phase = 'intro';
  round = 1;
  qNo = 0; // câu thứ mấy trong ván (1..questionsPerRound)
  phaseEndsAt: number;
  students = new Map<string, Student>();

  private deck: Question[] = [];
  private roundQs: Question[] = [];
  q: Question | null = null;
  tiles: string[] = [];
  revealed = new Set<number>(); // vị trí chữ đã mở (tính trên đáp án bỏ khoảng trắng)
  private bonusUsed = false;
  correct: Answerer[] = [];
  private tried = new Set<string>(); // ai đã trả lời câu này (đúng hay sai)
  private wrong = new Set<string>();
  private firstCorrectAt = 0;
  private seq = 0;
  stats = { received: 0, attempts: 0 };
  flowers = 0;
  lastFlowerAt = 0;
  clapUntil = 0;

  constructor(private bank: Question[], now: number, private rand = Math.random) {
    this.phaseEndsAt = now + GAME.introSec * 1000;
    this.pickRound();
  }

  // ---------- người chơi ----------
  private touch(e: { username: string; nickname: string; spoken: string; avatar: string }, now: number) {
    let s = this.students.get(e.username);
    if (!s) {
      s = {
        ...e,
        girl: hash(e.username) % 2 === 0,
        score: 0,
        reachedAt: 0,
        streak: 0,
        lastActive: now,
        joinedAt: now,
      };
      this.students.set(e.username, s);
    } else {
      s.nickname = e.nickname;
      s.spoken = e.spoken;
      if (e.avatar) s.avatar = e.avatar;
      s.lastActive = now;
    }
    return s;
  }

  /** 20 chỗ ngồi: điểm cao ngồi bàn đầu, cùng điểm thì ai đạt trước, rồi ai vừa hoạt động */
  seats(n = GAME.seats): Student[] {
    return [...this.students.values()]
      .sort((a, b) => b.score - a.score || a.reachedAt - b.reachedAt || b.lastActive - a.lastActive)
      .slice(0, n);
  }

  // ---------- câu hỏi ----------
  private pickRound() {
    // Chia bài theo bộ: hết cả bộ mới lặp lại, trong 1 ván không trùng câu
    const out: Question[] = [];
    while (out.length < GAME.questionsPerRound) {
      if (this.deck.length === 0) {
        this.deck = [...this.bank];
        for (let i = this.deck.length - 1; i > 0; i--) {
          const j = Math.floor(this.rand() * (i + 1));
          [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
        if (this.deck.length === 0) break;
      }
      const next = this.deck.pop()!;
      if (out.some((x) => x.id === next.id)) {
        if (this.bank.length <= out.length) break; // bộ câu ít hơn 10: chơi bấy nhiêu thôi
        continue;
      }
      out.push(next);
    }
    this.roundQs = out;
  }

  get answerLetters() {
    return this.q ? [...this.q.answer.normalize('NFC').toUpperCase().replace(/\s+/g, '')] : [];
  }

  /** Ô đáp án theo từng chữ: null = chưa mở, ' ' = khoảng cách giữa 2 từ */
  slots(showAll = false): (string | null)[] {
    if (!this.q) return [];
    const out: (string | null)[] = [];
    let i = 0;
    for (const ch of this.q.answer.normalize('NFC').toUpperCase().trim()) {
      if (/\s/.test(ch)) {
        if (out[out.length - 1] !== ' ') out.push(' ');
        continue;
      }
      out.push(showAll || this.revealed.has(i) ? ch : null);
      i++;
    }
    return out;
  }

  /** Mở thêm 1 chữ (không mở quá số chữ - 2). Trả về false nếu hết chữ được mở */
  revealOne(): boolean {
    const n = this.answerLetters.length;
    if (this.revealed.size >= Math.max(0, n - GAME.keepHiddenLetters)) return false;
    const hidden = [...Array(n).keys()].filter((i) => !this.revealed.has(i));
    this.revealed.add(hidden[Math.floor(this.rand() * hidden.length)]);
    return true;
  }

  private startQuestion(now: number): Say[] {
    this.qNo++;
    this.q = this.roundQs[this.qNo - 1] ?? null;
    if (!this.q) return this.startResults(now, true);
    this.tiles = scramble(this.q.answer, this.rand);
    this.revealed = new Set();
    this.bonusUsed = false;
    this.correct = [];
    this.tried = new Set();
    this.wrong = new Set();
    this.firstCorrectAt = 0;
    this.stats = { received: 0, attempts: 0 };
    this.phase = 'question';
    this.phaseEndsAt = now + GAME.questionSec * 1000;
    return [{ text: GAME.lines.question(this.qNo, this.q.clue) }];
  }

  private isRight(comment: string) {
    if (!this.q) return false;
    const key = GAME.requireDiacritics ? compactVi : plain;
    const typed = key(comment);
    return [this.q.answer, ...(this.q.acceptedAnswers ?? [])].some((a) => key(a) === typed);
  }

  /** Comment có phải là câu trả lời không: dài đúng bằng đáp án (không tính khoảng trắng). Nói chuyện thường không bị tính sai */
  private isAttempt(comment: string) {
    const n = compactVi(comment).length;
    return !!this.q && [this.q.answer, ...(this.q.acceptedAnswers ?? [])].some((a) => compactVi(a).length === n);
  }

  // ---------- sự kiện ----------
  chat(e: ChatIn, now: number): Say[] {
    this.touch(e, now);
    if (this.phase !== 'question' && this.phase !== 'bonus') return [];
    this.stats.received++;
    if (!this.isAttempt(e.comment) || this.tried.has(e.username)) return [];
    this.tried.add(e.username);
    this.stats.attempts++;
    if (!this.isRight(e.comment)) {
      this.wrong.add(e.username);
      return [];
    }
    this.correct.push({
      username: e.username,
      nickname: e.nickname,
      avatar: e.avatar,
      createTime: e.createTime,
      seq: ++this.seq,
      points: 0,
    });
    // xếp theo giờ TikTok gắn, không theo lúc bot nhận (comment có thể tới lệch thứ tự)
    this.correct.sort((a, b) => a.createTime - b.createTime || a.seq - b.seq);
    this.correct.forEach((a, i) => (a.points = pointsForRank(i)));
    if (!this.firstCorrectAt) {
      this.firstCorrectAt = now;
      if (GAME.endAfterFirstSec > 0) this.phaseEndsAt = Math.min(this.phaseEndsAt, now + GAME.endAfterFirstSec * 1000);
      return [{ text: GAME.lines.firstCorrect(e.spoken) }];
    }
    return [];
  }

  /** Quà: luôn là hoa tặng cô; quà to thì cô mở thêm 1 chữ cho cả lớp */
  gift(e: { username: string; nickname: string; spoken: string; avatar: string }, coins: number, now: number): Say[] {
    this.touch(e, now);
    this.flowers++;
    this.lastFlowerAt = now;
    const asking = this.phase === 'question' || this.phase === 'bonus';
    if (asking && coins >= GAME.hintGiftCoins && this.correct.length === 0 && this.revealOne()) {
      return [{ text: GAME.lines.giftHint(e.spoken), priority: true }];
    }
    return [];
  }

  /** Đủ tim: cả lớp vỗ tay */
  clap(now: number): Say[] {
    this.clapUntil = now + GAME.clapSec * 1000;
    return [{ text: GAME.lines.clap }];
  }

  private reveal(now: number): Say[] {
    this.phase = 'reveal';
    this.phaseEndsAt = now + GAME.revealSec * 1000;
    const out: Say[] = [];
    const winners = new Set(this.correct.map((a) => a.username));
    for (const [i, a] of this.correct.entries()) {
      const s = this.students.get(a.username);
      if (!s) continue;
      s.score += a.points;
      s.streak++;
      if (s.streak % GAME.streakEvery === 0) {
        s.score += GAME.streakBonus;
        out.push({ text: GAME.lines.streak(s.spoken) });
      }
      s.reachedAt = now + i / 1000; // cùng lúc chốt điểm: ai trả lời trước xếp trên
    }
    for (const s of this.students.values()) if (!winners.has(s.username)) s.streak = 0;
    const answer = this.q!.answer.toLowerCase();
    const top = this.correct.slice(0, 3).map((a) => this.students.get(a.username)?.spoken ?? 'bạn');
    out.unshift({ text: top.length ? GAME.lines.reveal(answer, top, this.correct.length) : GAME.lines.revealNobody(answer) });
    return out;
  }

  private startResults(now: number, outOfQuestions = false): Say[] {
    this.phase = 'results';
    this.phaseEndsAt = now + GAME.resultsSec * 1000;
    const best = this.seats(1)[0];
    const lines: Say[] = [];
    if (outOfQuestions) lines.push({ text: GAME.lines.outOfQuestions });
    lines.push({ text: best && best.score > 0 ? GAME.lines.results(best.spoken, best.score) : GAME.lines.resultsNobody });
    return lines;
  }

  newRound(now: number): Say[] {
    this.round++;
    this.qNo = 0;
    this.q = null;
    this.correct = [];
    for (const s of this.students.values()) {
      s.score = 0;
      s.streak = 0;
      s.reachedAt = 0;
    }
    this.pickRound();
    this.phase = 'intro';
    this.phaseEndsAt = now + GAME.introSec * 1000;
    return [{ text: GAME.lines.intro }];
  }

  /** Bỏ qua phần đang chạy (nút "Câu tiếp" ở trang điều khiển) */
  skip(now: number): Say[] {
    this.phaseEndsAt = now;
    return this.tick(now);
  }

  tick(now: number): Say[] {
    if (now < this.phaseEndsAt) return [];
    switch (this.phase) {
      case 'intro':
        return this.startQuestion(now);
      case 'question':
        if (this.correct.length === 0 && !this.bonusUsed) {
          this.bonusUsed = true;
          this.revealOne();
          this.phase = 'bonus';
          this.phaseEndsAt = now + GAME.bonusSec * 1000;
          return [{ text: GAME.lines.bonus }];
        }
        return this.reveal(now);
      case 'bonus':
        return this.reveal(now);
      case 'reveal':
        return this.qNo >= this.roundQs.length ? this.startResults(now) : this.startQuestion(now);
      case 'results':
        return this.newRound(now);
    }
  }

  /** Ảnh chụp trạng thái để vẽ (gọn, gửi được qua mạng cho trang điều khiển xem trước) */
  view(now: number) {
    const showAnswer = this.phase === 'reveal';
    return {
      phase: this.phase,
      round: this.round,
      qNo: this.qNo,
      total: this.roundQs.length,
      endsAt: this.phaseEndsAt,
      clue: this.q?.clue ?? '',
      category: this.q?.category ?? '',
      answer: this.q?.answer ?? '',
      tiles: this.tiles,
      slots: this.slots(showAnswer),
      correctTop: this.correct.slice(0, 3).map(({ username, nickname, avatar, points }) => ({ username, nickname, avatar, points })),
      correctCount: this.correct.length,
      seats: this.seats().map(({ username, nickname, avatar, girl, score, lastActive, joinedAt }) => ({
        username,
        nickname,
        avatar,
        girl,
        score,
        lastActive,
        joinedAt,
        // câu đang hỏi: trả lời đúng / sai / chưa
        answered: this.correct.some((a) => a.username === username) ? 'right' : this.wrong.has(username) ? 'wrong' : '',
      })),
      classSize: this.students.size,
      stats: this.stats,
      flowers: this.flowers,
      lastFlowerAt: this.lastFlowerAt,
      clapping: now < this.clapUntil,
    };
  }
}

export type ClassView = ReturnType<Classroom['view']>;
