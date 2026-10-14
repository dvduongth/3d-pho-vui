# Phố Vui (Happy Street) — GDD v1.1

> **Author:** daniel duong · **Ngày:** 14/10/2026  
> **Cập nhật v1.1:** bổ sung §17 về minigame hội chợ, căn lực–Luck, lưu lượt riêng theo quầy và công cụ thử nghiệm. Giữ cấu trúc §1–16; §17 ghi rõ phạm vi thay thế và tình trạng triển khai.
> **Tài liệu:** Game PRD, giữ cấu trúc GDD v1 và cập nhật các quyết định đã chốt trong phỏng vấn.  
> **Trạng thái:** ĐÃ CHỐT về hướng thiết kế; các giá trị `Proposed` cần kiểm chứng bằng playtest. Không mặc định các hệ thống đã được triển khai.  
> **Nguồn sự thật duy nhất về cơ chế chơi:** tài liệu này. Các tài liệu lịch sử không được ghi đè những quyết định bên dưới.  
> **Stack:** Three.js 3D + Vite + TypeScript, chạy trên trình duyệt; phiên bản **as pinned in the project's package.json**.  
> **Hạ tầng liên quan:** spec DB/phiên/collider được dẫn chiếu trong GDD gốc. Nội dung spec đó chưa được cung cấp trong cuộc trao đổi này; không xem ZPS, Database hoặc Multiplayer là đã tích hợp.

## 1. Fantasy và người chơi

- **Fantasy.** Bạn là một cư dân của Phố Vui: một khu phố Việt ấm áp, đông người, nơi bạn **làm giỏi một việc, được cả phố biết tên, và có đồ để khoe**. Phố nhớ bạn: NPC gọi tên, nhắc lại việc bạn đã làm, và tên bạn lên bảng vinh danh.
- **Tham chiếu.** Avatar: Thành Phố Diệu Kỳ. Giữ ba trải nghiệm: **avatar là chính mình, gặp nhau trong phố, khoe thành tích**. Tạo bản sắc riêng bằng phố Việt 3D ấm áp; không sao chép tên, nhân vật hay mỹ thuật của game tham chiếu.
- **Thể loại.** Game xã hội 3D với minigame và thi đua nhẹ. Câu cá là core loop; nhảy phục vụ di chuyển và thể hiện, không biến game thành platformer thu thập.
- **Người chơi mục tiêu.** Nhân viên văn phòng và người chơi casual, phiên 5–20 phút, **máy không có card đồ hoạ rời**: laptop Intel/AMD tích hợp. Chơi trên trình duyệt, đăng nhập ZPS; hỗ trợ điện thoại màn hình ngang. Chơi chung tối đa 30 người mỗi phòng.
- **Ba lời hứa** — mọi tính năng phải phục vụ cả ba:
  1. **Dễ.** Vào là biết làm gì, không phải đọc hướng dẫn, mỗi màn hình chỉ một việc chính.
  2. **Thấy được.** Mọi thành tích đều *người khác nhìn thấy*: thẻ tên, áo, bảng vinh danh, câu ông Tư đọc tên.
  3. **Cạnh tranh nhẹ.** Thi theo vòng ngắn, ai cũng có cơ hội, người chơi phiên ngắn vẫn thắng được.

## 2. Vòng chơi lõi

```text
Câu cá ở hồ ông Tư ──► Server chấm con cá: loài × độ chuẩn khi giật
        ▲                              │
        │                              ▼
Mặc đồ mới, đổi danh hiệu     Cả phòng nghe ông Tư đọc tên
và giao lưu trong phố         + bảng vinh danh ở đài sen
        ▲                              │
        └──── Xu + danh hiệu + đồ hiếm ◄┘
                 theo vòng / huy hiệu
```

- **Moment-to-moment.** Thả câu, quan sát kim chạy qua lại, giật khi kim vào vùng bắt cá. Dễ bắt được cá nhưng khó đạt độ chuẩn tuyệt đối. Giật hụt thì cá thoát, không mất lượt, có gợi ý “Sớm quá” hoặc “Muộn rồi” và được thử lại nhanh.
- **Chấm cá.** Kỹ năng quyết định hoàn toàn: cùng loài và cùng độ chuẩn thì cùng cân nặng. Không có random ngầm làm thay đổi cân nặng.
- **Vòng ngắn.** 12 phút thật = 1 ngày game. Mỗi vòng, đạo diễn phố rao một **đề thi** trên bảng tin và chat chung. Con cá to nhất vòng thắng.
- **Vòng ngày.** Theo giờ thật, reset 05:00 giờ Việt Nam. Bảng ngày theo từng môn; danh hiệu ngày tồn tại 24 giờ.
- **Vòng tuần.** Người nhất tuần được ghi tên lên biển Biệt thự ở trung tâm phố.
- **Lý do quay lại.** Danh hiệu sắp hết hạn, bảng ngày reset, lượt thi hồi dần, ông Tư còn nhớ con cá hôm qua của bạn.
- **Session loop.** Vào phố → tham gia hoạt động → xem phản hồi và thứ hạng → nhận hoặc sử dụng phần thưởng → mặc đồ, giao lưu, thi lại. Không có màn kết thúc toàn bộ game.

## 3. Mười lăm phút đầu (hợp đồng)

| Phút | Người chơi làm | Phản hồi phải có |
|---|---|---|
| 0–1 | Tạo nhân vật, chọn dáng có sẵn hoặc 🎲, bấm “Vào phố” | Cả phố quay ra chào, NPC gọi tên |
| 1–4 | Mục tiêu đầu tiên **duy nhất**: theo mũi tên tới ông Tư, bấm E | Ông Tư giao việc “câu thử một con”, +24 xu, câu thoại có tên mình |
| 4–8 | Câu cá: thả câu, canh kim, giật | Hiệu ứng, âm thanh, tên loài + kg, toast; server chấm |
| 8–10 | Chứng kiến thành tích được công nhận | Chat chung: “Ông Tư: Minh vừa giật cá chép 0,8 kg!”. Người khác cũng thấy, đám đông gần đó cổ vũ |
| 10–13 | Mua một món đồ ở shop, mặc luôn | Cả phòng thấy đồ mới, NPC khen |
| 13–15 | Xem bảng ở đài sen | “Vòng này: 1. … 2. Minh”. Ông Tư hẹn vòng sau hoặc mai |

Nhập môn chỉ dạy **4 cơ chế**: đi và nói chuyện, câu cá, mua và mặc đồ, vòng câu.

**Cập nhật đã chốt:** tính năng mở theo **thời gian chơi tích lũy riêng của người chơi**, không phải ngày thật hay tuổi của phòng:

- Ngày 1: có ngay khi bắt đầu.
- Ngày 2: mở khi đủ 12 phút chơi tích lũy.
- Ngày 3: mở khi đủ 24 phút chơi tích lũy.
- Không reset khi đổi phòng; tiến độ mở tính năng phải được lưu.
- Mở tính năng không thay mục tiêu nhập môn đang làm và không cắt ngang lượt câu. Thông báo mở nhỏ, không ép người chơi chuyển hoạt động — `Proposed`.
- Chỉ cộng thời gian khi game đang hiển thị; không cộng thời gian tab ẩn hoặc offline — `Proposed`.

Mốc phút của nhập môn tính từ lúc vào phố, độc lập với thời điểm vòng thi chung kết thúc. Thành tích bắt cá được công bố ngay, không phải đợi thắng vòng.

