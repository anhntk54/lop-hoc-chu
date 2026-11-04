# Lớp Học Chữ: ghi chú cho Claude

> File này mô tả RIÊNG game này. Luật chung cho mọi game nằm ở `E:\VibeCode\CLAUDE.md`.
> Khi chủ kênh chốt một quyết định (câu đọc, màu, luật chơi), ghi vào mục "Quyết định của chủ kênh".

## Ý tưởng

Lớp học 2D cho TikTok LIVE. Cô giáo áo dài đố chữ: chữ cái xáo trộn trên bảng đen, người xem gõ đáp án vào bình luận. Ai đúng nhanh nhất được nhiều điểm nhất, điểm cao ngồi bàn đầu. Luật gốc: `C:\Users\phaml\Documents\Codex\2026-11-03\xe\outputs\luat-choi-lop-hoc-chu.md` (đã chỉnh theo quyết định bên dưới).

## Luật chơi

- Comment bất kỳ là vào lớp (có tên trên đầu học sinh). Gõ `vào lớp` thì cô chào.
- Mỗi tiết 10 câu: 3 dễ, 4 vừa, 3 khó; câu 10 là câu hỏi vàng (điểm x2). Mỗi câu 20 giây. Hết giờ chưa ai đúng: mở 1 chữ, thêm 10 giây.
- Cô đọc: "Câu 3. Đây là một món ăn. <gợi ý>" (câu "Đây là..." ghi ở dòng `>` trong file câu hỏi).
- Sau mỗi tiết là giờ ra chơi 1 phút, bốc 1 trong 5 trò (không lặp trò vừa chơi): oẳn tù tì (+2), kiểm tra miệng gọi 1 bạn đang ngồi (+5), chọn phe (vui, không điểm), điểm danh "có mặt" (10 bạn đầu +3), thả tim 300 trong 30 giây (+1 cả lớp). Xong trò thì hiện "Học sinh giỏi hôm nay".
- Xếp hạng 3 tầng: điểm tiết (xếp ghế, xoá mỗi tiết) · điểm buổi (👑 lớp trưởng, ⭐ lớp phó) · bảng vàng tuần (lưu file `data/so-lop.json`, tự xoá khi sang tuần mới).
- Comment dài đúng bằng đáp án (không tính khoảng trắng) mới tính là trả lời; nói chuyện thường không bị tính sai. Mỗi người chỉ tính lần trả lời đầu tiên của câu đó. Phải gõ đủ dấu.
- Điểm theo thứ tự đúng, xếp theo giờ TikTok gắn lúc gửi (`createTime`), không theo lúc bot nhận: 10 / 7 / 5 / hạng 4–10 được 3 / sau đó 1. Đúng 3 câu liền +5.
- Quà: luôn là "tặng hoa cô" (cô cầm hoa, cảm ơn). Quà từ 30 xu lúc chưa ai đúng: cô mở thêm 1 chữ cho cả lớp. Quà không cộng điểm.
- 300 tim: cả lớp vỗ tay.

## File

- `src/game/quiz.ts`: lõi game (pha, chấm điểm, chỗ ngồi). Test: `npx tsx src/game/quiz.check.ts`.
- `src/game/cau-hoi/*.txt`: 1523 câu, 22 chủ đề. Kiểm tra: `npx tsx src/game/bank.check.ts` (gợi ý lộ đáp án, trùng, đáp án quá 14 chữ, thiếu câu "Đây là").
- `src/game/loi-thoai.ts`: toàn bộ lời cô (khoảng 330 câu, bốc kiểu xáo bài nên ít lặp). `src/game/config.ts`: số liệu.
- `data/so-lop.json`: câu nào hỏi lúc nào (game ưu tiên câu lâu chưa hỏi; 116 tiết liền không lặp) + điểm tuần. Không đưa lên git.
- `src/game/GameStage.tsx`: màn hình. Toạ độ bàn đo trên ảnh nền gốc 941x1672 (`ROWS`).
- `src/game/GameControls.tsx`: nút thử ở trang điều khiển, có "1000 người cùng đoán" để đo bot nhận đủ comment không.
- `tools/tach-nen.py`: tách nền xám ảnh trong `nhan-vat/` ra `public/assets/nv/`. Thay ảnh thì chạy lại.
- Trang stage chạy game thật và gửi ảnh chụp trạng thái lên `/api/game/state`; trang điều khiển chỉ vẽ lại ảnh chụp đó (xem trước luôn khớp live).
- `?view=stage&mute=1`: xem stage không phát tiếng (để Claude thử).
- Cổng riêng: **3006** (BAT-LIVE.bat đặt PORT=3006). Link LIVE Studio: http://lvh.me:3006/?view=stage. Thử trong khung preview của Claude: cổng 3500 (hoặc cấu hình "lop-hoc-3006").

