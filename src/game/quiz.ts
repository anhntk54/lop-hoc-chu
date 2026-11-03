import { GAME } from './config';
import { LINES, PICK_TOPICS } from './loi-thoai';
import type { Question } from './questions';

/**
 * Lõi game Lớp Học Chữ: không đụng React, không đụng giọng đọc, chạy theo đồng hồ truyền vào.
 * Trang stage gọi chat/gift/like/tick rồi đọc các câu trả về; test ở quiz.check.ts.
 *
 * Một vòng: intro → 10 câu (question → [bonus] → reveal) → results → recess (giờ ra chơi) → intro ...
 */

export type Phase = 'intro' | 'question' | 'bonus' | 'reveal' | 'results' | 'recess';
export type RecessGame = 'rps' | 'callup' | 'pick' | 'roll' | 'heart';
type RecessStage = 'play' | 'result' | 'board';

export interface Student {
  username: string;
  nickname: string; // đã lọc từ cấm
  spoken: string; // tên để đọc
  avatar: string;
  girl: boolean;
  score: number; // điểm tiết này (xếp chỗ ngồi, xoá khi sang tiết mới)
  session: number; // điểm cả buổi live (lớp trưởng, lớp phó)
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

type Person = Pick<ChatIn, 'username' | 'nickname' | 'spoken' | 'avatar'>;

// Dấu thanh kiểu cũ/mới ("hóa"/"hoá", "thủy"/"thuỷ") coi là một: đưa về kiểu mới (dấu trên chữ sau) ở cuối từ
const OLD_OA = /o([̣̀́̃̉])([ae])(?!\p{L})/gu;
const OLD_UY = /u([̣̀́̃̉])y(?!\p{L})/gu;
export const normVi = (s: string) =>
  s.normalize('NFD').toLowerCase().replace(OLD_OA, 'o$2$1').replace(OLD_UY, 'uy$1').normalize('NFC');
// Thường hoá: chuẩn Unicode, chữ thường, bỏ khoảng trắng và dấu câu, GIỮ dấu tiếng Việt
export const compactVi = (s: string) => normVi(s).replace(/[^\p{L}\p{N}]/gu, '');
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

/** Bốc câu thoại kiểu xáo bài: đọc hết cả nhóm mới lặp, và không lặp ngay câu vừa đọc */
export class LineBag {
  private left = new Map<string, number[]>();
  private last = new Map<string, number>();
  constructor(private rand = Math.random) {}
  pick<T>(key: string, list: T[]): T {
    let pool = this.left.get(key);
    if (!pool || pool.length === 0) {
      pool = list.map((_, i) => i);
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(this.rand() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      if (pool.length > 1 && pool[pool.length - 1] === this.last.get(key)) pool.unshift(pool.pop()!);
      this.left.set(key, pool);
    }
    const i = pool.pop()!;
    this.last.set(key, i);
    return list[i];
  }
}

const RPS = { bua: 'búa', keo: 'kéo', bao: 'bao' } as const;
type Rps = keyof typeof RPS;
const BEATS: Record<Rps, Rps> = { bua: 'keo', keo: 'bao', bao: 'bua' };
const RECESS_GAMES: RecessGame[] = ['rps', 'callup', 'pick', 'roll', 'heart'];

interface Recess {
  game: RecessGame;
  stage: RecessStage;
  rps: Map<string, Rps>;
  teacher: Rps | null;
  callTarget: Student | null;
  callQ: Question | null;
  callTiles: string[];
  callResult: '' | 'right' | 'wrong' | 'silent';
  pick: [string, string];
  votes: Map<string, 1 | 2>;
  roll: Answerer[];
  hearts: number;
}

export class Classroom {
  phase: Phase = 'intro';
  round = 0; // gọi newRound() để vào tiết 1
  qNo = 0; // câu thứ mấy trong tiết (1..questionsPerRound)
  phaseStartedAt: number;
  phaseEndsAt: number;
  students = new Map<string, Student>();

  private roundQs: Question[] = [];
  q: Question | null = null;
  tiles: string[] = [];
  revealed = new Set<number>(); // vị trí chữ đã mở (tính trên đáp án bỏ khoảng trắng)
  private bonusUsed = false;
  private quietSaid = false;
  correct: Answerer[] = [];
  private tried = new Set<string>(); // ai đã trả lời câu này (đúng hay sai)
  private wrong = new Set<string>();
  private seq = 0;
  stats = { received: 0, attempts: 0 };
  flowers = 0;
  lastFlowerAt = 0;
  clapUntil = 0;
  private lastChatAt: number;
  private lastIdleAt = 0;
  private monitor = ''; // lớp trưởng hiện tại (điểm cả buổi cao nhất)
  recess: Recess | null = null;
  private lastRecess: RecessGame | null = null;