## 4. Điều khiển và UX (đã có, giữ)

- **Desktop.** Giữ chuột trái rồi kéo để đi; bấm nhanh để đi tới chỗ đó bằng A*. Bấm vào người hoặc quầy thì đi tới và tương tác. Có thể đi bằng WASD. Bấm E để tương tác, Space để nhảy. Giữ chuột giữa và kéo để orbit camera.
- **Khi đang câu.** Space chuyển thành **Giật**, không đồng thời làm nhân vật nhảy. Có nút Giật trên panel.
- **Điện thoại.** Màn hình ngang, joystick bên trái, chạm xuống đường để đi, nút ✋ để tương tác. Vuốt vùng trống bên phải để orbit; camera tự theo khi di chuyển và nhường quyền khi người chơi chủ động xoay.
- **Nhân vật.** Trượt dọc tường, né người, A* vòng quanh nhà. NPC và đám đông cũng tìm đường.
- **Camera.** Không để gì che nhân vật: đèn lồng hoặc người đứng sát ống kính thì mờ đi; nhà chắn giữa thì làm trong suốt. Camera theo nhân vật và có thể orbit; tránh chui vào mái nhà hoặc để mái nhà che kín màn hình.
- **HUD** chỉ còn:
  - Góc trên trái: thẻ nhân vật, tên và danh hiệu.
  - Góc trên phải: giờ, xu, số người online, cài đặt.
  - Thanh hành động dưới.
  - Khung mục tiêu gọn.
  - Không còn thước nhu cầu, chip hạn mức, Pot hay nút tốc độ.
- **Mỗi hành động** đều có phản hồi: hiệu ứng bằng 1 lệnh vẽ, âm thanh, toast, vật phẩm bay vào túi khi phù hợp. Nút bị khoá vẫn giải thích lý do khi chạm vào.
- **Ưu tiên thị giác.** Không tái tạo tình trạng nhiều panel cạnh tranh sự chú ý trong ảnh bản hiện tại. Panel hoạt động đang chơi là trọng tâm; mở tính năng mới không chồng thêm tác vụ bắt buộc — `Proposed`.

## 5. Các hệ thống

| Hệ | Quyết định | Ngày mở | Ghi chú |
|---|---|---|---|
| **Câu cá — hồ ông Tư** | **Lõi**, đào sâu | 1 | Kim chạy qua lại; giữa vùng xanh ra cá lóc, lưng chừng ra cá chép, sát mép ra cá rô. Cân nặng theo loài × độ chuẩn. Server chấm. Dùng lượt thi hồi dần, không dùng thước năng lượng |
| **Shop + tủ đồ** | **Gộp** thành một tủ | 1 | Đồ thường mua bằng xu; đồ hiếm chỉ nhận khi **thắng thi hoặc đạt huy hiệu**. Lưu theo tài khoản: `worn`, `owned`; mặc vào phát `wear` cho cả phòng. Bỏ hai hệ áo trùng: `outfit.ts SHIRTS` và áo trùng trong `look.ts` |
| **Caro với chị Hoa** | Giữ | 1, tự khám phá | Cược 0–20 xu. **Bỏ trần** khi chơi không cược |
| **Caro hai người** | Giữ, thành giải | 2 | Server phân xử. Thưởng khoá theo tài khoản, không theo tên |
| **Việc NPC** | **Gộp** | 1 | Ngày 1 chỉ có việc ông Tư: “câu thử một con”. Từ ngày 2, việc trở thành **đề thi** trên bảng tin. Sửa lời thoại lệch giá |
| **Vườn cô Lan** | Giữ, ẩn ngày 1 | 2 | Gieo, tưới, thu, bán. Về sau thi rau theo tuần |
| **Chuồng chú Sáu** | Gộp vào vườn, ẩn ban đầu | 3 | Có bốn bước chờ đợi nên không đưa vào vòng sớm |
| **Thuê xe / máy bay** | Giữ | 2 | Chỗ tiêu xu mà người khác thấy. Một chuyến máy bay miễn phí là phần thưởng thi |
| **Emote** | Giữ | 1 | Vẫy, ôm, đập tay, tặng hoa, đá đít. Vui/Thân/Trí trở thành **điều kiện danh hiệu**, không còn là số trơ |
| **Nói chuyện NPC / người qua đường — LLM** | Giữ | 1 | NPC nhắc lại thành tích thật: cá to nhất, danh hiệu |
| **Bảng tin + đạo diễn phố** | Giữ, **lên server** | 1 | Server công bố đề thi và kết quả cho cả phòng; không chạy lịch riêng trên từng máy |
| **Ảnh** | Giữ | 2 | Lưu trên máy người chơi; ảnh lớn không lên server |
| **Nhà 3 cấp** | Sửa | 3 | Biển tên Biệt thự = người nhất tuần |
| **Hạn mức chống cày** | Giữ **ngầm** | — | Không hiện chip. Điểm thi do server tính. Kiểm lượt **trước** khi thả câu |
| Vé số, đi học, đi ngủ, gọi AI đèn/sách, bán chén, chip Pot | **CẮT** | — | Di sản “Nuôi con”: chỉ chạy một lần, không tới được hoặc không ai dùng |
| Ba thước nhu cầu: Năng lượng / No bụng / Tâm trạng | **CẮT** khỏi HUD và luật chơi | — | Giữ trường cũ trong save để không mất ví, xem §9 |
| Nút tốc độ 1x/2x/3x | **CẮT** | — | Online bị server kéo lùi. Độ dài ngày vẫn chỉnh trong Cài đặt khi chơi offline |

### Luật lượt câu đã chốt

- Ban đầu có **30 lượt**, tích tối đa **30 lượt**.
- Hồi **1 lượt mỗi 24 phút thực**, kể cả offline. Nhịp hồi do server xác định khi online.
- Reset bảng ngày không cấp thêm một đợt lượt.
- **Chỉ trừ lượt khi bắt được cá trong chế độ thi.** Giật hụt không mất lượt.
- Hết lượt vẫn câu **Luyện tập** và giao lưu được; không nhận xu, điểm thi, huy hiệu hay tiến độ thành tích từ lượt luyện tập.
- Ghi rõ “Luyện tập” trước khi thả câu, không đợi đến màn kết quả mới thông báo.
- Không hiện chip chống cày trên HUD. Panel câu cá có thể giải thích lượt và thời gian hồi khi cần — `Proposed`.
- Một lượt luyện tập đã bắt đầu vẫn là luyện tập dù lượt thi vừa hồi giữa chừng — `Proposed`.

Các con số hồi lượt xuất phát từ đề xuất và đã được người dùng đồng ý sử dụng; cần kiểm chứng nhịp chơi thực tế.

## 6. Thi đua và khoe thành tích

Nguyên tắc: **điểm chỉ lấy từ sự kiện server tự chấm**, không bao giờ tin số client gửi lên. Guest không lên bảng nhưng vẫn chơi được. Phần thưởng là **địa vị**, xu chỉ ở mức vừa phải.

