# 📘 TÀI LIỆU BASE UI - FRONTEND REACT E-COMMERCE

**Dự án:** Frontend React - Bán Nước Hoa  
**Phiên bản:** 1.0  
**Ngày tạo:** 2026-01-21

---

## MỤC LỤC

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Cấu trúc thư mục](#3-cấu-trúc-thư-mục)
4. [Theme System](#4-theme-system)
5. [UI Components Library](#5-ui-components-library)
6. [Styling Approach](#6-styling-approach)
7. [Cách Customize UI](#7-cách-customize-ui)
8. [Best Practices](#8-best-practices)
9. [Hướng dẫn đổi UI](#9-hướng-dẫn-đổi-ui)

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Kiến trúc

- **Framework:** React 19.1.1 với TypeScript
- **Build Tool:** Vite 7.1.7
- **Routing:** React Router DOM 7.9.5
- **State Management:** 
  - React Query (@tanstack/react-query) cho server state
  - Zustand cho global state
  - Context API cho theme & auth
- **UI Framework:** shadcn/ui (Radix UI + Tailwind CSS)
- **Styling:** Tailwind CSS 4.1.16 với CSS Variables

### 1.2 Đặc điểm chính

- ✅ Dark/Light mode support
- ✅ Responsive design
- ✅ Component-based architecture
- ✅ Type-safe với TypeScript
- ✅ Modern UI với shadcn/ui components

---

## 2. TECH STACK & DEPENDENCIES

### 2.1 Core Dependencies

```json
{
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "react-router-dom": "^7.9.5",
  "typescript": "~5.9.3"
}
```

### 2.2 UI & Styling

```json
{
  "@radix-ui/*": "Các component primitives",
  "tailwindcss": "^4.1.16",
  "@tailwindcss/vite": "^4.1.16",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.3.1",
  "lucide-react": "^0.552.0",
  "next-themes": "^0.4.6"
}
```

### 2.3 State & Data Fetching

```json
{
  "@tanstack/react-query": "^5.90.11",
  "zustand": "^5.0.8",
  "axios": "^1.13.2"
}
```

### 2.4 UI Components Library

- **shadcn/ui** (New York style)
- **Radix UI** primitives
- **Lucide React** icons
- **Sonner** toast notifications
- **Recharts** cho charts

---

## 3. CẤU TRÚC THƯ MỤC

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components (28 components)
│   ├── admin/          # Admin-specific components
│   ├── common/         # Shared components (auth, cart, products, user)
│   └── [other].tsx     # Feature components
├── contexts/           # React Context providers
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── useTheme.ts
├── layouts/            # Layout components
│   └── MainLayout.tsx
├── pages/              # Page components (31 pages)
│   ├── admin/          # Admin pages
│   └── [other].tsx     # Public pages
├── services/           # API services
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── lib/                # Library configurations
│   ├── api/           # Axios instance
│   └── store/         # React Query client
├── constants/          # App constants
└── assets/            # Static assets
```

### 3.1 UI Components Location

**Path:** `src/components/ui/`

**Available Components:**
- `alert-dialog.tsx` - Alert dialogs
- `avatar.tsx` - User avatars
- `badge.tsx` - Badges & labels
- `button.tsx` - Buttons với variants
- `card.tsx` - Card containers
- `dialog.tsx` - Modal dialogs
- `dropdown-menu.tsx` - Dropdown menus
- `input.tsx` - Form inputs
- `label.tsx` - Form labels
- `select.tsx` - Select dropdowns
- `table.tsx` - Data tables
- `tabs.tsx` - Tab navigation
- `textarea.tsx` - Text areas
- `sidebar.tsx` - Sidebar navigation
- `sheet.tsx` - Slide-over panels
- `skeleton.tsx` - Loading skeletons
- `sonner.tsx` - Toast notifications
- Và nhiều components khác...

---

## 4. THEME SYSTEM

### 4.1 Theme Configuration

**File:** `src/index.css`

**Theme Variables (CSS Custom Properties):**

#### Light Mode Colors:
```css
--background: oklch(0.9874 0.0032 17.2122)  /* Nền sáng */
--foreground: oklch(0.2178 0 0)             /* Chữ tối */
--primary: oklch(0.4991 0.0436 30.7120)     /* Màu chính (cam/vàng) */
--secondary: oklch(0.8948 0.0061 43.3296)   /* Màu phụ */
--muted: oklch(0.9582 0.0067 53.4461)       /* Màu nhạt */
--accent: oklch(0.9887 0.0055 31.0537)      /* Màu nhấn */
--destructive: oklch(0.5523 0.1631 24.1787) /* Màu cảnh báo/xóa */
--border: oklch(0.8948 0.0061 43.3296)      /* Viền */
```

#### Dark Mode Colors:
```css
--background: oklch(0.2022 0.0083 4.2755)   /* Nền tối */
--foreground: oklch(0.9476 0.0052 67.7620)  /* Chữ sáng */
--primary: oklch(0.7462 0.0436 29.1652)     /* Màu chính sáng hơn */
--secondary: oklch(0.2986 0.0122 0.9958)    /* Màu phụ */
--muted: oklch(0.2797 0.0091 6.2807)        /* Màu nhạt */
```

### 4.2 Theme Implementation

**File:** `src/contexts/ThemeContext.tsx`

**Features:**
- ✅ Light/Dark mode toggle
- ✅ System preference detection
- ✅ LocalStorage persistence
- ✅ Automatic class toggling (`dark` class on `<html>`)

**Usage:**
```tsx
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}
```

### 4.3 Typography

**Fonts:**
- **Primary:** "Be Vietnam Pro" (Vietnamese font)
- **Fallback:** "Inter", system fonts
- **Mono:** "IBM Plex Mono", "Courier New"

**Font Variables:**
```css
--font-sans: "Be Vietnam Pro", "Inter", -apple-system, ...
--font-serif: "Be Vietnam Pro", "Inter", serif;
--font-mono: "IBM Plex Mono", "Courier New", monospace;
```

### 4.4 Spacing & Radius

```css
--radius: 0.85rem;              /* Border radius mặc định */
--radius-sm: calc(var(--radius) - 4px);
--radius-md: calc(var(--radius) - 2px);
--radius-lg: var(--radius);
--radius-xl: calc(var(--radius) + 4px);
```

### 4.5 Shadows

```css
--shadow-sm: 0px 8px 20px 0px hsl(0 0% 0% / 0.10), 0px 1px 2px -1px hsl(0 0% 0% / 0.10);
--shadow-md: 0px 8px 20px 0px hsl(0 0% 0% / 0.10), 0px 2px 4px -1px hsl(0 0% 0% / 0.10);
--shadow-lg: 0px 8px 20px 0px hsl(0 0% 0% / 0.10), 0px 4px 6px -1px hsl(0 0% 0% / 0.10);
--shadow-xl: 0px 8px 20px 0px hsl(0 0% 0% / 0.10), 0px 8px 10px -1px hsl(0 0% 0% / 0.10);
--shadow-2xl: 0px 8px 20px 0px hsl(0 0% 0% / 0.25);
```

---

## 5. UI COMPONENTS LIBRARY

### 5.1 shadcn/ui Configuration

**File:** `components.json`

```json
{
  "style": "new-york",
  "tailwind": {
    "css": "src/index.css",
    "baseColor": "gray",
    "cssVariables": true
  },
  "iconLibrary": "lucide"
}
```

### 5.2 Component Variants

Components sử dụng **class-variance-authority** (CVA) để quản lý variants:

**Example - Button:**
```tsx
// File: src/components/ui/button.tsx
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background",
        secondary: "bg-secondary text-secondary-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
  }
);
```

### 5.3 Component Usage Pattern

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" />
          </div>
          <Button variant="default" size="default">
            Submit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 6. STYLING APPROACH

### 6.1 Tailwind CSS 4.0

**Configuration:**
- Sử dụng CSS Variables cho theming
- Custom color system với OKLCH color space
- Utility-first approach
- Responsive design với breakpoints mặc định

### 6.2 Class Naming Convention

```tsx
// Spacing
className="p-4"           // padding
className="m-2"           // margin
className="space-y-4"     // vertical spacing between children

// Colors
className="bg-background"      // Background color
className="text-foreground"    // Text color
className="border-border"      // Border color

// Dark mode
className="dark:bg-card dark:text-card-foreground"

// Responsive
className="md:flex lg:grid"    // Breakpoints
```

### 6.3 Utility Functions

**File:** `src/lib/utils.ts`

```tsx
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage:
className={cn("base-class", condition && "conditional-class")}
```

### 6.4 Custom Animations

**File:** `src/index.css`

```css
@keyframes pop-in {
  0% { transform: scale(0.96); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

.animate-pop-in {
  animation: pop-in 220ms ease-out both;
}

.animate-shake {
  animation: shake 420ms ease-in-out both;
}
```

---

## 7. CÁCH CUSTOMIZE UI

### 7.1 Thay đổi màu sắc

**Bước 1:** Mở `src/index.css`

**Bước 2:** Tìm và chỉnh sửa CSS variables:

```css
:root {
  /* Thay đổi màu primary */
  --primary: oklch(0.4991 0.0436 30.7120);  /* Màu hiện tại (cam/vàng) */
  
  /* Ví dụ: Đổi sang màu xanh */
  --primary: oklch(0.5 0.15 200);  /* Blue */
  
  /* Hoặc màu đỏ */
  --primary: oklch(0.55 0.2 25);   /* Red */
}
```

**Bước 3:** Lưu file, thay đổi sẽ tự động áp dụng

### 7.2 Thay đổi font

**Option 1: Thay đổi font chính**

```css
/* src/index.css */
:root {
  --font-sans: "Your Font Name", "Inter", sans-serif;
}
```

**Option 2: Import font mới**

```css
/* Thêm vào đầu file src/index.css */
@import url('https://fonts.googleapis.com/css2?family=YourFont:wght@300;400;500;600;700&display=swap');

:root {
  --font-sans: "YourFont", "Inter", sans-serif;
}
```

### 7.3 Thay đổi border radius

```css
:root {
  --radius: 0.5rem;  /* Nhỏ hơn (góc vuông hơn) */
  /* hoặc */
  --radius: 1.5rem;  /* Lớn hơn (góc tròn hơn) */
}
```

### 7.4 Thay đổi spacing

Tailwind sử dụng scale mặc định:
- `p-1` = 0.25rem (4px)
- `p-2` = 0.5rem (8px)
- `p-4` = 1rem (16px)
- `p-6` = 1.5rem (24px)
- `p-8` = 2rem (32px)

Có thể override trong Tailwind config nếu cần.

### 7.5 Tạo component mới

**Bước 1:** Tạo file component

```tsx
// src/components/ui/my-component.tsx
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const myComponentVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        outline: "border border-input",
      },
      size: {
        sm: "h-8 px-3",
        default: "h-10 px-4",
        lg: "h-12 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface MyComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof myComponentVariants> {}

export function MyComponent({
  className,
  variant,
  size,
  ...props
}: MyComponentProps) {
  return (
    <div
      className={cn(myComponentVariants({ variant, size }), className)}
      {...props}
    />
  );
}
```

**Bước 2:** Export từ index (nếu cần)

```tsx
// src/components/ui/index.ts
export { MyComponent } from './my-component';
```

### 7.6 Customize Layout

**File:** `src/layouts/MainLayout.tsx`

```tsx
export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        {/* Your header content */}
      </header>
      
      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border">
        {/* Your footer content */}
      </footer>
    </div>
  );
}
```

---

## 8. BEST PRACTICES

### 8.1 Component Organization

✅ **DO:**
- Đặt components trong `src/components/ui/` cho reusable UI
- Đặt feature-specific components trong `src/components/`
- Sử dụng TypeScript cho type safety
- Sử dụng `cn()` utility để merge classes

❌ **DON'T:**
- Không hardcode colors, dùng CSS variables
- Không inline styles, dùng Tailwind classes
- Không tạo components quá phức tạp, tách nhỏ ra

### 8.2 Styling Guidelines

✅ **DO:**
```tsx
// ✅ Sử dụng CSS variables
className="bg-primary text-primary-foreground"

// ✅ Sử dụng utility classes
className="flex items-center gap-4 p-4 rounded-lg"

// ✅ Conditional classes với cn()
className={cn("base-class", isActive && "active-class")}
```

❌ **DON'T:**
```tsx
// ❌ Không hardcode colors
className="bg-[#ff6b35]"

// ❌ Không inline styles
style={{ backgroundColor: '#ff6b35' }}

// ❌ Không string concatenation cho classes
className={"base-class " + (isActive ? "active" : "")}
```

### 8.3 Theme Usage

✅ **DO:**
- Luôn sử dụng theme variables (`bg-background`, `text-foreground`)
- Test cả light và dark mode
- Sử dụng `dark:` prefix cho dark mode specific styles

### 8.4 Responsive Design

✅ **DO:**
```tsx
// Mobile-first approach
className="flex flex-col md:flex-row lg:grid"

// Breakpoints: sm, md, lg, xl, 2xl
className="text-sm md:text-base lg:text-lg"
```

---

## 9. HƯỚNG DẪN ĐỔI UI

### 9.1 Checklist đổi UI

#### Bước 1: Xác định thay đổi
- [ ] Màu sắc chính (primary, secondary)
- [ ] Typography (font family, sizes)
- [ ] Spacing & Layout
- [ ] Component styles
- [ ] Dark mode colors

#### Bước 2: Backup
```bash
# Tạo branch mới
git checkout -b ui-redesign

# Commit hiện tại
git add .
git commit -m "backup: before UI changes"
```

#### Bước 3: Thực hiện thay đổi

**A. Đổi màu sắc:**
1. Mở `src/index.css`
2. Tìm `:root` và `.dark` sections
3. Thay đổi các CSS variables
4. Test với `npm run dev`

**B. Đổi font:**
1. Import font mới vào `src/index.css`
2. Cập nhật `--font-sans` variable
3. Kiểm tra hiển thị

**C. Đổi component styles:**
1. Mở component trong `src/components/ui/`
2. Chỉnh sửa variants hoặc base classes
3. Test component

#### Bước 4: Test
```bash
# Chạy dev server
npm run dev

# Test các scenarios:
- [ ] Light mode
- [ ] Dark mode
- [ ] Responsive (mobile, tablet, desktop)
- [ ] Tất cả pages
- [ ] Tất cả components
```

#### Bước 5: Build & Deploy
```bash
# Build production
npm run build

# Preview build
npm run preview

# Nếu OK, commit và push
git add .
git commit -m "feat: redesign UI with new colors/fonts"
git push origin ui-redesign
```

### 9.2 Ví dụ: Đổi sang theme màu xanh

**File:** `src/index.css`

```css
:root {
  /* Đổi primary từ cam sang xanh */
  --primary: oklch(0.5 0.15 200);  /* Blue */
  --primary-foreground: oklch(0.99 0 0);  /* White text */
  
  /* Có thể đổi thêm các màu khác */
  --accent: oklch(0.95 0.05 200);  /* Light blue accent */
}

.dark {
  --primary: oklch(0.65 0.15 200);  /* Lighter blue for dark mode */
  --primary-foreground: oklch(0.2 0 0);  /* Dark text */
}
```

### 9.3 Ví dụ: Đổi sang font khác

**File:** `src/index.css`

```css
/* Import font mới */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');

:root {
  /* Đổi font chính */
  --font-sans: "Poppins", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
}
```

### 9.4 Ví dụ: Thay đổi border radius

```css
:root {
  /* Góc vuông hơn */
  --radius: 0.5rem;
  
  /* Hoặc góc tròn hơn */
  /* --radius: 1.5rem; */
}
```

### 9.5 Resources hữu ích

**Color Tools:**
- [OKLCH Color Picker](https://oklch.com/)
- [Tailwind Color Generator](https://uicolors.app/)

**Font Resources:**
- [Google Fonts](https://fonts.google.com/)
- [Font Pair](https://www.fontpair.co/)

**Design Inspiration:**
- [shadcn/ui Examples](https://ui.shadcn.com/examples)
- [Tailwind UI](https://tailwindui.com/)

---

## 10. TROUBLESHOOTING

### 10.1 Màu không thay đổi

**Vấn đề:** Đã đổi CSS variable nhưng UI không cập nhật

**Giải pháp:**
1. Clear browser cache
2. Restart dev server: `npm run dev`
3. Kiểm tra xem có đang dùng hardcoded colors không
4. Kiểm tra Tailwind config

### 10.2 Dark mode không hoạt động

**Vấn đề:** Dark mode không toggle

**Giải pháp:**
1. Kiểm tra `ThemeContext` đã được wrap trong App
2. Kiểm tra `localStorage` có bị clear không
3. Kiểm tra class `dark` có được thêm vào `<html>` không

### 10.3 Font không load

**Vấn đề:** Font mới không hiển thị

**Giải pháp:**
1. Kiểm tra @import đã đúng chưa
2. Kiểm tra font name trong CSS variable
3. Kiểm tra network tab xem font có load không
4. Thử dùng font fallback

---

## KẾT LUẬN

Tài liệu này cung cấp đầy đủ thông tin về base UI của dự án, giúp bạn:

✅ Hiểu rõ cấu trúc và cách hoạt động  
✅ Dễ dàng customize UI theo nhu cầu  
✅ Tuân thủ best practices  
✅ Tránh các lỗi thường gặp  

**Lưu ý:** Luôn test kỹ sau khi thay đổi UI, đặc biệt là dark mode và responsive design.

---

*Tài liệu được tạo bởi AI Assistant - 2026-01-21*  
*Dự án: Frontend React E-commerce - Bán Nước Hoa*
