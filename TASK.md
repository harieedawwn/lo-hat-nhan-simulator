# TASK – Dòng điện xoay chiều + dây mới + làm đẹp đồ hoạ

Làm lần lượt từng phase. Xong phase nào: `npm test && npm run build` xanh → chụp ảnh tự kiểm tra → đánh dấu [x] ở đây → commit → `git push origin main`.
Toạ độ dưới đây là toạ độ thế giới SVG (2450×1100, mặt đất y = 900). Ảnh tham khảo (nếu có) ở `docs/yeu-cau/`.

## Vật lí phải tuân theo (Vật lí 12 – dòng điện xoay chiều, máy phát, máy biến áp)
- Máy phát tạo dòng **xoay chiều** i = I₀·cos(ωt + φ). Thực tế f = 50 Hz (đổi chiều 100 lần/giây); trong hình **làm chậm** để mắt thấy được.
- **Electron không chạy một chiều từ nhà máy ra lưới**: chúng **dao động qua lại tại chỗ** dọc dây. Cái đi một chiều (máy phát → lưới) là **năng lượng** → giữ các mũi tên `chevron` vàng chỉ chiều năng lượng.
- Đồng bộ với rôto: máy phát 2 cực (p = 1) → **1 vòng quay rôto = 1 chu kì dòng điện**. Dùng luôn góc `this.theta` của rôto trong `src/render/scene.js` (đang quay 0,8 vòng/s) làm pha: pha điện = `theta`. Truyền giá trị này sang `Flows` mỗi khung (qua chỗ đang gọi cả hai, ví dụ `main.js`/`stage.js`); KHÔNG tạo đồng hồ riêng.
- Mạch kín (như hình máy phát một pha trong SGK): **dây đi và dây về luôn có dòng ngược chiều nhau** (lệch pha π), cùng đổi chiều theo chu kì.
- Biên độ dao động ∝ cường độ dòng điện: phía 24 kV **dòng lớn** → dao động rộng; phía 500 kV **dòng nhỏ** (≈ 20 lần nhỏ hơn, P = UI) → dao động hẹp hơn hẳn. Mọi biên độ nhân `min(1, dr.pe)`; `pe ≈ 0` (ngắt tuabin/SCRAM, không hoà lưới) → **đứng yên, không có dòng**.

## Phase 1 – Dao động xoay chiều + dây thứ 2 phía 24 kV
- [ ] **1a. Hạt điện dao động** (`src/render/flows.js`, chỉ phần hạt điện `this.elec`; KHÔNG đụng hạt nước/hơi):
  - Mỗi hạt có vị trí gốc cố định `s0` (rải đều theo `gap`); vị trí vẽ `s = s0 + A·sin(theta + φ_dây)` (độ dời là tích phân của i ∝ cos).
  - Độ sáng quầng (lượt vẽ `pass = 0`) ∝ |cos(theta + φ_dây)| = |i| → sáng nhất khi dòng cực đại, gần tắt khi dòng đổi chiều. Chấm lõi giữ nguyên.
  - Thêm vào mỗi mục `ELEC` (`src/render/geometry.js`) hai trường: `amp` (px) và `ph` (rad). Gợi ý: 24 kV `amp: 12`; 500 kV `amp: 4`.
  - 3 pha 500 kV hiện có (`ph0..ph2`): `ph = 0, −2π/3, −4π/3` (đúng 3 pha lệch 120°). Thanh dẫn 24 kV hiện có (`bus`): `ph = 0`.
  - Bỏ chuyển động trôi một chiều của hạt điện (`pos += speed·dt`) – thay bằng dao động ở trên.
- [ ] **1b. Dây thứ 2 phía 24 kV** (đúng nét đỏ chủ repo vẽ trong ảnh 2): một thanh dẫn song song, nằm **bên trong** vòng thanh dẫn vàng hiện có, không cắt nó:
  - Đầu máy phát: thêm cực ra thứ 2 cạnh cực hiện có (`rect x=1280 y=578 w=12 h=14` trong `plant_hall.js`), ví dụ `x≈1298`.
  - Đường đi gợi ý: `M1304,590 V556 H1394 V775` (trong vòng `M1285,590 V540 H1410 V775`). Vẽ cùng kiểu 3 lớp như `#busG` (viền tối, thân, ánh sáng), thân màu đồng hơi khác vàng một chút để phân biệt; bề rộng nhỏ hơn 1 chút.
  - Đầu MBA: thêm sứ hạ áp thứ 2 trên nắp MBA tại x≈1394 (cạnh sứ hạ áp 1402–1418 ở `plant_yard.js`), cùng kiểu.
  - Thêm vào `ELEC`: `{ id: 'bus2', d: <cùng đường>, gap: 15, amp: 12, ph: Math.PI, alpha: 1 }` – cùng chiều tham số (máy phát → MBA) với `bus` nên lệch π ⇒ luôn ngược chiều dây kia ⇒ thấy dòng điện chạy vòng khép kín qua cuộn dây máy phát và cuộn sơ cấp MBA.
  - Cho phần tử mới `data-part="busduct"` để chạm vào mở thẻ thông tin.
- [ ] **1c. Chữ**: thẻ `busduct` trong `src/ui/parts.js` thêm 1–2 câu: “Dòng điện xoay chiều 50 Hz: electron chỉ dao động qua lại, đổi chiều 100 lần mỗi giây; năng lượng thì truyền một chiều từ máy phát tới máy biến áp. Hai dây đi – về luôn có dòng ngược chiều nhau (mạch kín). Trong hình đã làm chậm.” Thêm nhãn nhỏ cạnh thanh dẫn: `~ 50 Hz (làm chậm)` trong `labels.js` (độ ưu tiên thấp, `sm: 1`).
- [ ] **1d. Kiểm tra**: test + build; chụp vùng `1130 500 330 300` ở 2–3 thời điểm khác nhau (cách nhau ~0,3 s) → hai dây phải dao động ngược nhau, đồng bộ với rôto; ấn SCRAM (hoặc đặt `pe` = 0) → hạt đứng yên. Commit “Dòng điện xoay chiều dao động + dây đi–về 24 kV”, push.

