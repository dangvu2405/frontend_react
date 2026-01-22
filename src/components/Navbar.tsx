import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ShoppingCart, LogOut, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { storage } from '@/utils/storage';
import { getAvatarUrl } from '@/utils/imageUtils';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState<number>(0);

  useEffect(() => {
    const update = () => setCartCount(storage.getCart().length);
    update();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cart' || e.key === null) update();
    };
    const onCustom = () => update();
    window.addEventListener('storage', onStorage);
    window.addEventListener('cart:updated', onCustom as EventListener);
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('cart:updated', onCustom as EventListener);
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/logo.jpg" 
              alt="Project Shop Logo" 
              className="w-12 h-12 object-contain rounded-xl"
            />
            <span className="text-xl font-bold text-foreground">Project Shop</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">
              Trang chủ
            </Link>
            <Link to="/projects" className="text-foreground hover:text-primary transition-colors">
              Đồ án
            </Link>
            <Link to="/documents" className="text-foreground hover:text-primary transition-colors">
              Tài liệu
            </Link>
            <Link to="/subject-support" className="text-foreground hover:text-primary transition-colors">
              Hỗ trợ môn học
            </Link>
            <Link to="/blog" className="text-foreground hover:text-primary transition-colors">
              Bài viết
            </Link>
            <Link to="/mmo-shop" className="text-foreground hover:text-primary transition-colors">
              Tạp hóa MMO
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            <Link to="/cart" className="relative p-2 text-foreground hover:text-primary transition-colors">
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute top-0 right-0 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link to="/my-account" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                  <Avatar className="h-9 w-9 border-2 border-border">
                    <AvatarImage 
                      src={getAvatarUrl(user?.avatar, { width: 200, height: 200, quality: 80 })} 
                      alt={user?.fullName || user?.username || 'User'}
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.currentTarget.src = '';
                      }}
                    />
                    <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                      {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium text-foreground">
                    {user?.fullName || user?.username}
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  onClick={logout}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Đăng xuất"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" className="text-primary">
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Đăng ký
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-border">
            <Link
              to="/"
              className="block px-4 py-2 text-foreground hover:bg-muted rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Trang chủ
            </Link>
            <Link
              to="/projects"
              className="block px-4 py-2 text-foreground hover:bg-muted rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Đồ án
            </Link>
            <Link
              to="/documents"
              className="block px-4 py-2 text-foreground hover:bg-muted rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tài liệu
            </Link>
            <Link
              to="/subject-support"
              className="block px-4 py-2 text-foreground hover:bg-muted rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Hỗ trợ môn học
            </Link>
            <Link
              to="/blog"
              className="block px-4 py-2 text-foreground hover:bg-muted rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Bài viết
            </Link>
            <Link
              to="/mmo-shop"
              className="block px-4 py-2 text-foreground hover:bg-muted rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tạp hóa MMO
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/my-account"
                  className="flex items-center space-x-3 px-4 py-2 hover:bg-muted rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Avatar className="h-10 w-10 border-2 border-border">
                    <AvatarImage 
                      src={getAvatarUrl(user?.avatar, { width: 200, height: 200, quality: 80 })}
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.currentTarget.src = '';
                      }} 
                      alt={user?.fullName || user?.username || 'User'} 
                    />
                    <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                      {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {user?.fullName || user?.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Đăng ký
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

