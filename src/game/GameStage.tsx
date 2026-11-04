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

// Bàn dài + ghế băng vẽ đè lên dãy bàn lẻ trong ảnh nền (đo trên ảnh gốc): mép trên mặt bàn y, mép dưới b, 2 đầu bàn x1..x2.
// n = số bạn ngồi mỗi dãy (chủ kênh chốt 2026-11-04: 7–8 bạn một dãy, các bạn nhỏ lại một chút). Dãy cuối nằm dưới giao diện TikTok nên để trống.
const ROWS = [
  { y: 812, b: 922, x1: 100, x2: 838, n: GAME.rowSeats[0], s: 0.92 },
  { y: 942, b: 1069, x1: 72, x2: 870, n: GAME.rowSeats[1], s: 0.98 },
  { y: 1093, b: 1232, x1: 45, x2: 902, n: GAME.rowSeats[2], s: 1.04 },
  { y: 1253, b: 1414, x1: 28, x2: 922, n: GAME.rowSeats[3], s: 1.1 },
  { y: 1458, b: 1646, x1: 5, x2: 938, n: 0, s: 1.16 },
];
const KID = 0.82; // các bạn nhỏ hơn bản ghế lẻ để ngồi vừa bàn dài
const SEAT_ROW: number[] = ROWS.flatMap((r, ri) => Array.from({ length: r.n }, () => ri));
const SPRITE_H = 250; // chiều cao cả người
const SHOW = 0.5; // ngồi ghế: chỉ hiện phần trên (đầu tới hông)
// khung đầu đã xoá khỏi ảnh thân sau lưng, tính theo tỉ lệ ảnh (tools/tach-nen.py ghi ra public/assets/nv/*/head.json)
const HEAD = { nam: { x: 0.136, y: 0, w: 0.682, h: 0.284 }, nu: { x: 0.174, y: 0, w: 0.668, h: 0.248 } };
// màu 4 tổ (bản riêng cô Ngân): tổ 1 đỏ, tổ 2 xanh dương, tổ 3 xanh lá, tổ 4 vàng
const TEAM_COLOR = ['#ef4444', '#3b82f6', '#16a34a', '#f59e0b'];
const TEAM_ICON = ['🔴', '🔵', '🟢', '🟡'];

const POSE = {
  nam: { dung: '01-dung', tay: '02-giong-tay', nghi: '03-suy-nghi', vui: '05-vui-mung', buon: '06-buon', ngac: '07-ngac-nhien', chao: '08-vay-chao' },
  nu: { dung: '01-dung', tay: '02-giong-tay', nghi: '03-suy-nghi', vui: '05-vui-mung', buon: '06-buon', ngac: '07-ngac-nhien', chao: '08-vay-chao' },
};
type PoseKey = keyof typeof POSE.nam;

