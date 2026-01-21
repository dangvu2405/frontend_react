import {
  BarChart3,
  CheckSquare,
  Eye,
  Filter,
  Search,
  Square,
  Star,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { useMemo, type FC } from 'react';

import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import type { Review } from '@/types/models';
import { getProductImageUrl } from '@/utils/imageUtils';

import { useAdminReviews } from '../hooks/useAdminReviews';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const renderStars = (rating: number) => {
  const safeRating = Math.max(1, Math.min(5, Math.round(rating)));
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => index + 1).map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= safeRating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{safeRating}/5</span>
    </div>
  );
};

const getProductInfo = (product: Review['IdSanPham']) => {
  if (!product) {
    return { name: 'Sản phẩm không xác định', price: null, imageUrl: null };
  }
  if (typeof product === 'string') {
    return { name: 'Đang tải...', price: null, imageUrl: null };
  }
  return {
    name: product.TenSanPham || 'Sản phẩm không xác định',
    price: product.Gia,
    imageUrl: product.HinhAnhChinh ? getProductImageUrl(product.HinhAnhChinh, true) : null,
  };
};

const getCustomerInfo = (customer: Review['IdKhachHang']) => {
  if (!customer) return { name: 'Khách hàng không xác định', email: '' };
  if (typeof customer === 'string') return { name: 'Đang tải...', email: '' };
  return {
    name: customer.HoTen || customer.Email || 'Khách hàng không xác định',
    email: customer.Email || '',
  };
};

