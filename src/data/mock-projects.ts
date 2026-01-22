/**
 * Mock Projects Data
 * Dữ liệu mẫu cho đồ án để test UI
 */

import type { Project } from "@/types/models/product";

// Mock data uses extended Project fields (title, subject, etc.) that are not in the base Project type
// Cast to any to allow these additional fields for mock data
export const mockProjects = [
  {
    _id: "proj-001" as any,
    TenSanPham: "Website Bán Hàng Thời Trang",
    MaLoaiSanPham: "cat-001" as any,
    Gia: 299000,
    KhuyenMai: 25,
    SoLuong: 50,
    DaBan: 245,
    MoTa: "Website bán hàng thời trang hoàn chỉnh với đầy đủ tính năng quản lý đồ án, đơn hàng, thanh toán và admin dashboard. Code chuẩn, dễ customize.",
    HinhAnhChinh: "https://placehold.co/400x400/2563eb/ffffff?text=Fashion+Store",
    HinhAnhPhu: [
      "https://placehold.co/800x450/2563eb/ffffff?text=Home+Page",
      "https://placehold.co/800x450/10b981/ffffff?text=Projects+Page",
      "https://placehold.co/800x450/8b5cf6/ffffff?text=Admin+Dashboard"
    ],
    // Extended fields for mock data
    subject: "Web Development",
    category: "Source Code Full",
    level: "Đại học",
    originalPrice: 399000,
    shortDescription: "Website bán hàng thời trang fullstack với React + Node.js",
    tech_stack: ["React", "Node.js", "MongoDB", "Express", "Tailwind CSS", "Vite"],
    features: [
      "Quản lý đồ án, đơn hàng",
      "Tích hợp thanh toán VNPay",
      "Admin dashboard đầy đủ",
      "Responsive design",
      "Authentication & Authorization",
      "Shopping cart",
      "Project reviews"
    ],
    includes: [
      "Source code Frontend (React)",
      "Source code Backend (Node.js)",
      "Database schema & sample data",
      "Tài liệu hướng dẫn chi tiết",
      "Video demo 15 phút",
      "API documentation"
    ],
    preview_images: [
      "https://placehold.co/800x450/2563eb/ffffff?text=Home+Page",
      "https://placehold.co/800x450/10b981/ffffff?text=Projects+Page",
      "https://placehold.co/800x450/8b5cf6/ffffff?text=Admin+Dashboard"
    ],
    thumbnail: "https://placehold.co/400x400/2563eb/ffffff?text=Fashion+Store",
    demo_url: "https://demo.example.com/fashion-store",
    video_url: "https://youtube.com/watch?v=example",
    grade: "9.5/10",
    year: 2024,
    university: "ĐH Bách Khoa HN",
    semester: "Học kỳ 2",
    tags: ["ecommerce", "react", "nodejs", "fullstack", "fashion"],
    downloads: 245,
    views: 1234,
    rating: 4.8,
    totalReviews: 32,
    status: "available",
    isFeatured: true,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-20T00:00:00.000Z"
  },
  {
    _id: "proj-002" as any,
    TenSanPham: "Ứng Dụng Quản Lý Thư Viện Mobile",
    subject: "Mobile App Development",
    category: "Source Code Full",
    level: "Đại học",
    Gia: 249000,
    MoTa: "Ứng dụng mobile quản lý thư viện với React Native. Bao gồm tính năng mượn/trả sách, tìm kiếm, thông báo, và quản lý thành viên.",
    shortDescription: "App quản lý thư viện với React Native",
    tech_stack: ["React Native", "Firebase", "Redux", "TypeScript"],
    features: [
      "Mượn/trả sách",
      "Tìm kiếm sách",
      "Thông báo hạn trả",
      "Quản lý thành viên",
      "Barcode scanner",
      "Offline mode"
    ],
    includes: [
      "Source code React Native",
      "Firebase configuration",
      "APK file",
      "Tài liệu hướng dẫn",
      "Database schema"
    ],
    preview_images: [
      "https://placehold.co/400x800/2563eb/ffffff?text=Home+Screen",
      "https://placehold.co/400x800/10b981/ffffff?text=Books+List"
    ],
    thumbnail: "https://placehold.co/400x400/10b981/ffffff?text=Library+App",
    tags: ["mobile", "react-native", "firebase", "library"],
    downloads: 189,
    views: 856,
    rating: 4.6,
    totalReviews: 18,
    status: "available",
    createdAt: "2024-02-01T00:00:00.000Z",
    updatedAt: "2024-02-10T00:00:00.000Z"
  },
  {
    _id: "proj-003" as any,
    TenSanPham: "Hệ Thống Phân Tích Dữ Liệu Bán Hàng",
    subject: "Data Science",
    category: "Full Package",
    level: "Thạc sĩ",
    Gia: 499000,
    MoTa: "Hệ thống phân tích dữ liệu bán hàng với Python, Machine Learning. Bao gồm data visualization, predictive analytics, và báo cáo tự động.",
    shortDescription: "Hệ thống phân tích dữ liệu với ML",
    tech_stack: ["Python", "Pandas", "Scikit-learn", "Matplotlib", "Jupyter", "Flask"],
    features: [
      "Data visualization",
      "Predictive analytics",
      "Sales forecasting",
      "Customer segmentation",
      "Automated reports",
      "Dashboard"
    ],
    includes: [
      "Source code Python",
      "Jupyter notebooks",
      "Dataset mẫu",
      "Báo cáo luận văn (PDF)",
      "Slide thuyết trình",
      "Tài liệu hướng dẫn"
    ],
    preview_images: [
      "https://placehold.co/800x450/8b5cf6/ffffff?text=Dashboard",
      "https://placehold.co/800x450/2563eb/ffffff?text=Analytics"
    ],
    thumbnail: "https://placehold.co/400x400/8b5cf6/ffffff?text=Data+Analytics",
    grade: "9.0/10",
    year: 2023,
    university: "ĐH Khoa Học Tự Nhiên",
    tags: ["data-science", "python", "machine-learning", "analytics"],
    downloads: 156,
    views: 678,
    rating: 4.9,
    totalReviews: 24,
    status: "available",
    isFeatured: true,
    createdAt: "2023-12-15T00:00:00.000Z",
    updatedAt: "2024-01-05T00:00:00.000Z"
  },
  {
    _id: "proj-004" as any,
    TenSanPham: "Game 2D Platformer với Unity",
    subject: "Game Development",
    category: "Source Code Full",
    level: "Cao đẳng",
    Gia: 199000,
    MoTa: "Game 2D platformer đơn giản với Unity. Bao gồm character controller, enemy AI, collectibles, và level system.",
    shortDescription: "Game 2D platformer với Unity",
    tech_stack: ["Unity", "C#", "2D Sprite"],
    features: [
      "Character movement",
      "Enemy AI",
      "Collectibles",
      "Level system",
      "Sound effects",
      "Particle effects"
    ],
    includes: [
      "Unity project files",
      "Sprites & assets",
      "Scripts (C#)",
      "Build files (Windows, Android)",
      "Tài liệu hướng dẫn"
    ],
    preview_images: [
      "https://placehold.co/800x450/2563eb/ffffff?text=Game+Scene+1",
      "https://placehold.co/800x450/10b981/ffffff?text=Game+Scene+2"
    ],
    thumbnail: "https://placehold.co/400x400/2563eb/ffffff?text=2D+Game",
    tags: ["game", "unity", "2d", "platformer"],
    downloads: 312,
    views: 1456,
    rating: 4.5,
    totalReviews: 28,
    status: "available",
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-18T00:00:00.000Z"
  },
  {
    _id: "proj-005" as any,
    TenSanPham: "Hệ Thống Quản Lý Nhân Sự",
    subject: "Web Development",
    category: "Source Code Full",
    level: "Đại học",
    Gia: 349000,
    originalPrice: 449000,
    KhuyenMai: 22,
    MoTa: "Hệ thống quản lý nhân sự với Laravel và Vue.js. Quản lý nhân viên, chấm công, lương, và báo cáo.",
    shortDescription: "HR Management System với Laravel + Vue.js",
    tech_stack: ["Laravel", "Vue.js", "MySQL", "Bootstrap", "Chart.js"],
    features: [
      "Quản lý nhân viên",
      "Chấm công",
      "Tính lương",
      "Báo cáo",
      "Dashboard",
      "Role-based access"
    ],
    includes: [
      "Source code Laravel",
      "Source code Vue.js",
      "Database migration",
      "Sample data",
      "Tài liệu API",
      "Tài liệu hướng dẫn"
    ],
    preview_images: [
      "https://placehold.co/800x450/10b981/ffffff?text=Employee+List",
      "https://placehold.co/800x450/2563eb/ffffff?text=Dashboard"
    ],
    thumbnail: "https://placehold.co/400x400/10b981/ffffff?text=HR+System",
    tags: ["laravel", "vuejs", "hr", "management"],
    downloads: 278,
    views: 1123,
    rating: 4.7,
    totalReviews: 35,
    status: "available",
    isFeatured: true,
    createdAt: "2024-01-20T00:00:00.000Z",
    updatedAt: "2024-01-25T00:00:00.000Z"
  },
  {
    _id: "proj-006" as any,
    TenSanPham: "Chatbot Hỗ Trợ Khách Hàng",
    subject: "AI/ML",
    category: "Source Code Full",
    level: "Thạc sĩ",
    Gia: 399000,
    MoTa: "Chatbot hỗ trợ khách hàng sử dụng NLP và Machine Learning. Tích hợp với website và có thể trả lời câu hỏi tự động.",
    shortDescription: "AI Chatbot với NLP",
    tech_stack: ["Python", "TensorFlow", "NLTK", "Flask", "React"],
    features: [
      "Natural Language Processing",
      "Intent recognition",
      "Context understanding",
      "Web integration",
      "Admin dashboard",
      "Analytics"
    ],
    includes: [
      "Source code Python",
      "Trained model",
      "Frontend React",
      "API documentation",
      "Training dataset",
      "Tài liệu hướng dẫn"
    ],
    preview_images: [
      "https://placehold.co/800x450/8b5cf6/ffffff?text=Chatbot+Interface"
    ],
    thumbnail: "https://placehold.co/400x400/8b5cf6/ffffff?text=Chatbot",
    demo_url: "https://demo.example.com/chatbot",
    tags: ["ai", "nlp", "chatbot", "machine-learning"],
    downloads: 134,
    views: 567,
    rating: 4.8,
    totalReviews: 19,
    status: "available",
    createdAt: "2023-11-20T00:00:00.000Z",
    updatedAt: "2023-12-01T00:00:00.000Z"
  },
  {
    _id: "proj-007" as any,
    TenSanPham: "Website Tin Tức với Next.js",
    subject: "Web Development",
    category: "Source Code Full",
    level: "Đại học",
    Gia: 229000,
    MoTa: "Website tin tức hiện đại với Next.js, SSR, và CMS. Tối ưu SEO, tốc độ load nhanh.",
    shortDescription: "News website với Next.js",
    tech_stack: ["Next.js", "TypeScript", "Tailwind CSS", "Prisma", "PostgreSQL"],
    features: [
      "Server-side rendering",
      "SEO optimized",
      "CMS integration",
      "Comment system",
      "Newsletter",
      "Search functionality"
    ],
    includes: [
      "Source code Next.js",
      "Database schema",
      "CMS setup guide",
      "Deployment guide",
      "Tài liệu hướng dẫn"
    ],
    preview_images: [
      "https://placehold.co/800x450/2563eb/ffffff?text=News+Homepage"
    ],
    thumbnail: "https://placehold.co/400x400/2563eb/ffffff?text=News+Site",
    demo_url: "https://demo.example.com/news",
    tags: ["nextjs", "ssr", "cms", "news"],
    downloads: 423,
    views: 1890,
    rating: 4.6,
    totalReviews: 42,
    status: "available",
    createdAt: "2024-01-05T00:00:00.000Z",
    updatedAt: "2024-01-12T00:00:00.000Z"
  },
  {
    _id: "proj-008" as any,
    TenSanPham: "Luận Văn: Phân Tích An Toàn Mạng",
    subject: "Networking",
    category: "Báo cáo/Luận văn",
    level: "Thạc sĩ",
    Gia: 149000,
    MoTa: "Luận văn thạc sĩ về phân tích an toàn mạng. Bao gồm nghiên cứu, phân tích, và đề xuất giải pháp.",
    shortDescription: "Luận văn về an toàn mạng",
    tech_stack: ["Wireshark", "Python", "Network Analysis"],
    features: [
      "Nghiên cứu tổng quan",
      "Phân tích thực nghiệm",
      "Đề xuất giải pháp",
      "Kết quả và đánh giá"
    ],
    includes: [
      "File PDF luận văn",
      "Slide thuyết trình",
      "Source code phân tích",
      "Dataset",
      "Tài liệu tham khảo"
    ],
    preview_images: [
      "https://placehold.co/800x450/10b981/ffffff?text=Thesis+Cover"
    ],
    thumbnail: "https://placehold.co/400x400/10b981/ffffff?text=Thesis",
    grade: "8.5/10",
    year: 2023,
    university: "ĐH Công Nghệ",
    tags: ["thesis", "networking", "security", "research"],
    downloads: 89,
    views: 345,
    rating: 4.4,
    totalReviews: 12,
    status: "available",
    createdAt: "2023-10-15T00:00:00.000Z",
    updatedAt: "2023-11-01T00:00:00.000Z"
  },
  {
    _id: "proj-009" as any,
    TenSanPham: "Ứng Dụng Đặt Đồ Ăn",
    subject: "Mobile App Development",
    category: "Source Code Full",
    level: "Cao đẳng",
    Gia: 279000,
    MoTa: "App đặt đồ ăn với Flutter. Bao gồm đặt món, thanh toán, tracking đơn hàng, và đánh giá.",
    shortDescription: "Food delivery app với Flutter",
    tech_stack: ["Flutter", "Dart", "Firebase", "Google Maps API"],
    features: [
      "Đặt món",
      "Thanh toán online",
      "Tracking đơn hàng",
      "Đánh giá nhà hàng",
      "Lịch sử đơn hàng",
      "Push notifications"
    ],
    includes: [
      "Source code Flutter",
      "Firebase setup",
      "APK file",
      "Design files (Figma)",
      "Tài liệu hướng dẫn"
    ],
    preview_images: [
      "https://placehold.co/400x800/2563eb/ffffff?text=Home",
      "https://placehold.co/400x800/10b981/ffffff?text=Menu"
    ],
    thumbnail: "https://placehold.co/400x400/2563eb/ffffff?text=Food+App",
    tags: ["flutter", "mobile", "food-delivery", "firebase"],
    downloads: 367,
    views: 1567,
    rating: 4.7,
    totalReviews: 38,
    status: "available",
    isFeatured: true,
    createdAt: "2024-01-08T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z"
  },
  {
    _id: "proj-010" as any,
    TenSanPham: "Hệ Thống IoT Giám Sát Nông Nghiệp",
    subject: "IoT",
    category: "Full Package",
    level: "Đại học",
    Gia: 449000,
    MoTa: "Hệ thống IoT giám sát nhiệt độ, độ ẩm, ánh sáng cho nông nghiệp. Bao gồm hardware và software.",
    shortDescription: "IoT system cho nông nghiệp",
    tech_stack: ["Arduino", "Raspberry Pi", "Python", "React", "MQTT"],
    features: [
      "Sensor monitoring",
      "Real-time data",
      "Mobile app",
      "Alert system",
      "Data analytics",
      "Automation"
    ],
    includes: [
      "Source code",
      "Hardware schematics",
      "PCB design files",
      "Mobile app",
      "Documentation",
      "Video demo"
    ],
    preview_images: [
      "https://placehold.co/800x450/8b5cf6/ffffff?text=IoT+Dashboard"
    ],
    thumbnail: "https://placehold.co/400x400/8b5cf6/ffffff?text=IoT+System",
    tags: ["iot", "arduino", "agriculture", "sensors"],
    downloads: 112,
    views: 489,
    rating: 4.9,
    totalReviews: 15,
    status: "available",
    createdAt: "2023-12-20T00:00:00.000Z",
    updatedAt: "2024-01-03T00:00:00.000Z"
  }
];
