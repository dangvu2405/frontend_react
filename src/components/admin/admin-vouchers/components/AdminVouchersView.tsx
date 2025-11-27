import { BarChart3, Edit, Filter, Percent, Plus, Search, Ticket, Trash2, TrendingUp, X } from 'lucide-react';
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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { useAdminVouchers } from '../hooks/useAdminVouchers';

const formatDate = (dateString: string) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const currencyPercent = (value?: number) => (value ?? 0).toFixed(1);

export const AdminVouchersView: FC = () => {
  const {
    loading,
    vouchers,
    stats,
    pagination,
    filters,
    setFilters,
    resetFilters,
    filteredCount,
    openDialog,
    closeDialog,
    isDialogOpen,
    editingVoucher,
    formData,
    updateFormData,
    handleSubmit,
    openDeleteDialog,
    closeDeleteDialog,
    isDeleteDialogOpen,
    deletingVoucher,
    confirmDeleteVoucher,
    changePage,
  } = useAdminVouchers();

  const { currentPage, totalPages, pageSize, total } = pagination;
  const pageRange = useMemo(() => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, total);
    return { start, end };
  }, [currentPage, pageSize, total]);

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng voucher</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.summary.totalVouchers ?? 0}</div>
              <p className="text-xs text-muted-foreground">Tổng số mã giảm giá</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng số lượng</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.summary.totalQuantity ?? 0}</div>
              <p className="text-xs text-muted-foreground">Tổng số voucher có sẵn</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Giá trị TB</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currencyPercent(stats.summary.avgGiaTri)}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.summary.minGiaTri ?? 0}% - {stats.summary.maxGiaTri ?? 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sắp hết</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.summary.lowStock ?? 0}</div>
              <p className="text-xs text-muted-foreground">Voucher ≤ 10 cái</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quản lý voucher</CardTitle>
              <CardDescription>Quản lý mã giảm giá và khuyến mãi</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setFilters({ showFilters: !filters.showFilters })}>
                <Filter className="mr-2 h-4 w-4" />
                Lọc
              </Button>
              <Button size="sm" onClick={() => openDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Tạo voucher
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo mã hoặc nội dung voucher..."
                value={filters.search}
                onChange={(event) => setFilters({ search: event.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          {filters.showFilters && (
            <div className="mb-6 space-y-4 rounded-lg border bg-muted/50 p-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="minGiaTri">Giá trị tối thiểu (%)</Label>
                  <Input
                    id="minGiaTri"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={filters.minGiaTri}
                    onChange={(event) => setFilters({ minGiaTri: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxGiaTri">Giá trị tối đa (%)</Label>
                  <Input
                    id="maxGiaTri"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="100"
                    value={filters.maxGiaTri}
                    onChange={(event) => setFilters({ maxGiaTri: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minSoLuong">Số lượng tối thiểu</Label>
                  <Input
                    id="minSoLuong"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={filters.minSoLuong}
                    onChange={(event) => setFilters({ minSoLuong: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxSoLuong">Số lượng tối đa</Label>
                  <Input
                    id="maxSoLuong"
                    type="number"
                    min="0"
                    placeholder="Không giới hạn"
                    value={filters.maxSoLuong}
                    onChange={(event) => setFilters({ maxSoLuong: event.target.value })}
                  />
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
            <Select value={filters.sortBy} onValueChange={(value) => setFilters({ sortBy: value })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NgayTao">Ngày tạo</SelectItem>
                <SelectItem value="MaVoucher">Mã voucher</SelectItem>
                <SelectItem value="GiaTri">Giá trị</SelectItem>
                <SelectItem value="SoLuong">Số lượng</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}>
              {filters.sortOrder === 'asc' ? '↑ Tăng dần' : '↓ Giảm dần'}
            </Button>
          </div>

          {loading ? (
            <div className="py-8 text-center">Đang tải...</div>
          ) : vouchers.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">Không có voucher nào</div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Mã voucher</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Nội dung</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Giá trị</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Số lượng</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Ngày tạo</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vouchers.map((voucher) => (
                      <tr key={voucher._id} className="border-t transition-colors hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="font-mono">
                            {voucher.MaVoucher}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-xs truncate">{voucher.NoiDung}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={voucher.GiaTri >= 50 ? 'default' : 'secondary'} className="font-semibold">
                            {voucher.GiaTri}%
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              voucher.SoLuong === 0 ? 'destructive' : voucher.SoLuong <= 10 ? 'secondary' : 'default'
                            }
                          >
                            {voucher.SoLuong} cái
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(voucher.NgayTao || '')}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openDialog(voucher)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(voucher)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
                        <PaginationLink onClick={() => changePage(page)} isActive={currentPage === page} className="cursor-pointer">
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
                Hiển thị {pageRange.start}-{pageRange.end} / {total} voucher (đã lọc: {filteredCount})
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingVoucher ? 'Cập nhật voucher' : 'Tạo voucher mới'}</DialogTitle>
            <DialogDescription>{editingVoucher ? 'Cập nhật thông tin voucher' : 'Điền thông tin để tạo voucher mới'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="MaVoucher">Mã voucher *</Label>
              <Input
                id="MaVoucher"
                placeholder="VD: SALE2024"
                value={formData.MaVoucher}
                onChange={(event) => updateFormData('MaVoucher', event.target.value.toUpperCase())}
                disabled={!!editingVoucher}
              />
              <p className="text-xs text-muted-foreground">Mã voucher sẽ được chuyển thành chữ hoa</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="NoiDung">Nội dung *</Label>
              <Textarea
                id="NoiDung"
                placeholder="Mô tả về voucher..."
                value={formData.NoiDung}
                onChange={(event) => updateFormData('NoiDung', event.target.value)}
                rows={3}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="GiaTri">Giá trị (%) *</Label>
                <Input
                  id="GiaTri"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0-100"
                  value={formData.GiaTri}
                  onChange={(event) => updateFormData('GiaTri', event.target.value)}
                />
                <p className="text-xs text-muted-foreground">Phần trăm giảm giá (0-100%)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="SoLuong">Số lượng *</Label>
                <Input
                  id="SoLuong"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.SoLuong}
                  onChange={(event) => updateFormData('SoLuong', event.target.value)}
                />
                <p className="text-xs text-muted-foreground">Số lượng voucher có sẵn</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="NgayTao">Ngày tạo</Label>
              <Input id="NgayTao" type="date" value={formData.NgayTao} onChange={(event) => updateFormData('NgayTao', event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Hủy
            </Button>
            <Button onClick={handleSubmit}>{editingVoucher ? 'Cập nhật' : 'Tạo mới'}</Button>
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
            <AlertDialogTitle>Xác nhận xóa voucher</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa voucher <strong>{deletingVoucher?.MaVoucher}</strong>? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteVoucher} className="bg-destructive">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};


