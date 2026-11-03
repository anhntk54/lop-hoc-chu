# Lớp Học Chữ: ghi chú cho Claude

> File này mô tả RIÊNG game này. Luật chung cho mọi game nằm ở `E:\VibeCode\CLAUDE.md`.
> Khi chủ kênh chốt một quyết định (câu đọc, màu, luật chơi), ghi vào mục "Quyết định của chủ kênh".

## Ý tưởng

Lớp học 2D cho TikTok LIVE. Cô giáo áo dài đố chữ: chữ cái xáo trộn trên bảng đen, người xem gõ đáp án vào bình luận. Ai đúng nhanh nhất được nhiều điểm nhất, điểm cao ngồi bàn đầu. Luật gốc: `C:\Users\phaml\Documents\Codex\2026-11-03\xe\outputs\luat-choi-lop-hoc-chu.md` (đã chỉnh theo quyết định bên dưới).

## Luật chơi

- Comment bất kỳ là vào lớp (có tên trên đầu học sinh). Gõ `vào lớp` thì cô chào.
- Mỗi ván 10 câu. Mỗi câu 25 giây. Hết giờ chưa ai đúng: mở 1 chữ, thêm 10 giây.
- Comment dài đúng bằng đáp án (không tính khoảng trắng) mới tính là trả lời; nói chuyện thường không bị tính sai. Mỗi người chỉ tính lần trả lời đầu tiên của câu đó. Phải gõ đủ dấu.
- Điểm theo thứ tự đúng, xếp theo giờ TikTok gắn lúc gửi (`createTime`), không theo lúc bot nhận: 10 / 7 / 5 / hạng 4–10 được 3 / sau đó 1. Đúng 3 câu liền +5.
- Quà: luôn là "tặng hoa cô" (cô cầm hoa, cảm ơn). Quà từ 30 xu lúc chưa ai đúng: cô mở thêm 1 chữ cho cả lớp. Quà không cộng điểm.
- 300 tim: cả lớp vỗ tay.

## File

- `src/game/quiz.ts`: lõi game (pha, chấm điểm, chỗ ngồi). Test: `npx tsx src/game/quiz.check.ts`.
- `src/game/questions.ts`: bộ câu hỏi. `src/game/config.ts`: số liệu + câu cô đọc ("F:" = giọng nữ).
- `src/game/GameStage.tsx`: màn hình. Toạ độ bàn đo trên ảnh nền gốc 941x1672 (`ROWS`).
- `src/game/GameControls.tsx`: nút thử ở trang điều khiển, có "1000 người cùng đoán" để đo bot nhận đủ comment không.
- `tools/tach-nen.py`: tách nền xám ảnh trong `nhan-vat/` ra `public/assets/nv/`. Thay ảnh thì chạy lại.
- Trang stage chạy game thật và gửi ảnh chụp trạng thái lên `/api/game/state`; trang điều khiển chỉ vẽ lại ảnh chụp đó (xem trước luôn khớp live).
- `?view=stage&mute=1`: xem stage không phát tiếng (để Claude thử).
- Thử trong khung preview của Claude: cổng 3500.

## Quyết định của chủ kênh

- 25 giây mỗi câu, luôn chạy đủ 25 giây (`endAfterFirstSec: 0`).
- Điểm giảm dần theo thứ tự đúng để chép đáp án trên khung chat chỉ được 1 điểm.
- Quà = tặng hoa cô giáo; quà to mở chữ.
- Chưa làm phần cắt clip.
- Học sinh ngồi ghế QUAY LƯNG ra khán giả, mặt nhìn cô giáo (2026-11-04). Bộ ảnh chỉ có mặt trước nên thân sau lưng là ảnh gốc lật ngang + xoá đầu (`sau-*.webp`), tóc vẽ bằng SVG ở `src/game/Hair.tsx`: nam 4 kiểu (ngắn, đầu đinh, xoăn, mũ lưỡi trai ngược), nữ 6 kiểu (đuôi ngựa, búi, 2 bím nơ, xoã, bob, 2 chùm), 12 màu tóc có vài màu nhuộm. Kiểu tóc cố định theo tên tài khoản.
- Hết 20 ghế: 12 bạn tiếp theo (6 mỗi bên) đứng ngoài 2 bên cửa lớp hóng, vẫn tính điểm, có tên + điểm.
- Bảng đỏ chữ vàng "TIÊN HỌC LỄ – HẬU HỌC VĂN" phía trên bảng đen.
- Chỗ ngồi: điểm cao bàn đầu; cùng điểm thì ai vào lớp trước ngồi trước (không đổi chỗ mỗi lần comment).
- Muốn nhân vật đẹp hơn: làm ảnh học sinh nhìn từ sau lưng cùng nét vẽ, bỏ vào nhan-vat/ rồi sửa tools/tach-nen.py.
