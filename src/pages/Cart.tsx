import { MainLayout } from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { storage, type CartItem } from '@/utils/storage';
import { getCloudinaryProductImageUrl } from '@/utils/imageUtils';
import { toast } from 'sonner';

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Chỉ load cart từ localStorage, không sync từ database
  useEffect(() => {
    setCartItems(storage.getCart());
    
    // Lắng nghe event khi cart được cập nhật (từ các component khác)
    const handleCartUpdate = () => {
      setCartItems(storage.getCart());
    };
    
    window.addEventListener('cart:updated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cart:updated', handleCartUpdate);
    };
  }, []);

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, p) => {
      const unit = Number(p.gia) || 0;
      const discount = Number(p.giamGia) || 0;
      const finalUnit = discount > 0 ? Math.round(unit * (1 - discount / 100)) : unit;
      return sum + finalUnit * (p.quantity || 0);
    }, 0);
  }, [cartItems]);

  const shipping = 0;
  const total = subtotal + shipping;

  const handleIncrease = (id: string) => {
    const current = storage.getCart();
    const found = current.find((c) => c.id === id);
    const next = storage.updateCartItemQuantity(id, (found?.quantity || 0) + 1);
    setCartItems(next);
    window.dispatchEvent(new CustomEvent('cart:updated'));
  };

  const handleDecrease = (id: string) => {
    const current = storage.getCart();
    const found = current.find((c) => c.id === id);
    const newQty = Math.max(0, (found?.quantity || 0) - 1);
    const next = storage.updateCartItemQuantity(id, newQty);
    setCartItems(next);
    window.dispatchEvent(new CustomEvent('cart:updated'));
  };

  const handleRemove = (id: string) => {
    const next = storage.removeCartItem(id);
    setCartItems(next);
    window.dispatchEvent(new CustomEvent('cart:updated'));
  };

  const handleVolumeChange = (cartItemId: string, value: string) => {
    const target = cartItems.find((item) => item.id === cartItemId);
    if (!target || !target.volumeOptions) return;
    const option = target.volumeOptions.find((opt) => String(opt?.value) === value);
    if (!option) return;

    storage.updateCartItemVolume(cartItemId, option);
    const updated = storage.getCart();
    setCartItems(updated);
    window.dispatchEvent(new CustomEvent('cart:updated'));
    toast.success('Đã cập nhật dung tích');
  };
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-foreground mb-8">Giỏ hàng</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-24 h-24 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Giỏ hàng trống
            </h2>
            <p className="text-muted-foreground mb-8">
              Bạn chưa có sản phẩm nào trong giỏ hàng
            </p>
            <Link to="/products">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Tiếp tục mua sắm
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const discount = Number(item.giamGia) || 0;
                const basePrice = Number(item.gia) || 0;
                const finalPrice = discount > 0 ? Math.round(basePrice * (1 - discount / 100)) : basePrice;
                const imageUrl = getCloudinaryProductImageUrl(item.hinhAnh || '') || 'https://placehold.co/200x200/E5E5EA/000?text=No+Image';

                return (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="relative flex-shrink-0">
                          <img
                            src={imageUrl}
                            alt={item.tenSP}
                            className="w-28 h-28 rounded-lg object-contain bg-gray-50 border border-border"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/200x200/E5E5EA/000?text=No+Image';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-1">{item.loaiSP || 'Nước hoa'}</p>
                          <h3 className="font-bold text-foreground mb-2 line-clamp-2">{item.tenSP}</h3>
                          
                          {/* Hiển thị dung tích đã chọn */}
                          {item.selectedDungTich && (
                            <div className="mb-2">
                              <p className="text-xs text-muted-foreground">
                                Dung tích:{' '}
                                <span className="font-medium text-foreground">
                                  {item.selectedDungTich.label || `${item.selectedDungTich.value} ml`}
                                </span>
                              </p>
                            </div>
                          )}
                          
                          {/* Select để thay đổi dung tích nếu có nhiều options */}
                          {item.volumeOptions && item.volumeOptions.length > 1 && (
                            <div className="mb-2 w-full max-w-xs">
                              <Select
                                value={String(item.selectedDungTich?.value ?? item.volumeOptions[0]?.value ?? '')}
                                onValueChange={(value) => handleVolumeChange(item.id, value)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Chọn dung tích" />
                                </SelectTrigger>
                                <SelectContent>
                                  {item.volumeOptions.map((option) => (
                                    <SelectItem
                                      key={`${item.id}-${option?.value ?? 'default'}`}
                                      value={String(option?.value ?? '')}
                                    >
                                      {option?.label || `${option?.value} ml`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          
                          <p className="text-primary font-bold text-lg">
                            {finalPrice.toLocaleString('vi-VN')}đ
                            {discount > 0 && (
                              <span className="ml-2 text-sm text-muted-foreground line-through">
                                {basePrice.toLocaleString('vi-VN')}đ
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex flex-col items-end justify-between gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                            onClick={() => handleRemove(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 border-border"
                              onClick={() => handleDecrease(item.id)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center font-semibold text-sm">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 border-border"
                              onClick={() => handleIncrease(item.id)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-foreground mb-6">
                    Tóm tắt đơn hàng
                  </h2>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-foreground">
                      <span>Tạm tính</span>
                      <span className="font-semibold">
                        {subtotal.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    <div className="flex justify-between text-foreground">
                      <span>Phí vận chuyển</span>
                      <span className="font-semibold text-green-600">Miễn phí</span>
                    </div>
                    <div className="border-t border-border pt-4">
                      <div className="flex justify-between text-lg font-bold text-foreground">
                        <span>Tổng cộng</span>
                        <span className="text-primary">
                          {total.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link to="/checkout">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg">
                      Tiến hành thanh toán
                    </Button>
                  </Link>
                  <Link to="/products">
                    <Button variant="outline" className="w-full mt-3 border-border">
                      Tiếp tục mua sắm
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

