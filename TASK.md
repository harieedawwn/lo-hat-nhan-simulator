# TASK – Nâng cấp đồ hoạ: gọn, rõ, bắt mắt (giữ đúng vật lí)

Mỗi phase: chụp ảnh trước → sửa → `npm test && npm run build` → chụp ảnh sau → so sánh → hoàn tác chỗ nào không đẹp hơn → đánh dấu [x] → commit → push.
Ảnh gốc ban đầu: `node e2e/shots.mjs /tmp/goc` (chụp 1 lần ở Phase 0, giữ để so cuối cùng).

## Chẩn đoán (vì sao đang "đúng nhưng rối và xấu")
1. **Không có thứ bậc thị giác**: nhà, nền, khung kèo, thiết bị chính, ống… đều cùng độ đậm, cùng tông xám-xanh nhạt → mắt không biết nhìn vào đâu.
2. **Nhiễu hoa văn**: pattern gạch chéo/bê tông/cốt thép (`pRebar`, `pPanel`, `pGravel`, `pStripe*`) phủ vỏ lò, nhà tuabin, tháp, mặt đất; vùng phóng xạ bọc bằng gạch chéo đỏ `pHatch` + viền nét đứt quanh lò, bình điều áp, bơm → trông bẩn.
3. **Khu điện quá dày**: nhiều sứ, nhiều cực máy cắt, pha "chiều sâu" mờ chồng nhau, dây chéo nhau và vắt ngang thân tháp làm mát.
4. **Hạt quá dày** trên mọi ống; nhãn trắng nhiều, đường dẫn nhãn cắt ngang thiết bị.
5. **Thiếu chiều sâu/ánh sáng**: vật thể phẳng, bóng đổ không thống nhất, nền nhạt như vật thể.

## Hệ thống hình ảnh (art direction) – áp dụng cho mọi phase
- **3 lớp độ đậm**:
  - *Nền* (trời, đồi, cây xa): nhạt, ít bão hoà, không viền.
  - *Bối cảnh* (nhà tuabin, vỏ bọc, móng, giàn, mặt đất): tường gần trắng `#F1F4F8`, mặt cắt `#E3E9F0`, nét mảnh 1 px `#A3B0C2`, **không hoa văn**.
  - *Nhân vật chính* (lò, bình sinh hơi, bình điều áp, bơm, tuabin, máy phát, bình ngưng, MBA, máy cắt, cột, tháp, ống): bão hoà hơn, viền mực `#1E2A44` 1,6 px, có khối sáng–tối.
- **Một nguồn sáng** từ trên-trái: mọi trụ/ống có dải sáng mảnh phía trên-trái và tối dần xuống dưới-phải; bóng tiếp đất là elip mềm `gAO` cùng một độ đậm.
- **Bảng màu** (dùng lại, không tự chế thêm màu mới):
  - Vòng 1: nóng `#D7303A`, lạnh `#EA6E66`. Vòng 2: nước `#2F6FD0`, hơi `#CCD9EA`. Vòng 3: `#12A19E` / `#5BC8AE`.
  - Thép: `#F5F8FB → #C5CFDB → #8C99AD`. Đồng/điện: `#E2A53B`, viền `#8A5A14`. Sứ: `#EBDDC4`, khấc `#A07E55`. Bê tông: `#DCE2E9`.
  - Mặt đất: `#EADFCB`, mặt cắt dưới đất `#DCCDB3 → #CDBB9C`. Trời: `#DCEAF6 → #F4F8FC`. Nhấn cảnh báo: `#C62828`.
- **Vùng phóng xạ**: thay gạch chéo + nét đứt bằng nền tô đỏ rất nhạt `rgba(215,48,58,.07)`, bo góc, viền liền mảnh `rgba(198,40,40,.35)`; giữ biển ☢.
- Không SVG `filter`. Gradient chỉ khai báo trong `defs()`; dùng lại id có sẵn khi được.

## Phase 0 – Ảnh gốc
- [ ] `npm ci` (nếu chưa), `npx vite preview --port 4173 &`, `npm run build && node e2e/shots.mjs /tmp/goc`. Xem cả 6 ảnh.

