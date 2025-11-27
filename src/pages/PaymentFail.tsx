import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { XCircle, AlertCircle, RefreshCw, Home, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function PaymentFailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [method, setMethod] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const methodParam = searchParams.get('method');
    const codeParam = searchParams.get('code');
    const messageParam = searchParams.get('message');
    
    setMethod(methodParam);
    setCode(codeParam);
    setMessage(messageParam);
  }, [searchParams]);

  const getMethodName = (method: string | null) => {
    switch (method?.toLowerCase()) {
      case 'vnpay':
        return 'VNPay';
      case 'momo':
        return 'Ví MoMo';
      default:
        return 'Thanh toán trực tuyến';
    }
  };

  const getErrorMessage = () => {
    if (message) {
      return message;
    }
    
    if (code) {
      switch (code) {
        case '07':
          return 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).';
        case '09':
          return 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking.';
        case '10':
          return 'Xác thực giao dịch không thành công do: Nhập sai mật khẩu quá số lần quy định.';
        case '11':
          return 'Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch.';
        case '12':
          return 'Thẻ/Tài khoản bị khóa.';
        case '51':
          return 'Tài khoản không đủ số dư để thực hiện giao dịch.';
        case '65':
          return 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày.';
        case '75':
          return 'Ngân hàng thanh toán đang bảo trì.';
        case '79':
          return 'Nhập sai mật khẩu thanh toán quá số lần quy định.';
        default:
          return `Giao dịch thất bại với mã lỗi: ${code}`;
      }
    }
    
    return 'Giao dịch thanh toán không thành công. Vui lòng kiểm tra lại thông tin và thử lại.';
  };

  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <Card className="border-2 border-red-200 dark:border-red-800">
            <CardContent className="p-8 text-center">
              {/* Error Icon */}
              <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center animate-shake">
                <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Thanh toán thất bại
              </h1>
              <p className="text-muted-foreground mb-6">
                Rất tiếc, giao dịch của bạn không thành công.
              </p>

              {/* Error Info */}
              <div className="bg-muted/50 rounded-lg p-6 mb-6 space-y-3">
                {method && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Phương thức thanh toán:</span>
                    <span className="text-sm font-semibold text-foreground">
                      {getMethodName(method)}
                    </span>
                  </div>
                )}
                {code && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Mã lỗi:</span>
                    <span className="text-sm font-semibold text-foreground font-mono">
                      {code}
                    </span>
                  </div>
                )}
              </div>

              {/* Error Message */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-900 dark:text-red-200 text-left">
                    {getErrorMessage()}
                  </p>
                </div>
              </div>

              {/* Helpful Tips */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900 dark:text-blue-200 text-left">
                  <strong>Gợi ý:</strong>
                </p>
                <ul className="text-sm text-blue-800 dark:text-blue-300 text-left mt-2 space-y-1 list-disc list-inside">
                  <li>Kiểm tra lại số dư tài khoản hoặc thẻ của bạn</li>
                  <li>Đảm bảo thông tin thanh toán được nhập chính xác</li>
                  <li>Thử lại với phương thức thanh toán khác</li>
                  <li>Liên hệ ngân hàng nếu vấn đề vẫn tiếp tục</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => navigate('/checkout')}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  size="lg"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Thử lại thanh toán
                </Button>
                <Button
                  onClick={() => navigate('/cart')}
                  variant="outline"
                  size="lg"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Về giỏ hàng
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  size="lg"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Về trang chủ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

