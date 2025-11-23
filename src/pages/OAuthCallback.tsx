import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { storage } from '@/utils/storage';
import { Card, CardContent } from '@/components/ui/card';
import { userService } from '@/services/userService';
import { cartService } from '@/services/cartService';
import { toast } from 'sonner';

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Đọc token từ hash fragment (an toàn hơn) hoặc query string (fallback)
        const hash = window.location.hash.substring(1); // Bỏ dấu # đầu tiên
        const hashParams = new URLSearchParams(hash);
        
        // Ưu tiên đọc từ hash fragment, nếu không có thì đọc từ query string (backward compatibility)
        const token = hashParams.get('token') || searchParams.get('token');
        const refreshToken = hashParams.get('refreshToken') || searchParams.get('refreshToken');
        const error = hashParams.get('error') || searchParams.get('error');
        
        // Debug log trong development
        if (import.meta.env.DEV) {
          console.log('OAuth Callback - Hash:', hash);
          console.log('OAuth Callback - Token found:', !!token);
        }

        if (error) {
          // Xử lý lỗi OAuth
          if (import.meta.env.DEV) {
            console.error('OAuth error:', error);
          }
          toast.error('Đăng nhập thất bại. Vui lòng thử lại.');
          navigate('/login?error=oauth_failed');
          return;
        }

        if (token) {
          // Lưu token vào storage
          storage.setToken(token);
          if (refreshToken) {
            storage.setRefreshToken(refreshToken);
          }

          // Dispatch event để AuthContext refresh
          window.dispatchEvent(new CustomEvent('token:updated'));

          // Fetch user info
          try {
            const response: any = await userService.getCurrentUser();
            if (response) {
              const userData = {
                id: response._id || response.id,
                username: response.TenDangNhap || response.username,
                email: response.Email || response.email,
                fullName: response.HoTen || response.fullName || response.hoten || '',
                phone: response.SoDienThoai,
                birthday: response.NgaySinh,
                avatar: response.AvatarUrl || response.Avatar || response.avatar,
                role: response.MaVaiTro?._id || response.role,
                roleName: response.MaVaiTro?.TenVaiTro || response.roleName,
              };
              storage.setUser(userData);
            }
          } catch (userError) {
            if (import.meta.env.DEV) {
              console.error('Error fetching user info:', userError);
            }
          }

          // ✅ Load cart từ database và sync vào localStorage
          try {
            // ✅ cartService.getCart() trả về Cart object với Items array
            const cart = await cartService.getCart();
            
            if (cart && Array.isArray(cart.Items) && cart.Items.length > 0) {
              // ✅ Map từ database format (Cart.Items) sang localStorage format (CartItem[])
              const mappedCart = cart.Items.map((item: any) => {
                const product = typeof item.IdSanPham === 'object' ? item.IdSanPham : null;
                
                return {
                  id: product?._id || item.IdSanPham?._id || item.MaSanPham?._id || item.MaSanPham || item.id,
                  tenSP: item.TenSanPham || product?.TenSanPham || item.tenSP || 'Sản phẩm',
                  gia: item.Gia || product?.Gia || item.gia || 0,
                  giamGia: product?.KhuyenMai || item.giamGia || 0,
                  hinhAnh: product?.HinhAnhChinh || item.hinhAnh || '',
                  loaiSP: product?.MaLoaiSanPham?.TenLoaiSanPham || item.loaiSP || '',
                  quantity: item.SoLuong || item.quantity || 1,
                };
              });
              
              storage.removeCart();
              storage.setCart(mappedCart);
              window.dispatchEvent(new CustomEvent('cart:updated'));
              
              if (import.meta.env.DEV) {
                console.log('✅ Cart loaded from database after OAuth login:', mappedCart.length, 'items');
              }
            } else {
              if (import.meta.env.DEV) {
                console.log('ℹ️ No cart in database after OAuth login');
              }
            }
          } catch (cartError: any) {
            if (import.meta.env.DEV) {
              console.error('⚠️ Error loading cart from database after OAuth login:', cartError?.message || cartError);
            }
            // Giữ nguyên localStorage cart nếu load từ database thất bại
          }

          toast.success('Đăng nhập thành công!');
          // Xóa hash fragment khỏi URL để bảo mật
          window.history.replaceState(null, '', window.location.pathname);
          // Redirect về trang chủ
          navigate('/');
        } else {
          // Không có token, redirect về login
          if (import.meta.env.DEV) {
            console.warn('OAuth Callback - No token found in URL');
          }
          toast.error('Đăng nhập thất bại. Vui lòng thử lại.');
          navigate('/login?error=oauth_failed');
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('OAuth Callback - Unexpected error:', error);
        }
        toast.error('Có lỗi xảy ra khi xử lý đăng nhập.');
        navigate('/login?error=oauth_error');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground text-center">
              Đang xử lý đăng nhập...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

