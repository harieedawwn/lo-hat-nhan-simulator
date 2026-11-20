# CLAUDE.md – lo-hat-nhan-simulator

Mô phỏng 2D nhà máy điện hạt nhân PWR 1000 MW cho Vật lí 12. Vite + JS ES modules (không framework), một SVG tĩnh + Canvas 2D (hạt, khói), Web Audio, Vitest, Playwright. Mọi chữ hiển thị bằng tiếng Việt.

## Lệnh
- Cài: `npm ci` · test: `npm test` · build: `npm run build` · dev: `npm run dev` (cổng 5173)
- Server cho chụp ảnh: `npx vite preview --port 4173 &` (build lại thì chỉ cần tải lại trang)
- Bộ ảnh chuẩn (toàn cảnh 1600×900, điện thoại ngang 844×390, 4 vùng `1-lo 2-tuabin 3-dien 4-thap`): `npm run build && npm run shots -- /tmp/<tên>`
- Một vùng tuỳ ý (toạ độ thế giới): `npm run zoom -- /tmp/x.png <x> <y> <w> <h> [rộng=1200] [cao=700]`
- E2E: `npm run build && npm run e2e` (run.mjs tự bật preview 4173; hoặc `node e2e/run.mjs <url>`). Âm thanh: `node e2e/audio.mjs <url>`
- Tạo lại icon/OG/preview/`docs/hero.png`: `node e2e/assets.mjs <url>` (ghi đè file trong `public/`, `docs/`)
- Deploy: push `main` → `.github/workflows/deploy.yml` chạy test + build + đăng GitHub Pages.
- Trong trang có `window.__app` (stage, panel, sound, s, d, setRodTarget, scram…) để script e2e điều khiển.

## Bản đồ code (mở đúng file, đọc theo dòng)
- `index.html` – khung DOM giao diện (thanh trên, bảng, modal, màn khởi động); sửa khi thêm/bớt nút, thẻ bảng.
- `src/main.js` – ghép mọi thứ: bố cục theo màn hình, nút, phím tắt, vòng lặp khung (tối đa 10 bước DT/khung), `__app`.
- `src/styles.css` – toàn bộ giao diện: bảng, nút, nhãn, làm nổi bật vòng (`svg#svg[data-hl]`), breakpoint điện thoại.
- `src/audio.js` – âm thanh thủ tục Web Audio (`Sound`); sửa khi đổi tiếng.
- `src/sim/model.js` – mô hình vật lí thuần, không DOM (`createState step derive scram recover`). **Không sửa khi làm đồ hoạ/giao diện.**
- `src/sim/calc.js` – "Góc tính toán" (N phân hạch/s, ²³⁵U/ngày, E = mc², than). `src/sim/format.js` – định dạng số kiểu Việt (`fmt fmtSci`).
- `src/render/geometry.js` – toạ độ dùng chung SVG + hạt: `W=2450 H=1100 GROUND=900`, `PIPES FLOWS TUBE_A SG_X=520`, cột điện `TOWERS ARM_Y DEPTH GANTRY YARD`, dây `ELEC`, vùng camera `FOCUS`.
- `src/render/plant.js` – thứ tự lớp của nhóm `#world`. `plant_env.js` – `defs()` (mọi gradient/pattern/clipPath/symbol), `COL`, trời, đồi, cây, hồ, người, xe.
- `src/render/plant_reactor.js` – vỏ bọc lò, thùng lò, lõi, thanh điều khiển, bình điều áp, bình sinh hơi, bơm vòng 1, `pipeSvg()`.
- `src/render/plant_hall.js` – nhà tuabin, tuabin cao/hạ áp, máy phát, thanh dẫn 24 kV, van, bình ngưng.
- `src/render/plant_yard.js` – MBA, máy cắt, giàn, cột điện, dây 500 kV, tháp làm mát, ống vòng 3 ngầm.
- `src/render/scene.js` – cập nhật phần tử SVG theo mô hình mỗi khung (màu lõi, bơm quay, rôto, van…).
- `src/render/flows.js` – hạt Canvas trên đường ống/dây, khói tháp. `labels.js` – nhãn (`LABELS`, tránh chồng chéo).
- `src/render/stage.js` – dựng SVG + canvas + nhãn + kính lúp, gán `data-loop/data-top`, chạm mở thẻ. `camera.js` – kéo/zoom/chụm. `lens.js` – kính lúp "Bên trong lõi lò".
- `src/ui/panel.js` – bảng số liệu, đồng hồ, nhiệt kế, biểu đồ. `modals.js` – toast, popover, thẻ thông tin, trợ giúp, tour 4 bước.
- `src/ui/parts.js` – nội dung 28 thẻ bộ phận (`PARTS`, `LOOP_NAMES`). `inapp.js` – nhận diện Zalo/Facebook, toàn màn hình. `quality.js` – mức chất lượng tự động. `storage.js` – localStorage an toàn (`store`, khoá `pwr.*`).
- `tests/model.test.js` – Vitest cho model/calc/format. `e2e/` – `run.mjs` (kiểm thử + đo khung/giây), `shots.mjs`, `zoom.mjs`, `assets.mjs`, `audio.mjs`.

