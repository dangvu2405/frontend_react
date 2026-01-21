import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import authService from '@/services/authService';
import { userService } from '@/services/userService';
import { cartService } from '@/services/cartService';
import { heartService } from '@/services/heartService';
import { storage } from '@/utils/storage';
import { toast } from 'sonner';
import type { LoginCredentials } from '@/types/models';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  birthday?: string;
  avatar?: string;
  role?: string;
  roleName?: string; // Tên role từ populate
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string, turnstileToken?: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAdminRole: () => boolean;
}

interface RegisterData {
  hoten: string;
  username: string;
  email: string;
  sdt?: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);

  // Check if current user is admin - moved outside to avoid dependency issues
  const checkAdminRole = useCallback((userToCheck?: User | null): boolean => {
    const userToValidate = userToCheck || user;
    if (!userToValidate) return false;
    
    // Check roleName first
    if (userToValidate.roleName) {
      const roleName = userToValidate.roleName.toLowerCase().trim();
      if (roleName === 'admin' || 
          roleName === 'quản trị viên' || 
          roleName === 'administrator') {
        return true;
      }
    }
    
    // Fallback: check role ID if roleName is not available
    // This is a workaround for cases where roleName might not be populated
    if (userToValidate.role) {
      // You might need to adjust this based on your backend role IDs
      // For now, we'll rely on roleName primarily
    }
    
    return false;
  }, [user]);

  // Helper function to check admin role without dependencies
  const isAdminRole = (userToCheck: User | null): boolean => {
    if (!userToCheck) return false;
    if (userToCheck.roleName) {
      const roleName = userToCheck.roleName.toLowerCase().trim();
      return roleName === 'admin' || 
             roleName === 'quản trị viên' || 
             roleName === 'administrator';
    }
    return false;
  };

  // Fetch user info with role from API
  const fetchUserInfo = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    try {
      // Call API để lấy user info (có populate role)
      const response = await userService.getCurrentUser();
      if (response) {
        const responseAny = response as unknown as Record<string, unknown>;
        const maVaiTro = responseAny.MaVaiTro as Record<string, unknown> | string | undefined;
        const userData: User = {
          id: String(responseAny._id || responseAny.id || ''),
          username: String(responseAny.TenDangNhap || responseAny.username || ''),
          email: String(responseAny.Email || responseAny.email || ''),
          fullName: String(responseAny.HoTen || responseAny.fullName || responseAny.hoten || ''),
          phone: responseAny.SoDienThoai ? String(responseAny.SoDienThoai) : undefined,
          birthday: responseAny.NgaySinh ? (responseAny.NgaySinh === null ? undefined : String(responseAny.NgaySinh)) : undefined,
          avatar: responseAny.AvatarUrl || responseAny.Avatar || responseAny.avatar ? String(responseAny.AvatarUrl || responseAny.Avatar || responseAny.avatar) : undefined,
          role: typeof maVaiTro === 'object' && maVaiTro?._id ? String(maVaiTro._id) : maVaiTro ? String(maVaiTro) : responseAny.role ? String(responseAny.role) : undefined,
          roleName: typeof maVaiTro === 'object' && maVaiTro?.TenVaiTro ? String(maVaiTro.TenVaiTro) : responseAny.roleName ? String(responseAny.roleName) : undefined,
        };
        setUser(userData);
        // Save to storage for fallback
        storage.setUser(userData);
        
        // Log in development for debugging
        if (import.meta.env.DEV) {
          console.log('✅ User info loaded:', {
            username: userData.username,
            roleName: userData.roleName,
            isAdmin: isAdminRole(userData),
          });
        }
      }
    } catch (error: unknown) {
      // Nếu là lỗi 401 (token không hợp lệ/hết hạn), clear storage và user
      const errorRecord = error as Record<string, unknown>;
      if (errorRecord?.status === 401 || (errorRecord?.response as Record<string, unknown>)?.status === 401) {
        // Token không hợp lệ, clear tất cả
        storage.clearAll();
        setUser(null);
        if (import.meta.env.DEV) {
          console.warn('⚠️ Token không hợp lệ hoặc hết hạn, đã clear storage');
        }
        return;
      }
      
      // Log errors in both dev and prod for debugging
      console.error('❌ Failed to fetch user info:', {
        message: errorRecord?.message,
        status: errorRecord?.status || (errorRecord?.response as Record<string, unknown>)?.status,
        url: (errorRecord?.config as Record<string, unknown>)?.url,
        baseURL: (errorRecord?.config as Record<string, unknown>)?.baseURL,
      });
      
      // Nếu không phải 401, thử lấy từ storage
      const storedUser = storage.getUser() as Record<string, unknown> | null;
      if (storedUser) {
        const storedMaVaiTro = storedUser.MaVaiTro as Record<string, unknown> | string | undefined;
        const fallbackUser: User = {
          id: String(storedUser._id || storedUser.id || ''),
          username: String(storedUser.TenDangNhap || storedUser.username || ''),
          email: String(storedUser.Email || storedUser.email || ''),
          fullName: String(storedUser.HoTen || storedUser.fullName || storedUser.hoten || ''),
          phone: storedUser.SoDienThoai ? String(storedUser.SoDienThoai) : undefined,
          birthday: storedUser.NgaySinh ? (storedUser.NgaySinh === null ? undefined : String(storedUser.NgaySinh)) : undefined,
          avatar: storedUser.AvatarUrl || storedUser.Avatar || storedUser.avatar ? String(storedUser.AvatarUrl || storedUser.Avatar || storedUser.avatar) : undefined,
          role: typeof storedMaVaiTro === 'object' && storedMaVaiTro?._id ? String(storedMaVaiTro._id) : storedMaVaiTro ? String(storedMaVaiTro) : storedUser.role ? String(storedUser.role) : undefined,
          roleName: typeof storedMaVaiTro === 'object' && storedMaVaiTro?.TenVaiTro ? String(storedMaVaiTro.TenVaiTro) : storedUser.roleName ? String(storedUser.roleName) : undefined,
        };
        setUser(fallbackUser);
        
        // Log fallback in development
        if (import.meta.env.DEV) {
          console.warn('⚠️ Using stored user data (API failed):', {
            username: fallbackUser.username,
            roleName: fallbackUser.roleName,
            isAdmin: isAdminRole(fallbackUser),
          });
        }
      } else {
        // No stored user either
        if (import.meta.env.DEV) {
          console.error('❌ No user data available (API failed and no storage)');
        }
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Initial fetch on mount - only once
  useEffect(() => {
    let mounted = true;
    const token = storage.getToken();
    
    if (token && !hasFetchedRef.current && !isFetchingRef.current) {
      hasFetchedRef.current = true;
      fetchUserInfo().finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    } else {
      setLoading(false);
    }

    // Listen for storage changes (for OAuth callback) - with debounce
    let storageTimeout: ReturnType<typeof setTimeout>;
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' && e.newValue && mounted) {
        // Debounce to prevent multiple calls
        clearTimeout(storageTimeout);
        storageTimeout = setTimeout(() => {
          if (mounted && !isFetchingRef.current) {
            hasFetchedRef.current = false; // Reset to allow refetch
            fetchUserInfo();
          }
        }, 300);
      }
    };

    // Listen for custom token update event (for OAuth callback) - with debounce
    let tokenTimeout: ReturnType<typeof setTimeout>;
    const handleTokenUpdate = () => {
      const token = storage.getToken();
      if (token && !isFetchingRef.current && mounted) {
        // Debounce to prevent multiple calls
        clearTimeout(tokenTimeout);
        tokenTimeout = setTimeout(() => {
          if (mounted && !isFetchingRef.current) {
            hasFetchedRef.current = false; // Reset to allow refetch
            fetchUserInfo();
          }
        }, 300);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('token:updated', handleTokenUpdate);

    return () => {
      mounted = false;
      clearTimeout(storageTimeout);
      clearTimeout(tokenTimeout);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('token:updated', handleTokenUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Update loading state when user is set
  useEffect(() => {
    if (user !== null || !storage.getToken()) {
      setLoading(false);
    }
  }, [user]);

  const login = useCallback(async (username: string, password: string, turnstileToken?: string) => {
    try {
      const loginPayload: LoginCredentials & { 'cf-turnstile-response'?: string } = { username, password };
      if (turnstileToken) {
        loginPayload['cf-turnstile-response'] = turnstileToken;
      }
      const response = await authService.login(loginPayload);
      
      if (response && response.accessToken) {
        // Fetch user info with role after login
        await fetchUserInfo();
        
        // ✅ Xóa cart và hearts cũ trong localStorage trước khi load từ database
        storage.removeCart();
        storage.removeHearts();
        
        // ✅ Load hearts từ database và sync vào localStorage
        try {
          const heartProductIds = await heartService.getUserHeartProductIds();
          if (heartProductIds && heartProductIds.length > 0) {
            storage.setHearts(heartProductIds);
            if (import.meta.env.DEV) {
              console.log('✅ Hearts loaded from database after login:', heartProductIds.length, 'products');
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
              // item có thể là CartItem từ backend (IdSanPham, TenSanPham, Gia, SoLuong, ThanhTien)
              const idSanPham = itemRecord.IdSanPham as Record<string, unknown> | string | undefined;
              const product = typeof idSanPham === 'object' ? idSanPham : null;
              const productRecord = product as Record<string, unknown> | null;
              
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
              
              // Xử lý volumeOptions từ product
              const volumeOptions = productRecord?.DungTichOptions && Array.isArray(productRecord.DungTichOptions)
                ? productRecord.DungTichOptions.map((opt: unknown) => {
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
              const finalPrice = Number(itemRecord.Gia) || (productRecord ? Number(productRecord.Gia) : 0) || 0;
              const basePrice = selectedDungTich && selectedDungTich.priceDiff
                ? finalPrice - selectedDungTich.priceDiff
                : finalPrice;
              
              // Tạo cart item ID với volume
              const maSanPham = itemRecord.MaSanPham as Record<string, unknown> | string | undefined;
              const productId = productRecord?._id || 
                (typeof idSanPham === 'object' && idSanPham?._id ? idSanPham._id : idSanPham) ||
                (typeof maSanPham === 'object' && maSanPham?._id ? maSanPham._id : maSanPham) ||
                itemRecord.id;
              const cartItemId = selectedDungTich
                ? `${productId}::volume-${selectedDungTich.value}`
                : `${productId}::default`;
              
              const maLoaiSanPham = productRecord?.MaLoaiSanPham as Record<string, unknown> | undefined;
              return {
                id: cartItemId,
                productId: String(productId),
                tenSP: String(itemRecord.TenSanPham || productRecord?.TenSanPham || itemRecord.tenSP || 'Sản phẩm'),
                gia: finalPrice,
                basePrice,
                giamGia: Number(productRecord?.KhuyenMai || itemRecord.giamGia || 0),
                hinhAnh: String(productRecord?.HinhAnhChinh || itemRecord.hinhAnh || ''),
                loaiSP: String((maLoaiSanPham?.TenLoaiSanPham as string) || itemRecord.loaiSP || ''),
                quantity: Number(itemRecord.SoLuong || itemRecord.quantity || 1),
                selectedDungTich,
                volumeOptions,
              };
            });
            
            // ✅ Set cart mới từ database vào localStorage
            storage.setCart(mappedCart);
            
            // ✅ Dispatch event để update UI
            window.dispatchEvent(new CustomEvent('cart:updated'));
            
            if (import.meta.env.DEV) {
              console.log('✅ Cart loaded from database after login:', mappedCart.length, 'items');
            }
          } else {
            // ✅ Nếu không có cart trong database, giữ cart rỗng (đã xóa ở trên)
            if (import.meta.env.DEV) {
              console.log('ℹ️ No cart in database, cart cleared');
            }
          }
        } catch (cartError: unknown) {
          // ✅ Log error nhưng không block login
          if (import.meta.env.DEV) {
            const errorMsg = (cartError as Record<string, unknown>)?.message || cartError;
            console.error('⚠️ Error loading cart from database:', errorMsg);
          }
          // Cart đã được xóa ở trên, không cần làm gì thêm
        }
      }
      
      toast.success('Đăng nhập thành công!');
    } catch (error: unknown) {
      // Xử lý error message - có thể là string hoặc object
      let errorMessage = 'Đăng nhập thất bại';
      const errorRecord = error as Record<string, unknown>;
      
      if (typeof errorRecord?.message === 'string') {
        errorMessage = errorRecord.message;
      } else if ((errorRecord?.response as Record<string, unknown>)?.data) {
        const msg = ((errorRecord.response as Record<string, unknown>).data as Record<string, unknown>)?.message;
        errorMessage = typeof msg === 'string' ? msg : ((msg as Record<string, unknown>)?.message as string || 'Đăng nhập thất bại');
      } else if (errorRecord?.data) {
        const msg = (errorRecord.data as Record<string, unknown>)?.message;
        errorMessage = typeof msg === 'string' ? msg : ((msg as Record<string, unknown>)?.message as string || 'Đăng nhập thất bại');
      }
      
      toast.error(errorMessage);
      throw error;
    }
  }, [fetchUserInfo]);

  const register = useCallback(async (userData: RegisterData) => {
    try {
      const response = await authService.register(userData);
      
      if (response && response.accessToken) {
        // ✅ Fetch user info with role after register
        await fetchUserInfo();
        
        // ✅ Xóa cart và hearts cũ trong localStorage trước khi load từ database
        storage.removeCart();
        storage.removeHearts();
        
        // ✅ Load hearts từ database và sync vào localStorage (tương tự login)
        try {
          const heartProductIds = await heartService.getUserHeartProductIds();
          if (heartProductIds && heartProductIds.length > 0) {
            storage.setHearts(heartProductIds);
            if (import.meta.env.DEV) {
              console.log('✅ Hearts loaded from database after register:', heartProductIds.length, 'products');
            }
          }
        } catch (heartError: unknown) {
          if (import.meta.env.DEV) {
            const errorMsg = (heartError as Record<string, unknown>)?.message || heartError;
            console.error('⚠️ Error loading hearts from database:', errorMsg);
          }
        }
        
        // ✅ Load cart từ database và sync vào localStorage (tương tự login)
        try {
          const cart = await cartService.getCart();
          
          if (cart && Array.isArray(cart.Items) && cart.Items.length > 0) {
            // ✅ Map từ database format sang localStorage format
            const mappedCart = cart.Items.map((item: unknown) => {
              const itemRecord = item as Record<string, unknown>;
              const idSanPham = itemRecord.IdSanPham as Record<string, unknown> | string | undefined;
              const product = typeof idSanPham === 'object' ? idSanPham : null;
              const productRecord = product as Record<string, unknown> | null;
              
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
              
              // Xử lý volumeOptions từ product
              const volumeOptions = productRecord?.DungTichOptions && Array.isArray(productRecord.DungTichOptions)
                ? productRecord.DungTichOptions.map((opt: unknown) => {
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
              const finalPrice = Number(itemRecord.Gia) || (productRecord ? Number(productRecord.Gia) : 0) || 0;
              const basePrice = selectedDungTich && selectedDungTich.priceDiff
                ? finalPrice - selectedDungTich.priceDiff
                : finalPrice;
              
              // Tạo cart item ID với volume
              const maSanPham = itemRecord.MaSanPham as Record<string, unknown> | string | undefined;
              const productId = productRecord?._id || 
                (typeof idSanPham === 'object' && idSanPham?._id ? idSanPham._id : idSanPham) ||
                (typeof maSanPham === 'object' && maSanPham?._id ? maSanPham._id : maSanPham) ||
                itemRecord.id;
              const cartItemId = selectedDungTich
                ? `${productId}::volume-${selectedDungTich.value}`
                : `${productId}::default`;
              
              const maLoaiSanPham = productRecord?.MaLoaiSanPham as Record<string, unknown> | undefined;
              return {
                id: cartItemId,
                productId: String(productId),
                tenSP: String(itemRecord.TenSanPham || productRecord?.TenSanPham || itemRecord.tenSP || 'Sản phẩm'),
                gia: finalPrice,
                basePrice,
                giamGia: Number(productRecord?.KhuyenMai || itemRecord.giamGia || 0),
                hinhAnh: String(productRecord?.HinhAnhChinh || itemRecord.hinhAnh || ''),
                loaiSP: String((maLoaiSanPham?.TenLoaiSanPham as string) || itemRecord.loaiSP || ''),
                quantity: Number(itemRecord.SoLuong || itemRecord.quantity || 1),
                selectedDungTich,
                volumeOptions,
              };
            });
            
            storage.setCart(mappedCart);
            window.dispatchEvent(new CustomEvent('cart:updated'));
            
            if (import.meta.env.DEV) {
              console.log('✅ Cart loaded from database after register:', mappedCart.length, 'items');
            }
          } else {
            if (import.meta.env.DEV) {
              console.log('ℹ️ No cart in database after register, cart cleared');
            }
          }
        } catch (cartError: unknown) {
          if (import.meta.env.DEV) {
            const errorMsg = (cartError as Record<string, unknown>)?.message || cartError;
            console.error('⚠️ Error loading cart from database after register:', errorMsg);
          }
          // Cart đã được xóa ở trên, không cần làm gì thêm
        }
      }
      
      toast.success('Đăng ký thành công!');
    } catch (error: unknown) {
      const errorMsg = (error as Record<string, unknown>)?.message as string | undefined;
      toast.error(errorMsg || 'Đăng ký thất bại');
      throw error;
    }
  }, [fetchUserInfo]);

  const isLoggingOut = useRef(false); // Guard để tránh logout nhiều lần

  const logout = useCallback(async () => {
    // Tránh logout nhiều lần
    if (isLoggingOut.current) {
      return;
    }
    isLoggingOut.current = true;

    try {
      // ✅ Lưu hearts từ localStorage vào database trước khi logout
      const localHearts = storage.getHearts();
      if (localHearts && localHearts.length > 0 && user?.id) {
        try {
          await heartService.syncHearts(localHearts);
          if (import.meta.env.DEV) {
            console.log('✅ Hearts saved to database before logout:', localHearts.length, 'products');
          }
        } catch (heartError: unknown) {
          if (import.meta.env.DEV) {
            const errorMsg = (heartError as Record<string, unknown>)?.message || heartError;
            console.error('⚠️ Error saving hearts to database before logout:', errorMsg);
          }
        }
      }
      
      // ✅ Lưu cart từ localStorage vào database trước khi logout
      const localCart = storage.getCart();
      if (localCart && localCart.length > 0 && user?.id) {
        try {
          // ✅ Format cart items để gửi lên backend (backend mong đợi productId hoặc id)
          const cartItems = localCart.map(item => {
            // Lấy productId - có thể từ productId trực tiếp hoặc từ id (format: "productId::volume-xxx")
            let productId = item.productId;
            if (!productId && item.id) {
              // Nếu id có format "productId::volume-xxx", lấy phần trước "::"
              productId = item.id.includes('::') ? item.id.split('::')[0] : item.id;
            }
            
            return {
              id: productId, // Backend sẽ tìm productId, IdSanPham, hoặc id
              productId: productId, // Thêm productId để đảm bảo
              quantity: item.quantity || 1,
              tenSP: item.tenSP, // Giữ lại để backend có thể dùng nếu cần
              selectedDungTich: item.selectedDungTich ? {
                value: item.selectedDungTich.value,
                label: item.selectedDungTich.label,
                priceDiff: item.selectedDungTich.priceDiff || 0,
                sku: item.selectedDungTich.sku,
              } : undefined,
            };
          });
          
          await cartService.updateCart({ items: cartItems });
          
          if (import.meta.env.DEV) {
            console.log('✅ Cart saved to database before logout:', cartItems.length, 'items');
          }
        } catch (cartError: unknown) {
          // ✅ Log error nhưng không block logout
          if (import.meta.env.DEV) {
            const errorMsg = (cartError as Record<string, unknown>)?.message || cartError;
            console.error('⚠️ Error saving cart to database before logout:', errorMsg);
          }
          // Không block logout nếu lưu cart thất bại
        }
      }
      
      // ✅ Gọi logout API (trước khi clear storage)
      await authService.logout();
      
      // ✅ Clear user state
      setUser(null);
      
      // ✅ Dispatch event để update UI
      window.dispatchEvent(new CustomEvent('cart:updated'));
      window.dispatchEvent(new CustomEvent('hearts:updated'));
      
      toast.success('Đăng xuất thành công!');
    } catch (error: unknown) {
      const errorRecord = error as Record<string, unknown>;
      if (import.meta.env.DEV) {
        console.error('Logout error:', errorRecord?.message || error);
      }
      // ✅ Vẫn clear user, cart và hearts nếu logout thất bại
      setUser(null);
      storage.clearAll();
      window.dispatchEvent(new CustomEvent('cart:updated'));
      window.dispatchEvent(new CustomEvent('hearts:updated'));
      
      // ✅ Chỉ show error nếu không phải lỗi network thông thường
      const errorMsg = errorRecord?.message as string | undefined;
      if (errorMsg && !errorMsg.includes('Network Error') && !errorMsg.includes('Không có token')) {
        toast.error('Đăng xuất thất bại: ' + errorMsg);
      }
    } finally {
      isLoggingOut.current = false;
    }
  }, [user]);

  // Memoize isAdmin to prevent unnecessary recalculations
  const isAdmin = useMemo(() => {
    return checkAdminRole();
  }, [user, checkAdminRole]);

  // Memoize isAuthenticated
  const isAuthenticated = useMemo(() => {
    return !!authService.isAuthenticated();
  }, []); // authService.isAuthenticated() doesn't depend on user

  // Memoize the context value to prevent unnecessary re-renders
  const value: AuthContextType = useMemo(() => ({
    user,
    loading,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    checkAdminRole,
  }), [user, loading, isAuthenticated, isAdmin, login, register, logout, checkAdminRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;

