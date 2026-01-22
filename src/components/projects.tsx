/**
 * Projects Grid Component - Style Shopee
 * Hiển thị danh sách đồ án với bố cục giống Shopee
 */

import { memo, useCallback, useState, useEffect, useMemo } from "react"
import type { Project, ProjectIncludesOption } from "@/types/models/product"
import type { RatingStats } from "@/types/models"
import { useNavigate } from "react-router-dom"
import { Star, ShoppingCart, Heart } from "lucide-react"
import { getCloudinaryProjectImageUrl } from "@/utils/imageUtils"
import { reviewService } from "@/services/reviewService"
import { storage } from "@/utils/storage"
import { heartService } from "@/services/heartService"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"

type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

type ProjectsGridProps = {
  projects: Project[]
  loading?: boolean
  emptyMessage?: string
  className?: string
  showCategoryBadge?: boolean
  showSoldQuantity?: boolean
  showAddToCartButton?: boolean
  showIncludesOptions?: boolean
  onAddToCart?: (project: Project, selectedIncludes?: ProjectIncludesOption) => void
  pagination?: PaginationProps
  showPagination?: boolean
}

const FALLBACK_IMAGE =
  "https://placehold.co/300x300/E5E5EA/000?text=No+Image"

// ProjectCard component - Style Shopee
type ProjectCardProps = {
  project: Project;
  onAddToCart?: (project: Project, selectedIncludes?: ProjectIncludesOption) => void;
  showCategoryBadge: boolean;
  showSoldQuantity: boolean;
  showAddToCartButton: boolean;
  showIncludesOptions?: boolean;
  onProjectClick: (projectId: string) => void;
}

