import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { GameState, StageView } from './useGame';
import { GAME } from './config';
import { Hair } from './Hair';
import './stage.css';

/**
 * Màn hình lớp học 1080x1920. Nền là ảnh public/assets/bg/lop.webp (941x1672 phóng lên 1080 ngang),
 * nên mọi toạ độ dưới đây = toạ độ trên ảnh gốc x K.
 */
const K = 1080 / 941;

// 4 dãy bàn trên cùng: mép trên mặt bàn (y) và tâm từng bàn (x), đo trên ảnh nền gốc
const ROWS = [
  { y: 815, xs: [170, 322, 471, 620, 768], s: 0.92 },
  { y: 945, xs: [148, 310, 473, 636, 796], s: 0.98 },
  { y: 1097, xs: [125, 300, 476, 648, 822], s: 1.04 },
  { y: 1257, xs: [113, 296, 479, 661, 840], s: 1.1 },
];
const SPRITE_H = 250; // chiều cao cả người
const SHOW = 0.5; // ngồi ghế: chỉ hiện phần trên (đầu tới hông)
// khung đầu đã xoá khỏi ảnh thân sau lưng, tính theo tỉ lệ ảnh (tools/tach-nen.py ghi ra public/assets/nv/*/head.json)
const HEAD = { nam: { x: 0.136, y: 0, w: 0.682, h: 0.284 }, nu: { x: 0.174, y: 0, w: 0.668, h: 0.248 } };
// người không có ghế chen chúc 2 bên ngoài cửa lớp: [tâm x, chân y] (px stage), hàng trước (gần lớp) trước
const CROWD_ROWS = 10;
const STAND: [number, number][] = [];
for (let r = 0; r < CROWD_ROWS; r++) {
  const foot = 960 - r * 42;
  for (let c = 0; c < 3; c++) {
    const dx = c * 40 + (r % 2) * 20 + ((r * 7 + c * 13) % 9) - 4; // so le + lệch nhẹ cho giống đám đông
    STAND.push([18 + dx, foot], [1062 - dx, foot]);
  }
}
const NAMED_STANDING = 6; // chỉ hiện tên vài bạn đứng trước, còn lại để đám đông cho gọn

const POSE = {
  nam: { dung: '01-dung', tay: '02-giong-tay', nghi: '03-suy-nghi', vui: '05-vui-mung', buon: '06-buon', ngac: '07-ngac-nhien', chao: '08-vay-chao' },
  nu: { dung: '01-dung', tay: '02-giong-tay', nghi: '03-suy-nghi', vui: '05-vui-mung', buon: '06-buon', ngac: '07-ngac-nhien', chao: '08-vay-chao' },
};
type PoseKey = keyof typeof POSE.nam;

// tải trước mọi tư thế để đổi tư thế không bị nháy trắng
const ALL_IMGS = [
  ...Object.values(POSE.nam).map((p) => `/assets/nv/nam/${p}.webp`),
  ...Object.values(POSE.nu).map((p) => `/assets/nv/nu/${p}.webp`),
  ...['01-dung', '02-giang-bai', '03-chi-trai', '04-chi-phai', '05-vui', '06-buon', '07-suy-nghi', '08-vay-chao'].map((p) => `/assets/nv/co-giao/${p}.webp`),
];

function useNow(ms = 250) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export function GameStage({ game }: { game: GameState }) {
  const now = useNow();
  useEffect(() => {
    for (const src of ALL_IMGS) new Image().src = src;
  }, []);
  const v = game.view;
  if (!v) {
    return (
      <div className="flex h-full items-center justify-center bg-black/60 p-20 text-center text-[48px] text-white">
        Chưa mở trang stage (lvh.me:3000/?view=stage) nên chưa có gì để xem trước
      </div>
    );
  }
  return (
    <div className={`relative h-full w-full overflow-hidden ${v.clapping ? 'class-clap' : ''}`}>
      <Header v={v} name={game.channelName} />
      <Motto />
      <Board v={v} now={now} />
      <Teacher v={v} now={now} />
      <Podium v={v} />
      <Students v={v} now={now} />
      <Standing v={v} now={now} />
      <GiftBanner gift={game.lastGift} now={now} />
      {v.clapping && <Claps />}
    </div>
  );
}

