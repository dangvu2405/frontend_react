import { CheckSquare, Edit, Filter, Plus, Search, Square, Trash2, UserCheck, UserX } from 'lucide-react';
import { type FC } from 'react';

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

import { useAdminAccounts } from '../hooks/useAdminAccounts';

const AdminAccountsView: FC = () => {
  const {
    loading,
    users,
    roles,
    roleChart,
    statusChart,
    pagination,
    filters,
    setFilters,
    resetFilters,
    filteredUsers,
    isSelectMode,
    selectedUsers,
    toggleSelectMode,
    toggleSelectAll,
    toggleSelectUser,
    handleBulkDelete,
    handleBulkUpdateStatus,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    isDialogOpen,
    editingUser,
    formData,
    updateFormData,
    handleSubmit,
    submitting,
    openDeleteDialog,
    closeDeleteDialog,
    isDeleteDialogOpen,
    deletingUser,
    handleDelete,
    getStatusBadge,
    changePage,
  } = useAdminAccounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý tài khoản</h1>
          <p className="text-muted-foreground">Quản lý người dùng và phân quyền</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isSelectMode ? 'default' : 'outline'}
            onClick={() => {
              toggleSelectMode();
            }}
          >
            <CheckSquare className="mr-2 h-4 w-4" />
            {isSelectMode ? `Đã chọn: ${selectedUsers.size}` : 'Chọn nhiều'}
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm tài khoản
          </Button>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên, email, tên đăng nhập, SĐT..."
              value={filters.search}
              onChange={(event) => setFilters({ search: event.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm whitespace-nowrap">Vai trò:</Label>
            <Select value={filters.roleId} onValueChange={(value) => setFilters({ roleId: value })}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role._id} value={role._id}>
                    {role.TenVaiTro}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">Trạng thái:</Label>
            <Select value={filters.status} onValueChange={(value) => setFilters({ status: value })}>
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

          {(filters.roleId !== 'all' || filters.status !== 'all' || filters.search) && (
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Xóa bộ lọc
            </Button>
          )}
        </div>

        {isSelectMode && selectedUsers.size > 0 && (
          <div className="flex items-center gap-2 border-t pt-2">
            <span className="text-sm font-medium">Đã chọn {selectedUsers.size} tài khoản:</span>
            <div className="flex gap-2">
              <Select onValueChange={(value) => handleBulkUpdateStatus(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Thay đổi trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Đã khóa</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={submitting}>
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa tài khoản
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartAreaInteractive
          data={roleChart.map((item) => ({ name: item.name, sold: item.count || 0 }))}
          loading={loading}
          title="Phân bổ theo vai trò"
          description="Số lượng người dùng theo từng vai trò"
        />
        <ChartAreaInteractive
          data={statusChart.map((item) => ({ name: item.name, sold: item.count || 0 }))}
          loading={loading}
          title="Trạng thái tài khoản"
          description="Số lượng tài khoản đang hoạt động và bị khóa"
        />
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                {isSelectMode && (
                  <th className="w-12 px-4 py-3 text-center">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleSelectAll}>
                      {selectedUsers.size === filteredUsers.length && filteredUsers.length > 0 ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                  </th>
                )}
                <th className="px-4 py-3 text-left text-sm font-medium">Họ tên</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Số điện thoại</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Vai trò</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Ngày tạo</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isSelectMode ? 8 : 7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Đang tải...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={isSelectMode ? 8 : 7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {filters.search ? 'Không tìm thấy tài khoản phù hợp' : 'Chưa có tài khoản nào'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleName =
                    typeof user.MaVaiTro === 'string'
                      ? roles.find((role) => role._id === user.MaVaiTro)?.TenVaiTro ?? 'N/A'
                      : user.MaVaiTro?.TenVaiTro ?? 'N/A';
                  const createdText = user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '—';
                  const badge = getStatusBadge(user.TrangThai);

                  return (
                    <tr key={user._id} className={`border-b hover:bg-muted/50 ${selectedUsers.has(user._id) ? 'bg-primary/5' : ''}`}>
                      {isSelectMode && (
                        <td className="px-4 py-3 text-center">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleSelectUser(user._id)}>
                            {selectedUsers.has(user._id) ? (
                              <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </Button>
                        </td>
                      )}
                      <td className="px-4 py-3 text-sm font-medium">{user.HoTen}</td>
                      <td className="px-4 py-3 text-sm">{user.Email}</td>
                      <td className="px-4 py-3 text-sm">{user.SoDienThoai || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">{roleName}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${badge.className}`}>
                          {user.TrangThai === 'inactive' ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{createdText}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => openEditDialog(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => openDeleteDialog(user)}>
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

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Hiển thị {(pagination.currentPage - 1) * pagination.pageSize + 1} -{' '}
            {Math.min(pagination.currentPage * pagination.pageSize, pagination.total)} trong tổng số {pagination.total} tài khoản
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    if (pagination.currentPage > 1) changePage(pagination.currentPage - 1);
                  }}
                  className={pagination.currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, index) => {
                let pageNum: number;
                if (pagination.totalPages <= 5) pageNum = index + 1;
                else if (pagination.currentPage <= 3) pageNum = index + 1;
                else if (pagination.currentPage >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + index;
                else pageNum = pagination.currentPage - 2 + index;
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        changePage(pageNum);
                      }}
                      isActive={pagination.currentPage === pageNum}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              {pagination.totalPages > 5 && pagination.currentPage < pagination.totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    if (pagination.currentPage < pagination.totalPages) changePage(pagination.currentPage + 1);
                  }}
                  className={pagination.currentPage === pagination.totalPages ? 'pointer-events-none opacity-50' : ''}
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
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}</DialogTitle>
            <DialogDescription>Điền thông tin tài khoản. Các trường có dấu * là bắt buộc.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="hoten">Họ tên *</Label>
              <Input id="hoten" value={formData.hoten} onChange={(event) => updateFormData('hoten', event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={formData.email} onChange={(event) => updateFormData('email', event.target.value)} required />
            </div>
            {!editingUser ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="tenDangNhap">Tên đăng nhập *</Label>
                  <Input
                    id="tenDangNhap"
                    value={formData.tenDangNhap}
                    onChange={(event) => updateFormData('tenDangNhap', event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="matKhau">Mật khẩu *</Label>
                  <Input
                    id="matKhau"
                    type="password"
                    value={formData.matKhau}
                    onChange={(event) => updateFormData('matKhau', event.target.value)}
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="tenDangNhap">Tên đăng nhập</Label>
                  <Input
                    id="tenDangNhap"
                    value={formData.tenDangNhap}
                    onChange={(event) => updateFormData('tenDangNhap', event.target.value)}
                    placeholder="Để trống nếu không đổi"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="matKhau">Mật khẩu mới</Label>
                  <Input
                    id="matKhau"
                    type="password"
                    value={formData.matKhau}
                    onChange={(event) => updateFormData('matKhau', event.target.value)}
                    placeholder="Để trống nếu không đổi"
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="sdt">Số điện thoại {editingUser ? '' : '*'}</Label>
              <Input
                id="sdt"
                value={formData.sdt}
                onChange={(event) => updateFormData('sdt', event.target.value.replace(/\D/g, ''))}
                placeholder="0123456789"
                maxLength={10}
                required={!editingUser}
              />
            </div>
            <div className="space-y-2">
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
            <div className="space-y-2">
              <Label htmlFor="ngaySinh">Ngày sinh</Label>
              <Input id="ngaySinh" type="date" value={formData.ngaySinh} onChange={(event) => updateFormData('ngaySinh', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maVaiTro">Vai trò *</Label>
              <Select value={formData.maVaiTro} onValueChange={(value) => updateFormData('maVaiTro', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role._id} value={role._id}>
                      {role.TenVaiTro}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="trangThai">Trạng thái *</Label>
              <Select value={formData.trangThai} onValueChange={(value) => updateFormData('trangThai', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Đã khóa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog} disabled={submitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Đang xử lý...' : editingUser ? 'Cập nhật' : 'Thêm mới'}
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
            <AlertDialogTitle>Xác nhận xóa tài khoản</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tài khoản <strong>{filteredUsers.find((user) => user._id === deletingUser?._id)?.HoTen || '—'}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminAccountsView;