const ProjectCard = memo(({ 
  project, 
  onAddToCart, 
  showAddToCartButton,
  showIncludesOptions = true,
  onProjectClick
}: ProjectCardProps) => {
  const { isAuthenticated } = useAuth();
  const [rating, setRating] = useState<RatingStats | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingHeart, setIsTogglingHeart] = useState(false);

  // Get project ID (support both normalized and original)
  const projectId = String((project as unknown as Record<string, unknown>).id || (project as unknown as Record<string, unknown>)._id || '');
  
  // Load heart status from localStorage
  useEffect(() => {
    if (projectId) {
      setIsFavorite(storage.isHeart(projectId));
    }
  }, [projectId]);

  // Listen for hearts:updated event
  useEffect(() => {
    const handleHeartsUpdate = () => {
      if (projectId) {
        setIsFavorite(storage.isHeart(projectId));
      }
    };
    
    window.addEventListener('hearts:updated', handleHeartsUpdate);
    return () => {
      window.removeEventListener('hearts:updated', handleHeartsUpdate);
    };
  }, [projectId]);
  
  // Fetch rating stats cho đồ án
  useEffect(() => {
    if (!projectId) return;
    const fetchRating = async () => {
      try {
        // Loading state removed
        
        // Debug: Log API call
        if (import.meta.env.DEV) {
          console.log('⭐ [ProjectsGrid] Fetching rating stats...', { projectId });
        }
        
        const stats = await reviewService.getProjectRatingStats(String(projectId));
        
        // Debug: Log API response
        if (import.meta.env.DEV) {
          console.log('⭐ [ProjectsGrid] Rating stats received:', { projectId, stats });
        }
        
        setRating(stats);
      } catch (error: unknown) {
        // Handle 401/403/404 gracefully - rating stats might not require auth or might not exist
        const errorRecord = error as Record<string, unknown>;
        const status = (errorRecord?.response as Record<string, unknown>)?.status || errorRecord?.status;
        if (status === 401 || status === 403 || status === 404) {
          // Silently set default stats for unauthorized/not found
          if (import.meta.env.DEV) {
            console.debug('⭐ [ProjectsGrid] Rating stats not available (401/403/404), using defaults', { projectId, status });
          }
        } else if (import.meta.env.DEV) {
          // Only log non-auth errors in dev mode
          console.warn('⭐ [ProjectsGrid] Error fetching rating stats:', { projectId, error });
        }
        
        // Set default rating stats
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
        // Loading state removed
      }
    };
    fetchRating();
  }, [projectId]);

  // Support both normalized và original field names
  const projectAny = project as unknown as Record<string, unknown>;
  const includesOptions = useMemo<ProjectIncludesOption[]>(() => {
    const rawOptions = projectAny.DungTichOptions || projectAny.dungTichOptions;
    let normalized: ProjectIncludesOption[] = Array.isArray(rawOptions) ? rawOptions.filter(Boolean) : [];

    normalized = normalized
      .map((option: unknown) => {
        const optionRecord = option as Record<string, unknown>;
        const value = Number(optionRecord?.value ?? optionRecord?.Value);
        if (!Number.isFinite(value) || value <= 0) return null;
        return {
          value,
          label: optionRecord?.label || optionRecord?.Label || `${value} ml`,
          priceDiff: Number(optionRecord?.priceDiff ?? optionRecord?.PriceDiff) || 0,
          stockDiff: Number(optionRecord?.stockDiff ?? optionRecord?.StockDiff) || 0,
          sku: optionRecord?.sku || optionRecord?.SKU,
          isDefault: Boolean(optionRecord?.isDefault ?? optionRecord?.IsDefault),
        };
      })
      .filter(Boolean) as ProjectIncludesOption[];

    if (!normalized.length) {
      const fallback = Number(projectAny.DungTich ?? projectAny.dungTich ?? 0);
      if (fallback > 0) {
        normalized = [{ value: fallback, label: `${fallback} ml`, isDefault: true }];
      } else {
        normalized = [{ value: 100, label: '100 ml', isDefault: true }];
      }
    }

    if (!normalized.some(option => option.isDefault) && normalized.length) {
      normalized[0].isDefault = true;
    }

    return normalized;
  }, [projectAny.DungTichOptions, projectAny.DungTich, projectAny.dungTich, projectAny.dungTichOptions]);

  const [selectedIncludes, setSelectedIncludes] = useState<ProjectIncludesOption>(
    includesOptions.find(opt => opt.isDefault) || includesOptions[0]
  );

  useEffect(() => {
    setSelectedIncludes(includesOptions.find(opt => opt.isDefault) || includesOptions[0]);
  }, [projectId, includesOptions]);

  const isSoldOut = Number(projectAny.soLuong ?? projectAny.SoLuong ?? 0) <= 0;
  const discount = Number(projectAny.giamGia ?? projectAny.KhuyenMai ?? 0);
  const basePrice = Number(projectAny.gia ?? projectAny.Gia ?? 0);
  const variantBasePrice = basePrice + (selectedIncludes?.priceDiff || 0);
  const discountedPrice = discount > 0 ? Math.round(variantBasePrice * (1 - discount / 100)) : variantBasePrice;
  const avgRating = rating?.avgRating || 0;
  const formattedIncludes = selectedIncludes?.label || (selectedIncludes ? `${selectedIncludes.value} ml` : null);

  return (
    <div
      className="w-full bg-white dark:bg-card rounded-3xl shadow-lg p-3 flex flex-col h-full group cursor-pointer hover:shadow-xl transition-all duration-200"
      onClick={() => onProjectClick(String(projectId))}
    >
      {/* Image Section */}
      <div className="relative bg-gray-100 dark:bg-muted rounded-2xl mb-3 overflow-hidden aspect-square">
        {/* Favorite button */}
        <button
          onClick={async (e) => {
            e.stopPropagation();
            if (isTogglingHeart) return;
            
            setIsTogglingHeart(true);
            const newFavoriteState = !isFavorite;
            
            try {
              if (newFavoriteState) {
                // Thêm vào yêu thích
                storage.addHeart(String(projectId));
                
                // Nếu đã đăng nhập, sync với database
                if (isAuthenticated) {
                  try {
                    await heartService.addHeart(String(projectId));
                  } catch (error: unknown) {
                    // Nếu lỗi, vẫn giữ trong localStorage
                    console.error('Error adding heart to database:', error);
                  }
                }
              } else {
                // Xóa khỏi yêu thích
                storage.removeHeart(String(projectId));
                
                // Nếu đã đăng nhập, sync với database
                if (isAuthenticated) {
                  try {
                    await heartService.removeHeart(String(projectId));
                  } catch (error: unknown) {
                    // Nếu lỗi, vẫn xóa khỏi localStorage
                    console.error('Error removing heart from database:', error);
                  }
                }
              }
              
              setIsFavorite(newFavoriteState);
            } catch (error) {
              console.error('Error toggling heart:', error);
            } finally {
              setIsTogglingHeart(false);
            }
          }}
          disabled={isTogglingHeart}
          className="absolute top-3 right-3 w-9 h-9 bg-white dark:bg-card rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform z-10 disabled:opacity-50"
        >
          <Heart
            className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 dark:text-muted-foreground'}`}
          />
        </button>

        {/* Badge giảm giá - góc trên bên trái */}
        {discount > 0 && (
          <div className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-xs font-semibold px-2 py-1 rounded-full z-10">
            -{discount}%
          </div>
        )}

          <img
            src={(() => {
              const imagePath = String(projectAny.hinhAnhChinh || projectAny.hinhAnh || projectAny.HinhAnhChinh || '');
              // Nếu là URL đầy đủ (http/https), sử dụng trực tiếp
              if (imagePath && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
                return imagePath;
              }
              // Sử dụng getCloudinaryProjectImageUrl để xử lý Cloudinary path (bao gồm luxury_project_images/)
              return getCloudinaryProjectImageUrl(imagePath) || FALLBACK_IMAGE;
            })()}
            alt={String(projectAny.tenSP || projectAny.TenSanPham || 'Đồ án')}
            className="w-full h-full object-cover"
            onError={(event) => {
              event.currentTarget.src = FALLBACK_IMAGE
            }}
          />

          {/* Overlay khi hết hàng */}
          {isSoldOut && (
          <div className="absolute inset-0 bg-foreground/50 rounded-2xl flex items-center justify-center">
            <span className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium">
                Hết hàng
              </span>
            </div>
          )}
        </div>

      {/* Project Info */}
      <div className="space-y-2 flex flex-col flex-1">
        {/* Title and Rating */}
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-foreground flex-1 leading-tight">
            {String(projectAny.tenSP || projectAny.TenSanPham || 'Đồ án')}
          </h2>
            {avgRating > 0 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="w-4 h-4 fill-teal-500 text-teal-500" />
              <span className="text-sm font-semibold text-gray-700 dark:text-foreground">
                {avgRating.toFixed(1)}
              </span>
            </div>
            )}
        </div>

        {/* Description */}
        <p className="text-gray-500 dark:text-muted-foreground text-xs leading-snug line-clamp-2">
          {String(projectAny.moTa || projectAny.MoTa || 'Chưa có mô tả đồ án...')}
        </p>
        {showIncludesOptions && formattedIncludes && (
          <p className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
            Bao gồm: {formattedIncludes}
          </p>
        )}

        {/* Includes Selection */}
        {showIncludesOptions && includesOptions.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {includesOptions.map((option) => (
              <button
                key={`${projectId}-includes-${option.value}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIncludes(option);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  Number(selectedIncludes?.value) === Number(option.value)
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-white dark:bg-card text-gray-700 dark:text-foreground border-2 border-gray-200 dark:border-border hover:border-teal-300'
                }`}
              >
                {option.label || `${option.value} ml`}
              </button>
            ))}
            </div>
          )}

        {/* Price and Add to Cart */}
        <div className="flex items-center justify-between gap-2 pt-1 mt-auto">
          <div className="text-xl font-bold text-gray-900 dark:text-foreground">
              {discountedPrice.toLocaleString("vi-VN")}₫
            {discount > 0 && (
              <span className="text-xs text-muted-foreground line-through ml-1.5">
                {variantBasePrice.toLocaleString("vi-VN")}₫
                </span>
            )}
            </div>
          {showAddToCartButton && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isSoldOut && onAddToCart) {
                  onAddToCart(project, selectedIncludes);
                }
              }}
              disabled={isSoldOut || !onAddToCart}
              className="px-3 py-2 bg-white dark:bg-card text-teal-600 dark:text-teal-400 border-2 border-teal-600 dark:border-teal-500 rounded-full hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600 dark:hover:text-white transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-teal-600 flex items-center justify-center aspect-square"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

