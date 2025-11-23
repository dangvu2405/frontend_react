import { MainLayout } from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Truck, HeadphonesIcon } from 'lucide-react';
import { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { productsService } from '@/services/productsService';
import type { Product } from '@/types/models';
import { toast } from 'sonner';
import { storage, type CartItem } from '@/utils/storage';
import { getCloudinaryProductImageUrl, getVideoUrl } from '@/utils/imageUtils';

const ProductsGrid = lazy(async () => {
  const module = await import('@/components/products');
  return { default: module.ProductsGrid };
});

const FEATURE_CARDS = [
  {
    icon: <ShieldCheck className="w-8 h-8" />,
    title: 'Hàng chính hãng',
    description: '100% sản phẩm chính hãng, có tem chống giả',
  },
  {
    icon: <Truck className="w-8 h-8" />,
    title: 'Giao hàng nhanh',
    description: 'Giao hàng toàn quốc trong 2-3 ngày',
  },
  {
    icon: <Sparkles className="w-8 h-8" />,
    title: 'Chất lượng cao',
    description: 'Sản phẩm cao cấp từ các thương hiệu hàng đầu',
  },
  {
    icon: <HeadphonesIcon className="w-8 h-8" />,
    title: 'Hỗ trợ 24/7',
    description: 'Đội ngũ tư vấn nhiệt tình, chuyên nghiệp',
  },
];


export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [canPlayHero, setCanPlayHero] = useState(false);

  const handleAddToCart = useCallback((product: Product | any) => {
    // Support both normalized (camelCase) and original (PascalCase) formats
    const productAny = product as any;
    const productId = productAny.id || productAny._id || '';
    const productName = productAny.tenSP || productAny.TenSanPham || 'Sản phẩm';
    const productPrice = productAny.gia || productAny.Gia || 0;
    const productDiscount = productAny.giamGia || productAny.KhuyenMai || 0;
    const productImage = productAny.hinhAnhChinh || productAny.hinhAnh || productAny.HinhAnhChinh || '';
    const productCategory = productAny.loaiSP || (typeof productAny.MaLoaiSanPham === 'object' ? productAny.MaLoaiSanPham?.TenLoaiSanPham : '') || 'Nước hoa';

    const item: CartItem = {
      id: productId,
      tenSP: productName,
      gia: productPrice,
      giamGia: productDiscount,
      hinhAnh: productImage,
      loaiSP: productCategory,
      quantity: 1,
    };
    storage.addCartItem(item, 1);
    window.dispatchEvent(new CustomEvent('cart:updated'));
    toast.success('Đã thêm vào giỏ hàng');
  }, []);

  useEffect(() => {
    let isMounted = true;
    const frame = requestAnimationFrame(() => setCanPlayHero(true));

    productsService.getAllProducts({ limit: 8 })
      .then((result) => {
        if (!isMounted) return;
        
        const products = result.products || [];
        
        const validProducts = products.map((product, index) => {
          const p = product as any;
          let discountPercent = 0;
          if (p.KhuyenMai > 0) {
            discountPercent = Number(p.KhuyenMai);
          } else if (p.GiaKhuyenMai && p.Gia && p.GiaKhuyenMai < p.Gia) {
            discountPercent = Math.round(((p.Gia - p.GiaKhuyenMai) / p.Gia) * 100);
          }
          
          const normalized = {
            _id: p._id || p.id || `product-${index}`,
            TenSanPham: p.TenSanPham || 'Sản phẩm',
            MoTa: p.MoTa || 'Sản phẩm chính hãng cao cấp',
            Gia: Number(p.Gia || 0),
            KhuyenMai: discountPercent,
            SoLuong: Number(p.SoLuong || 0),
            DaBan: Number(p.DaBan || 0),
            HinhAnhChinh: getCloudinaryProductImageUrl(p.HinhAnhChinh),
            HinhAnhPhu: Array.isArray(p.HinhAnhPhu) 
              ? p.HinhAnhPhu.map((img: string) => getCloudinaryProductImageUrl(img))
              : [],
            MaLoaiSanPham: p.MaLoaiSanPham || (typeof p.MaLoaiSanPham === 'object' ? p.MaLoaiSanPham : null),
            id: p._id || p.id || `product-${index}`,
            tenSP: p.TenSanPham || 'Sản phẩm',
            mota: p.MoTa || 'Sản phẩm chính hãng cao cấp',
            gia: Number(p.Gia || 0),
            giamGia: discountPercent,
            soLuong: Number(p.SoLuong || 0),
            daBan: Number(p.DaBan || 0),
            hinhAnhChinh: getCloudinaryProductImageUrl(p.HinhAnhChinh),
            hinhAnhPhu: Array.isArray(p.HinhAnhPhu) 
              ? p.HinhAnhPhu.map((img: string) => getCloudinaryProductImageUrl(img))
              : [],
            hinhAnh: getCloudinaryProductImageUrl(p.HinhAnhChinh),
            loaiSP: typeof p.MaLoaiSanPham === 'object' ? p.MaLoaiSanPham?.TenLoaiSanPham : 'Nước hoa',
          };
          
          return normalized as unknown as Product;
        });
        
        setFeaturedProducts(validProducts.slice(0, 8));
        setLoading(false);
      })
      .catch((error) => {
        if (isMounted) {
          if (import.meta.env.DEV) {
          console.error('Error fetching products:', error);
          }
          toast.error('Không thể tải sản phẩm');
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
                Nước hoa
                <span className="text-primary"> cao cấp</span>
                <br />
                Chính hãng 100%
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Khám phá bộ sưu tập nước hoa cao cấp từ các thương hiệu hàng đầu thế giới.
                Mang đến hương thơm quyến rũ, đẳng cấp.
              </p>
              <div className="flex space-x-4">
                <Link to="/products">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6">
                    Khám phá ngay
                  </Button>
                </Link>
                <Link to="/about">
                  <Button variant="outline" className="text-lg px-8 py-6">
                    Tìm hiểu thêm
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
                    poster="https://placehold.co/800x600/151515/ffffff?text=Perfume+Shop"
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

      {/* Features */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {FEATURE_CARDS.map((feature, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-2xl hover:bg-muted transition-colors"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl text-primary mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Sản phẩm nổi bật</h2>
            <p className="text-lg text-muted-foreground">
              Những sản phẩm được yêu thích nhất tại Perfume Shop
            </p>
          </div>

          <Suspense
            fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-72 rounded-3xl bg-background/50 animate-pulse"
                  />
                ))}
              </div>
            }
          >
            <ProductsGrid
              products={featuredProducts}
              loading={loading}
              emptyMessage="Không có sản phẩm nào"
              className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6"
              showSoldQuantity={true}
              showAddToCartButton={true}
              onAddToCart={handleAddToCart}
            />
          </Suspense>

          <div className="text-center mt-12">
            <Link to="/products">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg">
                Xem tất cả sản phẩm
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