export const AdminReviewsView: FC = () => {
  const {
    loading,
    reviews,
    stats,
    error,
    pagination,
    filters,
    setFilters,
    resetFilters,
    isSelectMode,
    selectedReviews,
    toggleSelectMode,
    toggleSelectAll,
    toggleSelectReview,
    openViewDialog,
    closeViewDialog,
    isViewDialogOpen,
    viewingReview,
    openDeleteDialog,
    closeDeleteDialog,
    isDeleteDialogOpen,
    deleteReview,
    deleteSelectedReviews,
    changePage,
    refresh,
  } = useAdminReviews();

  const { currentPage, totalPages, total, pageSize } = pagination;

  const handleFilterChange =
    (field: keyof typeof filters) =>
    (value: string | 'asc' | 'desc') => {
      setFilters({ [field]: value } as Partial<typeof filters>);
    };

  const pageRange = useMemo(() => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, total);
    return { start, end };
  }, [currentPage, pageSize, total]);

  const viewDialogContent = useMemo(() => {
    if (!viewingReview) return null;
    const productInfo = getProductInfo(viewingReview.IdSanPham);
    const customerInfo = getCustomerInfo(viewingReview.IdKhachHang);

    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Sản phẩm</Label>
            <div className="mt-2 font-medium">{productInfo.name}</div>
            {productInfo.price !== null && (
              <div className="text-sm text-muted-foreground">{currencyFormatter.format(productInfo.price)}</div>
            )}
          </div>
          <div>
            <Label>Khách hàng</Label>
            <div className="mt-2 font-medium">{customerInfo.name}</div>
            {customerInfo.email && <div className="text-sm text-muted-foreground">{customerInfo.email}</div>}
          </div>
        </div>

        <div>
          <Label>Đánh giá</Label>
          <div className="mt-2">{renderStars(viewingReview.SoSao)}</div>
        </div>

        <div>
          <Label>Nội dung đánh giá</Label>
          <div className="mt-2 rounded-lg bg-muted p-4">{viewingReview.NoiDung}</div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Ngày tạo</Label>
            <div className="mt-2 text-sm">{formatDate(viewingReview.createdAt)}</div>
          </div>
          <div>
            <Label>Ngày cập nhật</Label>
            <div className="mt-2 text-sm">{formatDate(viewingReview.updatedAt)}</div>
          </div>
        </div>
      </div>
    );
  }, [viewingReview]);

  return (
    <div className="space-y-6">
      {stats?.summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng đánh giá</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.summary.totalReviews ?? 0}</div>
              <p className="text-xs text-muted-foreground">Tổng số đánh giá</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Điểm trung bình</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.summary.avgRating ?? 0).toFixed(2)}</div>
              {renderStars(Math.round(stats.summary.avgRating ?? 0))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">5 sao</CardTitle>
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.summary.distribution?.star5 ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats.summary.totalReviews
                  ? Math.round(((stats.summary.distribution?.star5 ?? 0) / stats.summary.totalReviews) * 100)
                  : 0}
                % tổng đánh giá
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">1 sao</CardTitle>
              <Star className="h-4 w-4 fill-gray-400 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.summary.distribution?.star1 ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats.summary.totalReviews
                  ? Math.round(((stats.summary.distribution?.star1 ?? 0) / stats.summary.totalReviews) * 100)
                  : 0}
                % tổng đánh giá
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quản lý đánh giá</CardTitle>
              <CardDescription>Quản lý và xem tất cả đánh giá của khách hàng</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isSelectMode && selectedReviews.size > 0 && (
                <Button variant="destructive" size="sm" onClick={deleteSelectedReviews}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa ({selectedReviews.size})
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toggleSelectMode();
                }}
              >
                {isSelectMode ? (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    Hủy chọn
                  </>
                ) : (
                  <>
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Chọn nhiều
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setFilters({ showFilters: !filters.showFilters })}>
                <Filter className="mr-2 h-4 w-4" />
                Lọc
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Nhập mã sản phẩm/khách hàng để lọc nhanh..."
                value={filters.productId || filters.customerId ? `${filters.productId} ${filters.customerId}`.trim() : ''}
                onChange={(event) => {
                  const value = event.target.value;
                  setFilters({ productId: value, customerId: value });
                }}
                className="pl-10"
              />
            </div>
          </div>

          {filters.showFilters && (
            <div className="mb-6 space-y-4 rounded-lg border bg-muted/50 p-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="productId">Mã sản phẩm</Label>
                  <Input
                    id="productId"
                    placeholder="Nhập mã sản phẩm"
                    value={filters.productId}
                    onChange={(event) => setFilters({ productId: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerId">Mã khách hàng</Label>
                  <Input
                    id="customerId"
                    placeholder="Nhập mã khách hàng"
                    value={filters.customerId}
                    onChange={(event) => setFilters({ customerId: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minRating">Đánh giá tối thiểu</Label>
                  <Select value={filters.minRating} onValueChange={(value) => handleFilterChange('minRating')(value)}>
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
                  <Select value={filters.maxRating} onValueChange={(value) => handleFilterChange('maxRating')(value)}>
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
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <X className="mr-2 h-4 w-4" />
                Xóa bộ lọc
              </Button>
            </div>
          )}

          <div className="mb-4 flex items-center gap-2">
          <Label>Sắp xếp theo:</Label>
            <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy')(value)}>
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
              onClick={() => setFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
            >
              {filters.sortOrder === 'asc' ? '↑ Tăng dần' : '↓ Giảm dần'}
            </Button>
          </div>

          {loading ? (
            <div className="py-8 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
              <p className="mt-2 text-sm text-muted-foreground">Đang tải...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <div className="mb-2 text-destructive">{error}</div>
              <Button variant="outline" size="sm" onClick={refresh}>
                Thử lại
              </Button>
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">Không có đánh giá nào</div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      {isSelectMode && (
                        <th className="px-4 py-3">
                          <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                            {selectedReviews.size === reviews.length ? (
                              <CheckSquare className="h-4 w-4" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </Button>
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-sm font-medium">Sản phẩm</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Khách hàng</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Đánh giá</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Nội dung</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Ngày tạo</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((review) => {
                      const productInfo = getProductInfo(review.IdSanPham);
                      const customerInfo = getCustomerInfo(review.IdKhachHang);

                      return (
                        <tr key={review._id} className="border-t transition-colors hover:bg-muted/50">
                          {isSelectMode && (
                            <td className="px-4 py-3">
                              <Button variant="ghost" size="sm" onClick={() => toggleSelectReview(review._id)}>
                                {selectedReviews.has(review._id) ? (
                                  <CheckSquare className="h-4 w-4" />
                                ) : (
                                  <Square className="h-4 w-4" />
                                )}
                              </Button>
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <div className="font-medium">{productInfo.name}</div>
                            {productInfo.price !== null && (
                              <div className="text-xs text-muted-foreground">{currencyFormatter.format(productInfo.price)}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{customerInfo.name}</div>
                            {customerInfo.email && <div className="text-xs text-muted-foreground">{customerInfo.email}</div>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {renderStars(review.SoSao)}
                              <Badge
                                variant={review.SoSao >= 4 ? 'default' : review.SoSao >= 3 ? 'secondary' : 'destructive'}
                              >
                                {review.SoSao} sao
                              </Badge>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="max-w-xs truncate">{review.NoiDung}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(review.createdAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openViewDialog(review)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteDialog(review)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => changePage(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => changePage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => changePage(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}

              <div className="text-center text-sm text-muted-foreground">
                {total > 0 ? (
                  <>
                    Hiển thị {reviews.length} / {total} đánh giá (trang {pageRange.start}-{pageRange.end})
                  </>
                ) : (
                  <>Không có đánh giá nào</>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isViewDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeViewDialog();
        }}
      >
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
                  closeViewDialog();
                  openDeleteDialog(viewingReview);
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa đánh giá
            </Button>
            <Button variant="outline" onClick={closeViewDialog}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa đánh giá</AlertDialogTitle>
            <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={deleteReview} className="bg-destructive">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};