ProjectCard.displayName = 'ProjectCard';

function ProjectsGridComponent({
  projects,
  loading,
  emptyMessage = "Không có đồ án nào",
  className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-3 lg:gap-4",
  showCategoryBadge = true,
  showSoldQuantity = true,
  showAddToCartButton = true,
  showIncludesOptions = true,
  onAddToCart,
  pagination,
  showPagination = false,
}: ProjectsGridProps) {
  // Tất cả hooks phải được gọi ở đầu component, trước các early returns
  const navigate = useNavigate()
  const handleProjectClick = useCallback((projectId: string) => {
    navigate(`/projects/${projectId}`);
  }, [navigate]);

  // Early returns sau khi hooks đã được gọi
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="text-muted-foreground mt-4">Đang tải đồ án...</p>
      </div>
    )
  }

  if (!projects?.length) {
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
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    
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
        {projects.map((project) => {
          const projectId = String((project as unknown as Record<string, unknown>).id || (project as unknown as Record<string, unknown>)._id || '');
          return (
          <ProjectCard
              key={projectId}
            project={project}
            onAddToCart={onAddToCart}
            showCategoryBadge={showCategoryBadge}
            showSoldQuantity={showSoldQuantity}
            showAddToCartButton={showAddToCartButton}
            showIncludesOptions={showIncludesOptions}
            onProjectClick={handleProjectClick}
          />
          );
        })}
      </div>
      
      {renderPagination()}
    </>
  )
}

export const ProjectsGrid = memo(ProjectsGridComponent)
ProjectsGrid.displayName = "ProjectsGrid"
