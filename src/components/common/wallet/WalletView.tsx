/**
 * Wallet View Component
 * Hiển thị số dư ví, nạp tiền và lịch sử giao dịch
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/contexts/WalletContext';
import { walletService } from '@/services/walletService';
import { toast } from 'sonner';
import {
  Wallet,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import type { DepositRequest, WalletTransaction, WalletPaymentMethod } from '@/types/models/wallet';

const PAYMENT_METHODS: { value: WalletPaymentMethod; label: string }[] = [
  { value: 'vnpay', label: 'VNPay' },
  { value: 'momo', label: 'MoMo' },
  { value: 'bank_transfer', label: 'Chuyển khoản ngân hàng' },
  { value: 'cash', label: 'Tiền mặt' },
];

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

export const WalletView = () => {
  const { wallet, loading, refreshWallet, transactions, refreshTransactions } = useWallet();
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<WalletPaymentMethod>('vnpay');
  const [isDepositing, setIsDepositing] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownCircle className="w-5 h-5 text-green-500" />;
      case 'payment':
      case 'withdraw':
        return <ArrowUpCircle className="w-5 h-5 text-red-500" />;
      case 'refund':
        return <CheckCircle2 className="w-5 h-5 text-blue-500" />;
      default:
        return <History className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTransactionStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Hoàn thành</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Đang chờ</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Thất bại</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/30">Đã hủy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDeposit = async () => {
    const amount = Number(depositAmount);
    if (!amount || amount < 10000) {
      toast.error('Số tiền nạp tối thiểu là 10,000đ');
      return;
    }

    if (amount > 50000000) {
      toast.error('Số tiền nạp tối đa là 50,000,000đ');
      return;
    }

    setIsDepositing(true);
    try {
      const request: DepositRequest = {
        amount,
        paymentMethod,
        description: `Nạp tiền vào ví - ${PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label}`,
      };

      const response = await walletService.deposit(request);

      if (response.paymentUrl) {
        // Mở cửa sổ thanh toán
        window.open(response.paymentUrl, '_blank');
        setCheckingStatus(response.transactionId);
        toast.success('Đang chuyển đến trang thanh toán...');
      } else {
        toast.success('Nạp tiền thành công!');
        await refreshWallet();
        await refreshTransactions();
        setIsDepositDialogOpen(false);
        setDepositAmount('');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi nạp tiền';
      toast.error(errorMessage);
    } finally {
      setIsDepositing(false);
    }
  };

  // Kiểm tra trạng thái giao dịch nếu đang chờ
  useEffect(() => {
    if (!checkingStatus) return;

    const interval = setInterval(async () => {
      try {
        const transaction = await walletService.checkDepositStatus(checkingStatus);
        if (transaction.status === 'completed') {
          setCheckingStatus(null);
          toast.success('Nạp tiền thành công!');
          await refreshWallet();
          await refreshTransactions();
          setIsDepositDialogOpen(false);
          setDepositAmount('');
        } else if (transaction.status === 'failed' || transaction.status === 'cancelled') {
          setCheckingStatus(null);
          toast.error('Giao dịch thất bại hoặc đã bị hủy');
        }
      } catch (error) {
        console.error('Error checking deposit status:', error);
      }
    }, 3000); // Kiểm tra mỗi 3 giây

    return () => clearInterval(interval);
  }, [checkingStatus, refreshWallet, refreshTransactions]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Đang tải thông tin ví...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Ví điện tử của tôi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Số dư hiện tại</p>
              <p className="text-3xl font-bold text-primary mt-1">
                {wallet ? formatCurrency(wallet.balance) : formatCurrency(0)}
              </p>
            </div>
            <Button onClick={() => setIsDepositDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Nạp tiền
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Tổng đã nạp</p>
              <p className="text-lg font-semibold text-foreground mt-1">
                {wallet ? formatCurrency(wallet.totalDeposited) : formatCurrency(0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tổng đã chi</p>
              <p className="text-lg font-semibold text-foreground mt-1">
                {wallet ? formatCurrency(wallet.totalSpent) : formatCurrency(0)}
              </p>
            </div>
          </div>

          {wallet && !wallet.isActive && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-600">
                ⚠️ Ví của bạn đã bị khóa. Vui lòng liên hệ admin để được hỗ trợ.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Lịch sử giao dịch
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Chưa có giao dịch nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={String(transaction._id || (transaction as unknown as Record<string, unknown>).id || '')}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getTransactionIcon(transaction.type)}
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {transaction.type === 'deposit' && 'Nạp tiền'}
                        {transaction.type === 'payment' && 'Thanh toán đơn hàng'}
                        {transaction.type === 'refund' && 'Hoàn tiền'}
                        {transaction.type === 'withdraw' && 'Rút tiền'}
                        {transaction.type === 'admin_adjust' && 'Điều chỉnh bởi admin'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {transaction.createdAt
                          ? new Date(transaction.createdAt).toLocaleString('vi-VN')
                          : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.amount > 0 ? '+' : ''}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <div className="mt-1">{getTransactionStatusBadge(transaction.status)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deposit Dialog */}
      <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nạp tiền vào ví</DialogTitle>
            <DialogDescription>Nhập số tiền bạn muốn nạp vào ví điện tử</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="amount">Số tiền (VNĐ)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Nhập số tiền"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min={10000}
                max={50000000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Số tiền tối thiểu: 10,000đ - Tối đa: 50,000,000đ
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setDepositAmount(String(amount))}
                >
                  {formatCurrency(amount)}
                </Button>
              ))}
            </div>

            <div>
              <Label htmlFor="paymentMethod">Phương thức thanh toán</Label>
              <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as WalletPaymentMethod)}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDepositDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleDeposit} disabled={isDepositing || !depositAmount}>
              {isDepositing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Nạp tiền'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
