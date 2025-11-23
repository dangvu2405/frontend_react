/**
 * Products Grid Component - Style Shopee
 * Hiển thị danh sách sản phẩm với bố cục giống Shopee
 */

import { memo, useCallback, useState, useEffect } from "react"
import type { Product, RatingStats } from "@/types/models"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"
import { Star, ShoppingCart } from "lucide-react"
import { getProductImageUrl } from "@/utils/imageUtils"
import { reviewService } from "@/services/reviewService"

type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

type ProductsGridProps = {
  products: Product[]
  loading?: boolean
  emptyMessage?: string
  className?: string
  showCategoryBadge?: boolean
  showSoldQuantity?: boolean
  showAddToCartButton?: boolean
  onAddToCart?: (product: Product) => void
  pagination?: PaginationProps
  showPagination?: boolean
}

const FALLBACK_IMAGE =
  "https://placehold.co/300x300/E5E5EA/000?text=No+Image"

// ProductCard component - Style Shopee
type ProductCardProps = {
  product: Product;
  onAddToCart?: (product: Product) => void;
  showCategoryBadge: boolean;
  showSoldQuantity: boolean;
  showAddToCartButton: boolean;
  onProductClick: (productId: string) => void;
}

const ProductCard = memo(({ 
  product, 
  onAddToCart, 
  showCategoryBadge, 
  showSoldQuantity, 
  showAddToCartButton,
  onProductClick
}: ProductCardProps) => {
  const [rating, setRating] = useState<RatingStats | null>(null);
  const [loadingRating, setLoadingRating] = useState(false);

  // Get product ID (support both normalized and original)
  const productId = (product as any).id || (product as any)._id || '';
  
  // Fetch rating stats cho sản phẩm
  useEffect(() => {
    if (!productId) return;
    const fetchRating = async () => {
      try {
        setLoadingRating(true);
        const stats = await reviewService.getProductRatingStats(productId);
        setRating(stats);
      } catch (error) {
        // Nếu không có rating, set default
        setRating({
          avgRating: 0,
          totalReviews: 0,
          star5: 0,
          star4: 0,
          star3: 0,
          star2: 0,
          star1: 0
        });
      } finally {
        setLoadingRating(false);
      }
    };
    fetchRating();
  }, [productId]);

  // Support both normalized and original field names
  const productAny = product as any;
  const isSoldOut = Number(productAny.soLuong ?? productAny.SoLuong ?? 0) <= 0;
  const discount = Number(productAny.giamGia ?? productAny.KhuyenMai ?? 0);
  const price = Number(productAny.gia ?? productAny.Gia ?? 0);
  const discountedPrice = discount > 0 ? Math.round(price * (1 - discount / 100)) : price;
  const soldCount = Number(productAny.daBan ?? productAny.DaBan ?? 0);
  const avgRating = rating?.avgRating || 0;
  const reviewCount = rating?.totalReviews || 0;

  // Render stars
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= fullStars
                ? 'text-primary fill-primary'
                : star === fullStars + 1 && hasHalfStar
                ? 'text-primary fill-primary opacity-50'
                : 'text-muted fill-muted'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card
      className="group relative overflow-hidden hover:shadow-lg transition-all duration-200 border border-border bg-card cursor-pointer rounded-sm flex flex-col h-full"
      onClick={() => onProductClick(productId)}
    >
      <CardContent className="p-0 flex flex-col h-full">
        {/* Hình ảnh sản phẩm - Style Shopee */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={getProductImageUrl(productAny.hinhAnhChinh || productAny.hinhAnh || productAny.HinhAnhChinh || '', true) || FALLBACK_IMAGE}
            alt={productAny.tenSP || productAny.TenSanPham || 'Sản phẩm'}
            className="w-full h-full object-cover"
            onError={(event) => {
              event.currentTarget.src = FALLBACK_IMAGE
            }}
          />
          {/* Badge giảm giá - góc trên bên trái */}
          {discount > 0 && (
            <div className="absolute top-0 left-0 bg-destructive text-destructive-foreground text-xs font-semibold px-2 py-1 rounded-br-sm">
              -{discount}%
            </div>
          )}
          {/* Overlay khi hết hàng */}
          {isSoldOut && (
            <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
              <span className="bg-foreground text-background px-3 py-1 rounded text-sm font-medium">
                Hết hàng
              </span>
            </div>
          )}
        </div>

        {/* Thông tin sản phẩm - Style Shopee */}
        <div className="p-2.5 flex flex-col flex-1">
          {/* Tên sản phẩm - 2 dòng, truncate */}
          <h3 className="text-sm text-card-foreground line-clamp-2 min-h-[2.5rem] mb-1.5 leading-tight">
            {productAny.tenSP || productAny.TenSanPham || 'Sản phẩm'}
          </h3>

          {/* Rating và số lượng đã bán */}
          <div className="flex items-center gap-2 mb-2">
            {avgRating > 0 && (
              <>
                {renderStars(avgRating)}
                <span className="text-xs text-muted-foreground">({reviewCount})</span>
              </>
            )}
            {avgRating === 0 && reviewCount === 0 && (
              <span className="text-xs text-muted-foreground/70">Chưa có đánh giá</span>
            )}
          </div>

          {/* Số lượng đã bán */}
          {showSoldQuantity && soldCount > 0 && (
            <div className="text-xs text-muted-foreground mb-2">
              Đã bán {soldCount.toLocaleString('vi-VN')}
            </div>
          )}

          {/* Giá sản phẩm */}
          <div className="mb-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-destructive font-bold text-base">
              {discountedPrice.toLocaleString("vi-VN")}₫
              </span>
            {discount > 0 && (
                <span className="text-muted-foreground/70 text-xs line-through">
                {price.toLocaleString("vi-VN")}₫
                </span>
            )}
            </div>
          </div>

          {/* Button thêm giỏ hàng - Style Shopee */}
          {showAddToCartButton && (
            <Button
              className="mt-auto w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 text-sm rounded-sm shadow-sm transition-colors"
              disabled={isSoldOut || !onAddToCart}
              onClick={(e) => {
                e.stopPropagation()
                onAddToCart?.(product)
              }}
            >
              <ShoppingCart className="w-4 h-4 mr-1.5" />
              {isSoldOut ? "Hết hàng" : "Thêm vào giỏ"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

ProductCard.displayName = 'ProductCard';

function ProductsGridComponent({
  products,
  loading,
  emptyMessage = "Không có sản phẩm nào",
  className = "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6",
  showCategoryBadge = true,
  showSoldQuantity = true,
  showAddToCartButton = true,
  onAddToCart,
  pagination,
  showPagination = false,
}: ProductsGridProps) {
  // Tất cả hooks phải được gọi ở đầu component, trước các early returns
  const navigate = useNavigate()
  const handleProductClick = useCallback((productId: string) => {
    navigate(`/products/${productId}`);
  }, [navigate]);

  // Early returns sau khi hooks đã được gọi
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="text-muted-foreground mt-4">Đang tải sản phẩm...</p>
      </div>
    )
  }

  if (!products?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  const renderPagination = () => {
    if (!showPagination || !pagination) return null

    const { currentPage, totalPages, onPageChange } = pagination
    const maxVisiblePages = 5
    
    // Tính toán range của pages hiển thị
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    
    // Điều chỉnh nếu không đủ pages ở cuối
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)

    return (
      <div className="flex justify-center items-center gap-2 mt-12">
        {/* Previous Button */}
        <Button
          variant="outline"
          className="border-border"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ← Trước
        </Button>

        {/* First Page */}
        {startPage > 1 && (
          <>
            <Button
              variant={currentPage === 1 ? "default" : "outline"}
              className={currentPage === 1 ? "bg-primary text-primary-foreground" : "border-border"}
              onClick={() => onPageChange(1)}
            >
              1
            </Button>
            {startPage > 2 && <span className="text-muted-foreground">...</span>}
          </>
        )}

        {/* Page Numbers */}
        {pages.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            className={
              currentPage === page
                ? "bg-primary text-primary-foreground"
                : "border-border"
            }
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}

        {/* Last Page */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-muted-foreground">...</span>}
            <Button
              variant={currentPage === totalPages ? "default" : "outline"}
              className={
                currentPage === totalPages
                  ? "bg-primary text-primary-foreground"
                  : "border-border"
              }
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </Button>
          </>
        )}

        {/* Next Button */}
        <Button
          variant="outline"
          className="border-border"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Sau →
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className={className}>
        {products.map((product) => {
          const productId = (product as any).id || (product as any)._id || '';
          return (
          <ProductCard
              key={productId}
            product={product}
            onAddToCart={onAddToCart}
            showCategoryBadge={showCategoryBadge}
            showSoldQuantity={showSoldQuantity}
            showAddToCartButton={showAddToCartButton}
            onProductClick={handleProductClick}
          />
          );
        })}
      </div>
      
      {renderPagination()}
    </>
  )
}

export const ProductsGrid = memo(ProductsGridComponent)
ProductsGrid.displayName = "ProductsGrid"
