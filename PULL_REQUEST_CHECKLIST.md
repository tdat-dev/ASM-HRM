# PR Checklist (bắt buộc tick trước khi merge)

- [ ] Không còn `console.log`/`debugger`
- [ ] Không còn inline style/sự kiện inline trong HTML
- [ ] Tất cả dữ liệu người dùng được escape bằng `escapeHTML()` trước khi render
- [ ] Tiền tệ hiển thị qua `formatVND()`
- [ ] Không dùng `var`, không chain Promise dài (ưu tiên async/await)
- [ ] Không có “magic numbers” – đã đưa vào constants
- [ ] UI có `:focus-visible`, có title/label cho nút tương tác
- [ ] Bảng lớn bọc `.table-wrapper`; header sticky nếu cần
- [ ] LocalStorage parse bằng `safeJSONParse()`; key có namespace `hrm_*`
- [ ] Dark/Light theme hoạt động; không vỡ layout trên mobile
- [ ] Đã tự test màn hình liên quan (chức năng chính + edge cases)
- [ ] Đã cập nhật tài liệu nếu có (README/SECURITY/Rules)