function Header({ v, name }: { v: StageView; name: string }) {
  const sub = v.phase === 'recess' ? 'Giờ ra chơi' : v.qNo > 0 && v.phase !== 'results' ? `Tiết ${v.round} · Câu ${v.qNo}/${v.total}` : `Tiết ${v.round}`;
  return (
    <div className="absolute left-1/2 top-[14px] flex w-[470px] -translate-x-1/2 flex-col items-center rounded-[28px] border-[5px] border-[#7a4a1d] bg-[#f6e3b4] px-6 py-3 shadow-[0_8px_0_#5b3512]">
      <div className="max-w-full truncate font-extrabold leading-none tracking-wide text-[#7a2e0e]" style={{ fontSize: name.length > 14 ? 34 : 46 }}>
        {name.toUpperCase()}
      </div>
      <div className="mt-1 text-[26px] font-semibold text-[#6b4a22]">
        {sub} · {v.classSize} bạn
      </div>
    </div>
  );
}

// ---------- Bảng đen ----------
function Board({ v, now }: { v: StageView; now: number }) {
  const left = Math.max(0, Math.ceil((v.endsAt - now) / 1000));
  return (
    <div className={`chalk absolute left-[350px] top-[262px] h-[348px] w-[555px] text-[#f4f1e6] ${v.golden && v.phase !== 'recess' ? 'golden-board' : ''}`}>
      {v.phase === 'intro' && v.round % 2 === 0 && v.weekTop.length > 0 && <WeekBoard v={v} left={left} />}
      {v.phase === 'intro' && !(v.round % 2 === 0 && v.weekTop.length > 0) && (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <div className="text-[64px] leading-none">Sắp vào học!</div>
          <div className="mt-6 text-[36px] leading-snug">
            Cô xáo chữ, cả lớp đoán từ.
            <br />
            Gõ đáp án vào <b className="text-[#ffe680]">bình luận</b>
            <br />
            Nhanh nhất <b className="text-[#ffe680]">+10 điểm</b>
          </div>
          <div className="mt-4 text-[30px] opacity-80">Bắt đầu sau {left} giây</div>
        </div>
      )}

      {(v.phase === 'question' || v.phase === 'bonus' || v.phase === 'reveal') && (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between">
            {v.golden ? (
              <span className="rounded-full bg-[#ffd84a] px-4 text-[28px] font-bold text-[#7a2e0e]">⭐ CÂU HỎI VÀNG x2</span>
            ) : (
              <span className="rounded-full border-2 border-[#f4f1e6]/60 px-4 text-[26px]">{v.category}</span>
            )}
            {v.phase !== 'reveal' ? <Timer left={left} /> : <span className="text-[34px] text-[#9df29d]">Đáp án</span>}
          </div>
          <div className="mt-2 line-clamp-2 min-h-[96px] shrink-0 text-center text-[38px] leading-[48px]">{v.clue}</div>
          <Tiles letters={v.tiles} dim={v.phase === 'reveal'} />
          <Slots slots={v.slots} reveal={v.phase === 'reveal'} />
          {v.phase === 'bonus' && <div className="mt-auto text-center text-[28px] text-[#ffe680]">Cô mở thêm 1 chữ, thêm 10 giây!</div>}
        </div>
      )}

      {v.phase === 'results' && <Results v={v} />}
      {v.phase === 'recess' && v.recess && <Recess v={v} left={left} />}
    </div>
  );
}

function Timer({ left }: { left: number }) {
  const urgent = left <= 5;
  return (
    <motion.div
      key={urgent ? left : 'calm'}
      initial={urgent ? { scale: 1.35 } : false}
      animate={{ scale: 1 }}
      className={`flex h-[64px] min-w-[64px] items-center justify-center rounded-full border-4 px-2 text-[40px] leading-none ${urgent ? 'border-[#ff8a7a] text-[#ff8a7a]' : 'border-[#f4f1e6]'}`}
    >
      {left}
    </motion.div>
  );
}

function Tiles({ letters, dim }: { letters: string[]; dim: boolean }) {
  const n = letters.length || 1;
  const size = Math.min(76, Math.floor((555 - 8 * (n - 1)) / n));
  return (
    <div className={`mt-3 flex justify-center gap-2 ${dim ? 'opacity-40' : ''}`}>
      {letters.map((ch, i) => (
        <motion.div
          key={`${i}${ch}`}
          initial={{ y: -30, opacity: 0, rotate: -8 }}
          animate={{ y: 0, opacity: 1, rotate: ((i * 37) % 9) - 4 }}
          transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 18 }}
          className="tile flex items-center justify-center font-extrabold"
          style={{ width: size, height: size * 1.1, fontSize: size * 0.62 }}
        >
          {ch}
        </motion.div>
      ))}
    </div>
  );
}

