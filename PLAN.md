# PLAN – Mô phỏng nhà máy điện hạt nhân PWR 1000 MW (2D)

Stack: Vite + JS ES modules (không framework), Vitest, Playwright. Base "./".

## Milestones
- [ ] 1. Scaffold + mô hình (src/sim/model.js) + test + Pages deploy (trang tối thiểu)
- [ ] 2. Minh hoạ nhà máy (SVG 1 file, hạt Canvas, lăng kính phản ứng dây chuyền, camera) + vòng art-direction ×2
- [ ] 3. Bảng điều khiển, responsive, màn hình khởi động, trình duyệt trong app (Zalo), hướng dẫn + tour + vòng art-direction
- [ ] 4. Âm thanh Web Audio thủ tục
- [ ] 5. README, ảnh OG, icon, manifest
- [ ] 6. Hoàn thiện, e2e Playwright, kiểm tra URL thật

## Quyết định chính
- Mô hình thuần, không DOM; bước cố định dt=0,05 s; tối đa 10 bước/khung; tốc độ 0,5×/1×/2×.
- p_f* = w/80 (đơn giản hoá có chủ đích); p = 0,935·p_f + p_d; k suy ra từ tốc độ đổi p_f.
- Sau SCRAM: p_f rơi nhanh còn vài % trong 1 s, tổng nhiệt ≈ 6–7 % (p_d theo Way–Wigner, nén thời gian ×10).
- Thế giới SVG 2450×1100, mặt đất y=900; ống dùng chung dữ liệu đường đi cho SVG và hạt Canvas.
- Nhãn vẽ ở lớp màn hình, tự tránh chồng chéo theo độ ưu tiên.
- Ống vòng 3 đi ngầm không cắt vòng 2 (bình ngưng 2 chặng: cấp & hồi cùng phía phải).

## Tiếp theo
Milestone 1.
