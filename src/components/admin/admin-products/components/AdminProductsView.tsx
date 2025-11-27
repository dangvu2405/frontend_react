import { CheckSquare, Edit, Filter, Plus, Search, Square, Trash2 } from 'lucide-react';
import { useMemo, type FC } from 'react';

import { ChartAreaInteractive } from '@/components/chart-area-interactive';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Product } from '@/types/models';

import { useAdminProducts } from '../hooks/useAdminProducts';
import type { StockFilter } from '../types';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const hasActiveFilters = (filters: { search: string; categoryId: string; stock: string }) =>
  Boolean(filters.search) || filters.categoryId !== 'all' || filters.stock !== 'all';

export const AdminProductsView: FC = () => {
  const {
    loading,
    categories,
    categorySalesChart,
    priceTrendChart,
    pagination,
    filters,
    setFilters,
    resetFilters,
    filteredProducts,
    isSelectMode,
    toggleSelectMode,
    selectedProducts,
    handleToggleSelectAll,
    handleToggleSelectProduct,
    handleBulkDelete,
    isDialogOpen,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    formData,
    updateFormData,
    submitting,
    handleSubmit,
    imageState,
    handleImageChange,
    removeImage,
    isDeleteDialogOpen,
    openDeleteDialog,
    closeDeleteDialog,
    deletingProduct,
    handleDelete,
    getStockStatus,
    changePage,
    editingProduct,
  } = useAdminProducts();

  const totalPages = pagination.totalPages || 1;
  const pageSize = pagination.pageSize;
  const totalItems = pagination.total;
  const currentPage = pagination.currentPage;

  const pageRangeLabel = useMemo(() => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);
    return { start, end };
  }, [currentPage, pageSize, totalItems]);

  const renderCategoryName = (product: Product) =>
    typeof product.MaLoaiSanPham === 'string'
      ? 'Không phân loại'
      : product.MaLoaiSanPham?.TenLoaiSanPham ?? 'Không phân loại';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý sản phẩm</h1>
          <p className="text-muted-foreground">Quản lý danh sách sản phẩm và tồn kho</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={isSelectMode ? 'default' : 'outline'} onClick={toggleSelectMode}>
            <CheckSquare className="mr-2 h-4 w-4" />
            {isSelectMode ? `Đã chọn: ${selectedProducts.size}` : 'Chọn nhiều'}
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm sản phẩm
          </Button>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên sản phẩm, mô tả, danh mục..."
              value={filters.search}
              onChange={(event) => setFilters({ search: event.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm whitespace-nowrap">Danh mục:</Label>
            <Select
              value={filters.categoryId}
              onValueChange={(value) => setFilters({ categoryId: value })}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {(Array.isArray(categories) ? categories : []).map((category) => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.TenLoaiSanPham}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">Tồn kho:</Label>
            <Select
              value={filters.stock}
              onValueChange={(value: StockFilter) => setFilters({ stock: value })}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Tồn kho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="in">Còn hàng (≥10)</SelectItem>
                <SelectItem value="low">Sắp hết (1-9)</SelectItem>
                <SelectItem value="out">Hết hàng (0)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters(filters) && (
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Xóa bộ lọc
            </Button>
          )}
        </div>

        {isSelectMode && selectedProducts.size > 0 && (
          <div className="flex items-center gap-2 border-t pt-2">
            <span className="text-sm font-medium">Đã chọn {selectedProducts.size} sản phẩm:</span>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={submitting}>
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa sản phẩm
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartAreaInteractive
          data={categorySalesChart}
          loading={loading}
          title="Doanh số theo danh mục"
          description="Số lượng bán và doanh thu theo từng danh mục sản phẩm"
        />
        <ChartAreaInteractive
          data={priceTrendChart}
          loading={loading}
          title="Phân bổ theo giá"
          description="Số lượng sản phẩm bán được theo phân khúc giá"
        />
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                {isSelectMode && (
                  <th className="w-12 px-4 py-3 text-center">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleToggleSelectAll}>
                      {selectedProducts.size === filteredProducts.length && filteredProducts.length > 0 ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                  </th>
                )}
                <th className="px-4 py-3 text-left text-sm font-medium">Tên sản phẩm</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Danh mục</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Giá</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Tồn kho</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Đã bán</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={isSelectMode ? 8 : 7}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    Đang tải...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={isSelectMode ? 8 : 7}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    {filters.search ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm nào'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product: Product) => {
                  const stockStatus = getStockStatus(product.SoLuong);
                  return (
                    <tr
                      key={product._id}
                      className={`border-b hover:bg-muted/50 ${
                        selectedProducts.has(product._id) ? 'bg-primary/5' : ''
                      }`}
                    >
                      {isSelectMode && (
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleToggleSelectProduct(product._id)}
                          >
                            {selectedProducts.has(product._id) ? (
                              <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </Button>
                        </td>
                      )}
                      <td className="px-4 py-3 text-sm font-medium">{product.TenSanPham}</td>
                      <td className="px-4 py-3 text-sm">{renderCategoryName(product)}</td>
                      <td className="px-4 py-3 text-right text-sm">
                        {currencyFormatter.format(product.Gia)}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">{product.SoLuong}</td>
                      <td className="px-4 py-3 text-center text-sm">{product.DaBan}</td>
                      <td className={`px-4 py-3 text-center text-sm font-medium ${stockStatus.color}`}>
                        {stockStatus.text}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => openEditDialog(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openDeleteDialog(product)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Hiển thị {pageRangeLabel.start} - {pageRangeLabel.end} trong tổng số {totalItems} sản phẩm
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    if (currentPage > 1) changePage(currentPage - 1);
                  }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = index + 1;
                } else if (currentPage <= 3) {
                  pageNum = index + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + index;
                } else {
                  pageNum = currentPage - 2 + index;
                }
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        changePage(pageNum);
                      }}
                      isActive={currentPage === pageNum}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    if (currentPage < totalPages) changePage(currentPage + 1);
                  }}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</DialogTitle>
            <DialogDescription>Điền thông tin sản phẩm. Các trường có dấu * là bắt buộc.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="TenSanPham">Tên sản phẩm *</Label>
                <Input
                  id="TenSanPham"
                  value={formData.TenSanPham}
                  onChange={(event) => updateFormData('TenSanPham', event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="MaLoaiSanPham">Loại sản phẩm *</Label>
                {categories.length === 0 ? (
                  <div className="space-y-2">
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Chưa có loại sản phẩm nào" />
                      </SelectTrigger>
                    </Select>
                    <p className="text-xs text-destructive">
                      ⚠️ Chưa có loại sản phẩm nào. Vui lòng tạo loại sản phẩm trước khi thêm sản phẩm.
                    </p>
                  </div>
                ) : (
                  <Select
                    value={formData.MaLoaiSanPham}
                    onValueChange={(value) => updateFormData('MaLoaiSanPham', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại sản phẩm" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Array.isArray(categories) ? categories : []).map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.TenLoaiSanPham}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="MoTa">Mô tả</Label>
              <Textarea
                id="MoTa"
                value={formData.MoTa}
                onChange={(event) => updateFormData('MoTa', event.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Ảnh chính *</Label>
                <div className="flex items-center gap-4">
                  <div className="relative flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted">
                    {imageState.mainImagePreview ? (
                      <>
                        <img
                          src={imageState.mainImagePreview}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(-1)}
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs"
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <span className="px-2 text-center text-xs text-muted-foreground">Chưa có ảnh</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleImageChange(event.target.files?.[0] || null, -1)}
                      className="cursor-pointer"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Chọn ảnh chính (JPG, PNG, tối đa 5MB)</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ảnh phụ (tối đa 3 ảnh)</Label>
                <div className="grid grid-cols-3 gap-4">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="space-y-2">
                      <div className="relative flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted">
                        {imageState.subImagePreviews[index] ? (
                          <>
                            <img
                              src={imageState.subImagePreviews[index]}
                              alt={`Preview ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs"
                            >
                              ×
                            </button>
                          </>
                        ) : (
                          <span className="px-2 text-center text-xs text-muted-foreground">Ảnh {index + 1}</span>
                        )}
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleImageChange(event.target.files?.[0] || null, index)}
                        className="cursor-pointer text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="Gia">Giá (VNĐ) *</Label>
                <Input
                  id="Gia"
                  type="number"
                  min="0"
                  value={formData.Gia}
                  onChange={(event) =>
                    updateFormData('Gia', event.target.value === '' ? 0 : Number(event.target.value))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="KhuyenMai">Giảm giá (%)</Label>
                <Input
                  id="KhuyenMai"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.KhuyenMai}
                  onChange={(event) => {
                    const value = event.target.value === '' ? 0 : Number(event.target.value);
                    updateFormData('KhuyenMai', Math.max(0, Math.min(100, value)));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="SoLuong">Số lượng *</Label>
                <Input
                  id="SoLuong"
                  type="number"
                  min="0"
                  value={formData.SoLuong}
                  onChange={(event) =>
                    updateFormData('SoLuong', event.target.value === '' ? 0 : Number(event.target.value))
                  }
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog} disabled={submitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Đang xử lý...' : editingProduct ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </DialogFooter>
          </form>
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
            <AlertDialogTitle>Xác nhận xóa sản phẩm</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa sản phẩm "{deletingProduct?.TenSanPham}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};




