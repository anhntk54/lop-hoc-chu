import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { GameState } from './useGame';
import type { ClassView } from './quiz';
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
// người không có ghế đứng 2 bên cửa lớp: tâm x và chân y (px stage)
const STAND = [
  [34, 610], [86, 660], [34, 735], [86, 785], [34, 860], [86, 910],
  [1046, 610], [994, 660], [1046, 735], [994, 785], [1046, 860], [994, 910],
];

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
      <Header v={v} />
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

function Header({ v }: { v: ClassView }) {
  return (
    <div className="absolute left-1/2 top-[14px] flex w-[470px] -translate-x-1/2 flex-col items-center rounded-[28px] border-[5px] border-[#7a4a1d] bg-[#f6e3b4] px-6 py-3 shadow-[0_8px_0_#5b3512]">
      <div className="text-[46px] font-extrabold leading-none tracking-wide text-[#7a2e0e]">{GAME.title}</div>
      <div className="mt-1 text-[26px] font-semibold text-[#6b4a22]">
        {v.qNo > 0 && v.phase !== 'results' ? `Câu ${v.qNo}/${v.total} · ` : ''}
        {v.classSize} bạn trong lớp
      </div>
    </div>
  );
}

// ---------- Bảng đen ----------
function Board({ v, now }: { v: ClassView; now: number }) {
  const left = Math.max(0, Math.ceil((v.endsAt - now) / 1000));
  return (
    <div className="chalk absolute left-[350px] top-[262px] h-[348px] w-[555px] text-[#f4f1e6]">
      {v.phase === 'intro' && (
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
            <span className="rounded-full border-2 border-[#f4f1e6]/60 px-4 text-[26px]">{v.category}</span>
            {v.phase !== 'reveal' ? <Timer left={left} /> : <span className="text-[34px] text-[#9df29d]">Đáp án</span>}
          </div>
          <div className="mt-2 line-clamp-2 min-h-[96px] text-center text-[38px] leading-[48px]">{v.clue}</div>
          <Tiles letters={v.tiles} dim={v.phase === 'reveal'} />
          <Slots slots={v.slots} reveal={v.phase === 'reveal'} />
          {v.phase === 'bonus' && <div className="mt-auto text-center text-[28px] text-[#ffe680]">Cô mở thêm 1 chữ, thêm 10 giây!</div>}
        </div>
      )}

      {v.phase === 'results' && <Results v={v} />}
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

function Results({ v }: { v: ClassView }) {
  const top = v.seats.filter((s) => s.score > 0).slice(0, 5);
  return (
    <div className="flex h-full flex-col items-center">
      <div className="text-[56px] leading-none text-[#ffe680]">Bảng vàng ván {v.round}</div>
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

// ---------- Cô giáo ----------
function Teacher({ v, now }: { v: ClassView; now: number }) {
  let pose = '01-dung';
  if (now - v.lastFlowerAt < 3000) pose = '05-vui';
  else if (v.phase === 'intro') pose = '08-vay-chao';
  else if (v.phase === 'question') pose = '04-chi-phai';
  else if (v.phase === 'bonus') pose = '07-suy-nghi';
  else if (v.phase === 'reveal') pose = v.correctCount > 0 ? '05-vui' : '06-buon';
  else if (v.phase === 'results') pose = '02-giang-bai';
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
function Podium({ v }: { v: ClassView }) {
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
function studentPose(s: ClassView['seats'][number], v: ClassView, rank: number, now: number): PoseKey {
  if (v.clapping) return 'vui';
  if (now - s.joinedAt < 3000) return 'chao';
  const asking = v.phase === 'question' || v.phase === 'bonus';
  if (s.answered === 'right') return 'vui';
  if (s.answered === 'wrong') return asking ? 'buon' : 'ngac';
  if (asking) return now - s.lastActive < 2500 ? 'tay' : 'nghi';
  if (v.phase === 'results' && rank < 3 && s.score > 0) return 'vui';
  return now - s.lastActive < 2500 ? 'tay' : 'dung';
}

function Students({ v, now }: { v: ClassView; now: number }) {
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
        return (
          <motion.div
            key={s.username}
            initial={{ opacity: 0, left: x, top: y + 40 }}
            animate={{ opacity: 1, left: x, top: y }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            className="absolute"
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
              <span className="truncate">{s.nickname}</span>
              {s.score > 0 && <b className="ml-1 text-[#c2410c]">{s.score}</b>}
            </div>
          </motion.div>
        );
      })}
    </>
  );
}

// Hết ghế: đứng ngoài 2 bên cửa nhìn vào (mặt hướng ra ngoài), vẫn có tên và điểm
function Standing({ v, now }: { v: ClassView; now: number }) {
  const H = 150;
  return (
    <>
      {v.standing.map((s, i) => {
        const [cx, foot] = STAND[i];
        const w = H * 0.47;
        const g = s.girl ? 'nu' : 'nam';
        const pose = studentPose(s, v, GAME.seats + i, now);
        return (
          <motion.div
            key={s.username}
            initial={{ opacity: 0, left: cx - w / 2, top: foot - H + 30 }}
            animate={{ opacity: 1, left: cx - w / 2, top: foot - H }}
            className="absolute"
            style={{ width: w, height: H, zIndex: 5 + Math.floor(foot / 10) }}
          >
            <img src={`/assets/nv/${g}/${POSE[g][pose]}.webp`} className="h-full w-full drop-shadow-[0_4px_3px_rgba(0,0,0,0.3)]" />
            {s.answered === 'right' && <div className="badge bg-[#16a34a]" style={{ width: 24, height: 24, fontSize: 15 }}>✓</div>}
            <div className="nametag" style={{ fontSize: 14, maxWidth: 110, bottom: 'calc(100% - 2px)' }}>
              <span className="truncate">{s.nickname}</span>
              {s.score > 0 && <b className="ml-1 text-[#c2410c]">{s.score}</b>}
            </div>
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