  /** id câu vừa dùng, trang stage gửi lên server để buổi sau không hỏi lại sớm */
  usedLog: string[] = [];
  /** điểm cộng thêm cho bảng vàng tuần, trang stage gửi lên server rồi xoá */
  weekDelta = new Map<string, { nickname: string; points: number }>();
  /** tên người nhất bảng vàng tuần (server báo về), cô đọc thỉnh thoảng */
  weekLeader = '';

  readonly lines: LineBag;

  constructor(
    private bank: Question[],
    now: number,
    private rand = Math.random,
    private history: Record<string, number> = {}, // id câu -> lần hỏi gần nhất (ms)
  ) {
    this.lines = new LineBag(rand);
    this.phaseStartedAt = now;
    this.phaseEndsAt = now + GAME.introSec * 1000;
    this.lastChatAt = now;
  }

  /** 1 câu cô nói (giọng nữ) */
  private t(text: string, priority = false): Say {
    return { text: `F: ${text}`, priority };
  }
  private line0(key: keyof typeof LINES) {
    return this.t(this.lines.pick(key, LINES[key] as string[]));
  }
  private line(key: keyof typeof LINES, ...args: string[]) {
    const fn = this.lines.pick(key, LINES[key] as ((...a: string[]) => string)[]);
    return fn(...args);
  }

  // ---------- người chơi ----------
  private touch(e: Person, now: number) {
    let s = this.students.get(e.username);
    if (!s) {
      s = { ...e, girl: hash(e.username) % 2 === 0, score: 0, session: 0, reachedAt: 0, streak: 0, lastActive: now, joinedAt: now };
      this.students.set(e.username, s);
    } else {
      s.nickname = e.nickname;
      s.spoken = e.spoken;
      if (e.avatar) s.avatar = e.avatar;
      s.lastActive = now;
    }
    return s;
  }

  /** Cộng điểm: `inClass` = điểm tiết học (xếp ghế); mọi điểm đều vào cả buổi + bảng tuần */
  private award(s: Student, points: number, now: number, inClass: boolean) {
    if (inClass) {
      s.score += points;
      s.reachedAt = now;
    }
    s.session += points;
    const w = this.weekDelta.get(s.username) ?? { nickname: s.nickname, points: 0 };
    w.nickname = s.nickname;
    w.points += points;
    this.weekDelta.set(s.username, w);
  }

  /** Lớp trưởng đổi người thì cô thông báo */
  private checkMonitor(): Say[] {
    const top = this.sessionTop(1)[0];
    if (!top || top.session <= 0 || top.username === this.monitor) return [];
    const first = this.monitor === '';
    this.monitor = top.username;
    return first && top.session < 10 ? [] : [this.t(this.line('newMonitor', top.spoken))];
  }

  /** 20 ghế: điểm tiết cao ngồi đầu; cùng điểm thì ai đạt trước, rồi điểm cả buổi, rồi ai vào trước (chỗ không nhảy lung tung) */
  seats(n = GAME.seats): Student[] {
    return [...this.students.values()]
      .sort((a, b) => b.score - a.score || a.reachedAt - b.reachedAt || b.session - a.session || a.joinedAt - b.joinedAt)
      .slice(0, n);
  }

  sessionTop(n: number): Student[] {
    return [...this.students.values()].filter((s) => s.session > 0).sort((a, b) => b.session - a.session || a.joinedAt - b.joinedAt).slice(0, n);
  }

