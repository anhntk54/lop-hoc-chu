// Bộ câu hỏi. Thêm câu: chép 1 dòng, đổi id cho khác. Đáp án phải rõ ràng, ai cũng biết.
// acceptedAnswers: cách viết khác cũng tính đúng (vd. "tivi" / "ti vi").

export interface Question {
  id: string;
  clue: string;
  answer: string;
  acceptedAnswers?: string[];
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const q = (id: string, category: string, difficulty: Question['difficulty'], answer: string, clue: string, acceptedAnswers?: string[]): Question => ({
  id,
  category,
  difficulty,
  answer,
  clue,
  acceptedAnswers,
});

export const QUESTIONS: Question[] = [
  // Đồ dùng học tập
  q('dd01', 'Đồ dùng học tập', 'easy', 'PHẤN', 'Cô cầm cái này viết lên bảng đen.'),
  q('dd02', 'Đồ dùng học tập', 'easy', 'THƯỚC', 'Dùng để kẻ đường thẳng cho ngay.'),
  q('dd03', 'Đồ dùng học tập', 'medium', 'TẨY', 'Viết bút chì sai thì lấy cái này chùi đi.', ['GÔM']),
  q('dd04', 'Đồ dùng học tập', 'medium', 'BÚT CHÌ', 'Ruột màu xám, gọt càng nhiều càng ngắn.'),
  q('dd05', 'Đồ dùng học tập', 'hard', 'COMPA', 'Có một chân nhọn, dùng để vẽ hình tròn.'),
  q('dd06', 'Đồ dùng học tập', 'medium', 'CẶP SÁCH', 'Ngày nào cũng đeo trên lưng tới trường.'),
  q('dd07', 'Đồ dùng học tập', 'hard', 'BẢNG CON', 'Tấm bảng nhỏ học sinh lớp một giơ lên cho cô xem.'),
  q('dd08', 'Đồ dùng học tập', 'medium', 'VỞ', 'Học sinh ghi bài vào đây, có dòng kẻ ô li.', ['TẬP']),
  q('dd09', 'Đồ dùng học tập', 'hard', 'MỰC TÍM', 'Ngày xưa chấm ngòi bút vào lọ này để viết.'),
  q('dd10', 'Đồ dùng học tập', 'hard', 'GIẤY THẤM', 'Tờ giấy hồng đặt dưới tay cho khỏi lem mực.'),

  // Trong lớp học
  q('lh01', 'Trong lớp học', 'easy', 'BẢNG ĐEN', 'Cô giáo viết bài lên đây cho cả lớp chép.'),
  q('lh02', 'Trong lớp học', 'medium', 'LỚP TRƯỞNG', 'Bạn hô "đứng dậy" khi cô bước vào lớp.'),
  q('lh03', 'Trong lớp học', 'medium', 'TRỰC NHẬT', 'Tới phiên thì ở lại quét lớp, lau bảng.'),
  q('lh04', 'Trong lớp học', 'medium', 'TRỐNG TRƯỜNG', 'Đánh "tùng tùng" là hết giờ ra chơi.'),
  q('lh05', 'Trong lớp học', 'hard', 'SỔ ĐẦU BÀI', 'Cuốn sổ cô ghi điểm tiết học, bị ghi tên vào là sợ.'),
  q('lh06', 'Trong lớp học', 'hard', 'KIỂM TRA MIỆNG', 'Đầu giờ cô gọi tên lên bảng trả bài.'),
  q('lh07', 'Trong lớp học', 'medium', 'RA CHƠI', 'Giờ cả trường chạy ùa ra sân.'),
  q('lh08', 'Trong lớp học', 'hard', 'KHĂN QUÀNG ĐỎ', 'Đội viên thắt cái này trên cổ.'),
  q('lh09', 'Trong lớp học', 'medium', 'HỌC BẠ', 'Cuốn sổ ghi điểm tổng kết cả năm, có lời phê của cô.'),
  q('lh10', 'Trong lớp học', 'hard', 'GIẤY KHEN', 'Học sinh giỏi cuối năm được phát tờ này.'),

  // Môn học
  q('mh01', 'Môn học', 'easy', 'TOÁN', 'Môn có cộng trừ nhân chia.'),
  q('mh02', 'Môn học', 'medium', 'LỊCH SỬ', 'Môn học về các triều đại, năm tháng xưa.'),
  q('mh03', 'Môn học', 'medium', 'ĐỊA LÝ', 'Môn học về sông núi, bản đồ.', ['ĐỊA LÍ']),
  q('mh04', 'Môn học', 'medium', 'THỂ DỤC', 'Môn học ngoài sân, chạy nhảy.'),
  q('mh05', 'Môn học', 'hard', 'HÓA HỌC', 'Môn có bảng tuần hoàn và ống nghiệm.', ['HOÁ HỌC']),
  q('mh06', 'Môn học', 'hard', 'SINH HỌC', 'Môn học về tế bào, cây cối, con vật.'),
  q('mh07', 'Môn học', 'medium', 'VẬT LÝ', 'Môn có định luật Newton.', ['VẬT LÍ']),
  q('mh08', 'Môn học', 'medium', 'MỸ THUẬT', 'Môn vẽ tranh, tô màu.', ['MĨ THUẬT']),

  // Con vật
  q('cv01', 'Con vật', 'easy', 'CON MÈO', 'Kêu meo meo, hay bắt chuột.'),
  q('cv02', 'Con vật', 'medium', 'CON TRÂU', 'Bạn của nhà nông, cày ruộng giỏi.'),
  q('cv03', 'Con vật', 'medium', 'CHIM SẺ', 'Loài chim nhỏ xíu hay nhảy trên mái nhà.'),
  q('cv04', 'Con vật', 'hard', 'CON NGHÊU', 'Sống dưới cát biển, hai mảnh vỏ, nấu canh chua ngon.', ['CON NGAO']),
  q('cv05', 'Con vật', 'hard', 'CÀO CÀO', 'Côn trùng nhảy xa trên đồng cỏ, giống châu chấu.'),
  q('cv06', 'Con vật', 'medium', 'CON VOI', 'Con vật to nhất trên cạn, có vòi dài.'),
  q('cv07', 'Con vật', 'hard', 'ĐOM ĐÓM', 'Ban đêm bay lập lòe, đít phát sáng.'),
  q('cv08', 'Con vật', 'medium', 'CON CUA', 'Bò ngang, có hai cái càng.'),

  // Món ăn Việt
  q('ma01', 'Món ăn Việt', 'easy', 'PHỞ', 'Món nước nổi tiếng của Hà Nội, bánh dẹt, nước dùng xương.'),
  q('ma02', 'Món ăn Việt', 'medium', 'BÁNH MÌ', 'Ổ bánh giòn kẹp pate, chả, đồ chua.'),
  q('ma03', 'Món ăn Việt', 'medium', 'BÚN CHẢ', 'Bún ăn với thịt nướng than, chấm nước mắm chua ngọt.'),
  q('ma04', 'Món ăn Việt', 'hard', 'BÁNH CHƯNG', 'Bánh vuông gói lá dong, ăn ngày Tết.'),
  q('ma05', 'Món ăn Việt', 'hard', 'CƠM TẤM', 'Món cơm Sài Gòn có sườn nướng, bì, chả.'),
  q('ma06', 'Món ăn Việt', 'hard', 'CHÈ BẮP', 'Món ngọt nấu từ ngô, rưới nước cốt dừa.', ['CHÈ NGÔ']),
  q('ma07', 'Món ăn Việt', 'medium', 'NEM RÁN', 'Cuốn bánh đa nem rồi chiên vàng giòn.', ['CHẢ GIÒ']),
  q('ma08', 'Món ăn Việt', 'hard', 'BÁNH XÈO', 'Đổ bột kêu xèo xèo, ăn cuốn rau sống.'),

  // Nghề nghiệp
  q('nn01', 'Nghề nghiệp', 'easy', 'BÁC SĨ', 'Mặc áo blouse trắng, khám bệnh.'),
  q('nn02', 'Nghề nghiệp', 'medium', 'GIÁO VIÊN', 'Người đứng lớp dạy học trò.'),
  q('nn03', 'Nghề nghiệp', 'hard', 'PHI CÔNG', 'Người lái máy bay.'),
  q('nn04', 'Nghề nghiệp', 'medium', 'NÔNG DÂN', 'Người trồng lúa, làm ruộng.'),
  q('nn05', 'Nghề nghiệp', 'hard', 'THỢ MAY', 'Người cắt vải, đo người, may áo quần.'),
  q('nn06', 'Nghề nghiệp', 'medium', 'ĐẦU BẾP', 'Người nấu ăn trong nhà hàng.'),

  // Đất nước
  q('dn01', 'Đất nước', 'medium', 'HÀ NỘI', 'Thủ đô của Việt Nam.'),
  q('dn02', 'Đất nước', 'hard', 'PHÚ QUỐC', 'Hòn đảo lớn nhất Việt Nam.'),
  q('dn03', 'Đất nước', 'hard', 'HẠ LONG', 'Vịnh có hàng nghìn đảo đá, di sản thế giới.'),
  q('dn04', 'Đất nước', 'hard', 'SÔNG HỒNG', 'Con sông nước đỏ nặng phù sa chảy qua Hà Nội.'),
  q('dn05', 'Đất nước', 'hard', 'ÁO DÀI', 'Trang phục truyền thống, cô giáo hay mặc màu trắng.'),
  q('dn06', 'Đất nước', 'hard', 'NÓN LÁ', 'Đội đầu che nắng, hình chóp, làm bằng lá.'),

  // Đời sống
  q('ds01', 'Đời sống', 'medium', 'XE ĐẠP', 'Hai bánh, đạp bằng chân, ngày xưa đạp đi học.'),
  q('ds02', 'Đời sống', 'hard', 'ĐIỆN THOẠI', 'Ai cũng cầm trên tay, đang xem live bằng nó.'),
  q('ds03', 'Đời sống', 'medium', 'CÁI Ô', 'Trời mưa thì bung ra che.', ['CÂY DÙ']),
  q('ds04', 'Đời sống', 'hard', 'ĐỒNG HỒ', 'Có kim giờ, kim phút, kim giây.'),
  q('ds05', 'Đời sống', 'hard', 'MÁY GIẶT', 'Bỏ quần áo vào, nó quay ầm ầm.'),
  q('ds06', 'Đời sống', 'hard', 'TRUNG THU', 'Ngày rằm tháng tám, rước đèn ông sao.'),
];
