import { Link } from 'react-router-dom';
// import { Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-muted text-foreground mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src="/logo.jpg" 
                alt="Project Shop Logo" 
                className="w-12 h-12 object-contain rounded-xl"
              />
              <span className="text-lg font-bold">Project Shop</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Đồ án chính hãng, chất lượng cao cấp từ các môn học hàng đầu thế giới.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold mb-4">Liên kết nhanh</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/projects" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Đồ án
                </Link>
              </li>
              <li>
                <Link to="/documents" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Tài liệu
                </Link>
              </li>
              <li>
                <Link to="/subject-support" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Hỗ trợ môn học
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Bài viết
                </Link>
              </li>
              <li>
                <Link to="/mmo-shop" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Tạp hóa MMO
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-bold mb-4">Chăm sóc khách hàng</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/my-account" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Tài khoản của tôi
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Giỏ hàng
                </Link>
              </li>
              <li>
                <Link to="/checkout" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Thanh toán
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Trợ giúp
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-bold mb-4">Tài nguyên</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/documents" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Tài liệu học tập
                </Link>
              </li>
              <li>
                <Link to="/subject-support" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Hướng dẫn môn học
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Bài viết & Tin tức
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Hỗ trợ kỹ thuật
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Project Shop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