## Quyết định của chủ kênh

- 20 giây mỗi câu (đổi từ 25, 2026-11-04), luôn chạy đủ giờ (`endAfterFirstSec: 0`).
- Tên lớp đổi được ở ô "Tên lớp" trang điều khiển (hiện trên bảng hiệu).
- Cô cà khịa nhiều: 60% số câu cô gọi tên trêu 1 bạn trả lời sai; đúng trong 4 giây đầu thì nghi "quay cóp"; lớp im 75 giây thì cô nhắc.
- Dấu kiểu cũ/mới (hóa/hoá, thủy/thuỷ) đều tính đúng; không dấu thì không tính.
- Điểm giảm dần theo thứ tự đúng để chép đáp án trên khung chat chỉ được 1 điểm.
- Quà = tặng hoa cô giáo; quà to mở chữ.
- Chưa làm phần cắt clip.
- Học sinh ngồi ghế QUAY LƯNG ra khán giả, mặt nhìn cô giáo (2026-11-04). Bộ ảnh chỉ có mặt trước nên thân sau lưng là ảnh gốc lật ngang + xoá đầu (`sau-*.webp`), tóc vẽ bằng SVG ở `src/game/Hair.tsx`: nam 4 kiểu (ngắn, đầu đinh, xoăn, mũ lưỡi trai ngược), nữ 6 kiểu (đuôi ngựa, búi, 2 bím nơ, xoã, bob, 2 chùm), 12 màu tóc có vài màu nhuộm. Kiểu tóc cố định theo tên tài khoản.
- Hết 20 ghế: tới 60 bạn tiếp theo chen chúc đứng ngoài 2 bên cửa lớp (30 mỗi bên, 10 hàng so le), vẫn tính điểm. Chỉ 6 bạn đứng đầu có bảng tên, còn lại không hiện tên (2026-11-04).
- Bảng đỏ chữ vàng "TIÊN HỌC LỄ – HẬU HỌC VĂN" phía trên bảng đen.
- Chỗ ngồi: điểm cao bàn đầu; cùng điểm thì ai vào lớp trước ngồi trước (không đổi chỗ mỗi lần comment).
- Muốn nhân vật đẹp hơn: làm ảnh học sinh nhìn từ sau lưng cùng nét vẽ, bỏ vào nhan-vat/ rồi sửa tools/tach-nen.py.
- Giọng đọc bám chương trình (chủ kênh chốt 2026-11-04): câu chính (giới thiệu tiết, đề, đáp án + cà khịa lúc hiện đáp án, tổng kết, ra chơi) đọc ngay, đồng hồ phần đó DỪNG trong lúc cô đọc (đọc đề xong mới đếm 20 giây). Câu chào, cảm ơn quà, follow, khen người đúng đầu tiên chỉ nói khi đang chờ học sinh trả lời và còn hơn 5 giây (`chatterWindow`, `chatterMinLeftMs`); chờ quá lâu thì bỏ.
- Có thêm 10 câu khen kiểu khen bé nhỏ tuổi trong nhóm `firstCorrect`.
