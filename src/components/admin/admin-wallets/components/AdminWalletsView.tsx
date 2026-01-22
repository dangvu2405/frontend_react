/**
 * Admin Wallets View Component
 */

import { Edit, Eye, Filter, Lock, Search, Unlock, Wallet, X } from 'lucide-react';
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

import { useAdminWallets } from '../hooks/useAdminWallets';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export const AdminWalletsView: FC = () => {
  const {
    loading,
    stats,
    pagination,
    filters,
    setFilters,
    resetFilters,
    filteredWallets,
    openDetailDialog,
    closeDetailDialog,
    isDetailDialogOpen,
    selectedWallet,
    transactions,
    transactionsLoading,
    openAdjustDialog,
    closeAdjustDialog,
    isAdjustDialogOpen,
    adjustingWallet,
    formData,
    updateFormData,
    handleAdjustBalance,
    submitting,
    openLockDialog,
    closeLockDialog,
    isLockDialogOpen,
    lockingWallet,
    handleToggleLock,
    locking,
    changePage,
  } = useAdminWallets();

  const totalPages = pagination.totalPages || 1;
  const pageSize = pagination.pageSize;
  const totalItems = pagination.total;
  const currentPage = pagination.currentPage;

  const pageRange = useMemo(() => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);
    return { start, end };
  }, [currentPage, pageSize, totalItems]);

  const formatCurrency = (amount: number) => currencyFormatter.format(amount);

  const getCustomerName = (wallet: typeof filteredWallets[0]) => {
    const customer = wallet.IdKhachHang as unknown as Record<string, unknown>;
    return String(customer?.HoTen || customer?.fullName || customer?.Email || customer?.email || 'N/A');
  };

  const getCustomerEmail = (wallet: typeof filteredWallets[0]) => {
    const customer = wallet.IdKhachHang as unknown as Record<string, unknown>;
    return String(customer?.Email || customer?.email || '');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý ví điện tử</h1>
          <p className="text-muted-foreground">Quản lý ví và giao dịch của khách hàng</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg bg-background">
            <p className="text-sm text-muted-foreground">Tổng số ví</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.totalWallets}</p>
          </div>
          <div className="p-4 border rounded-lg bg-background">
            <p className="text-sm text-muted-foreground">Tổng số dư</p>
            <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(stats.totalBalance)}</p>
          </div>
          <div className="p-4 border rounded-lg bg-background">
            <p className="text-sm text-muted-foreground">Tổng đã nạp</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(stats.totalDeposited)}</p>
          </div>
          <div className="p-4 border rounded-lg bg-background">
            <p className="text-sm text-muted-foreground">Tổng đã chi</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(stats.totalSpent)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 border rounded-lg bg-background">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên, email..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filters.isActive} onValueChange={(value) => setFilters({ isActive: value as 'all' | 'active' | 'locked' })}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="active">Đang hoạt động</SelectItem>
            <SelectItem value="locked">Đã khóa</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={resetFilters} className="gap-2">
          <X className="w-4 h-4" />
          Xóa bộ lọc
        </Button>
      </div>

      {/* Wallets Table */}
      <div className="border rounded-lg bg-background overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Đang tải...</div>
        ) : filteredWallets.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Không có ví nào</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Khách hàng</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Số dư</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Đã nạp</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Đã chi</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Trạng thái</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWallets.map((wallet) => (
                    <tr key={String(wallet._id)} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{getCustomerName(wallet)}</p>
                          <p className="text-xs text-muted-foreground">{getCustomerEmail(wallet)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-primary">{formatCurrency(wallet.balance)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-foreground">{formatCurrency(wallet.totalDeposited)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-foreground">{formatCurrency(wallet.totalSpent)}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {wallet.isActive ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Hoạt động</Badge>
                        ) : (
                          <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Đã khóa</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetailDialog(wallet)}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Chi tiết
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAdjustDialog(wallet)}
                            className="gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Điều chỉnh
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openLockDialog(wallet)}
                            className="gap-2"
                          >
                            {wallet.isActive ? (
                              <>
                                <Lock className="w-4 h-4" />
                                Khóa
                              </>
                            ) : (
                              <>
                                <Unlock className="w-4 h-4" />
                                Mở khóa
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t p-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => changePage(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => changePage(pageNum)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    {totalPages > 5 && currentPage < totalPages - 2 && <PaginationEllipsis />}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => changePage(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={closeDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết ví</DialogTitle>
            <DialogDescription>Thông tin ví và lịch sử giao dịch</DialogDescription>
          </DialogHeader>
          {selectedWallet && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Khách hàng</Label>
                  <p className="font-semibold">{getCustomerName(selectedWallet)}</p>
                  <p className="text-sm text-muted-foreground">{getCustomerEmail(selectedWallet)}</p>
                </div>
                <div>
                  <Label>Số dư</Label>
                  <p className="font-bold text-primary text-xl">{formatCurrency(selectedWallet.balance)}</p>
                </div>
                <div>
                  <Label>Tổng đã nạp</Label>
                  <p className="font-semibold text-green-600">{formatCurrency(selectedWallet.totalDeposited)}</p>
                </div>
                <div>
                  <Label>Tổng đã chi</Label>
                  <p className="font-semibold text-red-600">{formatCurrency(selectedWallet.totalSpent)}</p>
                </div>
                <div>
                  <Label>Trạng thái</Label>
                  {selectedWallet.isActive ? (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Hoạt động</Badge>
                  ) : (
                    <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Đã khóa</Badge>
                  )}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Lịch sử giao dịch</Label>
                {transactionsLoading ? (
                  <div className="text-center py-4 text-muted-foreground">Đang tải...</div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">Chưa có giao dịch nào</div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {transactions.map((tx) => (
                      <div key={String(tx._id)} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {tx.type === 'deposit' && 'Nạp tiền'}
                              {tx.type === 'payment' && 'Thanh toán đơn hàng'}
                              {tx.type === 'refund' && 'Hoàn tiền'}
                              {tx.type === 'withdraw' && 'Rút tiền'}
                              {tx.type === 'admin_adjust' && 'Điều chỉnh bởi admin'}
                            </p>
                            <p className="text-sm text-muted-foreground">{tx.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {tx.createdAt ? new Date(tx.createdAt).toLocaleString('vi-VN') : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.amount > 0 ? '+' : ''}
                              {formatCurrency(tx.amount)}
                            </p>
                            <p className="text-xs text-muted-foreground">Số dư: {formatCurrency(tx.balanceAfter)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDetailDialog}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Balance Dialog */}
      <Dialog open={isAdjustDialogOpen} onOpenChange={closeAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Điều chỉnh số dư ví</DialogTitle>
            <DialogDescription>
              {adjustingWallet && `Ví của ${getCustomerName(adjustingWallet)} - Số dư hiện tại: ${formatCurrency(adjustingWallet.balance)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Loại điều chỉnh</Label>
              <Select
                value={formData.adjustmentType}
                onValueChange={(value) => updateFormData('adjustmentType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Thêm tiền</SelectItem>
                  <SelectItem value="subtract">Trừ tiền</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Số tiền (VNĐ)</Label>
              <Input
                type="number"
                placeholder="Nhập số tiền"
                value={formData.adjustmentAmount}
                onChange={(e) => updateFormData('adjustmentAmount', e.target.value)}
                min={0}
              />
            </div>
            <div>
              <Label>Lý do *</Label>
              <Input
                placeholder="Nhập lý do điều chỉnh"
                value={formData.reason}
                onChange={(e) => updateFormData('reason', e.target.value)}
              />
            </div>
            <div>
              <Label>Ghi chú (tùy chọn)</Label>
              <Textarea
                placeholder="Ghi chú thêm"
                value={formData.note}
                onChange={(e) => updateFormData('note', e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAdjustDialog}>
              Hủy
            </Button>
            <Button onClick={handleAdjustBalance} disabled={submitting}>
              {submitting ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lock Dialog */}
      <AlertDialog open={isLockDialogOpen} onOpenChange={closeLockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {lockingWallet?.isActive ? 'Khóa ví' : 'Mở khóa ví'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {lockingWallet && (
                <>
                  Bạn có chắc chắn muốn {lockingWallet.isActive ? 'khóa' : 'mở khóa'} ví của{' '}
                  <strong>{getCustomerName(lockingWallet)}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleLock} disabled={locking}>
              {locking ? 'Đang xử lý...' : 'Xác nhận'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