## Phase 1 – Toàn cục: nền, hoa văn, bảng màu (`plant_env.js`)
- [ ] Bỏ (hoặc giảm còn ≤ 15 % độ mờ) mọi pattern nhiễu: `pRebar`, `pPanel`, `pGravel`, `pStripe`, `pStripe2`. Giữ `pFuel` (thanh nhiên liệu) và `pFill` (lớp đệm tháp) nhưng làm mảnh/nhạt hơn.
- [ ] Trời, đồi, mặt đất, mặt cắt dưới đất theo bảng màu; đồi xa nhạt hơn để đẩy lùi ra sau.
- [ ] Chỉnh các gradient kim loại/sơn theo "một nguồn sáng".
- [ ] Commit "Đồ hoạ: nền sạch, bỏ hoa văn nhiễu, bảng màu thống nhất".

## Phase 2 – Khu lò phản ứng (`plant_reactor.js`)
- [ ] Vùng phóng xạ theo quy tắc ở trên (không còn `pHatch` gạch chéo quanh ống vòng 1 và các thiết bị).
- [ ] Vỏ bọc bê tông: lớp *bối cảnh* (mặt cắt sạch, viền mảnh); thùng lò, bình sinh hơi, bình điều áp, bơm: lớp *nhân vật chính*, khối rõ.
- [ ] Đường nét đứt xanh từ kính lúp tới lõi: mảnh, nhạt hơn.
- [ ] Commit, push.

## Phase 3 – Nhà tuabin (`plant_hall.js`)
- [ ] Khung kèo mái, dải cửa sổ, cột nhà: lớp *bối cảnh* (nhạt, mảnh) để tuabin – máy phát nổi lên.
- [ ] Tuabin cao/hạ áp, máy phát (stato đồng, rôto N đỏ/S xanh), bình ngưng: khối sáng–tối rõ, viền mực.
- [ ] Commit, push.

## Phase 4 – Khu điện & đường dây (`plant_yard.js`, `geometry.js` nếu cần)
Giữ nguyên **cấu trúc mạch** (máy phát → 2 thanh dẫn 24 kV → MBA → máy cắt → giàn → cột → đường dây, và dây 500 kV đã thêm). Chỉ làm gọn:
- [ ] Pha "chiều sâu" phía sau nhạt hơn nữa, pha trước rõ; dây không chéo nhau, độ võng đều, bề dày thống nhất.
- [ ] Sứ, máy cắt, MBA theo bảng màu (sứ gốm ấm, thân MBA xanh lục có cánh tản nhiệt rõ).
- [ ] Chỗ dây truyền tải vắt ngang thân tháp làm mát: làm sao đọc được rõ (ví dụ dây đậm hơn, tháp phía sau nhạt hơn một bậc). Được phép dịch nhẹ dây/cột nếu giảm rối mà vẫn đúng mạch; nhớ cập nhật `geometry.js`.
- [ ] Kiểm tra lại dao động xoay chiều của hạt điện vẫn chạy đúng. Commit, push.

## Phase 5 – Tháp làm mát, nước, cảnh quan (`plant_yard.js`, `plant_env.js`)
- [ ] Vỏ tháp hyperbol: khối tròn bằng gradient ngang (sáng trái, tối phải), không hoa văn cốt thép; lớp đệm, vòi phun, bể nước gọn.
- [ ] Sông/hồ, cây, người, xe: hài hoà bảng màu, không tranh chú ý.
- [ ] Commit, push.

## Phase 6 – Hạt, nhãn, hoàn thiện
- [ ] `flows.js`: giảm mật độ hạt dòng chảy ~30 % (không đổi tốc độ, chiều, cách điều khiển); hạt điện giữ nguyên.
- [ ] `labels.js` + `styles.css`: nhãn gọn hơn (bóng nhẹ, viền mảnh), đường dẫn nhãn mảnh/nhạt; ở toàn cảnh chỉ hiện nhãn ưu tiên cao, nhãn còn lại hiện khi phóng to (nếu hệ nhãn có sẵn cơ chế ưu tiên `p` thì dùng nó).
- [ ] So bộ ảnh cuối với `/tmp/goc`: nhìn toàn cảnh 2 giây phải nhận ra ngay 5 khối: lò – tuabin/máy phát – khu điện – tháp làm mát – sông; ảnh điện thoại không rối hơn.
- [ ] `node e2e/run.mjs` (bỏ qua nếu lỗi môi trường). Cập nhật `docs/hero.png` bằng ảnh `0-toan-canh.png` mới. Commit "Hoàn thiện đồ hoạ", push, kiểm tra GitHub Actions xanh.
