# PLAN – Mô phỏng nhà máy điện hạt nhân PWR 1000 MW (2D)

Stack: Vite + JS ES modules (không framework), Vitest, Playwright. Base "./".

## Milestones
- [x] 1. Scaffold + mô hình (src/sim/model.js) + test + Pages deploy (trang tối thiểu)
- [x] 2. Minh hoạ nhà máy (SVG 1 file, hạt Canvas, lăng kính phản ứng dây chuyền, camera) + vòng art-direction ×2
- [x] 3. Bảng điều khiển, responsive, màn hình khởi động, trình duyệt trong app (Zalo), hướng dẫn + tour + vòng art-direction
- [x] 4. Âm thanh Web Audio thủ tục
- [x] 5. README, ảnh OG, icon, manifest
- [x] 6. Hoàn thiện, e2e Playwright, kiểm tra URL thật

## Quyết định chính
- Mô hình thuần, không DOM; bước cố định dt=0,05 s; tối đa 10 bước/khung; tốc độ 0,5×/1×/2×.
- p_f* = w/80 (đơn giản hoá có chủ đích); p = 0,935·p_f + p_d; k suy ra từ tốc độ đổi p_f.
- Sau SCRAM: p_f rơi nhanh còn vài % trong 1 s, tổng nhiệt ≈ 6–7 % (p_d theo Way–Wigner, nén thời gian ×10).
- Thế giới SVG 2450×1100, mặt đất y=900; ống dùng chung dữ liệu đường đi cho SVG và hạt Canvas.
- Nhãn vẽ ở lớp màn hình, tự tránh chồng chéo theo độ ưu tiên.
- Ống vòng 3 đi ngầm không cắt vòng 2 (bình ngưng 2 chặng: cấp & hồi cùng phía phải).

## Ghi chú
- Không truy cập được URL github.io từ sandbox (proxy chặn): xác minh triển khai qua GitHub Actions API.
- `main` được tạo từ nhánh làm việc vì kho ban đầu trống (không có nhánh mặc định để mở PR).

## Trạng thái
Hoàn thành 6/6. e2e: `node e2e/run.mjs` (50+ kiểm tra), âm thanh OfflineAudioContext < 0 dBFS.
Chưa làm được: WebKit (không cài được trong sandbox), kiểm tra URL github.io thật (proxy chặn máy chủ).
