import { Edit, Eye, Filter, Lock, Mail, Phone, Search, Trash2, Unlock, UserCog } from 'lucide-react';
import { useMemo, type FC } from 'react';

import { ChartAreaInteractive } from '@/components/chart-area-interactive';
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

import { useAdminCustomers } from '../hooks/useAdminCustomers';
import type { CustomerStatusFilter } from '../types';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export const AdminCustomersView: FC = () => {
  const {
    loading,
    customers,
    roles,
    topCustomersChart,
    statusChart,
    pagination,
    filters,
    setFilters,
    resetFilters,
    filteredCustomers,
    openDetailDialog,
    closeDetailDialog,
    isDetailDialogOpen,
    selectedCustomer,
    openEditDialog,
    closeEditDialog,
    isEditDialogOpen,
    formData,
    updateFormData,
    handleUpdateCustomer,
    submitting,
    openDeleteDialog,
    closeDeleteDialog,
    isDeleteDialogOpen,
    handleDeleteCustomer,
    deletingCustomer,
    openLockDialog,
    closeLockDialog,
    isLockDialogOpen,
    handleLockCustomer,
    lockingCustomer,
    openRoleDialog,
    closeRoleDialog,
    isRoleDialogOpen,
    selectedRoleId,
    setSelectedRoleId,
    handleChangeRole,
    changingRoleCustomer,
    getStatusBadgeProps,
    changePage,
    stats,
  } = useAdminCustomers();

  const currentPage = pagination.currentPage;
  const totalPages = pagination.totalPages;
  const pageSize = pagination.pageSize;
  const totalItems = pagination.total;

  const pageRange = useMemo(() => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);
    return { start, end };
  }, [currentPage, pageSize, totalItems]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý khách hàng</h1>
          <p className="text-muted-foreground">Thông tin khách hàng và lịch sử mua hàng</p>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên, email, SĐT..."
              value={filters.search}
              onChange={(event) => setFilters({ search: event.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm whitespace-nowrap">Trạng thái:</Label>
            <Select value={filters.status} onValueChange={(value) => setFilters({ status: value as CustomerStatusFilter })}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Đã khóa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(filters.status !== 'all' || filters.search) && (
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartAreaInteractive
          data={topCustomersChart.map((item) => ({
            name: item.name,
            sold: item.count || 0,
            revenue: item.revenue,
          }))}
          loading={loading}
          title="Top 10 khách hàng"
          description="Khách hàng có tổng giá trị chi tiêu cao nhất"
        />
        <ChartAreaInteractive
          data={statusChart.map((item) => ({
            name: item.name,
            sold: item.count || 0,
          }))}
          loading={loading}
          title="Trạng thái khách hàng"
          description="Phân bổ khách hàng theo trạng thái"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">Tổng khách hàng</div>
          <div className="mt-2 text-3xl font-bold">{stats.totalCustomers}</div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">Khách hàng VIP</div>
          <div className="mt-2 text-3xl font-bold">{stats.vipCustomers}</div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">Tổng doanh thu</div>
          <div className="mt-2 text-2xl font-bold">{currencyFormatter.format(stats.totalRevenue)}</div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">Tổng đơn hàng</div>
          <div className="mt-2 text-3xl font-bold">{stats.totalOrders}</div>
        </div>
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Khách hàng</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Số điện thoại</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Tổng đơn hàng</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Tổng chi tiêu</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Đang tải...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {filters.search ? 'Không tìm thấy khách hàng phù hợp' : 'Chưa có khách hàng nào'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const badge = getStatusBadgeProps(customer.TrangThai);
                  return (
                    <tr key={customer._id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm font-medium">{customer.HoTen || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {customer.Email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {customer.SoDienThoai ? (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {customer.SoDienThoai}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">{customer.orderCount || 0} đơn</td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        {currencyFormatter.format(customer.totalRevenue || 0)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={badge.className}>{badge.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openDetailDialog(customer)}
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => openEditDialog(customer)} title="Sửa">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openLockDialog(customer)}
                            title={customer.TrangThai === 'inactive' ? 'Mở khóa' : 'Khóa'}
                          >
                            {customer.TrangThai === 'inactive' ? (
                              <Unlock className="h-4 w-4" />
                            ) : (
                              <Lock className="h-4 w-4" />
                            )}
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => openRoleDialog(customer)} title="Đổi role">
                            <UserCog className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openDeleteDialog(customer)}
                            title="Xóa"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
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
            Hiển thị {pageRange.start} - {pageRange.end} trong tổng số {totalItems} khách hàng
            {filters.search && ` (${filteredCustomers.length} kết quả tìm kiếm)`}
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
                if (totalPages <= 5) pageNum = index + 1;
                else if (currentPage <= 3) pageNum = index + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + index;
                else pageNum = currentPage - 2 + index;

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
        open={isDetailDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDetailDialog();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết khách hàng</DialogTitle>
            <DialogDescription>Thông tin chi tiết và lịch sử mua hàng</DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Họ tên</p>
                  <p className="text-lg font-semibold">{selectedCustomer.HoTen || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{selectedCustomer.Email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Số điện thoại</p>
                  <p className="text-sm">{selectedCustomer.SoDienThoai || 'Chưa cập nhật'}</p>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/50 p-4">
                <h3 className="mb-3 font-semibold">Thống kê mua hàng</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg bg-background p-3">
                    <span className="text-sm text-muted-foreground">Tổng đơn hàng</span>
                    <span className="text-xl font-bold">{selectedCustomer.orderCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-background p-3">
                    <span className="text-sm text-muted-foreground">Tổng chi tiêu</span>
                    <span className="text-xl font-bold">
                      {currencyFormatter.format(selectedCustomer.totalRevenue || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-background p-3">
                    <span className="text-sm text-muted-foreground">Trung bình/đơn</span>
                    <span className="text-xl font-bold">
                      {currencyFormatter.format(
                        (selectedCustomer.totalRevenue || 0) / (selectedCustomer.orderCount || 1),
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-background p-3">
                    <span className="text-sm text-muted-foreground">Trạng thái</span>
                    {(() => {
                      const badge = getStatusBadgeProps(selectedCustomer.TrangThai);
                      return (
                        <Badge className={badge.className}>
                          {badge.label}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Ngày đăng ký</p>
                <p className="text-sm">
                  {selectedCustomer.createdAt
                    ? new Date(selectedCustomer.createdAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '—'}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeEditDialog();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa thông tin khách hàng</DialogTitle>
            <DialogDescription>Cập nhật thông tin khách hàng</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="hoten">Họ tên</Label>
              <Input id="hoten" value={formData.hoten} onChange={(event) => updateFormData('hoten', event.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(event) => updateFormData('email', event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="sdt">Số điện thoại</Label>
              <Input id="sdt" value={formData.sdt} onChange={(event) => updateFormData('sdt', event.target.value)} />
            </div>
            <div>
              <Label htmlFor="gioiTinh">Giới tính</Label>
              <Select value={formData.gioiTinh} onValueChange={(value) => updateFormData('gioiTinh', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giới tính" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Nam</SelectItem>
                  <SelectItem value="female">Nữ</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ngaySinh">Ngày sinh</Label>
              <Input
                id="ngaySinh"
                type="date"
                value={formData.ngaySinh}
                onChange={(event) => updateFormData('ngaySinh', event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              Hủy
            </Button>
            <Button onClick={handleUpdateCustomer} disabled={submitting}>
              {submitting ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDeleteDialog();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa khách hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa khách hàng <strong>{deletingCustomer?.HoTen || 'N/A'}</strong>? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive text-destructive-foreground">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isLockDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeLockDialog();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {lockingCustomer?.TrangThai === 'inactive' ? 'Mở khóa' : 'Khóa'} tài khoản
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn {lockingCustomer?.TrangThai === 'inactive' ? 'mở khóa' : 'khóa'} tài khoản của khách hàng{' '}
              <strong>{lockingCustomer?.HoTen}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleLockCustomer}>
              {lockingCustomer?.TrangThai === 'inactive' ? 'Mở khóa' : 'Khóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={isRoleDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeRoleDialog();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi role khách hàng</DialogTitle>
            <DialogDescription>
              Thay đổi role cho khách hàng <strong>{changingRoleCustomer?.HoTen || 'N/A'}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn role" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(roles) && roles.length > 0 ? (
                    roles.map((role) => (
                      <SelectItem key={role._id} value={role._id}>
                        {role.TenVaiTro}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      Không có role nào
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeRoleDialog}>
              Hủy
            </Button>
            <Button onClick={handleChangeRole} disabled={submitting || !selectedRoleId}>
              {submitting ? 'Đang xử lý...' : 'Đổi role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


