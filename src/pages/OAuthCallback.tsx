import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { storage } from '@/utils/storage';
import { Card, CardContent } from '@/components/ui/card';
import { userService } from '@/services/userService';
import { cartService } from '@/services/cartService';
import { toast } from 'sonner';
import axiosInstance from '@/services/axios';
import { API_ENDPOINTS } from '@/constants';

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const processedCodes = useRef<Set<string>>(new Set());
  const isProcessingRef = useRef<string | null>(null);

  useEffect(() => {
    // Đọc code từ URL query params
    const code = searchParams.get('code');
    
    // Nếu không có code, không làm gì
    if (!code) {
      return;
    }

    // Tránh xử lý cùng một code nhiều lần
    if (processedCodes.current.has(code)) {
      if (import.meta.env.DEV) {
        console.log('OAuth Callback - Code already processed, skipping...', code.substring(0, 20));
      }
      return;
    }

    // Tránh xử lý nếu đang xử lý code khác (hoặc cùng code)
    if (isProcessingRef.current === code) {
      if (import.meta.env.DEV) {
        console.log('OAuth Callback - Code is already being processed, skipping...', code.substring(0, 20));
      }
      return;
    }

    // Đánh dấu code này đang được xử lý
    isProcessingRef.current = code;
    // Đánh dấu code này đã được xử lý NGAY LẬP TỨC
    processedCodes.current.add(code);

    const handleOAuthCallback = async () => {
      try {
        const error = searchParams.get('error');
        
        // Debug log trong development
        if (import.meta.env.DEV) {
          console.log('OAuth Callback - Code:', code ? `${code.substring(0, 20)}...` : 'not found');
          console.log('OAuth Callback - Error:', error || 'none');
          console.log('OAuth Callback - Full URL:', window.location.href);
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

        if (!code) {
          // Không có code, redirect về login
          if (import.meta.env.DEV) {
            console.warn('OAuth Callback - No code found in URL');
          }
          toast.error('Đăng nhập thất bại. Vui lòng thử lại.');
          navigate('/login?error=oauth_failed');
          return;
        }

        // Gọi API exchange để đổi code lấy token
        try {
          if (import.meta.env.DEV) {
            console.log('OAuth Exchange - Sending code:', code ? `${code.substring(0, 20)}...` : 'missing');
          }
          
          const response = await axiosInstance.post(API_ENDPOINTS.GOOGLE_EXCHANGE, { code });
          
          if (import.meta.env.DEV) {
            console.log('OAuth Exchange - Response received:', response.data?.success ? 'success' : 'failed');
          }
          
          // Backend trả về: { success, message, data: { accessToken, refreshToken, user } }
          const responseData = response.data;
          const accessToken = responseData?.data?.accessToken;
          const refreshToken = responseData?.data?.refreshToken;
          const user = responseData?.data?.user;

          if (!accessToken) {
            throw new Error('Không nhận được access token từ server');
          }

          // Lưu token vào storage
          storage.setToken(accessToken);
          if (refreshToken) {
            storage.setRefreshToken(refreshToken);
          }

          // Lưu user info nếu có
          if (user) {
            const userData = {
              id: user.id || user._id,
              username: user.TenDangNhap || user.username,
              email: user.Email || user.email,
              fullName: user.HoTen || user.fullName || '',
              phone: user.SoDienThoai || user.phone,
              birthday: user.NgaySinh || user.birthday,
              avatar: user.AvatarUrl || user.Avatar || user.avatar,
              role: user.MaVaiTro?._id || user.MaVaiTro || user.role,
              roleName: ((user.MaVaiTro as unknown as Record<string, unknown> | undefined)?.TenVaiTro as string | undefined) || (user as unknown as Record<string, unknown>).roleName as string | undefined,
            };
            storage.setUser(userData);
          } else {
            // Nếu không có user trong response, fetch từ API
          try {
              const userResponse = await userService.getCurrentUser();
              if (userResponse) {
              const userData = {
                  id: userResponse._id || (userResponse as unknown as Record<string, unknown>).id as string | undefined,
                  username: userResponse.TenDangNhap || (userResponse as unknown as Record<string, unknown>).username as string | undefined,
                  email: userResponse.Email || (userResponse as unknown as Record<string, unknown>).email as string | undefined,
                  fullName: userResponse.HoTen || (userResponse as unknown as Record<string, unknown>).fullName as string | undefined || (userResponse as unknown as Record<string, unknown>).hoten as string | undefined || '',
                  phone: userResponse.SoDienThoai,
                  birthday: userResponse.NgaySinh,
                  avatar: userResponse.AvatarUrl || (userResponse as unknown as Record<string, unknown>).Avatar as string | undefined || (userResponse as unknown as Record<string, unknown>).avatar as string | undefined,
                  role: (typeof userResponse.MaVaiTro === 'object' && userResponse.MaVaiTro?._id ? userResponse.MaVaiTro._id : userResponse.MaVaiTro) || (userResponse as unknown as Record<string, unknown>).role as string | undefined,
                  roleName: ((userResponse.MaVaiTro as unknown as Record<string, unknown> | undefined)?.TenVaiTro as string | undefined) || (userResponse as unknown as Record<string, unknown>).roleName as string | undefined,
              };
              storage.setUser(userData);
            }
          } catch (userError) {
            if (import.meta.env.DEV) {
              console.error('Error fetching user info:', userError);
            }
          }
          }

          // Dispatch event để AuthContext refresh
          window.dispatchEvent(new CustomEvent('token:updated'));

          // ✅ Xóa cart và hearts cũ trong localStorage trước khi load từ database
          storage.removeCart();
          storage.removeHearts();
          
          // ✅ Load hearts từ database và sync vào localStorage
          try {
            const { heartService } = await import('@/services/heartService');
            const heartProjectIds = await heartService.getUserHeartProjectIds();
            if (heartProjectIds && heartProjectIds.length > 0) {
              storage.setHearts(heartProjectIds);
              if (import.meta.env.DEV) {
                console.log('✅ Hearts loaded from database after OAuth login:', heartProjectIds.length, 'projects');
              }
            }
          } catch (heartError: unknown) {
            if (import.meta.env.DEV) {
              const errorMsg = (heartError as Record<string, unknown>)?.message || heartError;
              console.error('⚠️ Error loading hearts from database:', errorMsg);
            }
          }

          // ✅ Load cart từ database và sync vào localStorage
          try {
            // ✅ cartService.getCart() trả về Cart object với Items array
            const cart = await cartService.getCart();
            
            if (cart && Array.isArray(cart.Items) && cart.Items.length > 0) {
              // ✅ Map từ database format (Cart.Items) sang localStorage format (CartItem[])
              const mappedCart = cart.Items.map((item: unknown) => {
                const itemRecord = item as Record<string, unknown>;
                const idSanPham = itemRecord.IdSanPham as Record<string, unknown> | string | undefined;
                const project = typeof idSanPham === 'object' ? idSanPham : null;
                const projectRecord = project as Record<string, unknown> | null;
                
                // Xử lý selectedDungTich từ DB
                const selectedDungTichRaw = itemRecord.SelectedDungTich as Record<string, unknown> | undefined;
                const selectedDungTich = selectedDungTichRaw ? {
                  value: Number(selectedDungTichRaw.value) || 0,
                  label: String(selectedDungTichRaw.label || `${selectedDungTichRaw.value || 0} ml`),
                  priceDiff: Number(selectedDungTichRaw.priceDiff) || 0,
                  stockDiff: Number(selectedDungTichRaw.stockDiff) || 0,
                  sku: selectedDungTichRaw.sku ? String(selectedDungTichRaw.sku) : undefined,
                  isDefault: Boolean(selectedDungTichRaw.isDefault),
                } : undefined;
                
                // Xử lý includesOptions từ project
                const includesOptions = projectRecord?.DungTichOptions && Array.isArray(projectRecord.DungTichOptions)
                  ? projectRecord.DungTichOptions.map((opt: unknown) => {
                      const optRecord = opt as Record<string, unknown>;
                      return {
                        value: Number(optRecord.value) || 0,
                        label: String(optRecord.label || `${optRecord.value || 0} ml`),
                        priceDiff: Number(optRecord.priceDiff) || 0,
                        stockDiff: Number(optRecord.stockDiff) || 0,
                        sku: optRecord.sku ? String(optRecord.sku) : undefined,
                        isDefault: Boolean(optRecord.isDefault),
                      };
                    })
                  : undefined;
                
                // Tính basePrice từ gia và selectedDungTich
                const finalPrice = Number(itemRecord.Gia) || (projectRecord ? Number(projectRecord.Gia) : 0) || 0;
                const basePrice = selectedDungTich && selectedDungTich.priceDiff
                  ? finalPrice - selectedDungTich.priceDiff
                  : finalPrice;
                
                // Tạo cart item ID với includes
                const maSanPham = itemRecord.MaSanPham as Record<string, unknown> | string | undefined;
                const projectId = projectRecord?._id || 
                  (typeof idSanPham === 'object' && idSanPham?._id ? idSanPham._id : idSanPham) ||
                  (typeof maSanPham === 'object' && maSanPham?._id ? maSanPham._id : maSanPham) ||
                  itemRecord.id;
                const cartItemId = selectedDungTich
                  ? `${projectId}::includes-${selectedDungTich.value}`
                  : `${projectId}::default`;
                
                const maLoaiSanPham = projectRecord?.MaLoaiSanPham as Record<string, unknown> | undefined;
                return {
                  id: cartItemId,
                  projectId: String(projectId),
                  tenSP: String(itemRecord.TenSanPham || projectRecord?.TenSanPham || itemRecord.tenSP || 'Đồ án'),
                  gia: finalPrice,
                  basePrice,
                  giamGia: Number(projectRecord?.KhuyenMai || itemRecord.giamGia || 0),
                  hinhAnh: String(projectRecord?.HinhAnhChinh || itemRecord.hinhAnh || ''),
                  loaiSP: String((maLoaiSanPham?.TenLoaiSanPham as string) || itemRecord.loaiSP || ''),
                  quantity: Number(itemRecord.SoLuong || itemRecord.quantity || 1),
                  selectedDungTich,
                  includesOptions,
                };
              });
              
              storage.setCart(mappedCart);
              window.dispatchEvent(new CustomEvent('cart:updated'));
              
              if (import.meta.env.DEV) {
                console.log('✅ Cart loaded from database after OAuth login:', mappedCart.length, 'items');
              }
            } else {
              if (import.meta.env.DEV) {
                console.log('ℹ️ No cart in database after OAuth login, cart cleared');
              }
            }
          } catch (cartError: unknown) {
            if (import.meta.env.DEV) {
              const errorMsg = (cartError as Record<string, unknown>)?.message || cartError;
              console.error('⚠️ Error loading cart from database after OAuth login:', errorMsg);
            }
            // Cart đã được xóa ở trên, không cần làm gì thêm
          }

          toast.success('Đăng nhập thành công!');
          // Reset processing flag
          isProcessingRef.current = null;
          // Xóa code khỏi URL để bảo mật
          window.history.replaceState(null, '', window.location.pathname);
          
          // ✅ Kiểm tra role và redirect tương ứng
          const storedUser = storage.getUser();
          const roleName = storedUser?.roleName?.toLowerCase() || 
                          storedUser?.MaVaiTro?.TenVaiTro?.toLowerCase() || 
                          user?.MaVaiTro?.TenVaiTro?.toLowerCase() || '';
          const isAdminUser = roleName === 'admin' || 
                             roleName === 'quản trị viên' || 
                             roleName === 'administrator';
          
          if (isAdminUser) {
            navigate('/admin');
          } else {
            navigate('/');
          }
        } catch (exchangeError: unknown) {
          // Reset processing flag khi có lỗi
          isProcessingRef.current = null;
          
          // Xử lý lỗi khi exchange code
          if (import.meta.env.DEV) {
            console.error('OAuth Exchange Error:', exchangeError);
          }
          
          // Bỏ qua lỗi "canceled" (do React Strict Mode)
          const errorRecord = exchangeError as Record<string, unknown>;
          if (errorRecord?.message === 'canceled' || errorRecord?.code === 'ERR_CANCELED') {
            if (import.meta.env.DEV) {
              console.log('OAuth Exchange - Request was canceled (likely due to React Strict Mode), ignoring...');
          }
            return;
          }
          const errorMessage = (((errorRecord?.response as Record<string, unknown>)?.data as Record<string, unknown>)?.message as string | undefined) || 
            (errorRecord?.message as string | undefined) || 'Đăng nhập thất bại';
          toast.error(errorMessage);
          navigate('/login?error=oauth_failed');
        }
      } catch (error) {
        // Reset processing flag khi có lỗi
        isProcessingRef.current = null;
        
        if (import.meta.env.DEV) {
          console.error('OAuth Callback - Unexpected error:', error);
        }
        toast.error('Có lỗi xảy ra khi xử lý đăng nhập.');
        navigate('/login?error=oauth_error');
      }
    };

    handleOAuthCallback();
    
    // Cleanup: Reset processing flag khi effect cleanup (nhưng không abort request)
    return () => {
      // Chỉ reset flag, không abort request vì request có thể đang được xử lý
      // Set processedCodes vẫn giữ để tránh xử lý lại
    };
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

