# CLAUDE.md – lo-hat-nhan-simulator

Mô phỏng 2D nhà máy điện hạt nhân PWR cho Vật lí 12. Vite + JS ES modules (không framework), SVG (tĩnh) + Canvas (hạt, khói). Mọi chữ hiển thị bằng tiếng Việt.

## Lệnh
- `npm ci` (một lần) · `npm test` · `npm run build` · `npx vite preview --port 4173 &` (server để chụp ảnh; build lại thì preview tự dùng bản mới khi tải lại)
- **Chụp bộ ảnh chuẩn** (toàn cảnh máy tính + điện thoại ngang + 4 vùng lò / tuabin / điện / tháp):
  `npm run build && node e2e/shots.mjs /tmp/<tên>` rồi Read các file `.png` trong đó.
- Chụp một vùng tuỳ ý: `node e2e/zoomrect.mjs http://localhost:4173/ /tmp/x.png <x> <y> <w> <h>`.
- Deploy: push lên `main` → GitHub Actions tự test + build + đăng GitHub Pages.

## Bản đồ code (chỉ mở file cần thiết)
- `src/render/plant_env.js` – `defs()`: TẤT CẢ gradient/pattern dùng chung; bầu trời, đồi, mặt đất.
- `src/render/plant_reactor.js` – vỏ bọc lò, thùng lò, lõi, bình điều áp, bình sinh hơi, bơm vòng 1, `pipeSvg()`.
- `src/render/plant_hall.js` – nhà tuabin, tuabin cao/hạ áp, máy phát, thanh dẫn 24 kV, bình ngưng.
- `src/render/plant_yard.js` – MBA, máy cắt, giàn, cột điện, dây, tháp làm mát, ống vòng 3 ngầm.
- `src/render/geometry.js` – toạ độ ống/dây dùng chung cho SVG và hạt. `src/render/flows.js` – hạt Canvas, khói.
- `src/render/labels.js` – nhãn; `src/styles.css` – giao diện bảng/nút/nhãn. `src/ui/parts.js` – thẻ thông tin.
- `src/sim/model.js` – mô hình vật lí. **Không sửa** khi làm đồ hoạ.

## Không được làm hỏng (code JS tìm các phần tử này)
- id: `cher vesselAlarm bcnA bcnAg bcnR bcnRg imp1 imp2 imp3 genTop genBot genTxtTop genTxtBot genRotor statorL blurHP blurLP vTSV vDump sgHeat przHeat sgSteamTint towerGroup busG`
  (trước khi xoá/đổi một `id` bất kỳ: `grep -rn "<id>" src`).
- class/thuộc tính: `.part` + `data-part` (chạm mở thẻ), `.pipe`, `.rodset`, `.asm`, `path.bb`, `path.bf`.
- Toạ độ trong `geometry.js` dùng chung cho SVG và hạt → đổi đường ống/dây ở SVG thì phải đổi ở đó, không vẽ lệch nhau.

## Quy tắc
1. Làm trên `main`. Commit nhỏ, message tiếng Việt, `git push origin main` sau mỗi phase.
2. Không thêm thư viện. Giữ mượt trên điện thoại: không thêm SVG `filter` (blur, drop-shadow), không thêm vòng lặp nặng mỗi khung.
3. Vật lí, cấu trúc nhà máy và ý nghĩa màu (vòng 1 đỏ, vòng 2 xanh dương/hơi xám, vòng 3 xanh ngọc, điện vàng) là đúng và cố định. Đồ hoạ chỉ được làm đẹp hơn, rõ hơn, không làm sai.
4. Sau mỗi bước: `npm test && npm run build` xanh → chụp bộ ảnh → tự so với ảnh trước. Chỗ nào không đẹp hơn rõ ràng → hoàn tác chỗ đó.
5. Không dùng subagent. Tiến độ ghi bằng checklist trong `TASK.md` để sau `/clear` làm tiếp được.
