import { MainLayout } from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { projectsService } from '@/services/projectsService';
import type { Project, ProjectIncludesOption } from '@/types/models/product';
import { toast } from 'sonner';
import { storage, type CartItemInput } from '@/utils/storage';
import { getCloudinaryProjectImageUrl, getVideoUrl } from '@/utils/imageUtils';

const ProjectsGrid = lazy(async () => {
  const module = await import('@/components/projects');
  return { default: module.ProjectsGrid };
});



export default function HomePage() {
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [canPlayHero, setCanPlayHero] = useState(false);

  const handleAddToCart = useCallback((project: Project, selectedIncludes?: ProjectIncludesOption) => {
    const projectAny = project as unknown as Record<string, unknown>;
    const projectId = projectAny._id || projectAny.id || '';
    if (!projectId) return;
    const projectName = String(projectAny.TenSanPham || projectAny.tenSP || 'Đồ án');
    const projectPrice = Number(projectAny.Gia ?? projectAny.gia ?? 0);
    const projectDiscount = Number(projectAny.KhuyenMai ?? projectAny.giamGia ?? 0);
    const projectImage = String(projectAny.HinhAnhChinh || projectAny.hinhAnh || '');
    const maLoaiSanPham = projectAny.MaLoaiSanPham as Record<string, unknown> | undefined;
    const projectCategory = String(projectAny.loaiSP || (typeof maLoaiSanPham === 'object' ? maLoaiSanPham?.TenLoaiSanPham : '') || 'Đồ án');
    const options = Array.isArray(projectAny.DungTichOptions) ? projectAny.DungTichOptions : undefined;

    const item: CartItemInput = {
      projectId: String(projectId),
      tenSP: projectName,
      basePrice: projectPrice,
      giamGia: projectDiscount,
      hinhAnh: projectImage,
      loaiSP: projectCategory,
      selectedDungTich: selectedIncludes,
      includesOptions: options,
    };
    storage.addCartItem(item, 1);
    window.dispatchEvent(new CustomEvent('cart:updated'));
    toast.success('Đã thêm vào giỏ hàng');
  }, []);

  useEffect(() => {
    let isMounted = true;
    const frame = requestAnimationFrame(() => setCanPlayHero(true));

    projectsService.getAllProjects({ limit: 8 })
      .then((result) => {
        if (!isMounted) return;
        
        const projects = result.projects || [];
        
        const validProjects = projects.map((project, index) => {
          const p = project as unknown as Record<string, unknown>;
          let discountPercent = 0;
          const khuyenMai = Number(p.KhuyenMai ?? 0);
          if (khuyenMai > 0) {
            discountPercent = khuyenMai;
          } else {
            const giaKhuyenMai = Number(p.GiaKhuyenMai ?? 0);
            const gia = Number(p.Gia ?? 0);
            if (giaKhuyenMai > 0 && gia > 0 && giaKhuyenMai < gia) {
              discountPercent = Math.round(((gia - giaKhuyenMai) / gia) * 100);
            }
          }
          
          const normalized = {
            _id: p._id || p.id || `project-${index}`,
            TenSanPham: p.TenSanPham || 'Đồ án',
            MoTa: p.MoTa || 'Đồ án chính hãng cao cấp',
            Gia: Number(p.Gia || 0),
            KhuyenMai: discountPercent,
            SoLuong: Number(p.SoLuong || 0),
            DaBan: Number(p.DaBan || 0),
            DungTich: p.DungTich,
            DungTichOptions: Array.isArray(p.DungTichOptions) ? p.DungTichOptions : (p.DungTich ? [{ value: p.DungTich, label: `${p.DungTich} ml`, isDefault: true }] : []),
            HinhAnhChinh: (() => {
              const img = String(p.HinhAnhChinh || '');
              // Nếu là URL đầy đủ, sử dụng trực tiếp
              if (img && (img.startsWith('http://') || img.startsWith('https://'))) {
                return img;
              }
              // Nếu là path Cloudinary, sử dụng getCloudinaryProjectImageUrl
              return getCloudinaryProjectImageUrl(img);
            })(),
            HinhAnhPhu: Array.isArray(p.HinhAnhPhu) 
              ? p.HinhAnhPhu.map((img: unknown) => {
                  const imgStr = String(img || '');
                  // Nếu là URL đầy đủ, sử dụng trực tiếp
                  if (imgStr && (imgStr.startsWith('http://') || imgStr.startsWith('https://'))) {
                    return imgStr;
                  }
                  return getCloudinaryProjectImageUrl(imgStr);
                })
              : [],
            MaLoaiSanPham: p.MaLoaiSanPham || (typeof p.MaLoaiSanPham === 'object' ? p.MaLoaiSanPham : null),
            id: String(p._id || p.id || `project-${index}`),
            tenSP: String(p.TenSanPham || 'Đồ án'),
            mota: String(p.MoTa || 'Đồ án chính hãng cao cấp'),
            gia: Number(p.Gia || 0),
            giamGia: discountPercent,
            soLuong: Number(p.SoLuong || 0),
            daBan: Number(p.DaBan || 0),
            dungTich: p.DungTich,
            dungTichOptions: Array.isArray(p.DungTichOptions) ? p.DungTichOptions : (p.DungTich ? [{ value: p.DungTich, label: `${p.DungTich} ml`, isDefault: true }] : []),
            hinhAnhChinh: (() => {
              const img = String(p.HinhAnhChinh || '');
              if (img && (img.startsWith('http://') || img.startsWith('https://'))) {
                return img;
              }
              return getCloudinaryProjectImageUrl(img);
            })(),
            hinhAnhPhu: Array.isArray(p.HinhAnhPhu) 
              ? p.HinhAnhPhu.map((img: unknown) => {
                  const imgStr = String(img || '');
                  if (imgStr && (imgStr.startsWith('http://') || imgStr.startsWith('https://'))) {
                    return imgStr;
                  }
                  return getCloudinaryProjectImageUrl(imgStr);
                })
              : [],
            hinhAnh: (() => {
              const img = String(p.HinhAnhChinh || '');
              if (img && (img.startsWith('http://') || img.startsWith('https://'))) {
                return img;
              }
              return getCloudinaryProjectImageUrl(img);
            })(),
            loaiSP: typeof p.MaLoaiSanPham === 'object' ? String((p.MaLoaiSanPham as Record<string, unknown>)?.TenLoaiSanPham || 'Đồ án') : 'Đồ án',
          };
          
          return normalized as unknown as Project;
        });
        
        setFeaturedProjects(validProjects.slice(0, 8));
        setLoading(false);
      })
      .catch((error) => {
        if (isMounted) {
          const errorRecord = error as Record<string, unknown>;
          const status = errorRecord?.status || (errorRecord?.response as Record<string, unknown>)?.status;
          
          // Don't show error toast for 404 (API not implemented yet)
          if (status !== 404) {
            if (import.meta.env.DEV) {
              console.error('Error fetching projects:', error);
            }
            toast.error('Không thể tải đồ án');
          } else if (import.meta.env.DEV) {
            console.warn('Projects API not implemented yet (404). Showing empty state.');
          }
          
          // Set empty array and stop loading
          setFeaturedProjects([]);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
                Đồ án
                <span className="text-primary"> cao cấp</span>
                <br />
                Chính hãng 100%
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Khám phá bộ sưu tập đồ án cao cấp từ các môn học hàng đầu thế giới.
                Mang đến chất lượng quyến rũ, đẳng cấp.
              </p>
              <div className="flex space-x-4">
                <Link to="/projects">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6">
                    Khám phá ngay
                  </Button>
                </Link>
                <Link to="/documents">
                  <Button variant="outline" className="text-lg px-8 py-6">
                    Tài liệu
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="w-full h-96 rounded-3xl overflow-hidden shadow-2xl bg-muted">
                {canPlayHero ? (
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="none"
                    poster="https://placehold.co/800x600/151515/ffffff?text=Project+Shop"
                    className="w-full h-full object-cover will-change-transform"
                    onLoadedData={(e) => {
                      // Video loaded, can start playing
                      (e.target as HTMLVideoElement).play().catch(() => {
                        // Auto-play failed, user interaction required
                      });
                    }}
                  >
                    <source src={getVideoUrl('backgroud', undefined, '1763184665')} type="video/mp4" />
                  </video>
                ) : (
                  <div className="w-full h-full bg-muted animate-pulse" />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Đồ án nổi bật</h2>
            <p className="text-lg text-muted-foreground">
              Những đồ án được yêu thích nhất tại Project Shop
            </p>
          </div>

          <Suspense
            fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-72 rounded-3xl bg-background/50 animate-pulse"
                  />
                ))}
              </div>
            }
          >
            <ProjectsGrid
              projects={featuredProjects}
              loading={loading}
              emptyMessage="Không có đồ án nào"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              showSoldQuantity={true}
              showAddToCartButton={true}
              showIncludesOptions={true}
              onAddToCart={handleAddToCart}
            />
          </Suspense>

          <div className="text-center mt-12">
            <Link to="/projects">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg">
                Xem tất cả đồ án
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-primary-foreground mb-4">
            Đăng ký nhận ưu đãi đặc biệt
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8">
            Nhận ngay voucher giảm giá 20% cho đơn hàng đầu tiên
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <input
              type="email"
              placeholder="Nhập email của bạn"
              className="px-6 py-4 rounded-xl text-foreground bg-background flex-1 max-w-md"
            />
            <Button className="bg-background text-primary hover:bg-muted px-8 py-4 text-lg font-semibold">
              Đăng ký ngay
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

