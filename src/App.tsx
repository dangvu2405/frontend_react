import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'sonner';
import { getQueryClient } from './lib/store/queryClient';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/Home'));
const ProjectsPage = lazy(() => import('./pages/Projects'));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetail'));
const CartPage = lazy(() => import('./pages/Cart'));
const CheckoutPage = lazy(() => import('./pages/Checkout'));
const OrdersPage = lazy(() => import('./pages/Orders'));
const MyAccountPage = lazy(() => import('./pages/MyAccount'));
const DocumentsPage = lazy(() => import('./pages/Documents'));
const SubjectSupportPage = lazy(() => import('./pages/SubjectSupport'));
const BlogPage = lazy(() => import('./pages/Blog'));
const MMOShopPage = lazy(() => import('./pages/MMOShop'));
const SupportPage = lazy(() => import('./pages/Support'));
const LoginForm = lazy(() => import('./pages/login-form').then(m => ({ default: m.LoginForm })));
const SignupForm = lazy(() => import('./pages/signup-form').then(m => ({ default: m.SignupForm })));
const ForgotPasswordPage = lazy(() => import('./pages/forgot-password'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback').then(m => ({ default: m.OAuthCallback })));
const PrivacyPage = lazy(() => import('./pages/Privacy'));
const TermsPage = lazy(() => import('./pages/Terms'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccess'));
const PaymentFailPage = lazy(() => import('./pages/PaymentFail'));

// Admin pages - lazy load (heavier)
const AdminLayout = lazy(() => import('./pages/admin/Layout'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminOrdersPage = lazy(() => import('./pages/admin/OrdersCRUD'));
const AdminProjectsPage = lazy(() => import('./pages/admin/ProjectsCRUD'));
const AdminCustomersPage = lazy(() => import('./pages/admin/CustomersCRUD'));
const AdminAccountsPage = lazy(() => import('./pages/admin/AccountsCRUD'));
const AdminReviewsPage = lazy(() => import('./pages/admin/ReviewsCRUD'));
const AdminVouchersPage = lazy(() => import('./pages/admin/VouchersCRUD'));
const AdminWalletsPage = lazy(() => import('./pages/admin/WalletsCRUD'));
const AdminChatPage = lazy(() => import('./pages/admin/Chat'));
const AdminSettingsPage = lazy(() => import('./pages/admin/Settings'));

import AdminRoute from './components/AdminRoute';
import CustomerChat from './components/CustomerChat';
import { WalletProvider } from './contexts/WalletContext';

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      <p className="text-muted-foreground mt-4">Đang tải...</p>
    </div>
  </div>
);
function App() {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <WalletProvider>
            <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
              {/* Main Pages */}
              <Route path="/" element={<HomePage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/my-account" element={<MyAccountPage />} />
              
              {/* Info Pages */}
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/subject-support" element={<SubjectSupportPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/mmo-shop" element={<MMOShopPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              
              {/* Auth Pages */}
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<SignupForm />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/auth/callback" element={<OAuthCallback />} />
              
              {/* Payment Pages */}
              <Route path="/payment-success" element={<PaymentSuccessPage />} />
              <Route path="/payment-fail" element={<PaymentFailPage />} />
              
              {/* Admin Routes - Protected by AdminRoute */}
              <Route path="/admin/*" element={<AdminRoute />}>
                <Route element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="orders" element={<AdminOrdersPage />} />
                  <Route path="projects" element={<AdminProjectsPage />} />
                  <Route path="customers" element={<AdminCustomersPage />} />
                  <Route path="accounts" element={<AdminAccountsPage />} />
                  <Route path="reviews" element={<AdminReviewsPage />} />
                  <Route path="vouchers" element={<AdminVouchersPage />} />
                  <Route path="chat" element={<AdminChatPage />} />
                  <Route path="settings" element={<AdminSettingsPage />} />
                </Route>
              </Route>
              
              {/* 404 - Catch all unmatched routes */}
              <Route path="*" element={
                <div className="min-h-screen flex items-center justify-center bg-background p-4">
                  <div className="text-center">
                    <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
                    <h2 className="text-2xl font-semibold text-foreground mb-4">
                      Trang không tìm thấy
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
                    </p>
                    <button
                      onClick={() => window.location.href = '/'}
                      className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
                    >
                      Về trang chủ
                    </button>
                  </div>
                </div>
              } />
              </Routes>
            </Suspense>
            </BrowserRouter>
            <Toaster position="top-right" richColors />
            {/* Customer Chat Widget - Hiển thị trên tất cả các trang cho user đã đăng nhập */}
            <CustomerChat />
          </WalletProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
