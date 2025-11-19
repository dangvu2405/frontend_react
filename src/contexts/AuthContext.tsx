import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import authService from '@/services/authService';
import { userService } from '@/services/userService';
import { cartService } from '@/services/cartService';
import { storage } from '@/utils/storage';
import { toast } from 'sonner';

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
  login: (username: string, password: string) => Promise<void>;
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
      const response: any = await userService.getCurrentUser();
      if (response) {
        const userData = {
          id: response._id || response.id,
          username: response.TenDangNhap || response.username,
          email: response.Email || response.email,
          fullName: response.HoTen || response.fullName || response.hoten || '',
          phone: response.SoDienThoai ,
          birthday: response.NgaySinh ,
          avatar: response.AvatarUrl || response.Avatar || response.avatar,
          role: response.MaVaiTro?._id || response.role,
          roleName: response.MaVaiTro?.TenVaiTro || response.roleName,
        };
        setUser(userData);
        // Save to storage for fallback
        storage.setUser(userData);
        
        // Log in production for debugging
        if (import.meta.env.PROD) {
          console.log('✅ User info loaded:', {
            username: userData.username,
            roleName: userData.roleName,
            isAdmin: isAdminRole(userData),
          });
        }
      }
    } catch (error: any) {
      // Nếu là lỗi 401 (token không hợp lệ/hết hạn), clear storage và user
      if (error?.status === 401 || error?.response?.status === 401) {
        // Token không hợp lệ, clear tất cả
        storage.clearAll();
        setUser(null);
        if (import.meta.env.DEV || import.meta.env.PROD) {
          console.warn('⚠️ Token không hợp lệ hoặc hết hạn, đã clear storage');
        }
        return;
      }
      
      // Log errors in both dev and prod for debugging
      console.error('❌ Failed to fetch user info:', {
        message: error?.message,
        status: error?.status || error?.response?.status,
        url: error?.config?.url,
        baseURL: error?.config?.baseURL,
      });
      
      // Nếu không phải 401, thử lấy từ storage
      const storedUser: any = storage.getUser();
      if (storedUser) {
        const fallbackUser = {
          id: storedUser._id || storedUser.id,
          username: storedUser.TenDangNhap || storedUser.username,
          email: storedUser.Email || storedUser.email,
          fullName: storedUser.HoTen || storedUser.fullName || storedUser.hoten || '',
          phone: storedUser.SoDienThoai  ,
          birthday: storedUser.NgaySinh  ,
          avatar: storedUser.AvatarUrl || storedUser.Avatar || storedUser.avatar,
          role: storedUser.MaVaiTro?._id || storedUser.role,
          roleName: storedUser.MaVaiTro?.TenVaiTro || storedUser.roleName,
        };
        setUser(fallbackUser);
        
        // Log fallback in production
        if (import.meta.env.PROD) {
          console.warn('⚠️ Using stored user data (API failed):', {
            username: fallbackUser.username,
            roleName: fallbackUser.roleName,
            isAdmin: isAdminRole(fallbackUser),
          });
        }
      } else {
        // No stored user either
        if (import.meta.env.PROD) {
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
    let storageTimeout: NodeJS.Timeout;
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
    let tokenTimeout: NodeJS.Timeout;
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

  const login = async (username: string, password: string) => {
    try {
      const response = await authService.login({ username, password });
      
      if (response && response.accessToken) {
        // Fetch user info with role after login
        await fetchUserInfo();
        
        // Load cart từ database và sync vào localStorage
        try {
          const cartRes = await cartService.getCart();
          const cartData = (cartRes as any)?.cart || (cartRes as any)?.data?.cart;
          
          if (cartData && cartData.Items && Array.isArray(cartData.Items) && cartData.Items.length > 0) {
            // Map từ database format sang localStorage format
            const mappedCart = cartData.Items.map((item: any) => {
              const product = item.IdSanPham || item.MaSanPham || {};
              return {
                id: product._id || product.id || item.IdSanPham?._id || item.MaSanPham?._id,
                tenSP: product.TenSanPham || item.TenSanPham || 'Sản phẩm',
                gia: product.Gia || item.Gia || 0,
                giamGia: product.KhuyenMai || 0,
                hinhAnh: product.HinhAnhChinh || '',
                loaiSP: product.MaLoaiSanPham?.TenLoaiSanPham || '',
                quantity: item.SoLuong || item.quantity || 1,
              };
            });
            
            // Xóa cart cũ trong localStorage và set cart mới từ database
            storage.removeCart();
            storage.setCart(mappedCart);
            
            // Dispatch event để update UI
            window.dispatchEvent(new CustomEvent('cart:updated'));
          } else {
            // Nếu không có cart trong database, xóa localStorage cart
            storage.removeCart();
          }
        } catch (cartError) {
          console.error('Error loading cart from database:', cartError);
          // Nếu lỗi, vẫn xóa localStorage cart để tránh conflict
          storage.removeCart();
        }
      }
      
      toast.success('Đăng nhập thành công!');
    } catch (error: any) {
      toast.error(error.message || 'Đăng nhập thất bại');
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await authService.register(userData);
      
      if (response && response.accessToken) {
        // Fetch user info with role after register
        await fetchUserInfo();
      }
      
      toast.success('Đăng ký thành công!');
    } catch (error: any) {
      toast.error(error.message || 'Đăng ký thất bại');
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Lưu cart từ localStorage vào database trước khi logout
      const localCart = storage.getCart();
      if (localCart && localCart.length > 0 && user?.id) {
        try {
          await cartService.updateCart({ items: localCart });
          console.log('Cart saved to database before logout');
        } catch (cartError) {
          console.error('Error saving cart to database:', cartError);
          // Không block logout nếu lưu cart thất bại
        }
      }
      
      await authService.logout();
      setUser(null);
      
      // Xóa cart trong localStorage sau khi logout
      storage.removeCart();
      
      // Dispatch event để update UI
      window.dispatchEvent(new CustomEvent('cart:updated'));
      
      toast.success('Đăng xuất thành công!');
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      // Vẫn xóa cart trong localStorage nếu logout thất bại
      storage.removeCart();
    }
  };

  // Memoize isAdmin to prevent unnecessary recalculations
  const isAdmin = useMemo(() => {
    return checkAdminRole();
  }, [user, checkAdminRole]);

  // Memoize isAuthenticated
  const isAuthenticated = useMemo(() => {
    return !!authService.isAuthenticated();
  }, [user]); // Recalculate when user changes

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;