// tải trước mọi tư thế để đổi tư thế không bị nháy trắng
const ALL_IMGS = [
  ...Object.values(POSE.nam).map((p) => `/assets/nv/nam/${p}.webp`),
  ...Object.values(POSE.nu).map((p) => `/assets/nv/nu/${p}.webp`),
  ...[
    '01-dung', '02-gioi-thieu', '03-chi-bang', '04-vay-chao', '05-dang-tay', '06-cuoi', '07-tay-nguc', '08-ngon-cai',
    '09-mung', '10-vo-tay', '11-nhun-vai', '12-gai-dau', '13-ngac-nhien', '14-ngon-tro', '15-chong-hong', '16-chi-trai',
  ].map((p) => `/assets/nv/co-ngan/${p}.webp`),
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
  // cận cảnh cô nhận hoa: lúc bạn nhỏ tới bục. Ngoài giờ trả lời thì zoom cả lớp vào cô;
  // đang hỏi thì hiện khung cận cảnh phía dưới để bảng đen vẫn đọc được
  const closeUp = !!v.walk && now - v.walk.at >= GAME.closeUpFromMs && now - v.walk.at <= GAME.closeUpToMs;
  const asking = v.phase === 'question' || v.phase === 'bonus';
  return (
    <div className={`relative h-full w-full overflow-hidden ${v.clapping ? 'class-clap' : ''}`}>
      <motion.div
        className="absolute inset-0"
        style={{ transformOrigin: '330px 700px' }}
        animate={{ scale: closeUp && !asking ? 1.9 : 1 }}
        transition={{ duration: 0.7, ease: 'easeInOut' }}
      >
        {/* sàn lớp trong ảnh nền hơi chói: phủ 1 lớp tối nhẹ từ chân bảng trở xuống (chủ kênh chỉnh 2026-11-04) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[600px] bg-gradient-to-b from-[#3b1d07]/0 via-[#3b1d07]/20 to-[#3b1d07]/28 mix-blend-multiply" />
        <Header v={v} name={game.channelName} />
        <Motto />
        <Board v={v} now={now} />
        <DayTop v={v} />
        <TeamBoard v={v} />
        <TalkTop v={v} />
        <GiftPile v={v} />
        <ClassFund v={v} />
        <Vase v={v} />
        <Teacher v={v} now={now} />
        <Punished v={v} />
        <Podium v={v} />
        <SeatHint now={now} />
        <Students v={v} now={now} />
        <FlowerWalk v={v} />
      </motion.div>
      {closeUp && asking && <CloseUpInset v={v} />}
      <GiftBanner gift={game.lastGift} now={now} />
      <BirthdayBanner v={v} />
      <FundParty v={v} />
      <LoveHearts n={v.loveFans} />
      <PollCard v={v} />
      {(v.clapping || v.fund.party > 0) && <Claps />}
    </div>
  );
}

// Quà cô nhận trong buổi: xếp thẳng ra chỗ cửa lớp bên trái (sau lưng cô), bó càng to icon càng to, chồng dần lên
const PILE_PER_ROW = 5;
function GiftPile({ v }: { v: StageView }) {
  const pile = v.gifts;
  return (
    <div className="pointer-events-none absolute left-[2px] top-[640px] z-[1] h-[230px] w-[150px]">
      {pile.map((tier, i) => {
        const t = GAME.giftTiers[tier];
        const size = 26 * t.size;
        const row = Math.floor(i / PILE_PER_ROW);
        const col = i % PILE_PER_ROW;
        return (
          <motion.div
            key={i}
            initial={i === pile.length - 1 ? { scale: 0, x: 220, y: -40 } : false}
            animate={{ scale: 1, x: 0, y: 0 }}
            transition={{ delay: i === pile.length - 1 ? GAME.closeUpToMs / 1000 - 1.2 : 0, type: 'spring', stiffness: 140, damping: 14 }}
            className="absolute leading-none drop-shadow-[0_3px_2px_rgba(0,0,0,0.35)]"
            style={{ fontSize: size, left: 6 + col * 26 + (row % 2) * 12 - size / 4, top: 210 - size - row * 24 }}
          >
            {t.icon}
          </motion.div>
        );
      })}
    </div>
  );
}

// Quỹ lớp: cột phải, giữa bảng Thi đua tổ và Top tương tác. Mỗi xu quà = 1 bông hoa vào quỹ, có mốc trong ngày
function ClassFund({ v }: { v: StageView }) {
  const f = v.fund;
  const pct = Math.min(100, (f.today / f.goal) * 100);
  return (
    <div className="absolute right-[8px] top-[428px] z-20 w-[168px] -rotate-1 rounded-[14px] border-[3px] border-[#c9a45c] bg-[#fff8e1]/95 px-2 pb-2 pt-3 text-center text-[#4a2c0e] shadow-[0_6px_10px_rgba(0,0,0,0.3)]">
      <div className="absolute -top-[18px] left-1/2 -translate-x-1/2 text-[28px]">📌</div>
      <div className="text-[20px] font-extrabold leading-tight text-[#be185d]">💝 Quỹ lớp</div>
      <div className="text-[30px] font-extrabold leading-tight text-[#be185d]">{f.today}</div>
      <div className="h-[12px] w-full overflow-hidden rounded-full bg-pink-100">
        <div className="h-full rounded-full bg-gradient-to-r from-pink-400 to-rose-500 transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-[16px] font-semibold leading-tight">Mục tiêu hôm nay {f.goal} 🌹</div>
    </div>
  );
}

// Khung cận cảnh (đang hỏi bài thì không zoom cả lớp, hiện khung này dưới bảng đen)
function CloseUpInset({ v }: { v: StageView }) {
  const w = v.walk!;
  const tier = GAME.giftTiers[w.tier];
  const g = w.girl ? 'nu' : 'nam';
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute left-1/2 top-[930px] z-[60] h-[430px] w-[820px] -translate-x-1/2 overflow-hidden rounded-[30px] border-[6px] border-white bg-gradient-to-b from-[#fde7c3] to-[#e8b77a] shadow-2xl"
    >
      <div className="absolute left-4 top-3 rounded-full bg-red-600 px-3 text-[22px] font-bold text-white">🎥 Cận cảnh</div>
      <img src="/assets/nv/co-ngan/06-cuoi.webp" className="absolute bottom-[-40px] left-[120px] h-[470px]" />
      <img src={`/assets/nv/${g}/${POSE[g].vui}.webp`} className="absolute bottom-[-20px] left-[430px] h-[330px]" />
      <motion.div animate={{ rotate: [-8, 8, -8] }} transition={{ duration: 1, repeat: Infinity }} className="absolute left-[380px] top-[150px]" style={{ fontSize: 60 * tier.size }}>
        {tier.icon}
      </motion.div>
      <div className="absolute right-6 top-14 w-[300px] text-center">
        <div className="truncate text-[40px] font-extrabold text-[#9d174d]">{w.nickname}</div>
        <div className="text-[30px] font-bold text-[#7a2e0e]">tặng cô {tier.label}</div>
      </div>
    </motion.div>
  );
}

// Quỹ hoa đạt mốc: biểu ngữ + pháo hoa (vỗ tay) 8 giây
function FundParty({ v }: { v: StageView }) {
  return (
    <AnimatePresence>
      {v.fund.party > 0 && (
        <motion.div
          key={v.fund.party}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="absolute left-1/2 top-[650px] z-[70] w-[880px] -translate-x-1/2 rounded-[30px] border-4 border-white bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 px-6 py-4 text-center font-extrabold text-white shadow-2xl"
        >
          <div className="text-[44px] leading-tight">🎆 Quỹ lớp đủ {v.fund.party} bông hoa! 🎆</div>
          <div className="text-[30px]">Cô cảm ơn cả lớp nhiều lắm 💕</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Header({ v, name }: { v: StageView; name: string }) {
  const sub =
    v.phase === 'team'
      ? `Chọn tổ · Tiết ${v.round}`
      : v.phase === 'recess'
      ? 'Giờ ra chơi'
      : v.phase === 'vote'
        ? 'Chọn chủ đề tiết sau'
        : v.qNo > 0 && v.phase !== 'results'
          ? `${v.review ? 'Ôn bài' : `Tiết ${v.round}`} · Câu ${v.qNo}/${v.total}`
          : `Tiết ${v.round}`;
  return (
    <div className="absolute left-1/2 top-[14px] flex w-[470px] -translate-x-1/2 flex-col items-center rounded-[28px] border-[5px] border-[#7a4a1d] bg-[#f6e3b4] px-6 py-3 shadow-[0_8px_0_#5b3512]">
      <div className="max-w-full truncate font-extrabold leading-none tracking-wide text-[#7a2e0e]" style={{ fontSize: name.length > 14 ? 34 : 46 }}>
        {name.toUpperCase()}
      </div>
      {/* sĩ số trong lớp / số bạn đang chờ vào (chỗ bảng sĩ số cũ ở cửa trái giờ là bàn quà của cô) */}
      <div className="mt-1 whitespace-nowrap text-[24px] font-semibold text-[#6b4a22]">
        {sub} · 👥 {v.roster.seated}/{v.roster.seats}
        {v.roster.waiting > 0 && ` · ⏳ chờ ${v.roster.waiting}`}
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
          {v.topic && <div className="mt-3 text-[32px] text-[#ffe680]">🗳️ Cả lớp chọn: {v.topic}</div>}
          {v.review && <div className="mt-3 text-[32px] text-[#ffe680]">📖 Giờ ôn bài · gõ "vào lớp" để học bài mới</div>}
          <div className="mt-4 text-[30px] opacity-80">Bắt đầu sau {left} giây</div>
        </div>
      )}

      {(v.phase === 'question' || v.phase === 'bonus' || v.phase === 'reveal') && (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between">
            {v.golden ? (
              <span className="rounded-full bg-[#ffd84a] px-4 text-[28px] font-bold text-[#7a2e0e]">⭐ CÂU HỎI VÀNG x2</span>
            ) : (
              <span className={`rounded-full border-2 px-4 text-[26px] ${v.slot ? 'border-[#ffe680] text-[#ffe680]' : 'border-[#f4f1e6]/60'}`}>
                {v.slot === 'meo'
                  ? '🤪 Đố mẹo'
                  : v.slot === 'su'
                    ? '📜 Lịch sử'
                    : v.slot === 'anh'
                      ? '🔤 Tiếng Anh'
                      : v.slot === 'dh'
                        ? '🖼️ Đuổi hình bắt chữ'
                        : v.category}
              </span>
            )}
            {v.phase !== 'reveal' ? <Timer left={left} /> : <span className="text-[34px] text-[#9df29d]">Đáp án</span>}
          </div>
          {!v.boardShown ? (
            // cô đang đọc đề: chưa hiện chữ xáo / phép tính, hô bắt đầu mới hiện
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              {!v.math && v.slot !== 'dh' && <div className="line-clamp-2 text-[38px] leading-[48px]">{v.clue}</div>}
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="mt-6 text-[40px] text-[#ffe680]"
              >
                👂 Nghe cô đọc đề nè…
              </motion.div>
            </div>
          ) : v.slot === 'dh' ? (
            // đuổi hình bắt chữ: hình ghép bằng emoji thật to, bên dưới là ô đáp án
            <motion.div
              key={v.clue}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 160, damping: 14 }}
              className={`mt-3 shrink-0 whitespace-nowrap text-center text-[84px] leading-[110px] ${v.phase === 'reveal' ? 'opacity-60' : ''}`}
            >
              {v.clue}
            </motion.div>
          ) : v.math ? (
            // câu toán: phép tính viết to bằng phấn, người xem gõ số
            <motion.div
              key={v.math}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`mt-4 shrink-0 text-center text-[76px] font-extrabold leading-[96px] text-[#ffe680] ${v.phase === 'reveal' ? 'opacity-50' : ''}`}
            >
              {v.math}
            </motion.div>
          ) : (
            <>
              <div className="mt-2 line-clamp-2 min-h-[96px] shrink-0 text-center text-[38px] leading-[48px]">{v.clue}</div>
              <Tiles letters={v.tiles} dim={v.phase === 'reveal'} />
            </>
          )}
          {v.boardShown && <Slots slots={v.slots} reveal={v.phase === 'reveal'} />}
          {v.boardShown && v.math && v.phase !== 'reveal' && <div className="mt-2 text-center text-[28px] opacity-80">Gõ số vào bình luận</div>}
          {v.phase === 'bonus' && (
            <div className="mt-auto text-center text-[28px] text-[#ffe680]">{v.math ? 'Thêm 10 giây, nhẩm lẹ lên!' : 'Cô mở thêm 1 chữ, thêm 10 giây!'}</div>
          )}
        </div>
      )}

      {v.phase === 'team' && <TeamPick v={v} left={left} />}
      {v.phase === 'praise' && <Praise v={v} />}
      {v.phase === 'vote' && v.vote && <Vote v={v} left={left} />}
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

