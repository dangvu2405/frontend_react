import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { CheckCircle2, Package, Home, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [method, setMethod] = useState<string | null>(null);

  useEffect(() => {
    const orderIdParam = searchParams.get('orderId');
    const methodParam = searchParams.get('method');
    
    setOrderId(orderIdParam);
    setMethod(methodParam);

    // Clear cart from localStorage if payment was successful
    try {
      const cart = localStorage.getItem('cart');
      if (cart) {
        const cartData = JSON.parse(cart);
        if (Array.isArray(cartData) && cartData.length > 0) {
          localStorage.setItem('cart', JSON.stringify([]));
          window.dispatchEvent(new CustomEvent('cart:updated'));
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Failed to clear cart:', error);
      }
    }
  }, [searchParams]);

  const getMethodName = (method: string | null) => {
    switch (method?.toLowerCase()) {
      case 'vnpay':
        return 'VNPay';
      case 'momo':
        return 'Ví MoMo';
      case 'cod':
        return 'Thanh toán khi nhận hàng (COD)';
      default:
        return 'Thanh toán trực tuyến';
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <Card className="border-2 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-8 text-center">
              {/* Success Icon */}
              <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center animate-pop-in">
                <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Thanh toán thành công!
              </h1>
              <p className="text-muted-foreground mb-6">
                Cảm ơn bạn đã đặt hàng. Chúng tôi đã nhận được thanh toán của bạn.
              </p>

              {/* Order Info */}
              <div className="bg-muted/50 rounded-lg p-6 mb-6 space-y-3">
                {orderId && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Mã đơn hàng:</span>
                    <span className="text-sm font-semibold text-foreground font-mono">
                      #{orderId.slice(-8).toUpperCase()}
                    </span>
                  </div>
                )}
                {method && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Phương thức thanh toán:</span>
                    <span className="text-sm font-semibold text-foreground">
                      {getMethodName(method)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-center gap-2 pt-2 border-t border-border">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Đơn hàng của bạn đang được xử lý
                  </span>
                </div>
              </div>

              {/* Info Message */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <strong>Lưu ý:</strong> Chúng tôi đã gửi email xác nhận đơn hàng đến địa chỉ email của bạn. 
                  Bạn có thể theo dõi trạng thái đơn hàng trong phần "Đơn hàng của tôi".
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => navigate('/orders')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="lg"
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Xem đơn hàng của tôi
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

