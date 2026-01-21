import { useEffect, useState, useCallback, useMemo } from "react"
import adminService from "@/services/adminService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  Trash2, 
  Filter, 
  Star, 
  Eye,
  X,
  CheckSquare,
  Square,
  BarChart3,
  TrendingUp
} from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import type { Review, ReviewStats, Product, User } from "@/types/models"
import { getProductImageUrl } from "@/utils/imageUtils"

// ==========================
// TYPES
// ==========================

interface ReviewsParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: string
  productId?: string
  customerId?: string
  minRating?: number
  maxRating?: number
}


// ==========================
// UTILS
// ==========================

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
})

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const renderStars = (rating: number) => {
  const validRating = Math.max(1, Math.min(5, Math.round(rating)))
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= validRating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{validRating}/5</span>
    </div>
  )
}

// ==========================
// HELPER FUNCTIONS
// ==========================

const getProductInfo = (product: Review["IdSanPham"]) => {
  if (!product) {
    return {
      name: "Sản phẩm không xác định",
      price: null,
      imageUrl: null,
    }
  }
  
  if (typeof product === "string") {
    return {
      name: "Đang tải...",
      price: null,
      imageUrl: null,
    }
  }

  const productObj = product as Product
  return {
    name: productObj.TenSanPham || "Sản phẩm không xác định",
    price: productObj.Gia,
    imageUrl: productObj.HinhAnhChinh 
      ? getProductImageUrl(productObj.HinhAnhChinh, true) 
      : null,
  }
}

const getCustomerInfo = (customer: Review["IdKhachHang"]) => {
  if (!customer) {
    return {
      name: "Khách hàng không xác định",
      email: "",
    }
  }
  
  if (typeof customer === "string") {
    return {
      name: "Đang tải...",
      email: "",
    }
  }

  const customerObj = customer as User
  return {
    name: customerObj.HoTen || customerObj.Email || "Khách hàng không xác định",
    email: customerObj.Email || "",
  }
}

// ==========================
// COMPONENT
// ==========================