| Thể thức | Cách vào | Tính điểm | Server ghi | Thưởng | Khoe |
|---|---|---|---|---|---|
| **Vòng câu** — mỗi ngày game; khi có ≥ 2 người, một mình thì đấu với người chơi giả | Câu ở chế độ thi trong vòng là tự vào | **Con to nhất**, không cộng dồn. Cùng loài và độ chuẩn cho cùng cân nặng | Server cấp `cast {seed, t0}`, nhận `pull {t}`, tự chấm bằng `needleAt` / `judgePull`, chấp nhận trễ ≤ 150 ms; lưu kỷ lục từng vòng | Nhất: “Vua câu” 24 giờ + 1 chuyến máy bay. Top 3: xu nhỏ. Người tham gia được ông Tư nhắc tên hôm sau | Ông Tư đọc tên trong chat chung, `townCheer`, bảng 3 dòng ở đài sen, danh hiệu trên thẻ tên |
| **Giải caro chiều** — 14–17h game | Ván hai người trong khung giờ | Thắng 3, hoà 1. Mỗi cặp tính tối đa 2 ván mỗi ngày. Ván dưới 9 quân không tính. Hai tài khoản cùng IP không tính | Đã có trong `hub.ts` theo GDD; bổ sung khoá theo tài khoản và trần theo cặp | “Kỳ thủ phố Chiếu” 24 giờ | Khán giả xem bàn cờ, đọc tên |
| **Huy hiệu** — một lần | Tự động | Ví dụ: con cá lóc đầu tiên, cá ≥ 2 kg, hạ chị Hoa mức Khó, 10 người đã vẫy chào mình, nhất 1 vòng câu | Chỉ trao khi điều kiện được server xác thực | Đồ hiếm độc quyền, không bán | Huy hiệu trên thẻ tên, ô “Thành tích” trong thẻ nhân vật |
| **Bảng ngày / tuần** | Tự động theo môn: câu, caro | Câu cá ngày: tổng cân nặng cá tốt nhất của **3 vòng tốt nhất**. Chơi ít hơn thì cộng những vòng đã chơi. Tuần: tổng điểm các ngày. Caro giữ nguyên nguyên tắc tổng 3 vòng tốt nhất ngày | Postgres, theo tài khoản; bảng ngày reset 05:00 giờ Việt Nam | Ngày: khung ◆/★ trên thẻ tên 24 giờ. Tuần: tên trên biển Biệt thự + đồ hiếm tuần | Bảng ở đài sen + tab “Bảng vàng” |

### Công bằng

- Cân nặng do kỹ năng quyết định hoàn toàn, không random ngầm.
- Bảng thi dùng độ chính xác đầy đủ của kết quả server, không dùng số kg đã làm tròn trên HUD.
- **Đồng hạng nhất vòng câu:** cùng nhận đầy đủ danh hiệu và phần thưởng. Không xét ai bắt sớm hơn, không ép đấu thêm.
- Chấm con to nhất và 3 vòng tốt nhất, để người chơi phiên ngắn vẫn có cơ hội.
- Vòng lặp suốt ngày, không giới hạn cơ hội tham gia vào một khung giờ thật duy nhất.
- Có hạng **“Người mới”** cho tài khoản dưới 3 ngày thật, với bảng riêng.
- Thưởng tham gia là được phố gọi tên, không phải xu.
- Nhãn “Người mới” theo tuổi tài khoản thật, không theo mốc mở tính năng.
- Bảng đài sen giữ 3 dòng; danh sách đầy đủ và các trường hợp đồng hạng xem trong “Bảng vàng”, không cắt phần thưởng vì giới hạn hiển thị — `Proposed`.

### Chống gian

- Khoá theo tài khoản ZPS, xác minh bằng SSO resolver.
- Guest bị loại khỏi bảng.
- Một tài khoản chỉ một phiên.
- Không xếp hạng ví, vườn, chuồng hay caro với chị Hoa vì các hệ này chạy ở client.
- `seed` phục vụ tái hiện lượt câu; không được thêm hệ số may mắn vào cân nặng.
- Server xác thực thời điểm giật trong lượt đã cấp; không nhận cân nặng hoặc loài do client tự khai.
- Huy hiệu liên quan đến caro với chị Hoa chỉ được kích hoạt khi có cách xác thực server phù hợp; không tin cờ “đã thắng” từ client — `Proposed`.

### Chi tiết còn cần đặc tả — `Proposed`

- Bảng tuần đổi kỳ vào 05:00 thứ Hai, giờ Việt Nam.
- Một vòng caro dùng cùng ranh giới ngày game; điểm ngày lấy tổng điểm của 3 vòng đủ điều kiện cao nhất.
- “Mỗi cặp tối đa 2 ván mỗi ngày” áp dụng theo ngày thật của bảng thi.
- Người chơi giả được ghi rõ là đối thủ mô phỏng, không tạo tài khoản giả trên bảng ngày/tuần và không chiếm phần thưởng của người thật.
- Hàm loài × độ chuẩn phải tăng nhất quán theo độ chuẩn; ranh giới loài không tạo lợi thế cho cú giật kém chuẩn hơn. Hệ số cân nặng cụ thể cần chốt sau khi đối chiếu `judgePull` hiện có.

## 7. Kinh tế

| Nguồn xu | Đích xu |
|---|---|
| Cá: 8 / 14 / 22 theo loài; việc ông Tư ngày 1: +24; quà chào mừng: 20; thắng cược caro; caro hai người: 15; top 3 vòng câu: xu nhỏ | Đồ thường: 16–24 xu/món; thuê xe: 2–80; mồi và hạt từ ngày 2; cược caro; **đồ theo mùa và màu nhuộm** làm đích dài hạn, sẽ thêm |

- Đồ hiếm **không mua được**. Muốn có phải thắng hoặc đạt huy hiệu.
- Câu luyện tập không tạo nguồn xu.
- Server kẹp mức tăng ví giữa hai lần lưu theo spec DB.
- Giá phải khớp lời thoại: NPC nói “để sẵn” thì miễn phí; nếu tính tiền thì phải nói giá.
- Cân nặng quyết định thi đua; không tự động suy ra rằng cá nặng hơn trả nhiều xu hơn mức theo loài.
- Ánh xạ mức xu theo thứ tự cá rô / cá chép / cá lóc — `Proposed`, cần đối chiếu dữ liệu hiện có.
- Phần thưởng phải ghi nhận một lần theo tài khoản và kết quả vòng; gửi lại sự kiện không nhân đôi xu, đồ hay chuyến bay — `Proposed`.
- Chuyến bay nhận trước khi mở tính năng thuê xe được giữ trong tài khoản, sử dụng khi tính năng mở — `Proposed`.

## 8. Kỹ thuật và ngân sách

- **Stack bắt buộc.** Three.js + Vite + TypeScript; phiên bản **as pinned in the project's package.json**. Không đổi engine, build tool hoặc ngôn ngữ.
- **Ngân sách hình ảnh.**
  - GPU tích hợp tự vào mức Thấp, không MSAA.
  - Mục tiêu khoảng 300 draw call hoặc ít hơn ở chỗ đông.
  - Tính năng mới dùng instancing hoặc 1 lệnh vẽ.
  - Mọi bảng vinh danh là một texture canvas.
- **Hiệu năng đã chốt.**
  - Mục tiêu **60 FPS trên laptop GPU tích hợp**.
  - Tối thiểu **30 FPS trên điện thoại tầm trung**.
  - Tự giảm bóng và hiệu ứng trước; giữ rõ nhân vật, trang phục, danh hiệu và thanh canh câu.
  - Thiết bị kiểm chứng đề xuất: laptop Intel Iris Xe, RAM 8 GB, Chrome ở 1280×720; Samsung Galaxy A54, Chrome, landscape — `Proposed`.
