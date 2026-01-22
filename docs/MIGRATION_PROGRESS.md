# 📋 TIẾN ĐỘ CHUYỂN ĐỔI: NƯỚC HOA → ĐỒ ÁN

**Ngày bắt đầu:** 2026-01-21  
**Trạng thái:** Đang tiến hành

---

## ✅ ĐÃ HOÀN THÀNH

### Phase 1: Theme & Colors ✅
- [x] Cập nhật CSS variables trong `src/index.css`
- [x] Đổi Primary color: Xanh dương học thuật (oklch(0.55 0.15 250))
- [x] Đổi Secondary color: Xanh lá mint (oklch(0.65 0.12 160))
- [x] Đổi Accent color: Tím nhẹ (oklch(0.65 0.15 280))
- [x] Cập nhật colors cho dark mode
- [x] Cập nhật chart colors
- [x] Đổi font từ "Be Vietnam Pro" sang "Inter"/"Roboto"

### Phase 2: Data Model ✅
- [x] Tạo file `src/types/models/project.ts`
- [x] Định nghĩa `Project` interface với đầy đủ fields
- [x] Định nghĩa `ProjectCategory`, `ProjectLevel`, `ProjectType`
- [x] Định nghĩa `ProjectReview`, `ProjectStats`
- [x] Định nghĩa `ProjectFilter`, `ProjectSearchResult`
- [x] Export từ `src/types/models/index.ts`

### Phase 3: Components (Đang tiến hành)
- [x] Tạo `TechStackBadges` component (`src/components/ui/tech-stack-badges.tsx`)
- [x] Tạo `ProjectCard` component (`src/components/project-card.tsx`)
- [x] Tạo `ProjectPreview` component (`src/components/project-preview.tsx`)
- [ ] Cập nhật `ProductCard` → sử dụng `ProjectCard` (hoặc giữ cả hai)
- [ ] Tạo `ProjectDetail` page
- [ ] Cập nhật Filter/Search components

---

## 🚧 ĐANG LÀM

### Phase 3: Components (tiếp tục)
- [ ] Cập nhật Products page → Projects page
- [ ] Cập nhật ProductDetail → ProjectDetail
- [ ] Cập nhật Cart logic (Mua & Tải về)

---

## 📝 CẦN LÀM

### Phase 4: Pages
- [ ] Cập nhật Home page
  - [ ] Hero section: "Kho Đồ Án Chất Lượng Cao"
  - [ ] Featured projects
  - [ ] Categories by subject
- [ ] Cập nhật Products page → Projects page
  - [ ] Filter by subject, level, tech stack
  - [ ] Search functionality
  - [ ] Sort by downloads, rating, price
- [ ] Cập nhật ProductDetail → ProjectDetail
  - [ ] Tech Stack section
  - [ ] Features section
  - [ ] What's Included section
  - [ ] Preview Images Gallery
  - [ ] Demo Link
  - [ ] Installation Guide
- [ ] Cập nhật Categories pages
- [ ] Cập nhật About/Contact pages

### Phase 5: Content & Copy
- [ ] Thay đổi tất cả text/copy
  - [ ] "Nước hoa" → "Đồ án"
  - [ ] "Mùi hương" → "Công nghệ"
  - [ ] "Dung tích" → "Bao gồm"
  - [ ] "Thương hiệu" → "Môn học"
- [ ] Cập nhật meta tags & SEO
- [ ] Cập nhật page titles
- [ ] Cập nhật error messages
- [ ] Cập nhật success messages

### Phase 6: Assets & Icons
- [ ] Thay đổi icons
  - [ ] Spray bottle → Code icon
  - [ ] Perfume bottle → File/Document icon
- [ ] Chuẩn bị placeholder images
- [ ] Cập nhật logo (nếu cần)
- [ ] Cập nhật favicon

### Phase 7: Services & API
- [ ] Cập nhật `productsService.ts` → `projectsService.ts`
- [ ] Cập nhật API endpoints
- [ ] Tạo mock data cho 10+ projects mẫu
- [ ] Cập nhật cart service (download logic)

### Phase 8: Testing
- [ ] Test tất cả pages
- [ ] Test responsive design
- [ ] Test dark mode
- [ ] Test filters/search
- [ ] Test purchase/download flow
- [ ] Cross-browser testing

---

## 📦 FILES ĐÃ TẠO/CẬP NHẬT

### Đã tạo mới:
1. `src/types/models/project.ts` - Project types
2. `src/components/ui/tech-stack-badges.tsx` - Tech stack badges
3. `src/components/project-card.tsx` - Project card component
4. `src/components/project-preview.tsx` - Project preview gallery

### Đã cập nhật:
1. `src/index.css` - Theme colors & fonts
2. `src/types/models/index.ts` - Export project types

---

## 🎯 NEXT STEPS

1. **Tạo mock data** cho projects (10+ mẫu)
2. **Cập nhật Products page** để sử dụng ProjectCard
3. **Tạo ProjectDetail page** với đầy đủ sections
4. **Cập nhật content** trên tất cả pages
5. **Test & Fix** các issues

---

## 📝 NOTES

- Giữ lại Product model để tương thích ngược (nếu cần)
- Project model có legacy fields để tương thích với Product
- Có thể chạy song song cả Product và Project trong giai đoạn transition

---

*Cập nhật lần cuối: 2026-01-21*
