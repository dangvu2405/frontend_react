import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { productsService } from '@/services/productsService';
import type { Product, ProductVolumeOption } from '@/types/models';
import { storage, type CartItemInput } from '@/utils/storage';
import { reviewService, type RatingStats } from '@/services/reviewService';
import { toast } from 'sonner';
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Truck, 
  ShieldCheck, 
  ArrowLeft,
  Minus,
  Plus
} from 'lucide-react';
import { ProductsGrid } from '@/components/products';
import { ProductReviews } from '@/components/ProductReviews';
import { getCloudinaryProductImageUrl } from '@/utils/imageUtils';
import { heartService } from '@/services/heartService';
import { useAuth } from '@/contexts/AuthContext';

const FALLBACK_IMAGE = 'https://placehold.co/600x600/E5E5EA/000?text=No+Image';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [selectedVolume, setSelectedVolume] = useState<ProductVolumeOption | undefined>(undefined);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingHeart, setIsTogglingHeart] = useState(false);

  const volumeOptions = useMemo<ProductVolumeOption[]>(() => {
    if (!product) return [];
    const rawOptions = product.DungTichOptions;
    let normalized = Array.isArray(rawOptions) ? rawOptions.filter(Boolean) : [];
    if (!normalized.length) {
      const fallback = product.DungTich;
      if (fallback && Number(fallback) > 0) {
        normalized = [{ value: Number(fallback), label: `${fallback} ml`, isDefault: true }];
      }
    }
    if (!normalized.length) return [];
    if (!normalized.some(opt => opt.isDefault)) {
      normalized[0].isDefault = true;
    }
    return normalized;
  }, [product]);

  useEffect(() => {
    if (!volumeOptions.length) {
      setSelectedVolume(undefined);
      return;
    }
    setSelectedVolume(volumeOptions.find(opt => opt.isDefault) || volumeOptions[0]);
  }, [volumeOptions]);

  const productId = useMemo(() => {
    if (product?._id) return String(product._id);
    return id || '';
  }, [product?._id, id]);

  useEffect(() => {
    if (!productId) {
      setIsFavorite(false);
      return;
    }
    setIsFavorite(storage.isHeart(productId));
  }, [productId]);

  useEffect(() => {
    const handleHeartsUpdate = () => {
      if (productId) {
        setIsFavorite(storage.isHeart(productId));
      }
    };

    window.addEventListener('hearts:updated', handleHeartsUpdate);
    return () => window.removeEventListener('hearts:updated', handleHeartsUpdate);
  }, [productId]);

  const shareUrl = useMemo(() => {
    if (!productId) return typeof window !== 'undefined' ? window.location.href : '';
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/products/${productId}`;
    }
    return `/products/${productId}`;
  }, [productId]);

  // Fetch product detail
  useEffect(() => {
    let isMounted = true;

    const fetchProductDetail = async () => {
      if (!id) {
        navigate('/products');
        return;
      }

      try {
        setLoading(true);
        const productData = await productsService.getProductById(id);
        
        if (!isMounted) return;

        if (!productData) {
          toast.error('Không tìm thấy sản phẩm');
          navigate('/products');
          return;
        }

        // ✅ Dùng trực tiếp data từ API, chỉ transform ảnh
        const product: Product = {
          ...productData,
          // Transform ảnh qua Cloudinary
          HinhAnhChinh: getCloudinaryProductImageUrl(productData.HinhAnhChinh) || FALLBACK_IMAGE,
          HinhAnhPhu: Array.isArray(productData.HinhAnhPhu) 
            ? productData.HinhAnhPhu.map((img: string) => getCloudinaryProductImageUrl(img) || FALLBACK_IMAGE)
            : [],
        };

        setProduct(product);
        setSelectedImage(0); // Reset về ảnh đầu tiên khi load sản phẩm mới

        // Fetch rating stats từ reviews
        try {
          const stats = await reviewService.getProductRatingStats(id);
          if (isMounted) {
            setRatingStats(stats);
          }
        } catch (statsError) {
          // Nếu không lấy được stats, để null (sẽ hiển thị mặc định)
          if (import.meta.env.DEV) {
            console.warn('Could not fetch rating stats:', statsError);
          }
        }

        // Fetch related products (same category)
        try {
          // Lấy category name từ product
          const categoryName = typeof product.MaLoaiSanPham === 'object' && product.MaLoaiSanPham
            ? product.MaLoaiSanPham.TenLoaiSanPham
            : '';
          
          if (categoryName) {
            const categoryProducts = await productsService.getProductsByCategory(categoryName);
          const related = categoryProducts
              .filter((p) => {
                const pId = p._id || (p as unknown as Record<string, unknown>).id;
              return pId !== id;
            })
            .slice(0, 4)
              .map((p) => ({
                ...p,
                // Transform ảnh qua Cloudinary
                HinhAnhChinh: getCloudinaryProductImageUrl(p.HinhAnhChinh) || FALLBACK_IMAGE,
                HinhAnhPhu: Array.isArray(p.HinhAnhPhu) 
                  ? p.HinhAnhPhu.map((img: string) => getCloudinaryProductImageUrl(img) || FALLBACK_IMAGE)
                  : [],
              }));

          setRelatedProducts(related);
          } else {
            setRelatedProducts([]);
          }
        } catch (relatedError) {
          if (import.meta.env.DEV) {
            console.warn('Could not fetch related products:', relatedError);
          }
          setRelatedProducts([]);
        }
      } catch (error: unknown) {
        if (!isMounted) return;
        if (import.meta.env.DEV) {
          console.error('Error fetching product:', error);
        }
        toast.error('Không thể tải thông tin sản phẩm');
        navigate('/products');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProductDetail();

    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  const handleQuantityChange = (delta: number) => {
    if (!product) return;
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= product.SoLuong) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = useCallback(() => {
    if (!product) return;

    // Lấy category name
    const categoryName = typeof product.MaLoaiSanPham === 'object' && product.MaLoaiSanPham
      ? product.MaLoaiSanPham.TenLoaiSanPham
      : 'Nước hoa';

    const item: CartItemInput = {
      productId: String(product._id),
      tenSP: product.TenSanPham,
      basePrice: product.Gia,
      giamGia: product.KhuyenMai || 0,
      hinhAnh: product.HinhAnhChinh,
      loaiSP: categoryName,
      selectedDungTich: selectedVolume || volumeOptions[0],
      volumeOptions: volumeOptions.length ? volumeOptions : undefined,
    };

    storage.addCartItem(item, quantity);
    window.dispatchEvent(new CustomEvent('cart:updated'));
    toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng`);
  }, [product, quantity, selectedVolume, volumeOptions]);

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  const handleAddToCartRelated = useCallback((relatedProduct: Product, selectedVolumeOption?: ProductVolumeOption) => {
    // Lấy category name
    const categoryName = typeof relatedProduct.MaLoaiSanPham === 'object' && relatedProduct.MaLoaiSanPham
      ? relatedProduct.MaLoaiSanPham.TenLoaiSanPham
      : 'Nước hoa';

    const options = relatedProduct.DungTichOptions && relatedProduct.DungTichOptions.length
      ? relatedProduct.DungTichOptions
      : (relatedProduct.DungTich ? [{ value: relatedProduct.DungTich, label: `${relatedProduct.DungTich} ml`, isDefault: true }] : []);
    const defaultSelection = selectedVolumeOption || options.find(opt => opt.isDefault) || options[0];

    const item: CartItemInput = {
      productId: String(relatedProduct._id),
      tenSP: relatedProduct.TenSanPham,
      basePrice: relatedProduct.Gia,
      giamGia: relatedProduct.KhuyenMai || 0,
      hinhAnh: relatedProduct.HinhAnhChinh,
      loaiSP: categoryName,
      selectedDungTich: defaultSelection,
      volumeOptions: options.length ? options : undefined,
    };
    storage.addCartItem(item, 1);
    window.dispatchEvent(new CustomEvent('cart:updated'));
    toast.success('Đã thêm vào giỏ hàng');
  }, []);

  const handleToggleHeart = useCallback(async () => {
    if (!productId || !product || isTogglingHeart) return;

    const nextState = !isFavorite;
    setIsTogglingHeart(true);

    try {
      if (nextState) {
        storage.addHeart(productId);
        if (isAuthenticated) {
          try {
            await heartService.addHeart(productId);
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error('Không thể đồng bộ yêu thích lên server:', error);
            }
          }
        }
        toast.success('Đã thêm vào danh sách yêu thích');
      } else {
        storage.removeHeart(productId);
        if (isAuthenticated) {
          try {
            await heartService.removeHeart(productId);
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error('Không thể xoá yêu thích trên server:', error);
            }
          }
        }
        toast.success('Đã bỏ khỏi danh sách yêu thích');
      }
      setIsFavorite(nextState);
    } catch {
      toast.error('Không thể cập nhật danh sách yêu thích');
    } finally {
      setIsTogglingHeart(false);
    }
  }, [isAuthenticated, isFavorite, isTogglingHeart, product, productId]);

  const handleShareProduct = useCallback(async () => {
    if (!product || !productId) return;

    const url = shareUrl || (typeof window !== 'undefined' ? window.location.href : '');
    const shareData = {
      title: product.TenSanPham,
      text: product.MoTa || 'Xem sản phẩm này trên cửa hàng của chúng tôi',
      url,
    };

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(shareData);
        toast.success('Đã mở hộp thoại chia sẻ');
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success('Đã sao chép link sản phẩm');
        return;
      }

      if (typeof window !== 'undefined') {
        window.prompt('Sao chép đường dẫn sản phẩm:', url);
        toast.success('Link sản phẩm đã sẵn sàng để sao chép');
      }
    } catch (error: unknown) {
      const errorRecord = error as Record<string, unknown>;
      if (errorRecord?.name !== 'AbortError') {
        toast.error('Không thể chia sẻ sản phẩm');
      }
    }
  }, [product, productId, shareUrl]);

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="text-muted-foreground mt-4">Đang tải sản phẩm...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!product) {
    return null;
  }

  // ✅ Tính toán từ data đúng format
  const isSoldOut = product.SoLuong <= 0;
  const discount = product.KhuyenMai || 0;
  const basePrice = product.Gia;
  const variantBasePrice = basePrice + (selectedVolume?.priceDiff || 0);
  const discountedPrice = discount > 0 ? Math.round(variantBasePrice * (1 - discount / 100)) : variantBasePrice;
  const savings = Math.max(0, variantBasePrice - discountedPrice);
  const volumeText = selectedVolume?.label || (product.DungTich ? `${Number.isInteger(product.DungTich) ? product.DungTich : parseFloat(product.DungTich.toFixed(2).replace(/\.?0+$/, ''))} ml` : null);
  
  // Lấy category name
  const categoryName = typeof product.MaLoaiSanPham === 'object' && product.MaLoaiSanPham
    ? product.MaLoaiSanPham.TenLoaiSanPham
    : 'Nước hoa';

  return (
    <MainLayout>
      {/* Breadcrumb */}
      <section className="bg-muted/30 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/products')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách sản phẩm</span>
          </button>
        </div>
      </section>

      {/* Product Detail */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted border-2 border-border">
                {(() => {
                  // ✅ Tạo mảng tất cả ảnh: ảnh chính + ảnh phụ
                  const allImages = [
                    product.HinhAnhChinh || FALLBACK_IMAGE,
                    ...(Array.isArray(product.HinhAnhPhu) ? product.HinhAnhPhu : [])
                  ].filter(Boolean); // Loại bỏ các giá trị null/undefined/empty
                  
                  const currentImage = allImages[selectedImage] || allImages[0] || FALLBACK_IMAGE;
                  
                  return (
                    <img
                      src={currentImage}
                      alt={product.TenSanPham}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  );
                })()}
                {discount > 0 && (
                  <div className="absolute top-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    -{discount}%
                  </div>
                )}
                {isSoldOut && (
                  <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
                    <span className="bg-destructive text-destructive-foreground px-6 py-3 rounded-lg font-bold text-lg">
                      HẾT HÀNG
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnail images */}
              {(() => {
                // ✅ Tạo mảng tất cả ảnh: ảnh chính + ảnh phụ
                const allImages = [
                  product.HinhAnhChinh || FALLBACK_IMAGE,
                  ...(Array.isArray(product.HinhAnhPhu) ? product.HinhAnhPhu : [])
                ].filter(Boolean); // Loại bỏ các giá trị null/undefined/empty
                
                // Chỉ hiển thị thumbnail nếu có nhiều hơn 1 ảnh
                if (allImages.length <= 1) return null;
                
                return (
                  <div className="grid grid-cols-4 gap-2">
                    {allImages.slice(0, 4).map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage === idx
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${product.TenSanPham} ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = FALLBACK_IMAGE;
                          }}
                        />
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Category */}
              <div>
                <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-full">
                  {categoryName}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl font-bold text-foreground">{product.TenSanPham}</h1>

              {/* Rating & Sold */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const avgRating = ratingStats?.avgRating || 0;
                      const filled = star <= Math.round(avgRating);
                      return (
                        <span 
                          key={star} 
                          className={filled ? 'text-primary' : 'text-muted'}
                        >
                          ★
                        </span>
                      );
                    })}
                  </div>
                  <span className="text-muted-foreground">
                    ({ratingStats?.totalReviews || 0} đánh giá)
                    {ratingStats && ratingStats.avgRating > 0 && (
                      <span className="ml-1 font-semibold text-foreground">
                        {ratingStats.avgRating.toFixed(1)}/5
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-4 w-px bg-border" />
                <span className="text-muted-foreground">
                  Đã bán: <span className="font-semibold text-foreground">{product.DaBan}</span>
                </span>
                {volumeText && (
                  <>
                    <div className="h-4 w-px bg-border" />
                    <span className="text-muted-foreground">
                      Dung tích: <span className="font-semibold text-foreground">{volumeText}</span>
                    </span>
                  </>
                )}
              </div>

              {volumeOptions.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Dung tích</p>
                  <div className="flex flex-wrap gap-2">
                    {volumeOptions.map((option) => (
                      <button
                        key={`detail-volume-${option.value}`}
                        onClick={() => setSelectedVolume(option)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          Number(selectedVolume?.value) === Number(option.value)
                            ? 'bg-teal-600 text-white shadow-md'
                            : 'bg-white dark:bg-card text-gray-700 dark:text-foreground border-2 border-gray-200 dark:border-border hover:border-teal-300'
                        }`}
                      >
                        {option.label || `${option.value} ml`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Price */}
              <Card className="bg-muted/30">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-bold text-primary">
                        {discountedPrice.toLocaleString('vi-VN')}₫
                      </span>
                      {discount > 0 && (
                        <span className="text-xl text-muted-foreground line-through">
                          {variantBasePrice.toLocaleString('vi-VN')}₫
                        </span>
                      )}
                    </div>
                    {discount > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Tiết kiệm: <span className="font-semibold text-destructive">{savings.toLocaleString('vi-VN')}₫</span>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Stock Status */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Tình trạng:</p>
                {isSoldOut ? (
                  <span className="text-destructive font-semibold">Hết hàng</span>
                ) : product.SoLuong <= 10 ? (
                  <span className="text-primary font-semibold">
                    ⚠️ Chỉ còn {product.SoLuong} sản phẩm
                  </span>
                ) : (
                  <span className="text-foreground font-semibold">
                    ✓ Còn hàng ({product.SoLuong} sản phẩm)
                  </span>
                )}
              </div>

              {/* Quantity Selector */}
              {!isSoldOut && (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Số lượng:</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border-2 border-border rounded-lg">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="h-12 w-12"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-16 text-center font-semibold text-lg">
                        {quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= product.SoLuong}
                        className="h-12 w-12"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {product.SoLuong} sản phẩm có sẵn
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={isSoldOut}
                  variant="outline"
                  className="flex-1 h-14 text-base font-semibold"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Thêm vào giỏ
                </Button>
                <Button
                  onClick={handleBuyNow}
                  disabled={isSoldOut}
                  className="flex-1 h-14 text-base font-semibold bg-primary hover:bg-primary/90"
                >
                  Mua ngay
                </Button>
              </div>

              {/* Secondary Actions */}
              <div className="flex gap-3">
                <Button
                  variant={isFavorite ? 'default' : 'outline'}
                  size="icon"
                  className={`h-12 w-12 ${isFavorite ? 'bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-500/20 dark:text-red-300' : ''}`}
                  onClick={handleToggleHeart}
                  disabled={isTogglingHeart}
                  aria-label={isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                  aria-pressed={isFavorite}
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12"
                  onClick={handleShareProduct}
                  aria-label="Chia sẻ sản phẩm"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Benefits */}
              <div className="space-y-3 pt-6 border-t border-border">
                <div className="flex items-center gap-3 text-sm">
                  <Truck className="w-5 h-5 text-primary" />
                  <span>Miễn phí vận chuyển cho đơn hàng trên 500.000₫</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span>Cam kết 100% hàng chính hãng</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span>Đổi trả trong vòng 7 ngày nếu có lỗi từ nhà sản xuất</span>
                </div>
              </div>

            </div>
          </div>

          {/* Product Description */}
          <div className="mt-16">
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Mô tả sản phẩm</h2>
                <div className="prose prose-lg max-w-none text-muted-foreground">
                  <p className="whitespace-pre-line">{product.MoTa || 'Chưa có mô tả'}</p>
                  
                  <div className="mt-8 space-y-4">
                    <h3 className="text-xl font-semibold text-foreground">Thông tin chi tiết</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="font-medium">Danh mục:</span>
                        <span>{categoryName}</span>
                      </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="font-medium">Dung tích:</span>
                      <span>{volumeText || '—'}</span>
                    </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="font-medium">Tình trạng:</span>
                        <span>{isSoldOut ? 'Hết hàng' : 'Còn hàng'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="font-medium">Đã bán:</span>
                        <span>{product.DaBan} sản phẩm</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="font-medium">Mã sản phẩm:</span>
                        <span className="font-mono text-sm">{product._id.slice(-8).toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Reviews */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold mb-8">Đánh giá sản phẩm</h2>
            <ProductReviews productId={id!} />
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-3xl font-bold mb-8">Sản phẩm liên quan</h2>
              <ProductsGrid
                products={relatedProducts}
                loading={false}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                onAddToCart={handleAddToCartRelated}
              />
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}