- **Server-authoritative.** Câu cá thi đấu, caro hai người, phiên, giờ phòng, đề thi, bảng xếp hạng, huy hiệu do server chấm, sở hữu tủ đồ.
- **Client.** Di chuyển, vườn, chuồng, caro với chị Hoa, ảnh.
- **Lưu trữ.** Postgres theo tài khoản; offline fallback về localStorage theo spec DB. Dữ liệu offline không tự chuyển thành điểm thi server — `Proposed`.
- **Đo.** Giữ các công cụ được GDD chỉ định: `scripts/soak-idle.mjs`, `walk-check.mjs`, `smoke-prod.mjs`, `?prof`, ô FPS và `?colliders` cho admin.
- **Giới hạn xác nhận.** Tài liệu này quy định trải nghiệm online cần có, không chứng nhận backend đã hoạt động. Bản mô phỏng hoặc offline phải phân biệt rõ với phòng người thật — `Proposed`.

## 9. Tương thích và rủi ro khi cắt

- `isEvening` bắt buộc có `grid` đủ 16 ô và `child` trong `src/sim/evening.ts:541–551`. Khi cắt cơ chế phải **giữ đọc và ghi các trường cũ**, hoặc nới hàm kiểm kèm test, nếu không save bị reset và mất ví.
- Save cũ có `child: 'sleeping'` phải ép về `'awake'` lúc tải.
- Tin mới trong hub: `cast/pull/feat/wear` phải deploy client và server cùng lúc. Tab cũ gửi `hello` kiểu cũ thì server báo “Có bản mới, tải lại”.
- **“Hôm nay” của thi đua theo giờ thật của server**, không theo `state.day`. Ngày truyện bị phòng ghi đè và một ngày game chỉ dài 12 phút.
- **Thời gian mở tính năng là tiến độ cá nhân**, không lấy từ `state.day` hoặc tuổi phòng.
- Thời gian hồi lượt câu theo giờ thật, độc lập với ngày game và tốc độ mô phỏng offline.
- Các test mã hoá cơ chế đã cắt phải xoá cùng code: `evening.test.ts`, `lottery.test.ts`, `money.test.ts`, `needs.test.ts`, `life.test.ts`, `duty.test.ts`, một phần `shop.test.ts` / `farm.test.ts`. Giữ test tải save cũ.
- Không xoá toàn bộ nội dung một bộ test nếu còn kiểm tra ví, mua đồ, vườn hoặc migration vẫn được giữ — `Proposed`.

## 10. Thứ tự làm

Giữ thứ tự và phụ thuộc của GDD gốc. Cột **Công** giữ nhãn gốc để truy nguyên tài liệu, không phải cam kết thời gian.

| # | Gói | Công | Phụ thuộc |
|---|---|---|---|
| 1 | **Cắt:** vé số, học, ngủ, AI đèn/sách, chén, Pot, 1x/2x/3x, chip hạn mức, 3 thước nhu cầu, câu “Pháp sư”. Giữ tương thích save | S | — |
| 2 | Mục tiêu đầu = ông Tư; kiểm lượt trước khi câu; lượt thi hồi dần; hụt không mất lượt; có luyện tập; sửa lời thoại lệch giá | S | 1 |
| 3 | **Server chấm câu cá** + tin `feat` cho cả phòng + vòng câu + bảng đài sen + danh hiệu trên thẻ tên người thật | M | DB/phiên |
| 4 | Gộp tủ đồ: sở hữu lưu theo tài khoản, tin `wear`, đồ hiếm làm phần thưởng | M | DB |
| 5 | Giải caro chiều + khoá thưởng theo tài khoản | S–M | 3 |
| 6 | Huy hiệu server chấm + ô Thành tích | S | 3 |
| 7 | Bảng ngày/tuần trong Postgres + tab “Bảng vàng” + biển Biệt thự | L | DB, 3, 5 |

Mỗi gói kết thúc bằng phép đo trên bản build thật: Vitest, walk-check, smoke, ảnh chụp và E2E hai người chơi. Gói 1–2 làm ngay sau khi nhánh DB/phiên merge xong.

**Bổ sung đã chốt về hình ảnh:** dựng nhân vật và phố bằng primitives cùng animation procedural trước để kiểm chứng gameplay, camera và độ mượt. Chỉ thay dần bằng model 3D làm riêng sau khi gameplay ổn. Không dùng ảnh 2D thay cho model 3D; giữ silhouette, kích thước và collider khi thay asset.

---

## 11. Bổ sung: Controls đầy đủ

Các binding chưa được chốt riêng trong phỏng vấn mang nhãn `Proposed`. Input trên UI không đồng thời điều khiển nhân vật hoặc camera.

| Hành động | Keyboard / mouse | Touch | Nguồn |
|---|---|---|---|
| Đi tự do | WASD; hoặc giữ chuột trái và kéo | Joystick trái | User |
| Đi tới điểm | Click mặt đường | Chạm mặt đường | User |
| Đi tới và tương tác | Click người/quầy; E khi trong tầm | Chạm người/quầy; nút ✋ khi trong tầm | User |
| Orbit camera | Giữ chuột giữa và kéo | Vuốt vùng trống bên phải | User |
| Nhảy | Space ngoài minigame | Nút Jump ngoài minigame | Desktop: User; Touch: Proposed |
| Thả câu | Click “Thả câu”; E khi panel câu sẵn sàng | Chạm “Thả câu” | Proposed |
| Giật cá | Space hoặc click “Giật” | Nút “Giật” lớn | Desktop: User; Touch: Proposed |
| Chọn ô caro | Click ô hợp lệ | Chạm ô hợp lệ | Proposed |
| Gieo, tưới, thu, bán | Click hành động trong panel tương tác | Chạm hành động tương ứng | Proposed |
| Chăm chuồng | Click hành động hiện có trong panel | Chạm hành động tương ứng | Proposed |
| Mua, mặc đồ, đổi danh hiệu | Click món và nút xác nhận | Chạm món và nút xác nhận | Proposed |
| Thuê xe, dùng chuyến bay | Chọn phương tiện và xác nhận; xe dùng input di chuyển | Chạm chọn và xác nhận; xe dùng joystick | Proposed |
| Emote | Click emote, chọn đối tượng khi cần | Chạm emote, chọn đối tượng khi cần | Proposed |
| Chat phố / NPC | Click ô nhập, gõ, Enter gửi | Chạm ô nhập, bàn phím hệ thống, nút Gửi | Proposed |
| Chụp ảnh | Click nút Chụp | Chạm nút Chụp | Proposed |
| Mở bảng tin, Bảng vàng, Thành tích, tủ đồ | Click nút hoặc tương tác tại điểm tương ứng | Chạm nút hoặc tương tác tại điểm tương ứng | Proposed |
| Đóng panel / mở cài đặt | Escape đóng panel; nút bánh răng mở cài đặt | Nút đóng; bánh răng | Proposed |

**Context input — `Proposed`:** khi câu, khoá di chuyển và nhảy, thay cụm hành động bằng Giật; khi nhập chat, không bắt WASD/Space làm gameplay. Sau khi đóng minigame, khôi phục controls khám phá phố.