function Slots({ slots, reveal }: { slots: (string | null)[]; reveal: boolean }) {
  const n = slots.length || 1;
  const size = Math.min(56, Math.floor((555 - 6 * (n - 1)) / n));
  return (
    <div className="mt-4 flex justify-center gap-[6px]">
      {slots.map((ch, i) =>
        ch === ' ' ? (
          <div key={i} style={{ width: size * 0.5 }} />
        ) : (
          <div
            key={i}
            className={`flex items-end justify-center border-b-4 ${reveal ? 'border-[#9df29d] text-[#9df29d]' : 'border-[#f4f1e6]'}`}
            style={{ width: size, height: size, fontSize: size * 0.8, lineHeight: 1 }}
          >
            {ch ?? ''}
          </div>
        ),
      )}
    </div>
  );
}

function Results({ v }: { v: StageView }) {
  const top = v.seats.filter((s) => s.score > 0).slice(0, 5);
  return (
    <div className="flex h-full flex-col items-center">
      <div className="text-[56px] leading-none text-[#ffe680]">Bảng vàng tiết {v.round}</div>
      {top.length === 0 && <div className="mt-16 text-[38px]">Chưa ai ghi điểm</div>}
      <div className="mt-4 w-full space-y-1">
        {top.map((s, i) => (
          <motion.div
            key={s.username}
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.25 }}
            className="flex items-center gap-3 px-6 text-[40px]"
          >
            <span className="w-12 text-[#ffe680]">{['🥇', '🥈', '🥉', '4', '5'][i]}</span>
            <span className="flex-1 truncate">{s.nickname}</span>
            <span>{s.score}đ</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ---------- Giờ ra chơi ----------
const RECESS_TITLE = { rps: 'Oẳn tù tì với cô', callup: 'Kiểm tra miệng', pick: 'Chọn phe', roll: 'Điểm danh siêu tốc', heart: 'Thả tim cả lớp' };

function Recess({ v, left }: { v: StageView; left: number }) {
  const r = v.recess!;
  if (r.stage === 'board') return <SessionBoard v={v} />;
  const playing = r.stage === 'play';
  return (
    <div className="flex h-full flex-col items-center text-center">
      <div className="flex w-full items-center justify-between">
        <span className="rounded-full bg-[#ffd84a] px-4 text-[26px] font-bold text-[#7a2e0e]">
          🔔 Giờ ra chơi{r.game === 'callup' ? ` · ${RECESS_TITLE.callup}` : ''}
        </span>
        {playing && <Timer left={left} />}
      </div>
      {r.game !== 'callup' && <div className="mt-1 shrink-0 text-[48px] leading-tight text-[#ffe680]">{RECESS_TITLE[r.game]}</div>}
      {r.game === 'rps' && (
        <>
          <div className="mt-3 flex w-full justify-center gap-6 text-[34px]">
            {[
              ['✊', 'búa'],
              ['✌️', 'kéo'],
              ['✋', 'bao'],
            ].map(([icon, word], i) => (
              <div key={word} className={`w-[150px] rounded-2xl border-2 py-2 ${r.teacher === word ? 'border-[#ffd84a] bg-white/15' : 'border-white/30'}`}>
                <div className="text-[56px] leading-none">{icon}</div>
                <div>{word}</div>
                <div className="text-[30px] text-[#9df29d]">{r.rpsCounts[i]}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[32px]">{playing ? 'Gõ: búa, kéo hoặc bao' : r.teacher ? `Cô ra: ${r.teacher}` : 'Không ai chơi'}</div>
        </>
      )}
      {r.game === 'callup' && (
        <>
          <div className="mt-1 max-w-full shrink-0 truncate text-[36px] text-[#ffe680]">📢 {r.callName} lên bảng!</div>
          <div className="line-clamp-2 shrink-0 text-[30px] leading-[36px]">{r.callClue}</div>
          <Tiles letters={r.callTiles} dim={!playing} />
          <Slots slots={r.callSlots} reveal={!playing} />
          {!playing && (
            <div className="mt-1 text-[34px]">{r.callResult === 'right' ? '✅ Đúng! +5 điểm' : r.callResult === 'wrong' ? '❌ Sai mất rồi' : '💤 Không trả lời'}</div>
          )}
        </>
      )}
      {r.game === 'pick' && (
        <div className="mt-4 w-full space-y-4 px-4">
          {r.pick.map((label, i) => {
            const total = r.votes[0] + r.votes[1] || 1;
            const pct = Math.round((r.votes[i] / total) * 100);
            return (
              <div key={label} className="relative h-[70px] overflow-hidden rounded-2xl border-2 border-white/40 text-left">
                <div className="absolute inset-y-0 left-0 bg-[#ffd84a]/35 transition-all duration-500" style={{ width: `${pct}%` }} />
                <div className="relative flex h-full items-center justify-between px-4 text-[36px]">
                  <span>
                    Gõ <b className="text-[#ffe680]">{i + 1}</b>: {label}
                  </span>
                  <span>{r.votes[i]}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {r.game === 'roll' && (
        <>
          <div className="text-[34px]">
            Gõ <b className="text-[#ffe680]">CÓ MẶT</b> thật nhanh, 10 bạn đầu +3
          </div>
          <div className="mt-2 grid w-full grid-cols-2 gap-x-6 px-6 text-left text-[28px]">
            {r.roll.map((n, i) => (
              <div key={i} className="truncate">
                {i + 1}. {n}
              </div>
            ))}
          </div>
        </>
      )}
      {r.game === 'heart' && (
        <>
          <div className="mt-4 text-[90px] leading-none">❤️</div>
          <div className="mt-2 h-[40px] w-[460px] overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-[#ff5d8f] transition-all duration-300" style={{ width: `${Math.min(100, (r.hearts / r.heartTarget) * 100)}%` }} />
          </div>
          <div className="mt-2 text-[36px]">
            {r.hearts}/{r.heartTarget} tim
          </div>
        </>
      )}
    </div>
  );
}

function SessionBoard({ v }: { v: StageView }) {
  return (
    <div className="flex h-full flex-col items-center">
      <div className="text-[48px] leading-none text-[#ffe680]">Học sinh giỏi hôm nay</div>
      {v.sessionTop.length === 0 && <div className="mt-16 text-[36px]">Chưa ai có điểm</div>}
      <div className="mt-3 w-full space-y-1">
        {v.sessionTop.map((s, i) => (
          <motion.div
            key={s.username}
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.2 }}
            className="flex items-center gap-3 px-6 text-[36px]"
          >
            <span className="w-[150px] text-[26px] text-[#ffe680]">{i === 0 ? '👑 Lớp trưởng' : i < 3 ? '⭐ Lớp phó' : `${i + 1}`}</span>
            <span className="flex-1 truncate">{s.nickname}</span>
            <span>{s.session}đ</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function WeekBoard({ v, left }: { v: StageView; left: number }) {
  return (
    <div className="flex h-full flex-col items-center">
      <div className="text-[48px] leading-none text-[#ffe680]">Bảng vàng tuần này</div>
      <div className="mt-3 w-full space-y-1">
        {v.weekTop.slice(0, 5).map((s, i) => (
          <div key={s.username} className="flex items-center gap-3 px-6 text-[36px]">
            <span className="w-12 text-[#ffe680]">{['🥇', '🥈', '🥉', '4', '5'][i]}</span>
            <span className="flex-1 truncate">{s.nickname}</span>
            <span>{s.points}đ</span>
          </div>
        ))}
      </div>
      <div className="mt-auto text-[28px] opacity-80">Vào tiết sau {left} giây</div>
    </div>
  );
}

// ---------- Cô giáo ----------
function Teacher({ v, now }: { v: StageView; now: number }) {
  let pose = '01-dung';
  if (now - v.lastFlowerAt < 3000) pose = '05-vui';
  else if (v.phase === 'intro') pose = '08-vay-chao';
  else if (v.phase === 'question') pose = '04-chi-phai';
  else if (v.phase === 'bonus') pose = '07-suy-nghi';
  else if (v.phase === 'reveal') pose = v.correctCount > 0 ? '05-vui' : '06-buon';
  else if (v.phase === 'results') pose = '02-giang-bai';
  else if (v.phase === 'recess') pose = v.recess?.stage === 'play' ? '08-vay-chao' : v.recess?.stage === 'result' ? '05-vui' : '03-chi-trai';
  const gotFlower = now - v.lastFlowerAt < 3000;
  return (
    <div className="absolute left-[96px] top-[410px] h-[490px] w-[300px]">
      <img src={`/assets/nv/co-giao/${pose}.webp`} className="h-full w-full object-contain object-bottom drop-shadow-[0_10px_8px_rgba(0,0,0,0.25)]" />
      <AnimatePresence>
        {gotFlower && (
          <motion.div
            key={v.lastFlowerAt}
            initial={{ scale: 0, y: 80 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute left-[130px] top-[150px] text-[80px]"
          >
            💐
          </motion.div>
        )}
      </AnimatePresence>
      {v.flowers > 0 && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-4 py-1 text-[24px] font-bold text-pink-600 shadow">
          💐 {v.flowers} bó hoa
        </div>
      )}
    </div>
  );
}

// ---------- Ai nhanh nhất câu này ----------
function Podium({ v }: { v: StageView }) {
  if (v.phase !== 'question' && v.phase !== 'bonus' && v.phase !== 'reveal') return null;
  return (
    <div className="absolute left-[330px] top-[636px] w-[600px]">
      <div className="flex items-center justify-between rounded-t-[20px] bg-[#7a2e0e] px-5 py-1 text-[26px] font-bold text-[#ffe9b8]">
        <span>⚡ Nhanh nhất</span>
        <span>{v.correctCount} bạn đã đúng</span>
      </div>
      <div className="flex h-[74px] items-center gap-2 rounded-b-[20px] bg-[#fff6dd]/95 px-3 shadow-lg">
        {v.correctTop.length === 0 && <div className="w-full text-center text-[28px] text-[#8a6a3a]">Chưa ai đoán ra…</div>}
        <AnimatePresence initial={false}>
          {v.correctTop.map((a, i) => (
            <motion.div
              key={a.username}
              layout
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex w-1/3 min-w-0 items-center gap-1 text-[24px] text-[#4a2c0e]"
            >
              <span className="text-[30px]">{['🥇', '🥈', '🥉'][i]}</span>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate font-semibold">{a.nickname}</div>
                <div className="font-extrabold text-[#c2410c]">+{a.points}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------- Học sinh ----------
function studentPose(s: StageView['seats'][number], v: StageView, rank: number, now: number): PoseKey {
  if (v.clapping) return 'vui';
  if (now - s.joinedAt < 3000) return 'chao';
  const asking = v.phase === 'question' || v.phase === 'bonus';
  if (s.answered === 'right') return 'vui';
  if (s.answered === 'wrong') return asking ? 'buon' : 'ngac';
  if (asking) return now - s.lastActive < 2500 ? 'tay' : 'nghi';
  if (v.phase === 'results' && rank < 3 && s.score > 0) return 'vui';
  return now - s.lastActive < 2500 ? 'tay' : 'dung';
}

function Students({ v, now }: { v: StageView; now: number }) {
  return (
    <>
      {v.seats.map((s, i) => {
        const row = ROWS[Math.floor(i / 5)];
        const scale = row.s;
        const w = SPRITE_H * 0.47 * scale;
        const h = SPRITE_H * scale;
        const show = h * SHOW;
        const x = row.xs[i % 5] * K - w / 2;
        const y = (row.y + 72) * K - show; // ngồi trên ghế, lưng quay ra khán giả, mặt nhìn lên bảng
        const pose = studentPose(s, v, i, now);
        const g = s.girl ? 'nu' : 'nam';
        const hd = HEAD[g];
        const called = v.recess?.game === 'callup' && v.recess.callUser === s.username;
        return (
          <motion.div
            key={s.username}
            initial={{ opacity: 0, left: x, top: y + 40 }}
            animate={{ opacity: 1, left: x, top: y }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            className={`absolute ${called ? 'called-up' : ''}`}
            style={{ width: w, height: show, zIndex: 10 + Math.floor(i / 5) }}
          >
            <div className="absolute inset-0 overflow-hidden">
              <img src={`/assets/nv/${g}/sau-${POSE[g][pose]}.webp`} style={{ width: w, height: h }} className="max-w-none" />
              <div className="absolute" style={{ left: hd.x * w, top: hd.y * h, width: hd.w * w, height: hd.h * h }}>
                <Hair username={s.username} girl={s.girl} />
              </div>
            </div>
            {s.answered === 'right' && <div className="badge bg-[#16a34a]">✓</div>}
            {s.answered === 'wrong' && <div className="badge bg-[#dc2626]">✗</div>}
            <div className="nametag" style={{ fontSize: 19 * scale }}>
              {i < 5 && s.score > 0 && <span className="rank">{i + 1}</span>}
              {s.title && <span className="mr-1">{s.title === 'lop-truong' ? '👑' : '⭐'}</span>}
              {called && <span className="mr-1">📢</span>}
              <span className="truncate">{s.nickname}</span>
              {s.score > 0 && <b className="ml-1 text-[#c2410c]">{s.score}</b>}
            </div>
          </motion.div>
        );
      })}
    </>
  );
}

// Hết ghế: chen chúc đứng ngoài 2 bên cửa nhìn vào, vẫn tính điểm; chỉ vài bạn đứng đầu có bảng tên
function Standing({ v, now }: { v: StageView; now: number }) {
  return (
    <>
      {v.standing.slice(0, STAND.length).map((s, i) => {
        const [cx, foot] = STAND[i];
        const H = 100 + (foot - 540) * 0.12; // xa thì nhỏ
        const w = H * 0.47;
        const g = s.girl ? 'nu' : 'nam';
        const pose = studentPose(s, v, GAME.seats + i, now);
        return (
          <motion.div
            key={s.username}
            initial={{ opacity: 0, left: cx - w / 2, top: foot - H + 30 }}
            animate={{ opacity: 1, left: cx - w / 2, top: foot - H }}
            className="absolute"
            style={{ width: w, height: H, zIndex: Math.floor(foot / 20) }}
          >
            <img src={`/assets/nv/${g}/${POSE[g][pose]}.webp`} className="h-full w-full drop-shadow-[0_3px_2px_rgba(0,0,0,0.3)]" />
            {s.answered === 'right' && <div className="badge bg-[#16a34a]" style={{ width: 20, height: 20, fontSize: 13, right: 0 }}>✓</div>}
            {i < NAMED_STANDING && (
              <div className="nametag" style={{ fontSize: 14, maxWidth: 104, bottom: 'calc(100% - 2px)', zIndex: 60 }}>
                {s.title && <span className="mr-1">{s.title === 'lop-truong' ? '👑' : '⭐'}</span>}
                <span className="truncate">{s.nickname}</span>
                {s.score > 0 && <b className="ml-1 text-[#c2410c]">{s.score}</b>}
              </div>
            )}
          </motion.div>
        );
      })}
    </>
  );
}

// Bảng khẩu hiệu đỏ trên bảng đen
function Motto() {
  return (
    <div className="motto absolute left-1/2 top-[168px] -translate-x-1/2 whitespace-nowrap px-10 py-[6px] text-[38px] font-extrabold tracking-wider">
      TIÊN HỌC LỄ – HẬU HỌC VĂN
    </div>
  );
}

function GiftBanner({ gift, now }: { gift: GameState['lastGift']; now: number }) {
  const show = gift && now - gift.at < 4000;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={gift.at}
          initial={{ opacity: 0, y: -30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          className="absolute left-[24px] top-[220px] z-50 max-w-[560px] rounded-[26px] bg-gradient-to-r from-pink-500 to-rose-400 px-6 py-3 text-[30px] font-bold text-white shadow-xl"
        >
          💐 <span className="inline-block max-w-[300px] truncate align-bottom">{gift.nickname}</span> tặng cô {gift.repeatCount > 1 ? `${gift.repeatCount} × ` : ''}
          {gift.giftName}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Claps() {
  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      {Array.from({ length: 14 }, (_, i) => (
        <motion.div
          key={i}
          initial={{ y: 1500, opacity: 0 }}
          animate={{ y: 700, opacity: [0, 1, 0] }}
          transition={{ duration: 2.2, delay: (i % 7) * 0.25, repeat: Infinity }}
          className="absolute text-[70px]"
          style={{ left: 60 + i * 70 }}
        >
          👏
        </motion.div>
      ))}
    </div>
  );
}