export default function AdminReviewsPage() {
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  // Filter states
  const [productIdFilter, setProductIdFilter] = useState<string>("")
  const [customerIdFilter, setCustomerIdFilter] = useState<string>("")
  const [minRating, setMinRating] = useState<string>("all")
  const [maxRating, setMaxRating] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showFilters, setShowFilters] = useState(false)

  // Multi-select states
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)

  // Dialog states
  const [viewingReview, setViewingReview] = useState<Review | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingReview, setDeletingReview] = useState<Review | null>(null)

  // Refresh trigger - dùng để force refresh sau khi xóa
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Build params from filters
  const reviewsParams = useMemo<ReviewsParams>(() => {
    const params: ReviewsParams = {
      page: currentPage,
      limit: pageSize,
      sortBy,
      sortOrder,
    }

    if (productIdFilter.trim()) {
      params.productId = productIdFilter.trim()
    }
    if (customerIdFilter.trim()) {
      params.customerId = customerIdFilter.trim()
    }
    if (minRating && minRating !== "all") {
      params.minRating = parseInt(minRating)
    }
    if (maxRating && maxRating !== "all") {
      params.maxRating = parseInt(maxRating)
    }

    return params
  }, [currentPage, sortBy, sortOrder, productIdFilter, customerIdFilter, minRating, maxRating, refreshTrigger])

  // Fetch reviews data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const reviewsRes = await adminService.getReviews(reviewsParams)
      
        // Backend trả về: { success: true, message: "...", data: Review[], pagination: {...} }
        // Axios interceptor normalizeResponse đã giữ lại pagination ở cùng level với data
        const responseData = reviewsRes?.data
        
        let reviewsData: Review[] = []
        let pagination: { totalPages?: number; total?: number } | undefined

        // Debug log trong development - log trước khi parse
        if (import.meta.env.DEV) {
          console.log('📥 Reviews Response Raw:', {
            hasResponse: !!reviewsRes,
            responseData: responseData,
            responseDataType: Array.isArray(responseData) ? 'array' : typeof responseData,
            responseDataKeys: responseData && !Array.isArray(responseData) && typeof responseData === 'object' ? Object.keys(responseData) : 'N/A (array)',
            hasSuccess: responseData && !Array.isArray(responseData) && typeof responseData === 'object' ? 'success' in responseData : false,
            hasData: responseData && !Array.isArray(responseData) && typeof responseData === 'object' ? 'data' in responseData : false,
            hasPagination: responseData && !Array.isArray(responseData) && typeof responseData === 'object' ? 'pagination' in responseData : false,
            dataType: responseData && !Array.isArray(responseData) && typeof responseData === 'object' && responseData.data ? typeof responseData.data : 'undefined',
            dataIsArray: responseData && !Array.isArray(responseData) && typeof responseData === 'object' && responseData.data ? Array.isArray(responseData.data) : false,
            dataLength: Array.isArray(responseData) 
              ? responseData.length 
              : (responseData && !Array.isArray(responseData) && typeof responseData === 'object' && responseData.data && Array.isArray(responseData.data) 
                  ? responseData.data.length 
                  : 'N/A'),
            paginationValue: responseData && !Array.isArray(responseData) && typeof responseData === 'object' ? (responseData as Record<string, unknown>)?.pagination : undefined
          })
        }

        // Parse response - normalizeResponse đã giữ lại pagination
        if (responseData) {
          // Case 1: responseData là object có success và data (structure chuẩn, pagination được giữ lại)
          if (responseData && typeof responseData === 'object' && !Array.isArray(responseData) && 'success' in responseData && 'data' in responseData) {
            if (Array.isArray(responseData.data)) {
              reviewsData = responseData.data
              // pagination ở cùng level với data (đã được normalizeResponse giữ lại)
              pagination = (responseData as Record<string, unknown>).pagination as { totalPages?: number; total?: number } | undefined
            } else if (responseData.data && typeof responseData.data === 'object' && 'reviews' in responseData.data) {
              // Fallback: data là object có reviews
              reviewsData = Array.isArray(responseData.data.reviews) ? responseData.data.reviews : []
              pagination = responseData.data.pagination || (responseData as Record<string, unknown>).pagination
            }
          }
          // Case 2: responseData là array trực tiếp (fallback - không nên xảy ra nếu normalizeResponse hoạt động đúng)
          else if (Array.isArray(responseData)) {
          reviewsData = responseData
            // Pagination bị mất trong trường hợp này
            pagination = undefined
          }
          // Case 3: responseData là object nhưng không có success (có thể là data trực tiếp)
          else if (responseData && typeof responseData === 'object' && !Array.isArray(responseData) && 'data' in responseData) {
          if (Array.isArray(responseData.data)) {
            reviewsData = responseData.data
              pagination = (responseData as Record<string, unknown>).pagination as { totalPages?: number; total?: number } | undefined
            }
          }
        }
        
        // Debug log sau khi parse
        if (import.meta.env.DEV) {
          console.log('📥 Reviews Parsed:', {
            reviewsCount: reviewsData.length,
            pagination: pagination,
            totalPages: pagination?.totalPages,
            total: pagination?.total
          })
        }

        setReviews(reviewsData)
        if (pagination) {
          setTotalPages(pagination.totalPages || 1)
          setTotal(pagination.total || 0)
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Không thể tải danh sách đánh giá. Vui lòng thử lại sau."
        setError(errorMessage)
        toast.error("Không thể tải danh sách đánh giá")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [reviewsParams])

  // Fetch stats (independent from filters)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsRes = await adminService.getReviewStats()
        const responseData = statsRes?.data
        
        // Backend trả về: { success, message, data: ReviewStats }
        if (responseData?.success && responseData.data) {
          // Case 1: data là ReviewStats trực tiếp
          if ('summary' in responseData.data) {
            setStats(responseData.data as ReviewStats)
          }
          // Case 2: data có nested structure
          else if (typeof responseData.data === 'object' && 'data' in responseData.data) {
            const nestedData = ((responseData.data as Record<string, unknown>).data as Record<string, unknown>)
            if (nestedData && 'summary' in nestedData) {
              setStats({
                summary: nestedData.summary as { totalReviews: number; avgRating: number; distribution: { star5: number; star4: number; star3: number; star2: number; star1: number; }; },
                topReviewedProducts: (nestedData.topReviewedProducts as { productId: string; productName: string; reviewCount: number; avgRating: number; }[]) || [],
                monthlyStats: (nestedData.monthlyStats as { year: number; month: number; reviewCount: number; avgRating: number; }[]) || []
              })
            }
          }
        }
      } catch {
        // Không set error vì stats không critical
        // Stats sẽ được refresh lại khi có refreshTrigger
      }
    }

    fetchStats()
  }, [refreshTrigger])

  // Handlers
  const handleViewReview = useCallback((review: Review) => {
    setViewingReview(review)
    setIsViewDialogOpen(true)
  }, [])

  const handleDeleteReview = useCallback((review: Review) => {
    setDeletingReview(review)
    setIsDeleteDialogOpen(true)
  }, [])

  const confirmDeleteReview = useCallback(async () => {
    if (!deletingReview) return

    try {
      await adminService.deleteReview(deletingReview._id)
      toast.success("Xóa đánh giá thành công")
      setIsDeleteDialogOpen(false)
      setDeletingReview(null)
      // Refresh data bằng cách trigger refresh
      setCurrentPage(1)
      setRefreshTrigger(prev => prev + 1)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Không thể xóa đánh giá"
      toast.error(errorMessage)
    }
  }, [deletingReview])

  const handleDeleteMultiple = useCallback(async () => {
    if (selectedReviews.size === 0) {
      toast.error("Vui lòng chọn đánh giá cần xóa")
      return
    }

    try {
      await adminService.deleteMultipleReviews(Array.from(selectedReviews))
      toast.success(`Đã xóa ${selectedReviews.size} đánh giá thành công`)
      setSelectedReviews(new Set())
      setIsSelectMode(false)
      // Refresh data bằng cách trigger refresh
      setCurrentPage(1)
      setRefreshTrigger(prev => prev + 1)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Không thể xóa đánh giá"
      toast.error(errorMessage)
    }
  }, [selectedReviews])

  const handleToggleSelectAll = useCallback(() => {
    if (selectedReviews.size === reviews.length) {
      setSelectedReviews(new Set())
    } else {
      setSelectedReviews(new Set(reviews.map((review) => review._id)))
    }
  }, [selectedReviews.size, reviews])

  const handleToggleSelectReview = useCallback((reviewId: string) => {
    setSelectedReviews((prev) => {
      const newSelected = new Set(prev)
      if (newSelected.has(reviewId)) {
        newSelected.delete(reviewId)
      } else {
        newSelected.add(reviewId)
      }
      return newSelected
    })
  }, [])

  const clearFilters = useCallback(() => {
    setProductIdFilter("")
    setCustomerIdFilter("")
    setMinRating("all")
    setMaxRating("all")
    setCurrentPage(1)
  }, [])

  // Reset selected when filter changes
  useEffect(() => {
    setSelectedReviews(new Set())
    setIsSelectMode(false)
  }, [productIdFilter, customerIdFilter, minRating, maxRating, sortBy, sortOrder])

  // Prepare view dialog content
  const viewDialogContent = useMemo(() => {
    if (!viewingReview) return null

    const productInfo = getProductInfo(viewingReview.IdSanPham)
    const customerInfo = getCustomerInfo(viewingReview.IdKhachHang)
    
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Sản phẩm</Label>
            <div className="mt-2">
              <div className="font-medium">
                {productInfo.name}
              </div>
              {productInfo.price !== null && productInfo.price !== undefined && (
                <div className="text-sm text-muted-foreground">
                  {currencyFormatter.format(productInfo.price)}
                </div>
              )}
            </div>
          </div>
          <div>
            <Label>Khách hàng</Label>
            <div className="mt-2">
              <div className="font-medium">
                {customerInfo.name}
              </div>
              {customerInfo.email && (
                <div className="text-sm text-muted-foreground">
                  {customerInfo.email}
                </div>
              )}
            </div>
          </div>
        </div>
        <div>
          <Label>Đánh giá</Label>
          <div className="mt-2">{renderStars(viewingReview.SoSao)}</div>
        </div>
        <div>
          <Label>Nội dung đánh giá</Label>
          <div className="mt-2 p-4 bg-muted rounded-lg">
            {viewingReview.NoiDung}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Ngày tạo</Label>
            <div className="mt-2 text-sm">
              {formatDate(viewingReview.createdAt)}
            </div>
          </div>
          <div>
            <Label>Ngày cập nhật</Label>
            <div className="mt-2 text-sm">
              {formatDate(viewingReview.updatedAt)}
            </div>
          </div>
        </div>
      </div>
    )
  }, [viewingReview])

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats?.summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng đánh giá</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.summary.totalReviews ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">Tổng số đánh giá</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Điểm trung bình</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.summary.avgRating ? stats.summary.avgRating.toFixed(2) : "0.00"}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {renderStars(Math.round(stats.summary.avgRating ?? 0))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">5 sao</CardTitle>
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.summary.distribution?.star5 ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.summary.totalReviews > 0
                  ? Math.round(
                      ((stats.summary.distribution?.star5 ?? 0) / stats.summary.totalReviews) * 100
                    )
                  : 0}
                % tổng đánh giá
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">1 sao</CardTitle>
              <Star className="h-4 w-4 text-gray-400 fill-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.summary.distribution?.star1 ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.summary.totalReviews > 0
                  ? Math.round(
                      ((stats.summary.distribution?.star1 ?? 0) / stats.summary.totalReviews) * 100
                    )
                  : 0}
                % tổng đánh giá
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quản lý đánh giá</CardTitle>
              <CardDescription>
                Quản lý và xem tất cả đánh giá của khách hàng
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isSelectMode && selectedReviews.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteMultiple}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa ({selectedReviews.size})
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsSelectMode(!isSelectMode)
                  if (isSelectMode) setSelectedReviews(new Set())
                }}
              >
                {isSelectMode ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Hủy chọn
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Chọn nhiều
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Lọc
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          {showFilters && (
            <div className="mb-6 p-4 border rounded-lg space-y-4 bg-muted/50">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="productId">Mã sản phẩm</Label>
                  <Input
                    id="productId"
                    placeholder="Nhập mã sản phẩm"
                    value={productIdFilter}
                    onChange={(e) => setProductIdFilter(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerId">Mã khách hàng</Label>
                  <Input
                    id="customerId"
                    placeholder="Nhập mã khách hàng"
                    value={customerIdFilter}
                    onChange={(e) => setCustomerIdFilter(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minRating">Đánh giá tối thiểu</Label>
                  <Select value={minRating} onValueChange={setMinRating}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn số sao tối thiểu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="1">1 sao trở lên</SelectItem>
                      <SelectItem value="2">2 sao trở lên</SelectItem>
                      <SelectItem value="3">3 sao trở lên</SelectItem>
                      <SelectItem value="4">4 sao trở lên</SelectItem>
                      <SelectItem value="5">Chỉ 5 sao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxRating">Đánh giá tối đa</Label>
                  <Select value={maxRating} onValueChange={setMaxRating}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn số sao tối đa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="1">Chỉ 1 sao</SelectItem>
                      <SelectItem value="2">2 sao trở xuống</SelectItem>
                      <SelectItem value="3">3 sao trở xuống</SelectItem>
                      <SelectItem value="4">4 sao trở xuống</SelectItem>
                      <SelectItem value="5">5 sao trở xuống</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          )}

          {/* Sort */}
          <div className="mb-4 flex items-center gap-2">
            <Label>Sắp xếp theo:</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Ngày tạo</SelectItem>
                <SelectItem value="SoSao">Đánh giá</SelectItem>
                <SelectItem value="updatedAt">Ngày cập nhật</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "↑ Tăng dần" : "↓ Giảm dần"}
            </Button>
          </div>

          {/* Reviews Table */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-sm text-muted-foreground">Đang tải...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-destructive mb-2">{error}</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null)
                  setCurrentPage(1)
                  setRefreshTrigger(prev => prev + 1)
                }}
              >
                Thử lại
              </Button>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không có đánh giá nào
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      {isSelectMode && (
                        <th className="px-4 py-3 text-left">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleToggleSelectAll}
                          >
                            {selectedReviews.size === reviews.length ? (
                              <CheckSquare className="h-4 w-4" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </Button>
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Sản phẩm
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Khách hàng
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Đánh giá
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Nội dung
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Ngày tạo
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((review) => {
                      const productInfo = getProductInfo(review.IdSanPham)
                      const customerInfo = getCustomerInfo(review.IdKhachHang)
                      
                      return (
                        <tr
                          key={review._id}
                          className="border-t hover:bg-muted/50 transition-colors"
                        >
                          {isSelectMode && (
                            <td className="px-4 py-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleSelectReview(review._id)}
                              >
                                {selectedReviews.has(review._id) ? (
                                  <CheckSquare className="h-4 w-4" />
                                ) : (
                                  <Square className="h-4 w-4" />
                                )}
                              </Button>
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium">
                                {productInfo.name}
                              </div>
                              {productInfo.price !== null && productInfo.price !== undefined && (
                                <div className="text-xs text-muted-foreground">
                                  {currencyFormatter.format(productInfo.price)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium">
                                {customerInfo.name}
                              </div>
                              {customerInfo.email && (
                                <div className="text-xs text-muted-foreground">
                                  {customerInfo.email}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {renderStars(review.SoSao)}
                              <Badge
                                variant={
                                  review.SoSao >= 4
                                    ? "default"
                                    : review.SoSao >= 3
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {review.SoSao} sao
                              </Badge>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="max-w-xs truncate">{review.NoiDung}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {formatDate(review.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewReview(review)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteReview(review)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        className={
                          currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                        }
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}

              <div className="text-sm text-muted-foreground text-center">
                {total > 0 ? (
                  <>Hiển thị {reviews.length} / {total} đánh giá</>
                ) : (
                  <>Không có đánh giá nào</>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Review Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết đánh giá</DialogTitle>
            <DialogDescription>Thông tin chi tiết về đánh giá này</DialogDescription>
          </DialogHeader>
          {viewDialogContent}
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => {
                if (viewingReview) {
                  setIsViewDialogOpen(false)
                  handleDeleteReview(viewingReview)
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa đánh giá
            </Button>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa đánh giá</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingReview(null)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteReview} className="bg-destructive">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