## 12. Bổ sung: Win, Lose và tiếp tục chơi

| Phạm vi | Thành công / Win | Thất bại / Lose | Sau đó |
|---|---|---|---|
| Một lượt câu | Giật trong vùng bắt cá; server trả loài và kg | Giật ngoài vùng: cá thoát, không trừ lượt | Hiển thị kết quả hoặc gợi ý sớm/muộn; cho thả lại |
| Vòng câu | Cá lớn nhất vòng; bằng kết quả cao nhất thì đồng hạng nhất | Không đứng nhất không kết thúc phiên hoặc lấy mất cá đã bắt | Công bố thứ hạng và phần thưởng; vòng tiếp theo tự bắt đầu |
| Luyện tập | Vẫn có phản hồi loài và kg | Có thể giật hụt như thường | Không xu, điểm thi hay huy hiệu; được chơi tiếp |
| Caro | Theo luật thắng của hệ caro hiện có | Thua hoặc hoà theo server ở ván hai người | Xem kết quả, cập nhật xu/điểm hợp lệ, chọn chơi lại |
| Toàn game | Không có chiến thắng cuối cùng | Không có Game Over toàn bộ khu phố | Người chơi ở lại giao lưu, đổi hoạt động hoặc thoát |

**Bổ sung `Proposed`:** kết quả vòng là panel không chặn sinh hoạt trong phố, có “Xem bảng” và “Tiếp tục”. Chơi lại minigame không reset ví, đồ sở hữu, tiến độ mở tính năng hay thành tích đã xác nhận.

## 13. Bổ sung: Cấu trúc không gian và Progression

### Cấu trúc không gian — `Proposed`

Một khu phố liên thông gồm hồ ông Tư, shop/tủ đồ, đài sen, bàn caro chị Hoa, vườn cô Lan và chuồng chú Sáu, điểm thuê xe/máy bay, cụm nhà và Biệt thự trung tâm. Không chia thành các level platformer.

- Đài sen là mốc định hướng và nơi khoe thành tích chung.
- Từ điểm vào phố có đường dễ đọc tới ông Tư; mũi tên dẫn theo tuyến đi được, không xuyên nhà hoặc leo qua mái.
- Khu vực chưa mở có thể nhìn thấy, nhưng tương tác giải thích mốc mở.
- Không đặt vật trang trí làm khuất thanh canh câu hoặc điểm tương tác chính.
- Bố cục phải tạo cơ hội thấy người khác câu, thay đồ và được vinh danh, thay vì chia mỗi hoạt động thành phòng riêng biệt.

### Hướng Progression

- **Đã chốt:** mở rộng hoạt động theo thời gian chơi riêng; sau nhập môn là vườn, caro hai người, thuê xe, ảnh, rồi chuồng và nhà.
- **Đã chốt:** sức hút dài hạn đến từ đồ hiếm, danh hiệu hữu hạn, bảng ngày/tuần và ký ức của NPC.
- **Proposed:** độ khó câu không tự tăng theo tuổi tài khoản; cùng đề thi có cùng quy luật để kết quả kỹ năng so sánh được.
- **Proposed:** trang phục, nhà và danh hiệu không tăng vùng bắt cá, cân nặng hoặc lợi thế thi đấu.
- Thi rau theo tuần và đồ theo mùa/màu nhuộm giữ trạng thái **về sau** như GDD, không thay thế bốn thể thức thi đua đã chốt.

## 14. Bổ sung: Các màn hình và panel

Không áp dụng máy móc baseline “Next level” của game theo màn. Phố Vui dùng luồng vào phố và panel kết quả hoạt động.

| Màn hình / panel | Mục đích |
|---|---|
| Vào game / đăng nhập ZPS hoặc Guest | Xác định danh tính; Guest được chơi nhưng không lên bảng |
| Tạo nhân vật | Chọn dáng, tuỳ biến, 🎲 và “Vào phố” |
| Khu phố 3D + HUD | Di chuyển, gặp gỡ, theo mục tiêu |
| Hội thoại NPC + chat phố | Tương tác, nhận đề thi, chứng kiến công bố thành tích |
| Câu cá | Thả, canh, giật; kg, loài, phản hồi hụt; phân biệt Thi / Luyện tập |
| Shop + tủ đồ hợp nhất | Mua đồ thường, xem đồ sở hữu, mặc và đổi danh hiệu |
| Caro | Chọn chế độ hợp lệ, cược khi có, bàn cờ, kết quả và chơi lại |
| Vườn + chuồng | Các thao tác được giữ trong GDD |
| Thuê phương tiện | Giá, quyền sử dụng, chuyến bay thưởng |
| Bảng tin | Đề thi và thông báo chung từ server |
| Bảng vàng | Bảng vòng, ngày, tuần, theo môn và hạng Người mới |
| Thẻ nhân vật / Thành tích | Danh hiệu, huy hiệu, thành tích được xác thực |
| Kết quả vòng | Thứ hạng, đồng hạng, phần thưởng, đi tới bảng đầy đủ |
| Ảnh | Chụp và lưu trên thiết bị, không lên server |
| Cài đặt | Chất lượng hình ảnh; thời lượng ngày chỉ khi offline |
| Phiên hết hạn / bản client cũ | Giải thích lý do và hướng dẫn đăng nhập lại hoặc tải lại |

Tên màn hình và cách gộp panel là `Proposed`; các chức năng bên trong giữ quyết định GDD.

**Cài đặt bổ sung — `Proposed`:** âm lượng nhạc/SFX riêng, độ nhạy camera, đảo chiều camera. Mở cài đặt không dừng giờ hoặc vòng thi online.

## 15. Bổ sung: Art Style và âm thanh

### Art direction đã chốt

**Style A:** 3D chibi tròn trịa, đáng yêu, chất liệu mềm, ánh sáng ấm và bảng màu dịu ấm theo ảnh tham chiếu. Nhân vật dần được thay bằng model 3D làm riêng. Lấy cảm hứng từ Avatar: Thành Phố Diệu Kỳ nhưng giữ bản sắc phố Việt, tạo không gian gần gũi, thư thái và sống động để người chơi gặp gỡ, thể hiện bản thân và khoe thành tích.

- **Palette — `Proposed`:** kem `#F6E8CF`, vàng ấm `#E9BC72`, xanh lá dịu `#7E9B70`, xanh lam dịu `#6F9EB0`, nâu đậm `#493A32`.
- **Camera / view:** perspective 3D theo nhân vật, nhìn chếch từ phía sau và orbit tự do; ánh sáng có chiều sâu và bóng đổ, không giả lập bằng ảnh nền.
- **Readability:** nhân vật, trang phục và thẻ tên nổi hơn nền; ngõ vẫn đọc được hình dáng. Không dùng tương phản tối quá mạnh làm nhân vật chìm vào cảnh.
- **Bản sắc phố Việt — `Proposed`:** mái ngói, tường vàng kem, sân gạch, chậu cây, quầy nhỏ, đèn lồng và biển tên. Chi tiết có chọn lọc để giữ silhouette sạch và FPS.
- Ảnh tham chiếu là đích phong cách, không phải cam kết chất lượng model đã tồn tại.

### Drawn in code trước, thay model sau

Tất cả hàng dưới dùng primitives ở giai đoạn kiểm chứng. Chi tiết tạo hình là `Proposed`; hướng Style A và lộ trình thay model đã được người dùng chốt.