  // ---------- chọn câu ----------
  /** Chọn câu lâu chưa hỏi nhất theo độ khó, tránh 2 câu liền cùng chủ đề và quá 2 câu/chủ đề mỗi tiết */
  private pickOne(difficulty: Question['difficulty'], taken: Question[], now: number): Question | null {
    const used = new Set(taken.map((q) => q.id));
    const perCat = (c: string) => taken.filter((q) => q.category === c).length;
    const prev = taken[taken.length - 1]?.category;
    let pool = this.bank.filter((q) => q.difficulty === difficulty && !used.has(q.id));
    const nice = pool.filter((q) => q.category !== prev && perCat(q.category) < 2);
    if (nice.length) pool = nice;
    if (!pool.length) pool = this.bank.filter((q) => !used.has(q.id));
    if (!pool.length) return null;
    // xáo trước rồi xếp theo lần hỏi gần nhất: câu chưa hỏi bao giờ lên đầu, thứ tự trong file không ảnh hưởng
    const at = (q: Question) => this.history[q.id] ?? 0;
    pool = [...pool];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(this.rand() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    pool.sort((a, b) => at(a) - at(b));
    const q = pool[0];
    this.history[q.id] = now;
    this.usedLog.push(q.id);
    return q;
  }

  private pickRound(now: number) {
    const out: Question[] = [];
    for (const d of GAME.roundPlan) {
      const q = this.pickOne(d, out, now);
      if (q) out.push(q);
    }
    this.roundQs = out;
  }

  get golden() {
    return this.qNo > 0 && this.qNo === this.roundQs.length && this.roundQs.length >= GAME.questionsPerRound;
  }

  private lettersOf(q: Question | null) {
    return q ? [...q.answer.normalize('NFC').toUpperCase().replace(/\s+/g, '')] : [];
  }
  get answerLetters() {
    return this.lettersOf(this.q);
  }

  /** Ô đáp án theo từng chữ: null = chưa mở, ' ' = khoảng cách giữa 2 từ */
  slotsOf(q: Question | null, revealed: Set<number>, showAll: boolean): (string | null)[] {
    if (!q) return [];
    const out: (string | null)[] = [];
    let i = 0;
    for (const ch of q.answer.normalize('NFC').toUpperCase().trim()) {
      if (/\s/.test(ch)) {
        if (out[out.length - 1] !== ' ') out.push(' ');
        continue;
      }
      out.push(showAll || revealed.has(i) ? ch : null);
      i++;
    }
    return out;
  }
  slots(showAll = false) {
    return this.slotsOf(this.q, this.revealed, showAll);
  }

  /** Mở thêm 1 chữ (không mở quá số chữ - 2). Trả về false nếu hết chữ được mở */
  revealOne(): boolean {
    const n = this.answerLetters.length;
    if (this.revealed.size >= Math.max(0, n - GAME.keepHiddenLetters)) return false;
    const hidden = [...Array(n).keys()].filter((i) => !this.revealed.has(i));
    this.revealed.add(hidden[Math.floor(this.rand() * hidden.length)]);
    return true;
  }

  private setPhase(p: Phase, now: number, sec: number) {
    this.phase = p;
    this.phaseStartedAt = now;
    this.phaseEndsAt = now + sec * 1000;
  }

  private startQuestion(now: number): Say[] {
    this.qNo++;
    this.q = this.roundQs[this.qNo - 1] ?? null;
    if (!this.q) return this.startResults(now, true);
    this.tiles = scramble(this.q.answer, this.rand);
    this.revealed = new Set();
    this.bonusUsed = false;
    this.quietSaid = false;
    this.correct = [];
    this.tried = new Set();
    this.wrong = new Set();
    this.stats = { received: 0, attempts: 0 };
    this.setPhase('question', now, GAME.questionSec);
    const out: Say[] = [];
    if (this.golden) out.push(this.line0('goldenIntro'));
    out.push(this.t(`Câu ${this.qNo}. ${this.q.kind} ${this.q.clue}`));
    return out;
  }

  private matches(q: Question | null, comment: string) {
    if (!q) return false;
    const key = GAME.requireDiacritics ? compactVi : plain;
    const typed = key(comment);
    return [q.answer, ...(q.acceptedAnswers ?? [])].some((a) => key(a) === typed);
  }

  /** Comment có phải là câu trả lời không: dài đúng bằng đáp án (không tính khoảng trắng). Nói chuyện thường không bị tính sai */
  private isAttempt(q: Question | null, comment: string) {
    const n = compactVi(comment).length;
    return !!q && [q.answer, ...(q.acceptedAnswers ?? [])].some((a) => compactVi(a).length === n);
  }

  // ---------- sự kiện ----------
  chat(e: ChatIn, now: number): Say[] {
    const s = this.touch(e, now);
    this.lastChatAt = now;
    if (this.phase === 'recess') return this.recessChat(s, e, now);
    if (this.phase !== 'question' && this.phase !== 'bonus') return [];
    this.stats.received++;
    if (!this.isAttempt(this.q, e.comment) || this.tried.has(e.username)) return [];
    this.tried.add(e.username);
    this.stats.attempts++;
    if (!this.matches(this.q, e.comment)) {
      this.wrong.add(e.username);
      return [];
    }
    this.correct.push({ username: e.username, nickname: e.nickname, avatar: e.avatar, createTime: e.createTime, seq: ++this.seq, points: 0 });
    // xếp theo giờ TikTok gắn, không theo lúc bot nhận (comment có thể tới lệch thứ tự)
    this.correct.sort((a, b) => a.createTime - b.createTime || a.seq - b.seq);
    const mult = this.golden ? 2 : 1;
    this.correct.forEach((a, i) => (a.points = pointsForRank(i) * mult));
    if (this.correct.length === 1) {
      if (GAME.endAfterFirstSec > 0) this.phaseEndsAt = Math.min(this.phaseEndsAt, now + GAME.endAfterFirstSec * 1000);
      const fast = now - this.phaseStartedAt < GAME.superFastSec * 1000;
      return [this.t(this.line(fast ? 'superFast' : 'firstCorrect', e.spoken))];
    }
    return [];
  }

  /** Quà: luôn là hoa tặng cô; quà to lúc chưa ai đúng thì cô mở thêm 1 chữ cho cả lớp */
  gift(e: Person, coins: number, now: number): Say[] {
    this.touch(e, now);
    this.flowers++;
    this.lastFlowerAt = now;
    const asking = this.phase === 'question' || this.phase === 'bonus';
    if (asking && coins >= GAME.hintGiftCoins && this.correct.length === 0 && this.revealOne()) {
      return [this.t(this.line('giftHint', e.spoken), true)];
    }
    return [];
  }

  /** Câu cảm ơn quà (useGame quyết định có cảm ơn hay không để tránh lặp combo) */
  thank(e: Person, giftName: string, coins: number): Say {
    return this.t(coins >= GAME.bigGiftCoins ? this.line('bigGift', e.spoken) : this.line('thankGift', e.spoken, giftName), true);
  }
  follow(e: Person): Say {
    return this.t(this.line('thankFollow', e.spoken));
  }
  greet(names: string): Say {
    return this.t(this.line('greeting', names));
  }
  share(): Say {
    return this.line0('share');
  }

  /** Tim: giờ ra chơi "thả tim" thì đếm; ngoài ra đủ mốc thì cả lớp vỗ tay */
  like(count: number, now: number, reachedClap: boolean): Say[] {
    if (this.recess?.game === 'heart' && this.recess.stage === 'play') {
      this.recess.hearts += count;
      return [];
    }
    if (!reachedClap) return [];
    this.clapUntil = now + GAME.clapSec * 1000;
    return [this.line0('clap')];
  }

  private reveal(now: number): Say[] {
    this.setPhase('reveal', now, GAME.revealSec);
    const out: Say[] = [];
    const winners = new Set(this.correct.map((a) => a.username));
    for (const a of this.correct) {
      const s = this.students.get(a.username);
      if (!s) continue;
      this.award(s, a.points, now + a.seq / 1e6, true);
      s.streak++;
      if (s.streak % GAME.streakEvery === 0) {
        this.award(s, GAME.streakBonus, now, true);
        out.push(this.t(this.line('streak', s.spoken)));
      }
    }
    // cùng lúc chốt điểm: ai trả lời trước xếp trên
    this.correct.forEach((a, i) => {
      const s = this.students.get(a.username);
      if (s) s.reachedAt = now + i / 1000;
    });
    for (const s of this.students.values()) if (!winners.has(s.username)) s.streak = 0;
    const answer = this.q!.answer.toLowerCase();
    const top = this.correct[0] && this.students.get(this.correct[0].username);
    let main: string;
    if (top) {
      const rest = this.line('revealTop', top.spoken) + (this.correct.length > 1 ? ' ' + this.line('revealCount', String(this.correct.length)) : '');
      main = this.line('reveal', answer, rest);
      if (this.golden) out.unshift(this.t(this.line('goldenWinner', top.spoken)));
    } else main = this.line('revealNobody', answer);
    out.unshift(this.t(main));
    // cà khịa 1 bạn trả lời sai (60% số câu, tên đọc được)
    const wrongs = [...this.wrong].map((u) => this.students.get(u)).filter((s): s is Student => !!s && s.spoken !== 'bạn');
    if (wrongs.length && this.rand() < GAME.roastChance) out.push(this.t(this.line('roastWrong', wrongs[Math.floor(this.rand() * wrongs.length)].spoken)));
    return [...out, ...this.checkMonitor()];
  }

  private startResults(now: number, outOfQuestions = false): Say[] {
    this.setPhase('results', now, GAME.resultsSec);
    const best = this.seats(1)[0];
    const lines: Say[] = [];
    if (outOfQuestions) lines.push(this.t('Hết câu hỏi rồi, cô tổng kết luôn nha.'));
    lines.push(best && best.score > 0 ? this.t(this.line('results', best.spoken, String(best.score))) : this.line0('resultsNobody'));
    if (this.weekLeader && this.round % 3 === 0) lines.push(this.t(this.line('weekBoard', this.weekLeader)));
    return lines;
  }

  // ---------- giờ ra chơi ----------
  private startRecess(now: number, forced?: RecessGame): Say[] {
    const choices = RECESS_GAMES.filter((g) => g !== this.lastRecess);
    let game = forced ?? choices[Math.floor(this.rand() * choices.length)];
    let callTarget: Student | null = null;
    let callQ: Question | null = null;
    if (game === 'callup') {
      // gọi 1 bạn đang ngồi lớp, vừa hoạt động trong 3 phút
      const active = this.seats().filter((s) => now - s.lastActive < 180_000 && s.spoken !== 'bạn');
      callTarget = active[Math.floor(this.rand() * active.length)] ?? null;
      // câu dễ chưa có trong tiết; bộ câu quá ít thì lấy đại 1 câu
      callQ = callTarget ? (this.pickOne('easy', this.roundQs, now) ?? this.bank[Math.floor(this.rand() * this.bank.length)] ?? null) : null;
      if (!callTarget || !callQ) game = 'roll';
    }
    this.lastRecess = game;
    this.recess = {
      game,
      stage: 'play',
      rps: new Map(),
      teacher: null,
      callTarget,
      callQ,
      callTiles: callQ ? scramble(callQ.answer, this.rand) : [],
      callResult: '',
      pick: PICK_TOPICS[Math.floor(this.rand() * PICK_TOPICS.length)],
      votes: new Map(),
      roll: [],
      hearts: 0,
    };
    this.setPhase('recess', now, GAME.recessPlaySec[game]);
    const out: Say[] = [this.line0('recessIntro')];
    const r = this.recess;
    if (game === 'rps') out.push(this.line0('rpsIntro'));
    if (game === 'callup') out.push(this.t(this.line('callUp', callTarget!.spoken)), this.t(`${callQ!.kind} ${callQ!.clue}`));
    if (game === 'pick') out.push(this.t(this.line('pickIntro', r.pick[0], r.pick[1])));
    if (game === 'roll') out.push(this.line0('rollIntro'));
    if (game === 'heart') out.push(this.t(this.line('heartIntro', String(GAME.heartTarget))));
    return out;
  }

  private recessChat(s: Student, e: ChatIn, now: number): Say[] {
    const r = this.recess;
    if (!r || r.stage !== 'play') return [];
    const word = plain(e.comment);
    if (r.game === 'rps' && word in RPS && !r.rps.has(s.username)) r.rps.set(s.username, word as Rps);
    if (r.game === 'pick' && (word === '1' || word === '2') && !r.votes.has(s.username)) r.votes.set(s.username, word === '1' ? 1 : 2);
    if (r.game === 'roll' && word === 'comat' && !r.roll.some((a) => a.username === s.username)) {
      r.roll.push({ username: s.username, nickname: s.nickname, avatar: s.avatar, createTime: e.createTime, seq: ++this.seq, points: GAME.rollPoints });
      r.roll.sort((a, b) => a.createTime - b.createTime || a.seq - b.seq);
    }
    if (r.game === 'callup' && r.callTarget?.username === s.username && this.isAttempt(r.callQ, e.comment)) {
      r.callResult = this.matches(r.callQ, e.comment) ? 'right' : 'wrong';
      this.phaseEndsAt = now; // trả lời rồi thì chốt luôn
    }
    return [];
  }

  private recessResult(now: number): Say[] {
    const r = this.recess!;
    r.stage = 'result';
    this.setPhase('recess', now, GAME.recessResultSec);
    const out: Say[] = [];
    if (r.game === 'rps') {
      if (r.rps.size === 0) return [this.line0('rpsNobody')];
      r.teacher = (Object.keys(RPS) as Rps[])[Math.floor(this.rand() * 3)];
      let win = 0;
      let lose = 0;
      for (const [u, p] of r.rps) {
        if (BEATS[p] === r.teacher) {
          win++;
          const s = this.students.get(u);
          if (s) this.award(s, GAME.rpsPoints, now, false);
        } else if (BEATS[r.teacher] === p) lose++;
      }
      const rest = win ? this.line('rpsWin', String(win)) : lose ? this.line('rpsLose', String(lose)) : 'Hòa cả lớp luôn.';
      out.push(this.t(this.line('rpsReveal', RPS[r.teacher], rest)));
    }
    if (r.game === 'callup') {
      const s = r.callTarget!;
      if (r.callResult === 'right') this.award(s, GAME.callUpPoints, now, false);
      if (r.callResult === '') r.callResult = 'silent';
      const key = r.callResult === 'right' ? 'callUpRight' : r.callResult === 'wrong' ? 'callUpWrong' : 'callUpSilent';
      out.push(this.t(this.line(key, s.spoken)));
      if (r.callResult !== 'right') out.push(this.t(`Đáp án là ${r.callQ!.answer.toLowerCase()}.`));
    }
    if (r.game === 'pick') {
      const one = [...r.votes.values()].filter((v) => v === 1).length;
      const two = r.votes.size - one;
      if (r.votes.size === 0) out.push(this.line0('pickNobody'));
      else if (one === two) out.push(this.line0('pickTie'));
      else {
        const [win, lose, n] = one > two ? [r.pick[0], r.pick[1], one] : [r.pick[1], r.pick[0], two];
        out.push(this.t(this.line('pickResult', win, String(Math.round((n / r.votes.size) * 100)))), this.t(this.line('pickRoast', lose)));
      }
    }
    if (r.game === 'roll') {
      const first = r.roll.slice(0, GAME.rollWinners);
      for (const a of first) {
        const s = this.students.get(a.username);
        if (s) this.award(s, GAME.rollPoints, now, false);
      }
      const names = first.slice(0, 3).map((a) => this.students.get(a.username)?.spoken ?? 'bạn');
      out.push(first.length ? this.t(this.line('rollResult', names.join(', '))) : this.line0('rollNobody'));
    }
    if (r.game === 'heart') {
      if (r.hearts >= GAME.heartTarget) {
        for (const s of this.students.values()) if (now - s.lastActive < 600_000) this.award(s, 1, now, false);
        out.push(this.line0('heartWin'));
        this.clapUntil = now + GAME.clapSec * 1000;
      } else out.push(this.t(this.line('heartFail', String(r.hearts))));
    }
    return [...out, ...this.checkMonitor()];
  }

  private recessBoard(now: number): Say[] {
    this.recess!.stage = 'board';
    this.setPhase('recess', now, GAME.recessBoardSec);
    const top = this.sessionTop(1)[0];
    return top ? [this.t(this.line('sessionBoard', top.spoken, String(top.session)))] : [];
  }

  newRound(now: number): Say[] {
    this.round++;
    this.qNo = 0;
    this.q = null;
    this.correct = [];
    this.recess = null;
    for (const s of this.students.values()) {
      s.score = 0;
      s.streak = 0;
      s.reachedAt = 0;
    }
    this.pickRound(now);
    this.setPhase('intro', now, GAME.introSec);
    return [this.line0('intro')];
  }

  /** Bỏ qua phần đang chạy (nút "Qua phần tiếp" ở trang điều khiển) */
  skip(now: number): Say[] {
    this.phaseEndsAt = now;
    return this.tick(now);
  }

  /** Nút "Ra chơi ngay" ở trang điều khiển: chơi luôn 1 trò */
  forceRecess(game: RecessGame, now: number): Say[] {
    return this.startRecess(now, game);
  }

  tick(now: number): Say[] {
    const extra: Say[] = [];
    // lớp im quá lâu: cô nhắc 1 câu
    if (now - this.lastChatAt > GAME.idleAfterSec * 1000 && now - this.lastIdleAt > GAME.idleAfterSec * 1000) {
      this.lastIdleAt = now;
      extra.push(this.line0('idle'));
    }
    if (this.phase === 'question' && !this.quietSaid && this.correct.length === 0 && now - this.phaseStartedAt > GAME.questionSec * 500) {
      this.quietSaid = true;
      if (this.rand() < 0.5) extra.push(this.line0('quietHalfway'));
    }
    if (now < this.phaseEndsAt) return extra;
    return [...extra, ...this.advance(now)];
  }

  private advance(now: number): Say[] {
    switch (this.phase) {
      case 'intro':
        return this.startQuestion(now);
      case 'question':
        if (this.correct.length === 0 && !this.bonusUsed) {
          this.bonusUsed = true;
          this.revealOne();
          this.setPhase('bonus', now, GAME.bonusSec);
          return [this.line0('bonus')];
        }
        return this.reveal(now);
      case 'bonus':
        return this.reveal(now);
      case 'reveal':
        return this.qNo >= this.roundQs.length ? this.startResults(now) : this.startQuestion(now);
      case 'results':
        return this.startRecess(now);
      case 'recess':
        if (this.recess?.stage === 'play') return this.recessResult(now);
        if (this.recess?.stage === 'result') return this.recessBoard(now);
        return this.newRound(now);
    }
  }

  /** Ảnh chụp trạng thái để vẽ (gọn, gửi được qua mạng cho trang điều khiển xem trước) */
  view(now: number) {
    const showAnswer = this.phase === 'reveal';
    const asking = this.phase === 'question' || this.phase === 'bonus' || this.phase === 'reveal';
    const seated = this.seats(GAME.seats + GAME.standing);
    const titles = new Map(this.sessionTop(3).map((s, i) => [s.username, i === 0 ? 'lop-truong' : 'lop-pho']));
    const pub = ({ username, nickname, avatar, girl, score, session, lastActive, joinedAt }: Student) => ({
      username,
      nickname,
      avatar,
      girl,
      score,
      session,
      lastActive,
      joinedAt,
      title: titles.get(username) ?? '',
      // câu đang hỏi: trả lời đúng / sai / chưa (ngoài giờ hỏi thì không hiện)
      answered: !asking ? '' : this.correct.some((a) => a.username === username) ? 'right' : this.wrong.has(username) ? 'wrong' : '',
    });
    const r = this.recess;
    return {
      phase: this.phase,
      round: this.round,
      qNo: this.qNo,
      total: this.roundQs.length,
      golden: this.golden,
      endsAt: this.phaseEndsAt,
      clue: this.q?.clue ?? '',
      kind: this.q?.kind ?? '',
      category: this.q?.category ?? '',
      answer: this.phase === 'recess' ? (r?.callQ?.answer ?? '') : (this.q?.answer ?? ''),
      tiles: this.tiles,
      slots: this.slots(showAnswer),
      correctTop: this.correct.slice(0, 3).map(({ username, nickname, avatar, points }) => ({ username, nickname, avatar, points })),
      correctCount: this.correct.length,
      seats: seated.slice(0, GAME.seats).map(pub),
      standing: seated.slice(GAME.seats).map(pub), // không có ghế: đứng ngoài cửa hóng, vẫn tính điểm
      sessionTop: this.sessionTop(5).map(({ username, nickname, session }) => ({ username, nickname, session })),
      classSize: this.students.size,
      stats: this.stats,
      flowers: this.flowers,
      lastFlowerAt: this.lastFlowerAt,
      clapping: now < this.clapUntil,
      recess: r && {
        game: r.game,
        stage: r.stage,
        rpsCounts: (Object.keys(RPS) as Rps[]).map((k) => [...r.rps.values()].filter((v) => v === k).length),
        teacher: r.teacher ? RPS[r.teacher] : '',
        callName: r.callTarget?.nickname ?? '',
        callUser: r.callTarget?.username ?? '',
        callClue: r.callQ ? `${r.callQ.kind} ${r.callQ.clue}` : '',
        callTiles: r.callTiles,
        callSlots: this.slotsOf(r.callQ, new Set(), r.stage !== 'play'),
        callResult: r.callResult,
        pick: r.pick,
        votes: [[...r.votes.values()].filter((v) => v === 1).length, [...r.votes.values()].filter((v) => v === 2).length],
        roll: r.roll.slice(0, GAME.rollWinners).map((a) => a.nickname),
        hearts: r.hearts,
        heartTarget: GAME.heartTarget,
      },
    };
  }
}

export type ClassView = ReturnType<Classroom['view']>;