## Phase 2 – Dây mới phía 500 kV: MBA → lên → máy cắt → cột điện (ảnh 3, 4)
Nét đen chủ repo vẽ: từ nắp MBA (phía phải, gần bình dầu phụ) **đi thẳng lên**, rồi **nối qua máy cắt điện**, rồi từ máy cắt **kéo sang cột điện** (TOWER_A, x = 1768) ở **một xà thấp hơn các xà hiện có**, tiếp tục qua các cột sau như dây hiện có.
- [ ] **2a. Sứ ra mới** trên nắp MBA tại x≈1478 (nắp MBA x 1388–1492, sứ cao áp hiện có quanh x 1446–1460), cao lên tới y≈664 giống `hvBushings()`.
- [ ] **2b. Một cực máy cắt riêng** cho dây mới, dùng lại `breaker()`, đặt sao cho tách biệt, không chồng các cực đang có (ví dụ pha “trước” `k = −1` → tịnh tiến `−DEPTH`, hoặc dịch sang phải ~30 px – chọn cách nhìn rõ nhất, xác nhận bằng ảnh chụp). Kèm chuỗi sứ néo trên giàn như `strainChain()`.
- [ ] **2c. Dây**: sứ mới → (đường cong Bezier đi lên rồi sang, giống `IN_SEGS`) → sứ vào máy cắt mới → (giống `OUT_SEGS`) → điểm néo trên giàn → xà mới của TOWER_A tại `y = 695` → qua mọi cột trong `TOWERS` tới `LINE_END` (như `linePhase`). Thêm xà mới `y = 695` cho **tất cả** cột trong `transmission()` (cùng kiểu xà + sứ treo). Dây không được cắt qua thân cột, MBA hay máy cắt khác.
- [ ] **2d. Dòng điện**: thêm vào `ELEC` `{ id: 'ret5', d: <đường hạt giống phasePath>, gap: 34, amp: 4, ph: Math.PI, alpha: 1 }` – dây về của mạch thứ cấp (ngược pha pha trước `ph0`), dao động ngược chiều như cặp dây 24 kV. Thêm 1 `chevron` chỉ chiều năng lượng trên dây mới.
- [ ] **2e. Chữ**: nhãn ngắn cho cực máy cắt mới nếu cần (tránh chồng nhãn `brk`); thẻ `switchyard`/`lines` thêm 1 câu: “Phía 500 kV dòng điện nhỏ hơn ≈ 20 lần nên electron dao động hẹp hơn; hao phí P²R/U² giảm ≈ 400 lần.”
- [ ] **2f. Kiểm tra**: chụp `1360 520 460 400` và `1120 480 760 440` → mạch liền mạch, không chồng/cắt, đẹp. Commit “Dây 500 kV mới: MBA → máy cắt → cột”, push.

## Phase 3 – Làm đẹp đồ hoạ (nhanh, an toàn)
Mục tiêu: đẹp hơn, **không được xấu hơn, không được sai hình**. Chỉ chỉnh màu/gradient/viền/bóng; **không đổi hình dạng, toạ độ, bố cục** bộ phận cũ.
- [ ] **3a. Ảnh “trước”**: chụp toàn cảnh `0 90 2450 1010` (vw 1600 vh 700) và 4 vùng: lò `50 150 690 800`, tuabin `690 440 700 480`, khu điện `1120 480 760 440`, tháp `1780 40 680 1000` → lưu `/tmp/before_*.png`.
- [ ] **3b. Chỉnh** (tối đa ~6 thay đổi nhỏ, ưu tiên `defs()` trong `plant_env.js` và màu trong các file `plant_*.js`): gradient kim loại có điểm sáng mềm hơn; bóng đổ (`gAO`) dịu và nhất quán; độ dày nét viền thống nhất; thanh dẫn đồng/vàng có ánh kim; sứ cách điện màu gốm ấm rõ khấc; màu vòng 1 đỏ / vòng 2 xanh dương / vòng 3 xanh ngọc giữ nguyên ý nghĩa, chỉ hài hoà độ bão hoà. Không thêm `filter` blur/drop-shadow SVG (nặng trên điện thoại).
- [ ] **3c. Ảnh “sau”** cùng vùng, so sánh từng cặp. Thay đổi nào không rõ ràng đẹp hơn → hoàn tác thay đổi đó. Chạy `node e2e/perf.mjs` nếu chạy được để chắc FPS không giảm.
- [ ] **3d.** Commit “Làm đẹp màu sắc, gradient”, push.

## Phase 4 – Chốt
- [ ] `npm test && npm run build`; `node e2e/run.mjs` (nếu lỗi môi trường Playwright thì bỏ qua, ghi lại).
- [ ] Kiểm tra GitHub Actions: `gh run list -L 1` / `gh run watch` (nếu có `gh`), hoặc báo link https://github.com/harieedawwn/lo-hat-nhan-simulator/actions.
- [ ] Cập nhật README mục “Giả thiết của mô hình”: 1 gạch đầu dòng về dòng xoay chiều làm chậm, đồng bộ rôto, mạch đi–về. Cập nhật `PLAN.md` phần Trạng thái. Commit, push.