| Thành phần chính | Procedural spec ban đầu | Hướng hoàn thiện |
|---|---|---|
| Avatar và người chơi khác | Đầu sphere lớn, thân capsule, tay chân bo tròn, tóc bằng khối cong; trang phục màu kem/xanh, kích thước bám collider | Model riêng Style A; tách trang phục để mặc và đồng bộ |
| Ông Tư | Cùng bộ khung chibi, mũ xanh, ria, áo xanh, cần câu và giỏ | Model riêng giữ silhouette nhận diện |
| Cô Lan | Nón dạng cone bo viền, áo tím dịu, chậu cây và bình tưới | Model riêng |
| Chị Hoa, chú Sáu, NPC và đám đông | Chung bộ khung nhẹ; khác silhouette tóc, mũ, màu áo và đạo cụ nghề | Model riêng theo bộ nhất quán |
| Cá rô / chép / lóc | Thân ellipsoid, vây và đuôi đơn giản; cá lóc dài hơn, cá chép thân dày, cá rô gọn | Model riêng nếu cần; không ảnh hưởng chấm cá |
| Cần câu, phao và mặt hồ | Cần dạng cylinder, dây line, phao nổi; nước là mặt phẳng có gợn procedural | Giữ hiệu ứng nước và dây procedural |
| Vườn và chuồng | Luống dạng box bo cạnh, cây stem/leaf instanced, vật nuôi từ sphere/capsule, hàng rào đơn giản | Model riêng theo nội dung vườn/chuồng được giữ |
| Nhà và Biệt thự | Tường box, mái dốc, cửa lõm; biển tên canvas | Model kiến trúc riêng, giữ đường đi và collider |
| Xe / máy bay | Thân bo tròn, bánh cylinder hoặc cánh dạng box; màu đồng bộ palette | Model riêng, giữ kích thước tương tác |
| Bàn caro | Bàn box, lưới và ký hiệu trên canvas texture | Có thể giữ procedural |
| Đài sen và bảng tin | Đế trụ, cánh sen bo tròn, bảng canvas; điểm tương tác rõ | Model đài riêng, nội dung bảng vẫn canvas |
| Quần áo, huy hiệu, danh hiệu | Mesh trang phục đơn giản, icon vector/canvas, thẻ tên rõ | Trang phục model riêng; UI giữ procedural |
| HUD, panel, mũi tên và toast | Khối bo góc màu kem, icon vector, chữ tương phản; mũi tên bám mặt đường | Giữ UI vẽ bằng code |
| Hiệu ứng bắt cá / vinh danh | Vòng nước, hạt sáng và dấu nhấn instanced, không tạo nhiều mesh lẻ | Procedural |

### Motion & juice — `Proposed`

- Avatar có idle, đi/chạy, nhảy, thả câu, giật, khoe cá, mặc đồ, emote và ăn mừng.
- Tiếp đất squash theo `LAND_SQUASH_AMOUNT` và `LAND_SQUASH_DURATION`; chỉ tác động display, không đổi collider.
- Idle và phản ứng đám đông có phase riêng, tránh chuyển động đồng loạt.
- Blob shadow dưới nhân vật giúp nhận biết vị trí chạm đất.
- Thành tích nổi bật bằng pose khoe cá, tên người chơi và phản hồi đám đông, không cần tăng mật độ particle.
- Khi thay model, giữ asset key, kích thước logic và các animation state; không thay gameplay theo tỷ lệ model.

### Âm thanh đã chốt

**Phố Việt thư thái:** nhạc acoustic nhẹ, tiếng phố và mặt nước; âm thanh nổi bật khi câu chuẩn hoặc được vinh danh.

**Danh mục âm thanh — `Proposed`:**

- Nhạc nền khu phố acoustic nguyên bản.
- Ambience phố và ambience hồ.
- SFX bước chân, nhảy/tiếp đất, thả câu, giật, hụt, bắt cá chuẩn.
- SFX nhận xu, mua/mặc đồ, đặt quân caro, tương tác vườn/chuồng.
- SFX mở/đóng panel, nút bị khoá, thông báo mở hoạt động.
- SFX vinh danh và cổ vũ đám đông.

Ưu tiên tín hiệu canh câu; hạn chế tiếng cổ vũ chồng nhau ở phòng đông. “Ông Tư đọc tên” được thể hiện bằng chat và phản ứng như GDD; không mặc định bổ sung hệ giọng nói đọc tên động.

## 16. Bổ sung: Tuning

Các giá trị dưới là đề xuất để thử nghiệm. Bộ thông số canh câu đã được người dùng đồng ý dùng, nhưng giữ nhãn `Proposed` theo cách chốt trong phỏng vấn. Tham số không lặp lại các mức thưởng, chu kỳ và giới hạn đã có ở các mục trên.

| Constant | Giá trị | Đơn vị | Nguồn |
|---|---:|---|---|
| `FISH_NEEDLE_TRAVERSE_S` | 1.6 | giây / lượt trái → phải | Proposed, đã đồng ý dùng |
| `FISH_CATCH_ZONE_RATIO` | 0.50 | tỷ lệ chiều dài thanh | Proposed, đã đồng ý dùng |
| `FISH_BEST_ZONE_RATIO` | 0.12 | tỷ lệ chiều dài thanh | Proposed, đã đồng ý dùng |
| `FISH_MISS_RETRY_S` | 0.8 | giây | Proposed, đã đồng ý dùng |
| `PLAYER_RUN_SPEED` | 6 | m/s | Proposed |
| `PLAYER_ACCEL_TIME_S` | 0.20 | giây tới tốc độ tối đa | Proposed |
| `PLAYER_JUMP_HEIGHT_M` | 2 | m | Proposed |
| `PLAYER_JUMP_APEX_S` | 0.40 | giây | Proposed |
| `LAND_SQUASH_AMOUNT` | 0.20 | tỷ lệ giảm chiều cao hiển thị | Proposed |
| `LAND_SQUASH_DURATION` | 100 | ms | Proposed |

**Quy tắc sử dụng — `Proposed`:**

- Vùng bắt cá đặt giữa thanh, vùng chuẩn nhất nằm trong đó. Trong vùng bắt, độ chuẩn liên tục theo khoảng cách tới tâm; ngoài vùng bắt là hụt.
- Kim đổi chiều tại hai đầu thanh. Gợi ý sớm/muộn xét cả vị trí và chiều đang chạy.
- Vùng chuẩn nhất không làm mọi cú giật bên trong có cùng cân nặng; tâm vẫn là mục tiêu tốt nhất.
- Nhảy theo gravity arc: `g = 2 × PLAYER_JUMP_HEIGHT_M / PLAYER_JUMP_APEX_S²`, `v0 = 2 × PLAYER_JUMP_HEIGHT_M / PLAYER_JUMP_APEX_S`. Không dùng chuyển động tween cố định thay cho quỹ đạo vật lý.
- Các thông số này không trao lợi thế theo đồ mặc, danh hiệu hay độ tuổi tài khoản.

## 17. Minigame hội chợ — cập nhật v1.1

### 17.1. Phạm vi và nguồn sự thật

