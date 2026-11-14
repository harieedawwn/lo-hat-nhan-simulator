# CLAUDE.md – lo-hat-nhan-simulator

Mô phỏng 2D nhà máy điện hạt nhân PWR cho Vật lí 12. Vite + JS ES modules (không framework), SVG + Canvas. Mọi chữ hiển thị bằng tiếng Việt.

## Lệnh
- `npm ci` (một lần) · `npm test` (vitest) · `npm run build` · `npx vite preview --port 4173 &` (server để chụp ảnh)
- Chụp một vùng thế giới SVG để tự kiểm tra bằng mắt:
  `node e2e/zoomrect.mjs http://localhost:4173/ /tmp/x.png <x> <y> <w> <h> [vw=1200] [vh=700]` rồi Read `/tmp/x.png`.
  Vùng hay dùng: điện 24 kV `1130 500 330 300` · trạm phân phối `1360 520 460 400` · cả khu điện `1120 480 760 440`.
- Deploy: push lên `main` → GitHub Actions tự `npm test` + build + đăng GitHub Pages. KHÔNG có bước deploy thủ công.

## Bản đồ code (chỉ đọc file cần thiết, không quét cả repo)
- `src/render/geometry.js` – toạ độ dùng chung: `ELEC` (đường hạt điện), `YARD`, `GANTRY`, `TOWERS`, `ARM_Y`, `DEPTH`, `PHASE_ALPHA`, `phasePath()`, `linePhase()`.
- `src/render/flows.js` – hạt Canvas; hạt điện: `this.elec` (constructor), `update()` (dòng ~115), `draw()` mục “xung năng lượng” (~200). `dr.pe` = P_điện/1000.
- `src/render/plant_hall.js` – máy phát (x 1150–1310, y 590–690) và thanh dẫn 24 kV `#busG` (path `M1285,590 V540 H1410 V775`).
- `src/render/plant_yard.js` – MBA (x 1372–1512, nắp y≈782), sứ cao áp, máy cắt `breaker()`, giàn, cột `transmission()`, mũi tên `chevron()`.
- `src/render/labels.js` – nhãn (id, chữ, x, y, part). `src/ui/parts.js` – thẻ thông tin từng bộ phận.
- `src/sim/model.js` – mô hình vật lí thuần (KHÔNG sửa trừ khi task yêu cầu).

## Quy tắc bắt buộc
1. Làm trên nhánh `main` (nhánh mặc định trên GitHub đang trỏ nhánh cũ – bỏ qua nó).
2. Sửa nhỏ, đúng chỗ. Không đổi tên/xoá export đang dùng, không đổi toạ độ bộ phận cũ trừ khi task nói rõ.
3. Không thêm thư viện. Giữ hiệu năng điện thoại (không thêm vòng lặp nặng mỗi khung, không filter SVG blur lớn).
4. Sau mỗi thay đổi: `npm test && npm run build` phải xanh, rồi chụp ảnh vùng liên quan và tự nhìn. Nếu hình xấu/sai hơn trước → sửa hoặc `git checkout -- <file>`.
5. Vật lí phải đúng chương trình Vật lí 12. Ý tưởng của chủ repo là cố định: chỉ được làm cho đúng vật lí, không được bỏ/cãi yêu cầu.
6. Commit nhỏ theo từng phase, message tiếng Việt, rồi `git push origin main`.
7. Không dùng subagent, không plan mode dài; spec trong `TASK.md` đã đủ chi tiết.
8. Theo dõi tiến độ bằng checklist trong `TASK.md` (đánh dấu [x] khi xong), để sau `/clear` vẫn làm tiếp được.