// Cả lớp chọn chủ đề tiết sau: gõ 1 hoặc 2
function Vote({ v, left }: { v: StageView; left: number }) {
  const r = v.vote!;
  const total = r.counts[0] + r.counts[1] || 1;
  return (
    <div className="flex h-full flex-col items-center text-center">
      <div className="flex w-full items-center justify-between">
        <span className="rounded-full bg-[#ffd84a] px-4 text-[26px] font-bold text-[#7a2e0e]">🗳️ Cả lớp quyết định</span>
        <Timer left={left} />
      </div>
      <div className="mt-1 text-[44px] leading-tight text-[#ffe680]">Tiết sau học gì?</div>
      <div className="mt-3 w-full space-y-4 px-4">
        {r.topics.map((label, i) => {
          const pct = Math.round((r.counts[i] / total) * 100);
          return (
            <div key={label} className="relative h-[76px] overflow-hidden rounded-2xl border-2 border-white/40 text-left">
              <div className="absolute inset-y-0 left-0 bg-[#ffd84a]/35 transition-all duration-500" style={{ width: `${pct}%` }} />
              <div className="relative flex h-full items-center justify-between gap-3 px-4 text-[32px]">
                <span className="truncate">
                  Gõ <b className="text-[#ffe680]">{i + 1}</b>: {label}
                </span>
                <span>{r.counts[i]}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Dừng giữa tiết: bạn nhỏ giỏi nhất từ đầu tiết, kèm quà cô vừa tặng
function Praise({ v }: { v: StageView }) {
  return (
    <div className="flex h-full flex-col items-center">
      <div className="text-[50px] leading-none text-[#ffe680]">🎁 Cô phát quà nè!</div>
      <div className="mt-1 text-[28px] opacity-80">Bạn nhỏ giỏi nhất sau {v.qNo} câu</div>
      <div className="mt-4 w-full space-y-2">
        {v.praiseTop.map((s, i) => (
          <motion.div
            key={s.username}
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.4 }}
            className="flex items-center gap-3 px-6 text-[40px]"
          >
            <span className="w-12">{['🥇', '🥈', '🥉'][i]}</span>
            <span className="flex-1 truncate">{s.nickname}</span>
            <span className="text-[34px]">{s.desk[s.desk.length - 1]?.icon}</span>
            <span>{s.score}đ</span>
          </motion.div>
        ))}
      </div>
      <div className="mt-auto text-[30px] text-[#ffe680]">Chào cô, thả tim để được quà nha! 💕</div>
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
      {v.teamWin.length > 0 && (
        <div className="mt-auto text-[36px] text-[#ffe680]">
          🚩 {v.teamWin.map((n) => `Tổ ${n}`).join(' & ')} thắng tiết này!
        </div>
      )}
    </div>
  );
}

// ---------- Chia tổ (bản riêng cô Ngân) ----------
// 45 giây đầu tiết: 4 ô tổ trên bảng đen, số bạn mỗi tổ nhảy lên khi có người chọn
function TeamPick({ v, left }: { v: StageView; left: number }) {
  return (
    <div className="flex h-full flex-col items-center">
      <div className="flex w-full items-center justify-between">
        <span className="rounded-full bg-[#ffd84a] px-4 text-[26px] font-bold text-[#7a2e0e]">🚩 Chọn tổ thi đua</span>
        <Timer left={left} />
      </div>
      <div className="mt-1 text-[32px] leading-tight">
        Gõ <b className="text-[#ffe680]">tổ 1</b>, <b className="text-[#ffe680]">tổ 2</b>, <b className="text-[#ffe680]">tổ 3</b> hoặc <b className="text-[#ffe680]">tổ 4</b>
      </div>
      <div className="mt-2 grid w-full grid-cols-2 gap-2 px-2">
        {v.teams.map((t, i) => (
          <div key={t.no} className="rounded-2xl border-[3px] bg-white/10 text-center leading-[38px]" style={{ borderColor: TEAM_COLOR[i] }}>
            <div className="text-[32px] font-bold" style={{ color: TEAM_COLOR[i] }}>
              {TEAM_ICON[i]} Tổ {t.no}
            </div>
            <motion.div key={t.members} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="text-[28px] leading-[32px]">
              {t.members} bạn{t.wins > 0 && <span className="ml-2 text-[24px] text-[#ffe680]">🚩{t.wins}</span>}
            </motion.div>
          </div>
        ))}
      </div>
      <div className="mt-auto text-[24px] leading-tight opacity-85">
        {v.noTeam > 0 ? `${v.noTeam} bạn chưa chọn, hết giờ cô Ngân xếp giùm` : 'Chưa chọn thì cô Ngân tự xếp vào tổ ít người'}
      </div>
    </div>
  );
}

// Bảng thi đua tổ: ghim bên phải bảng đen, điểm tiết này của cả tổ, tổ dẫn đầu nổi lên trên, 🚩 = số tiết đã thắng
function TeamBoard({ v }: { v: StageView }) {
  if (!v.teams.length) return null;
  const rows = [...v.teams].sort((a, b) => b.score - a.score || b.wins - a.wins || a.no - b.no);
  const lead = rows[0].score > 0 ? rows[0].no : 0;
  return (
    <div className="absolute right-[8px] top-[150px] z-20 w-[168px] rotate-2 rounded-[14px] border-[3px] border-[#c9a45c] bg-[#fff8e1]/95 px-2 pb-2 pt-3 text-[#4a2c0e] shadow-[0_6px_10px_rgba(0,0,0,0.3)]">
      <div className="absolute -top-[18px] left-1/2 -translate-x-1/2 text-[28px]">📌</div>
      <div className="text-center text-[19px] font-extrabold leading-tight text-[#b45309]">🚩 Thi đua tổ</div>
      <div className="mt-1 space-y-[4px]">
        {rows.map((t) => (
          <motion.div
            key={t.no}
            layout
            className="rounded-lg px-2 py-[2px] text-white shadow"
            style={{ background: TEAM_COLOR[t.no - 1], outline: t.no === lead ? '3px solid #ffd84a' : undefined }}
          >
            <div className="flex items-center justify-between text-[20px] font-extrabold leading-tight">
              <span>
                {t.no === lead ? '👑 ' : ''}Tổ {t.no}
              </span>
              <span>{t.score}đ</span>
            </div>
            <div className="flex justify-between text-[15px] font-semibold leading-tight opacity-95">
              <span>{t.members} bạn</span>
              <span>{t.wins > 0 ? `🚩x${t.wins}` : ''}</span>
            </div>
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

// Cuối giờ ra chơi: lớp trưởng các tiết trước (mới nhất trên cùng), ai làm nhiều lần thì có số lần
function SessionBoard({ v }: { v: StageView }) {
  return (
    <div className="flex h-full flex-col items-center">
      <div className="text-[48px] leading-none text-[#ffe680]">👑 Lớp trưởng các tiết</div>
      {v.champions.length === 0 && <div className="mt-16 text-[36px]">Chưa có lớp trưởng</div>}
      <div className="mt-3 w-full space-y-1">
        {v.champions.map((c, i) => (
          <motion.div
            key={c.round}
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.2 }}
            className="flex items-center gap-3 px-6 text-[36px]"
          >
            <span className="w-[110px] text-[26px] text-[#ffe680]">Tiết {c.round}</span>
            <span className="flex-1 truncate">{c.nickname}</span>
            {c.times > 1 && <span className="text-[26px] text-[#ffe680]">👑x{c.times}</span>}
            <span>{c.score}đ</span>
          </motion.div>
        ))}
      </div>
      <div className="mt-auto text-[28px] opacity-80">Tiết mới điểm làm lại, ai cũng có thể làm lớp trưởng!</div>
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

// Góc trái trên đầu cô: tờ giấy ghim "Học sinh xuất sắc hôm nay", tính tổng điểm cả ngày (server lưu, qua 0 giờ thì làm lại)
function DayTop({ v }: { v: StageView }) {
  const rows = (v.todayTop ?? []).slice(0, 4); // top 4 thôi để không che đầu cô
  return (
    <div className="absolute left-[10px] top-[230px] z-20 w-[326px] -rotate-2 rounded-[14px] border-[3px] border-[#c9a45c] bg-[#fff8e1]/95 px-3 pb-2 pt-3 text-[#4a2c0e] shadow-[0_6px_10px_rgba(0,0,0,0.3)]">
      <div className="absolute -top-[18px] left-1/2 -translate-x-1/2 text-[30px]">📌</div>
      <div className="whitespace-nowrap text-center text-[21px] font-extrabold leading-tight text-[#b45309]">🏆 Học sinh xuất sắc hôm nay</div>
      {rows.length === 0 && <div className="py-3 text-center text-[20px] text-[#8a6a3a]">Chưa có ai, trả lời đúng là lên bảng!</div>}
      <div className="mt-1 space-y-[2px]">
        {rows.map((r, i) => (
          <motion.div key={r.username} layout className="flex items-center gap-2 text-[23px] leading-[28px]">
            <span className="w-7 text-center">{['🥇', '🥈', '🥉', '4', '5'][i]}</span>
            <span className="min-w-0 flex-1 truncate font-semibold">{r.nickname}</span>
            <b className="text-[#c2410c]">{r.points}</b>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ---------- Cô giáo (cô Ngân, bản riêng: 16 tư thế, ảnh gốc trong nhan-vat/co-giao-ngan, tách nền ra public/assets/nv/co-ngan) ----------
function teacherPose(v: StageView, now: number): string {
  // có bạn cầm hoa đi lên: ngạc nhiên, tới bục đưa hoa thì cười che miệng
  if (v.walk) return now - v.walk.at < GAME.closeUpFromMs ? '13-ngac-nhien' : '06-cuoi';
  if (now - v.lastFlowerAt < 3000) return '06-cuoi'; // được tặng hoa
  if (v.birthday) return '09-mung';
  if (v.clapping) return '10-vo-tay';
  if (v.loveFans > 0) return '07-tay-nguc'; // các bạn gõ "yêu cô"
  switch (v.phase) {
    case 'team':
    case 'intro':
      return '04-vay-chao';
    case 'question':
      if (!v.boardShown) return '02-gioi-thieu'; // đang đọc đề
      if (v.correctCount > 0) return '08-ngon-cai'; // có bạn đúng rồi
      return now % 8000 < 4000 ? '03-chi-bang' : '01-dung'; // chờ trả lời: lúc chỉ bảng, lúc đứng
    case 'bonus':
      return '12-gai-dau'; // chưa ai ra, thêm giờ
    case 'reveal':
      return v.correctCount === 0 ? '11-nhun-vai' : v.golden ? '09-mung' : '08-ngon-cai';
    case 'praise':
      return '09-mung';
    case 'results':
    case 'vote':
      return '14-ngon-tro';
    case 'recess':
      if (v.recess?.stage === 'play') return v.recess.game === 'callup' ? '16-chi-trai' : '05-dang-tay';
      return v.recess?.stage === 'result' ? '15-chong-hong' : '07-tay-nguc';
  }
  return '01-dung';
}

function Teacher({ v, now }: { v: StageView; now: number }) {
  const gotFlower = now - v.lastFlowerAt < 3000;
  const pose = teacherPose(v, now);
  return (
    <div className="absolute left-[96px] top-[410px] h-[490px] w-[300px]">
      <img src={`/assets/nv/co-ngan/${pose}.webp`} className="h-full w-full object-contain object-bottom drop-shadow-[0_10px_8px_rgba(0,0,0,0.25)]" />
      {/* bảng tên cài ngực áo (trên đầu cô là bảng Học sinh xuất sắc nên không đặt ở đó) */}
      <div className="absolute left-1/2 top-[128px] z-10 -translate-x-1/2 -rotate-3 whitespace-nowrap rounded-full border-[3px] border-[#fff6dd] bg-gradient-to-b from-[#ff6b9a] to-[#d63384] px-3 py-[1px] text-[22px] font-extrabold text-white shadow-[0_3px_0_#9d174d]">
        🌸 Cô Ngân
      </div>
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
    </div>
  );
}

// ---------- Ai nhanh nhất câu này ----------
// Hết câu (hiện đáp án): bảng Top 5 nhanh nhất, thời gian tới mili giây + điểm được cộng; ai đúng chậm hơn +1
const secText = (ms: number) => `${(ms / 1000).toFixed(3).replace('.', ',')} giây`;
function FastestBoard({ v }: { v: StageView }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute left-[392px] top-[622px] z-30 w-[470px] overflow-hidden rounded-[16px] border-[3px] border-[#7a2e0e] bg-[#fff6dd]/97 shadow-xl"
    >
      <div className="flex items-center justify-between bg-[#7a2e0e] px-3 py-[2px] text-[21px] font-bold text-[#ffe9b8]">
        <span>⚡ Top {GAME.fastestShown} nhanh nhất</span>
        <span>{v.correctCount} bạn đúng</span>
      </div>
      {v.fastest.length === 0 && <div className="py-3 text-center text-[22px] text-[#8a6a3a]">Chưa ai đúng câu này</div>}
      {v.fastest.map((a, i) => (
        <motion.div
          key={a.username}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 * i }}
          className={`flex items-center gap-2 px-3 text-[22px] leading-[33px] text-[#4a2c0e] ${i % 2 ? 'bg-[#f6e3b4]/60' : ''}`}
        >
          <span className="w-8 text-center text-[24px]">{['🥇', '🥈', '🥉', '4', '5'][i]}</span>
          <span className="min-w-0 flex-1 truncate font-semibold">{a.nickname}</span>
          <span className="w-[120px] text-right font-mono text-[20px] text-[#6b4a22]">{secText(a.ms)}</span>
          <b className="w-[52px] text-right text-[#c2410c]">+{a.points}</b>
        </motion.div>
      ))}
      {v.laterCount > 0 && (
        <div className="border-t border-[#e9d8a6] px-3 text-center text-[19px] font-semibold leading-[30px] text-[#6b4a22]">
          {v.laterCount} bạn khác đúng chậm hơn: mỗi bạn +{v.laterPoints}
        </div>
      )}
    </motion.div>
  );
}

function Podium({ v }: { v: StageView }) {
  if (v.phase === 'reveal') return <FastestBoard v={v} />;
  if (v.phase !== 'question' && v.phase !== 'bonus') return null;
  return (
    <div className="absolute left-[417px] top-[634px] w-[420px]">
      <div className="flex items-center justify-between rounded-t-[14px] bg-[#7a2e0e] px-3 py-[1px] text-[19px] font-bold text-[#ffe9b8]">
        <span>⚡ Nhanh nhất</span>
        <span>{v.correctCount} bạn đã đúng</span>
      </div>
      <div className="flex h-[48px] items-center gap-1 rounded-b-[14px] bg-[#fff6dd]/95 px-2 shadow-lg">
        {v.correctTop.length === 0 && <div className="w-full text-center text-[20px] text-[#8a6a3a]">Chưa ai đoán ra…</div>}
        <AnimatePresence initial={false}>
          {v.correctTop.map((a, i) => (
            <motion.div
              key={a.username}
              layout
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex w-1/3 min-w-0 items-center gap-1 text-[17px] text-[#4a2c0e]"
            >
              <span className="text-[20px]">{['🥇', '🥈', '🥉'][i]}</span>
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

// Dòng nhắc dưới khung "Nhanh nhất", trên hàng ghế đầu: cách được vào lớp ngồi (đổi câu mỗi 8 giây, viết ngắn)
const SEAT_HINTS = ['⭐ Đoán nhanh, điểm cao được vào lớp ngồi!', '💬 Tương tác nhiều để giữ chỗ trong lớp nha!'];
function SeatHint({ now }: { now: number }) {
  const i = Math.floor(now / 8000) % SEAT_HINTS.length;
  return (
    <div className="pointer-events-none absolute left-[397px] top-[718px] z-[9] flex w-[460px] justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="whitespace-nowrap rounded-full bg-[#7a2e0e]/80 px-3 py-[1px] text-[18px] font-bold text-[#ffe9b8] shadow-md"
        >
          {SEAT_HINTS[i]}
        </motion.div>
      </AnimatePresence>
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
  if ((v.phase === 'results' || v.phase === 'praise') && rank < 3 && s.score > 0) return 'vui';
  if (now - (s.desk[s.desk.length - 1]?.at ?? 0) < 3000) return 'vui'; // vừa được cô tặng quà
  return now - s.lastActive < 2500 ? 'tay' : 'dung';
}

/** Vị trí ghế thứ i (khung nửa trên người ngồi, toạ độ stage) */
function seatBox(i: number) {
  const ri = SEAT_ROW[i] ?? ROWS.length - 1;
  const row = ROWS[ri];
  const k = i - SEAT_ROW.indexOf(ri); // thứ tự trong dãy
  const scale = row.s * KID;
  const w = SPRITE_H * 0.47 * scale;
  const h = SPRITE_H * scale;
  const show = h * SHOW;
  const cx = row.x1 + ((k + 0.5) * (row.x2 - row.x1)) / Math.max(1, row.n);
  const x = cx * K - w / 2;
  const y = (row.y + 0.64 * (row.b - row.y)) * K - show; // ngồi trên ghế băng, lưng quay ra khán giả
  return { scale, w, h, show, x, y, ri };
}

/** Bàn dài + ghế băng của 1 dãy (che hẳn dãy bàn lẻ vẽ sẵn trong ảnh nền) */
function LongDesk({ ri }: { ri: number }) {
  const r = ROWS[ri];
  const h = r.b - r.y;
  const [x1, x2] = [r.x1 - 6, r.x2 + 6];
  const Y = (f: number) => r.y + f * h;
  const nLegs = Math.max(2, Math.floor((r.n || 8) / 2) + 1);
  const legs = Array.from({ length: nLegs }, (_, j) => x1 + 22 + (j * (x2 - x1 - 44)) / (nLegs - 1));
  // màu gỗ hạ vài tông so với bản đầu (chủ kênh chỉnh 2026-11-04: bàn sáng quá, tên và quà trên bàn khó nhìn)
  const line = { stroke: '#57320f', strokeWidth: 3, strokeLinejoin: 'round' as const };
  return (
    <svg className="pointer-events-none absolute left-0 top-0" width={1080} height={1920} viewBox="0 0 941 1672" style={{ zIndex: 9 + ri }}>
      {/* bóng dưới bàn ghế: che chân bàn lẻ trong ảnh nền */}
      <rect x={x1 - 2} y={Y(0.5)} width={x2 - x1 + 4} height={h * 0.52} rx={10} fill="#9c5a2c" />
      {/* chân bàn 2 đầu */}
      <rect x={x1 + 6} y={Y(0.34)} width={14} height={h * 0.62} fill="#70411b" {...line} />
      <rect x={x2 - 20} y={Y(0.34)} width={14} height={h * 0.62} fill="#70411b" {...line} />
      {/* mặt bàn + cạnh trước + tấm chắn trước bàn */}
      <rect x={x1 + 14} y={Y(0.36)} width={x2 - x1 - 28} height={h * 0.26} fill="#965c22" {...line} />
      <polygon points={`${x1 + 8},${r.y} ${x2 - 8},${r.y} ${x2},${Y(0.28)} ${x1},${Y(0.28)}`} fill="#cf9a4c" {...line} />
      <rect x={x1} y={Y(0.28)} width={x2 - x1} height={h * 0.08} fill="#b5772f" {...line} />
      {/* ghế băng */}
      {legs.map((lx) => (
        <rect key={lx} x={lx - 5} y={Y(0.74)} width={10} height={h * 0.24} fill="#5f3816" />
      ))}
      <rect x={x1 + 16} y={Y(0.6)} width={x2 - x1 - 32} height={h * 0.1} rx={4} fill="#c68a3c" {...line} />
      <rect x={x1 + 16} y={Y(0.7)} width={x2 - x1 - 32} height={h * 0.06} fill="#a5692b" {...line} />
    </svg>
  );
}

function Students({ v, now }: { v: StageView; now: number }) {
  const asking = v.phase === 'question' || v.phase === 'bonus';
  const first = asking ? v.correctTop[0]?.username : undefined;
  return (
    <>
      {ROWS.map((_, ri) => (
        <LongDesk key={ri} ri={ri} />
      ))}
      {v.seats.map((s, i) => {
        const { scale, w, h, show, x, y, ri } = seatBox(i);
        const pose = studentPose(s, v, i, now);
        const g = s.girl ? 'nu' : 'nam';
        const hd = HEAD[g];
        const called = v.recess?.game === 'callup' && v.recess.callUser === s.username;
        // đang lên bục (tặng hoa / bị phạt): ghế trống, nhân vật vẽ ở chỗ khác
        const away = s.standing || v.walk?.username === s.username;
        return (
          <motion.div
            key={s.username}
            initial={{ opacity: 0, left: x, top: y + 40 }}
            // bạn đúng đầu tiên: nhảy lên vui mừng
            animate={{ opacity: away ? 0 : 1, left: x, top: s.username === first ? [y, y - 34, y, y - 18, y] : y }}
            transition={s.username === first ? { top: { duration: 0.9 } } : { type: 'spring', stiffness: 120, damping: 18 }}
            className={`absolute ${called ? 'called-up' : ''}`}
            style={{ width: w, height: show, zIndex: 10 + ri }}
          >
            <div className="absolute inset-0 overflow-hidden">
              <img src={`/assets/nv/${g}/sau-${POSE[g][pose]}.webp`} style={{ width: w, height: h }} className="max-w-none" />
              <div className="absolute" style={{ left: hd.x * w, top: hd.y * h, width: hd.w * w, height: hd.h * h }}>
                <Hair username={s.username} girl={s.girl} />
              </div>
            </div>
            {s.answered === 'right' && <div className="badge bg-[#16a34a]">✓</div>}
            {s.answered === 'wrong' && <div className="badge bg-[#dc2626]">✗</div>}
            <DeskGifts desk={s.desk} x={x} y={y} w={w} show={show} scale={scale} />
            {s.sleeping && !s.bubble && (
              <motion.div
                animate={{ y: [0, -14, 0], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2.4, repeat: Infinity }}
                className="pointer-events-none absolute -top-[46px] right-0 text-[34px]"
                style={{ fontSize: 34 * scale }}
              >
                💤
              </motion.div>
            )}
            {s.bubble && <ChatBubble text={s.bubble} scale={scale} />}
            <div className="nametag" style={{ fontSize: 19 * scale }}>
              {s.team > 0 && (
                <span className="mr-1 shrink-0 rounded-full px-[5px] font-extrabold text-white" style={{ background: TEAM_COLOR[s.team - 1] }}>
                  {s.team}
                </span>
              )}
              {i < 5 && s.score > 0 && <span className="rank">{i + 1}</span>}
              {s.title && <span className="mr-1">{s.title === 'lop-truong' ? '👑' : '⭐'}</span>}
              {called && <span className="mr-1">📢</span>}
              {s.days >= 2 && <span className="mr-1 whitespace-nowrap">🎒{s.days}</span>}
              {/* học bạ: lớp mấy (lớp 1 thì khỏi hiện cho gọn), tốt nghiệp đội mũ */}
              {s.grade >= 2 && (
                <span className="mr-1 shrink-0 rounded-full bg-[#2563eb] px-[5px] font-extrabold text-white">{s.grade > 12 ? '🎓' : `L${s.grade}`}</span>
              )}
              <span className="truncate">{s.nickname}</span>
              {s.score > 0 && <b className="ml-1 text-[#c2410c]">{s.score}</b>}
            </div>
          </motion.div>
        );
      })}
    </>
  );
}

// Bong bóng chat trên đầu (đã lọc: không có câu trả lời, không có từ cấm)
function ChatBubble({ text, scale }: { text: string; scale: number }) {
  return (
    <motion.div
      key={text}
      initial={{ opacity: 0, y: 10, scale: 0.7 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="pointer-events-none absolute bottom-[calc(100%+30px)] left-1/2 z-30 max-w-[200px] -translate-x-1/2 truncate rounded-[16px] bg-white px-3 py-1 font-semibold text-[#3b2a14] shadow-md"
      style={{ fontSize: 18 * scale }}
    >
      {text}
      <div className="absolute -bottom-[7px] left-1/2 h-[14px] w-[14px] -translate-x-1/2 rotate-45 bg-white" />
    </motion.div>
  );
}

// Tặng hoa: bạn nhỏ đứng dậy đi lên bục đưa hoa cho cô, rồi đi về chỗ (bạn không có ghế thì đi từ cửa lớp)
const PODIUM: [number, number] = [372, 690]; // chỗ đứng đưa hoa, cạnh tay cô (toạ độ góc trên trái nhân vật)
function FlowerWalk({ v }: { v: StageView }) {
  const w = v.walk;
  if (!w) return null;
  const i = v.seats.findIndex((s) => s.username === w.username);
  const H = 210;
  const from: [number, number] = i >= 0 ? [seatBox(i).x, seatBox(i).y - 40] : [990, 760];
  const g = w.girl ? 'nu' : 'nam';
  return (
    <motion.div
      key={w.at}
      initial={{ left: from[0], top: from[1], opacity: 0 }}
      animate={{ left: [from[0], PODIUM[0], PODIUM[0], from[0]], top: [from[1], PODIUM[1], PODIUM[1], from[1]], opacity: [1, 1, 1, 0] }}
      transition={{ duration: GAME.walkMs / 1000, times: [0, 0.35, 0.65, 1], ease: 'easeInOut' }}
      className="pointer-events-none absolute z-30"
      style={{ width: H * 0.47, height: H }}
    >
      <img src={`/assets/nv/${g}/${POSE[g].vui}.webp`} className="h-full w-full drop-shadow-[0_4px_3px_rgba(0,0,0,0.3)]" />
      {/* bó hoa to nhỏ theo bậc quà */}
      <div className="absolute -right-4 top-[70px] leading-none" style={{ fontSize: 40 * GAME.giftTiers[w.tier].size }}>
        {GAME.giftTiers[w.tier].icon}
      </div>
      <div className="nametag" style={{ fontSize: 16, bottom: 'calc(100% - 4px)' }}>
        <span className="truncate">{w.nickname}</span>
      </div>
    </motion.div>
  );
}

// Học sinh cá biệt: bị cô phạt đứng cạnh bảng (bên phải), đeo bảng tên đỏ
const STAND_SPOTS = [870, 965];
function Punished({ v }: { v: StageView }) {
  return (
    <>
      {v.punished.slice(0, STAND_SPOTS.length).map((s, i) => {
        const H = 185;
        const g = s.girl ? 'nu' : 'nam';
        return (
          <motion.div
            key={s.username}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-none absolute z-30"
            style={{ left: STAND_SPOTS[i] - (H * 0.47) / 2, top: 640 - H, width: H * 0.47, height: H }}
          >
            <img src={`/assets/nv/${g}/${POSE[g].buon}.webp`} className="h-full w-full drop-shadow-[0_4px_3px_rgba(0,0,0,0.3)]" />
            <div className="absolute -top-[52px] left-1/2 w-[120px] -translate-x-1/2 rounded-md bg-red-600 px-1 text-center text-[15px] font-bold leading-tight text-white shadow">
              😅 Học sinh cá biệt
              <div className="truncate text-[14px] font-semibold">{s.nickname}</div>
            </div>
          </motion.div>
        );
      })}
    </>
  );
}

// Bình hoa trên bàn cô: hoa các bạn tặng cắm vào, càng nhiều hoa càng đầy bình
const VASE_SPOTS: [number, number][] = [
  [0, 0], [-22, 8], [22, 8], [-12, -18], [12, -18], [0, -30], [-30, -10], [30, -10], [-20, -36], [20, -36], [-36, 14], [36, 14],
];
function Vase({ v }: { v: StageView }) {
  const n = Math.min(v.flowers, VASE_SPOTS.length);
  return (
    <div className="pointer-events-none absolute left-[150px] top-[585px] z-[9]">
      {VASE_SPOTS.slice(0, n).map(([dx, dy], i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i === n - 1 ? GAME.walkMs / 2000 : 0, type: 'spring' }}
          className="absolute text-[30px]"
          style={{ left: dx, top: dy }}
        >
          {['🌸', '🌷', '🌹', '🌼'][i % 4]}
        </motion.div>
      ))}
    </div>
  );
}

// Quà cô thưởng: bay từ tay cô giáo xuống, đặt lên mặt bàn 2 bên người bạn nhỏ
const TEACHER_HAND: [number, number] = [300, 640]; // px stage
function DeskGifts({ desk, x, y, w, show, scale }: { desk: StageView['seats'][number]['desk']; x: number; y: number; w: number; show: number; scale: number }) {
  const size = 34 * scale;
  const deskTop = show - 72 * K + 44 * scale; // mặt bàn: mép trên bàn (ROWS.y) lùi xuống, tính trong khung học sinh
  // chỗ trống trên mặt bàn 2 bên đầu bạn nhỏ (lệch so với tâm bàn): trái, phải, trái ngoài, phải ngoài
  const SPOTS = [-40, 40, -58, 58];
  return (
    <>
      {desk.map((g, i) => {
        const left = w / 2 + SPOTS[i % SPOTS.length] * scale - size / 2;
        const top = deskTop - size + (i >= 2 ? 3 : 0) * scale;
        return (
          <motion.div
            key={g.at + g.icon}
            // quà cũ (mở lại trang, đổi chỗ ngồi) thì nằm sẵn trên bàn, không bay lại
            initial={Date.now() - g.at < 2000 ? { x: TEACHER_HAND[0] - (x + left), y: TEACHER_HAND[1] - (y + top), scale: 2.2, rotate: -30, opacity: 0 } : false}
            animate={{ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }}
            transition={{ duration: 1.1, ease: [0.3, 1.4, 0.5, 1], opacity: { duration: 0.2 } }}
            className="pointer-events-none absolute drop-shadow-[0_4px_2px_rgba(0,0,0,0.35)]"
            style={{ left, top, fontSize: size, lineHeight: 1, zIndex: 5 }}
          >
            {g.icon}
          </motion.div>
        );
      })}
    </>
  );
}

// Bên phải, trên hàng ghế đầu: top tương tác hôm nay (cách tính không hiện ra màn hình)
function TalkTop({ v }: { v: StageView }) {
  const rows = (v.talkTop ?? []).slice(0, 5);
  return (
    <div className="absolute left-[842px] top-[606px] z-[8] w-[232px] rotate-1 rounded-[14px] border-[3px] border-[#c9a45c] bg-[#fff8e1]/95 px-2 pb-2 pt-3 text-[#4a2c0e] shadow-[0_6px_10px_rgba(0,0,0,0.3)]">
      <div className="absolute -top-[18px] left-1/2 -translate-x-1/2 text-[28px]">📌</div>
      <div className="whitespace-nowrap text-center text-[22px] font-extrabold leading-tight text-[#b45309]">💬 Top tương tác</div>
      {rows.length === 0 && <div className="py-2 text-center text-[17px] text-[#8a6a3a]">Bình luận để lên bảng nha!</div>}
      <div className="mt-1 space-y-[1px]">
        {rows.map((r, i) => (
          <motion.div key={r.username} layout className="flex items-center gap-1 text-[22px] leading-[28px]">
            <span className="w-6 text-center">{['🥇', '🥈', '🥉', '4', '5'][i]}</span>
            <span className="min-w-0 flex-1 truncate font-semibold">{r.nickname}</span>
          </motion.div>
        ))}
      </div>
    </div>
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
          className="absolute left-[24px] top-[470px] z-50 max-w-[560px] rounded-[26px] bg-gradient-to-r from-pink-500 to-rose-400 px-6 py-3 text-[30px] font-bold text-white shadow-xl"
        >
          💐 <span className="inline-block max-w-[300px] truncate align-bottom">{gift.nickname}</span> tặng cô {gift.repeatCount > 1 ? `${gift.repeatCount} × ` : ''}
          {gift.giftName}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// "Ai yêu cô thì gõ số 1": mỗi bạn gõ là một trái tim bay lên cạnh cô, kèm số đếm
function LoveHearts({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <div className="pointer-events-none absolute left-[60px] top-[330px] z-40 h-[520px] w-[340px]">
      {Array.from({ length: Math.min(n, 30) }, (_, i) => (
        <motion.div
          key={i}
          initial={{ y: 480, opacity: 0, scale: 0.6 }}
          animate={{ y: -20, opacity: [0, 1, 0], scale: 1.2 }}
          transition={{ duration: 2.4, delay: (i % 6) * 0.15, repeat: Infinity, repeatDelay: 0.4 }}
          className="absolute text-[54px]"
          style={{ left: ((i * 67) % 280) + 10 }}
        >
          {i % 3 === 0 ? '💕' : '❤️'}
        </motion.div>
      ))}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-pink-500 px-5 py-1 text-[30px] font-bold text-white shadow-lg">
        💕 {n} bạn yêu cô
      </div>
    </div>
  );
}

// Bình chọn vui ("miền Bắc gõ B..."): thẻ đếm phiếu cạnh cô trong 15 giây
function PollCard({ v }: { v: StageView }) {
  return (
    <AnimatePresence>
      {v.poll && (
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          className="absolute left-[16px] top-[640px] z-40 w-[330px] rounded-[20px] border-[3px] border-white bg-gradient-to-br from-sky-500 to-indigo-500 px-4 py-2 text-white shadow-xl"
        >
          <div className="text-center text-[24px] font-extrabold">🗳️ Gõ chữ để chọn nha!</div>
          {v.poll.map((o) => (
            <div key={o.key} className="flex items-center gap-2 text-[24px] leading-[34px]">
              <b className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white text-indigo-600">{o.key.toUpperCase()}</b>
              <span className="min-w-0 flex-1 truncate">{o.label}</span>
              <b>{o.n}</b>
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Chúc mừng sinh nhật: biểu ngữ trên đầu lớp, bánh kem đã đặt lên bàn bạn nhỏ
function BirthdayBanner({ v }: { v: StageView }) {
  return (
    <AnimatePresence>
      {v.birthday && (
        <motion.div
          key={v.birthday.at}
          initial={{ opacity: 0, y: -40, scale: 0.7 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          className="absolute left-1/2 top-[620px] z-50 w-[900px] -translate-x-1/2 rounded-[30px] border-4 border-white bg-gradient-to-r from-pink-500 via-fuchsia-500 to-amber-400 px-6 py-4 text-center font-extrabold text-white shadow-2xl"
        >
          <div className="text-[46px] leading-tight">🎉 Chúc mừng sinh nhật 🎂</div>
          <div className="mt-1 truncate text-[54px] leading-tight drop-shadow">{v.birthday.nickname}</div>
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