- **Đã chốt:** bổ sung NPC với 2048, Chim bay (Flappy), ném vòng và sáu quầy hội chợ. Câu cá tiếp tục là vòng chơi lõi; hội chợ không thay bốn cơ chế nhập môn.
- **Đã chốt:** sáu quầy hội chợ có màn chơi trực quan như các minigame hiện có, dùng căn lực để thể hiện kỹ năng và có sai lệch may mắn.
- Luật căn lực bên dưới thay cách dùng d20 thuần túy cho hành động chơi tại sáu quầy. Không áp dụng ngẫu nhiên vào cân nặng câu cá; quy tắc câu cá ở §2, §5, §6 vẫn giữ nguyên.
- **Hiện có trong mã:** chín trò hội chợ là mô phỏng cá nhân phía client. Chưa có đấu đối kháng online, chấm điểm server, giải đấu hay bảng xếp hạng cho các trò này. Không tự cộng kết quả vào bảng câu cá, huy hiệu server hoặc phần thưởng vòng phố.
- “Đã có trong mã” không đồng nghĩa đã được chơi thử trực quan hoặc kiểm chứng hiệu năng trên thiết bị mục tiêu.

### 17.2. Danh mục NPC và trò chơi

| NPC | Trò | Vào chơi và mục tiêu | Tình trạng |
|---|---|---|---|
| Cô Mai | 2048 | Miễn phí; ghép ô bằng nhau tới 2048. Phím mũi tên/WASD, vuốt hoặc nút hướng. Hết nước đi thì kết thúc lượt | Đã có trong mã |
| Anh Bình | Chim bay | Miễn phí; Space/nút Vỗ cánh để qua cổng, mỗi cổng 1 điểm; va chạm kết thúc lượt | Đã có trong mã |
| Chú Bảy | Ném vòng tính giờ | Miễn phí; canh vòng ngắm rồi ném, 5 vòng, trúng ít nhất 3 để thắng | Đã có trong mã; tách biệt Ném vòng chai |
| Chú Sơn | Thử sức mạnh | Một vé cho một lần vung búa | Đã có trong mã |
| Cô Liên | Ném vòng chai | Một vé cho ba vòng; chọn chai lớn hoặc chai nhỏ | Đã có trong mã |
| Anh Hải | Bắn bia | Một vé cho chuỗi ba bia; phải trúng liên tiếp | Đã có trong mã |
| Chị Ngân | Đua ngựa súng nước | Một vé cho một cuộc đua; có thể mời thêm NPC | Đã có trong mã; đối thủ mô phỏng |
| Chú Tám | Ném chai sữa | Một vé cho ba bóng, mỗi bóng vào một tháp sáu chai | Đã có trong mã |
| Cô Vy | Hồ vịt | Một vé cho một lần chọn vịt có căn lực | Đã có trong mã |

Caro chị Hoa tiếp tục dùng luật ở §5 và §12, có ván không cược. Điểm 2048, Chim bay và ném vòng miễn phí chỉ thuộc lượt chơi; chưa lưu kỷ lục hoặc thưởng xu từ ba trò này.

### 17.3. Luồng vào và giao diện

- Thanh hành động có **Trò chơi**: chọn trò để mở ngay, không bắt buộc tìm đường tới NPC. Vẫn có thể gặp NPC trong phố để mở trò tương ứng.
- Sáu trò dùng sân chơi 3D riêng với cùng renderer/camera Three.js: búa–chuông, chai và vòng, bia bắn, ngựa đua, tháp chai, hồ vịt. Không dùng ảnh 2D thay mô hình.
- Đầu màn hình: tên trò, vé, Luck và ví hội chợ. Bên trái: trạng thái lượt, quà, luật thu gọn. Bên phải: mua lượt, chọn Luck và hành động. Giữa: sân chơi và thanh căn lực. Phía dưới: kết quả và phép tính.
- “Vé, quà & linh kiện” mở ngăn phụ. Có “Về phố”, kết quả và chơi lại. Không reset toàn bộ phố khi thua một trò.
- Khi chơi, input không đồng thời di chuyển/nhảy nhân vật. Thiết kế cho desktop và điện thoại ngang; các nút chính đủ lớn cho cảm ứng.
- Ba trò miễn phí có thể mở khi đang tải tiến độ. Trò dùng vé cần tải ví trước; phải giải thích trạng thái chờ, không im lặng từ chối. Dữ liệu cloud tới không tự đóng một lượt miễn phí đang chơi.

### 17.4. Căn lực, sai lệch và Luck

**Đã chốt về hướng:** kỹ năng quyết định kết quả nền; may mắn gây sai lệch; người chơi quyết định dùng/vay Luck trước hành động.

**Tuning hiện dùng, còn cần playtest:**

1. Giữ nút hành động rồi thả; bàn phím bấm Space lần đầu để bắt đầu và lần hai để thực hiện. Kim chạy qua lại, tâm thanh là lực lý tưởng. Mỗi lần ném/bắn có lượt căn riêng.
2. Gọi vị trí kim là `p` trong `[0,1]`: `accuracy = max(0, 1 - 2 × abs(p - 0.5))`; điểm nền `round(20 × accuracy)`.
3. Gieo một d20 thật, gọi mặt gieo là `n`; sai lệch `round((n - 10.5) / 3)`, trong khoảng −3…+3. Tổng hành động = điểm nền + sai lệch + các d4 Luck − d4 trả nợ nếu có.
4. Nhịp kim hiện dùng chung setting `needleSeconds` với câu cá, mặc định 1,6 giây mỗi chiều. Cần đánh giá việc tách setting sau playtest.
5. Vùng màu ở tâm chỉ là hướng dẫn, không gom các cú căn trong vùng thành cùng một điểm.
6. Chọn số d4 trước khi bắt đầu căn; khoá lựa chọn khi đang căn. Chuyển tab, mất focus hoặc mở ngăn phụ hủy thao tác chưa thực hiện, không gieo, không trừ Luck và không tiêu thêm lần ném. Vé đã trả để mở lượt vẫn giữ trạng thái đã trả.
7. Kết quả ghi riêng độ chuẩn, điểm nền, mặt d20, sai lệch, d4 cộng/trừ và Luck trước/sau. Hoạt cảnh minh hoạ kết quả, không tự thay đổi kết quả.

**Luck:**

- Bắt đầu với **1 Luck**. Dùng `k` d4 làm Luck giảm `k`; được phép xuống âm để vay tương lai.
- Khi Luck trước lần gieo âm và không dùng thêm d4, chịu −1d4 và hồi 1 Luck.
- Mỗi **natural 1 trên d20** hồi thêm 1 Luck; có thể cộng với hồi Luck do trả nợ trong cùng lần gieo. Không hiểu “natural” là tổng sau cộng/trừ.
- Nợ Luck được lưu qua việc rời quầy, đổi trò, tải lại và hoàn tất bộ linh kiện.
- Giao diện hiện giới hạn nhập 10.000 d4/lần để bảo vệ dung lượng và xử lý; đây là giới hạn kỹ thuật, không phải số d4 miễn phí.
- Charisma mời NPC, Wisdom nhận ra mẹo và Intelligence giải mẹo vẫn dùng d20 + d4 Luck − phạt nợ, không có căn lực.

### 17.5. Luật sáu quầy với căn lực