## Bất biến (JS tìm các phần tử này – grep trước khi đổi/xoá id, class)
- id SVG trong `scene.js`: `cher vesselAlarm bcnA bcnAg bcnR bcnRg imp1 imp2 imp3 genTop genBot genTxtTop genTxtBot blurHP blurLP vTSV vDump sgHeat przHeat sgSteamTint`; trong `stage.js`: `svg cam towerGroup` (+ `fx lab lensBox lensCv lensK vignette` do stage tự tạo).
- class/thuộc tính SVG: `.part` + `data-part` (chạm mở thẻ, khoá trong `PARTS`), `.pipe` + `l1/l2/l3` (làm nổi bật vòng), `.rodset`, `.asm`, `path.bb`, `path.bf` (cánh tuabin).
- id giao diện trong `index.html` được tìm bằng `$('…')` ở `main.js`, `panel.js`, `modals.js`: `grep -rn "'<id>'" src` trước khi đổi.
- `geometry.js` dùng chung cho SVG và hạt: đổi đường ống/dây thì đổi ở đây, không vẽ lệch ở SVG.
- Màu cố định: vòng 1 đỏ (có phóng xạ), vòng 2 xanh dương (nước) / xám nhạt (hơi), vòng 3 xanh ngọc, điện vàng. Ba vòng không bao giờ trộn lẫn.
- Vật lí (model.js, có test): P_nhiệt định mức 3000 MW; P_điện = 0,333·P_nhiệt ≈ 1000 MW; p_f* = w/80 (w = % rút thanh); p = 0,935·p_f + p_d; p_d → 6,5 % p_f, sau SCRAM theo Way–Wigner (nén ×10): ≈ 6–7 % sau 1 s, ≈ 3 % sau 1 phút thực, 1–2 % sau 1 giờ; SCRAM thanh rơi hết trong 2 s, k < 1; T_nóng = 291 + 33·p; tuabin 3000 vòng/phút, lên tốc 12 s, chạy đà 25 s; Cảnh báo p > 1,03 hoặc T_nóng > 325,5 °C; Quá nhiệt p > 1,10 hoặc > 327,5 °C → đếm ngược 5 s → SCRAM; p ≥ 1,18 tắt ngay; DT = 0,05 s.

## Tiết kiệm usage
- `grep -n` rồi Read theo `offset/limit`; không mở cả file lớn khi chỉ cần một hàm.
- Kiểm tra theo bậc: chỉ đổi code → `npm test && npm run build`; đổi hình → thêm 1 ảnh `npm run zoom` đúng vùng; đổi bố cục → đo rect/scrollHeight bằng script Playwright, chỉ xem ảnh khi nghi vấn; bộ `shots` đầy đủ chỉ chạy ở cuối.
- Refactor không đổi đầu ra: so `svg#svg.outerHTML`, danh sách id, `#panel.innerText` trước/sau (che các giá trị động: transform, opacity, cánh tuabin, thanh máy phát).
- Không dùng subagent. Việc nhiều phase: tạo `TASK.md` tạm làm checklist, xoá khi xong.

## Quy tắc
1. Làm trên `main`; commit nhỏ, message tiếng Việt; push sau mỗi phase.
2. Không thêm thư viện. Không thêm SVG `filter` (blur, drop-shadow), không thêm vòng lặp nặng mỗi khung: phải mượt trên điện thoại và trong trình duyệt của Zalo.
3. Vật lí, cấu trúc nhà máy, ý nghĩa màu là đúng và cố định; đồ hoạ chỉ được đẹp hơn, rõ hơn, không làm sai.
4. Sau mỗi bước: `npm test && npm run build` xanh; thay đổi hình thì so ảnh trước/sau, chỗ nào không đẹp hơn rõ ràng thì hoàn tác.
