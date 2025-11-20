import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ExternalLink, Copy, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cartService } from '@/services/cartService';
import axiosInstance from '@/services/axios';

interface PaymentResponse {
  message?: string;
  paymentUrl?: string;
  qrCode?: string;
  orderId?: string;
  transactionRef?: string;
  error?: string;
}

export default function VNPayDebugPage() {
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState('100000');
  const [orderDescription, setOrderDescription] = useState('Thanh toan don hang test');
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [response, setResponse] = useState<PaymentResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [testMode, setTestMode] = useState<'url' | 'qr'>('url');

  const handleCreatePaymentUrl = async () => {
    if (!orderId.trim() || !amount.trim()) {
      toast.error('Vui lòng nhập Order ID và Amount');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Amount phải là số dương');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResponse(null);
      setPaymentUrl('');
      setQrCode('');

      const data = {
        orderId: orderId.trim(),
        amount: amountNum,
        orderDescription: orderDescription.trim() || 'Thanh toan don hang',
        orderType: 'other',
        language: 'vn',
      };

      console.log('🔍 Request Data:', data);

      const result: any = await cartService.createVNPayUrl(data);
      console.log('✅ Response:', result);

      if (result?.paymentUrl) {
        setPaymentUrl(result.paymentUrl);
        setResponse(result);
        toast.success('Tạo payment URL thành công!');
      } else {
        throw new Error('Không nhận được paymentUrl từ response');
      }
    } catch (err: any) {
      console.error('❌ Error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Lỗi không xác định';
      setError(errorMessage);
      setResponse(err?.response?.data || null);
      toast.error(`Lỗi: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQR = async () => {
    if (!orderId.trim() || !amount.trim()) {
      toast.error('Vui lòng nhập Order ID và Amount');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Amount phải là số dương');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResponse(null);
      setPaymentUrl('');
      setQrCode('');

      const data = {
        orderId: orderId.trim(),
        amount: amountNum,
        orderDescription: orderDescription.trim() || 'Thanh toan don hang',
      };

      console.log('🔍 Request Data (QR):', data);

      const result: any = await cartService.createVNPayQR(data);
      console.log('✅ Response (QR):', result);

      if (result?.qrCode || result?.paymentUrl) {
        setQrCode(result.qrCode || '');
        setPaymentUrl(result.paymentUrl || '');
        setResponse(result);
        toast.success('Tạo QR code thành công!');
      } else {
        throw new Error('Không nhận được qrCode hoặc paymentUrl từ response');
      }
    } catch (err: any) {
      console.error('❌ Error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Lỗi không xác định';
      setError(errorMessage);
      setResponse(err?.response?.data || null);
      toast.error(`Lỗi: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Đã sao chép ${label}`);
    } catch {
      toast.error('Không thể sao chép');
    }
  };

  const handleOpenPaymentUrl = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
    }
  };

  const parseVNPayUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const params: Record<string, string> = {};
      urlObj.searchParams.forEach((value, key) => {
        params[key] = decodeURIComponent(value);
      });
      return params;
    } catch {
      return {};
    }
  };

  const vnpayParams = paymentUrl ? parseVNPayUrl(paymentUrl) : {};

  return (
    <div className="container mx-auto max-w-6xl space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">🔍 VNPay Debug & Test</h1>
        <p className="text-muted-foreground mt-2">
          Trang debug để test chức năng thanh toán VNPay
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin Test</CardTitle>
            <CardDescription>Nhập thông tin để test VNPay</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orderId">Order ID *</Label>
              <Input
                id="orderId"
                placeholder="Ví dụ: 507f1f77bcf86cd799439011"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Order ID phải là MongoDB ObjectId hợp lệ
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (VND) *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="100000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Số tiền tính bằng VND (ví dụ: 100000 = 100,000 VND)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderDescription">Order Description</Label>
              <Textarea
                id="orderDescription"
                placeholder="Thanh toan don hang"
                value={orderDescription}
                onChange={(e) => setOrderDescription(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Mô tả đơn hàng (chỉ ASCII, không tiếng Việt có dấu)
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreatePaymentUrl}
                disabled={loading || !orderId.trim() || !amount.trim()}
                className="flex-1"
              >
                {loading && testMode === 'url' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  'Tạo Payment URL'
                )}
              </Button>
              <Button
                onClick={handleCreateQR}
                disabled={loading || !orderId.trim() || !amount.trim()}
                variant="outline"
                className="flex-1"
              >
                {loading && testMode === 'qr' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  'Tạo QR Code'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Test Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Test</CardTitle>
            <CardDescription>Test với các order có sẵn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={async () => {
                // Tạo order test trước
                try {
                  const testOrder = await axiosInstance.post('/api/orders', {
                    SanPham: [{ MaSanPham: 'test', SoLuong: 1, Gia: 100000 }],
                    TongTien: 100000,
                    PhiVanChuyen: 0,
                    PhuongThucThanhToan: 'VNPay',
                  });
                  if (testOrder?.data?._id) {
                    setOrderId(testOrder.data._id);
                    setAmount('100000');
                    toast.success('Đã tạo order test');
                  }
                } catch (err: any) {
                  toast.error('Không thể tạo order test. Vui lòng nhập Order ID thủ công.');
                }
              }}
            >
              Tạo Order Test & Fill Form
            </Button>
            <p className="text-xs text-muted-foreground">
              Tạo một order test và tự động điền form
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Lỗi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm font-medium">{error}</p>
              {response && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs font-mono text-muted-foreground">
                    {JSON.stringify(response, null, 2)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment URL Result */}
      {paymentUrl && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Payment URL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={paymentUrl}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleCopy(paymentUrl, 'Payment URL')}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleOpenPaymentUrl}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Mở VNPay
              </Button>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-semibold mb-2 block">VNPay Parameters</Label>
              <div className="rounded-lg bg-muted p-4 space-y-2 max-h-96 overflow-y-auto">
                {Object.entries(vnpayParams).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-2 text-xs">
                    <span className="font-mono font-semibold text-primary min-w-[140px]">{key}:</span>
                    <span className="font-mono text-muted-foreground break-all">{String(value)}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 ml-auto"
                      onClick={() => handleCopy(String(value), key)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* QR Code Result */}
      {qrCode && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <img
                src={qrCode}
                alt="VNPay QR Code"
                className="border rounded-lg p-4 bg-white max-w-xs"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleCopy(qrCode, 'QR Code Data URL')}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy QR Data URL
              </Button>
              {paymentUrl && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleCopy(paymentUrl, 'Payment URL')}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Payment URL
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Response Data */}
      {response && !error && (
        <Card>
          <CardHeader>
            <CardTitle>Response Data</CardTitle>
            <CardDescription>Dữ liệu trả về từ API</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted p-4">
              <pre className="text-xs font-mono overflow-x-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => handleCopy(JSON.stringify(response, null, 2), 'Response Data')}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Response
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Debug Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">API Endpoints</Label>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline">POST</Badge>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  /api/payment/vnpay/create-payment-url
                </code>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">POST</Badge>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  /api/payment/vnpay/create-qr
                </code>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-semibold mb-2 block">Checklist</Label>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span>✓</span>
                <span>Order ID phải là ObjectId hợp lệ</span>
              </li>
              <li className="flex items-center gap-2">
                <span>✓</span>
                <span>Amount phải là số dương (VND)</span>
              </li>
              <li className="flex items-center gap-2">
                <span>✓</span>
                <span>Order Description chỉ ASCII (không tiếng Việt có dấu)</span>
              </li>
              <li className="flex items-center gap-2">
                <span>✓</span>
                <span>Kiểm tra env vars: VNPAY_TMN_CODE, VNPAY_HASH_SECRET</span>
              </li>
              <li className="flex items-center gap-2">
                <span>✓</span>
                <span>Kiểm tra Return URL và IPN URL trong env</span>
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-semibold mb-2 block">Common Issues</Label>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>
                <strong className="text-foreground">"Dữ liệu không hợp lệ":</strong>
                <ul className="ml-4 mt-1 space-y-1 list-disc">
                  <li>Kiểm tra signature có đúng không</li>
                  <li>Kiểm tra params có đầy đủ không</li>
                  <li>Kiểm tra URL encoding có đúng không</li>
                  <li>Kiểm tra Return URL và IPN URL có hợp lệ không</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