| Quầy | Thành công và phần thưởng |
|---|---|
| Thử sức mạnh | Tổng ≥19: quà lớn; mọi kết quả khác: quà nhỏ. Một lần/vé |
| Ném vòng chai | Ba vòng/vé. Chai lớn: tổng ≥19 nhận quà lớn. Chai nhỏ: mặt d20 chia hết cho 3 **và điểm căn lực ≥12** nhận quà nhỏ |
| Bắn bia | Ba bia cần tổng lần lượt ≥12, ≥15, ≥17. Trượt một bia kết thúc lượt; trúng cả ba nhận quà lớn |
| Đua ngựa súng nước | Tổng ≥10 + số người khác để thắng. Ít hơn sáu người: quà nhỏ; đủ sáu người: quà lớn. Mời tối đa năm NPC qua Charisma DC 12, mỗi NPC có vé riêng; người chơi trả vé của mình |
| Ném chai sữa | Trúng tổng ≥11 hạ 1d4+1 chai. Ngoại lệ natural 20 chỉ hạ 1 chai, kể cả đã giải mẹo. Hạ sáu chai trong một lần nhận quà lớn. Cuối ba bóng, tổng ≥10 nhận quà vừa; nếu chưa tới 10 nhưng ≥3 nhận quà nhỏ |
| Hồ vịt | Tổng **đúng 20** nhận quà lớn. Nếu không, mặt d20 chẵn **và điểm căn lực ≥12** nhận quà nhỏ. Căn quá lực hoặc cộng quá nhiều Luck có thể vượt 20 |

- Khi có căn lực, các ngưỡng trúng dùng tổng đã tính; natural 20 không tự bảo đảm trúng bia/chai lớn. Ngoại lệ natural 20 của chai sữa vẫn áp dụng như bảng trên.
- Điều kiện căn ≥12 cho quà nhỏ tại vòng chai/hồ vịt là tuning mới để kỹ năng có tác dụng, cần kiểm chứng nhịp thưởng. Đây là thay đổi so với mô tả d20 thuần túy ban đầu.
- Chai sữa: sau hai bóng, bắt buộc Wisdom DC 12. Thành công phát hiện gian lận; người chơi có thể ném tiếp hoặc thử Intelligence DC 15 khi Luck không âm. Giải được mẹo cho lần ném trúng kế tiếp hạ sáu chai, trừ natural 20. Intelligence có thể thử lại sau một lần ném tiếp theo; kiến thức về mẹo được lưu.
- Quà lớn và quà theo tổng số chai được tính riêng trong triển khai hiện tại. Chưa coi đây là kết luận cân bằng kinh tế.
- NPC tuyển cho đua ngựa là mô phỏng, không phải người trong phòng Multiplayer. Chưa có cơ chế chuyển vé giữa người thật.

### 17.6. Ví hội chợ, quà và mục tiêu

- **Đã được người dùng chốt:** khởi đầu 12 bạc, 0 vàng, 1 Luck; Athletics, đánh xa, Concentration, Charisma, Wisdom và Intelligence đều +0. Charisma mời NPC DC 12.
- Vé giá **1 bạc/1 vé** hoặc **1 vàng/12 vé**. Ví bạc/vàng độc lập với xu Phố Vui; chưa có quy đổi hay nguồn thu bạc/vàng bổ sung tự động.
- **3 quà nhỏ → 1 quà vừa; 3 quà vừa → 1 quà lớn** tại quầy được chọn. Quà lớn có thú bông và linh kiện trên nơ; mỗi quầy đóng góp một linh kiện khác nhau.
- Mục tiêu là đủ **6 linh kiện**, có danh sách theo dõi từng quầy. Hoàn thành vẫn được chơi tiếp. Không tự thưởng thêm xu, danh hiệu hay lợi thế khi hoàn thành bộ.
- Có thể thắng nhiều quà lớn, nhưng linh kiện cùng quầy chỉ ghi nhận một lần.
- Lấy trộm thú bông có linh kiện chưa sở hữu thu hút một nhân viên. Gây gổ thu hút thêm 1d4 nhân viên mỗi lần. **Hiện mới ghi nhận số nhân viên và phản hồi bằng chữ; chưa có hệ giao chiến, truy đuổi hoặc luật kết thúc đối đầu.**

### 17.7. Lưu tiến độ và sửa lỗi đổi trò

- Lưu ví hội chợ, vé, Luck kể cả âm, quà, linh kiện, nhân viên, NPC đã mời, kiến thức mẹo chai sữa và các lượt đã trả vé cùng save tài khoản.
- Mỗi quầy giữ tối đa một lượt đang dở. Khi đổi trò, cất lượt hiện tại vào `pausedAttempts`; khôi phục lượt của **đúng quầy được chọn**, nếu có. Không trừ thêm vé khi tiếp tục.
- Lỗi cũ: màn render dùng `attempt.stall` ghi đè trò vừa chọn, khiến mọi trò thành quầy ném vòng còn dở. Đã sửa bằng `selectStall`; không dùng lượt cũ để thay lựa chọn mới.
- Đóng panel không tự bỏ lượt. Bỏ lượt là thao tác có xác nhận, không hoàn vé, giữ quà đã nhận và nợ Luck.
- Save cũ thiếu trường mới được đọc tương thích; kiểm tra các lượt tạm dừng không trùng quầy. Không ghi đè bản cloud bằng dữ liệu fallback khi cloud đã có save.
- Database và Multiplayer đã được bật trong môi trường dự án; mã client đã gọi dịch vụ lưu và relay của nền tảng. Điều này **không chứng nhận** chấm thi server, ZPS resolver riêng, một tài khoản/một phiên hoặc spec collider của GDD gốc đã hoàn tất. Room `world` nền tảng tối đa 50 người; mục tiêu 30 người của GDD chưa được cưỡng chế.

### 17.8. Công cụ thử nghiệm `duongdv`

- Hiện nút **⚒ Thử nghiệm** khi danh tính do `api/me` trả về có username `duongdv`. Không dùng tên tự nhập trong game để cấp quyền.
- Nạp đến tối thiểu: 1.000 xu Phố Vui; 100 vé, 100 bạc, 10 vàng, 20 Luck, 27 quà nhỏ, 9 quà vừa. Bấm lại chỉ nạp đủ mức này, không cộng dồn vô hạn. Không tự trao linh kiện.
- Có nút mở các mốc hoạt động, đủ áo, nạp lượt câu và kết thúc thời gian chờ vườn/chuồng; có lối mở danh sách trò.
- Mọi thay đổi gắn cờ `assisted` trong save; kết quả vẫn là mô phỏng. Không gửi thành tích này vào bảng thi đấu xác thực.
- **Đây là tiện ích client cho thử nghiệm, không phải phân quyền admin server hay cơ chế chống gian.** Chưa có API phân quyền admin trong phạm vi triển khai.

### 17.9. Kiểm chứng và phần còn thiếu

Đã chạy kiểm tra TypeScript và các test logic liên quan: 2048/va chạm/ném vòng, luật sáu quầy, căn lực–Luck, công cụ thử nghiệm, lưu tiến độ, đổi qua sáu quầy và khôi phục lượt không trừ lại vé.

Chưa xác nhận bằng playtest trực quan cho các màn hội chợ mới; chưa đo FPS trên thiết bị mục tiêu, chưa kiểm chứng đầy đủ cảm ứng landscape, cân bằng vé/Luck/quà hoặc E2E nhiều người. Chưa triển khai thi đấu minigame online, phần thưởng được server xác thực, giao chiến với nhân viên hay công dụng tiếp theo của bộ sáu linh kiện.
