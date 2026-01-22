import { MainLayout } from '@/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Gamepad2, 
  Coins, 
  Sword, 
  Shield,
  Crown,
  Zap,
  ShoppingCart,
  Loader2
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { storage, type CartItemInput } from '@/utils/storage';

interface MMOProduct {
  id: string;
  name: string;
  category: 'gold' | 'items' | 'accounts' | 'services';
  game: string;
  price: number;
  stock: number;
  description: string;
  image?: string;
}

export default function MMOShopPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'gold' | 'items' | 'accounts' | 'services'>('all');
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<MMOProduct[]>([]);

  // TODO: Fetch products from API
  // useEffect(() => {
  //   const fetchProducts = async () => {
  //     setLoading(true);
  //     try {
  //       const response = await mmoShopService.getProducts({
  //         category: selectedCategory !== 'all' ? selectedCategory : undefined,
  //         game: selectedGame !== 'all' ? selectedGame : undefined,
  //         search: searchQuery || undefined,
  //       });
  //       setProducts(response.products);
  //     } catch (error) {
  //       console.error('Error fetching MMO products:', error);
  //       toast.error('Không thể tải sản phẩm');
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchProducts();
  // }, [selectedCategory, selectedGame, searchQuery]);

  const categories = [
    { id: 'gold', name: 'Gold/Currency', icon: Coins, color: 'bg-yellow-500/10 text-yellow-600' },
    { id: 'items', name: 'Items/Equipment', icon: Sword, color: 'bg-blue-500/10 text-blue-600' },
    { id: 'accounts', name: 'Accounts', icon: Crown, color: 'bg-purple-500/10 text-purple-600' },
    { id: 'services', name: 'Services', icon: Zap, color: 'bg-green-500/10 text-green-600' },
  ];

  const games = [
    'All Games',
    'World of Warcraft',
    'Final Fantasy XIV',
    'Lost Ark',
    'Black Desert Online',
    'Guild Wars 2',
    'Elder Scrolls Online',
    'New World',
    'Other',
  ];

  const handleAddToCart = (product: MMOProduct) => {
    const item: CartItemInput = {
      projectId: product.id,
      tenSP: product.name,
      basePrice: product.price,
      giamGia: 0,
      hinhAnh: product.image || '',
      loaiSP: 'MMO Shop',
      selectedDungTich: undefined,
      includesOptions: undefined,
    };
    storage.addCartItem(item, 1);
    window.dispatchEvent(new CustomEvent('cart:updated'));
    toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <MainLayout>
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gamepad2 className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold">Tạp hóa MMO</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Mua bán Gold, Items, Accounts và Dịch vụ game MMO uy tín
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as typeof selectedCategory)}>
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4">
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              <TabsTrigger value="gold">Gold</TabsTrigger>
              <TabsTrigger value="items">Items</TabsTrigger>
              <TabsTrigger value="accounts">Accounts</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Products List */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
            <p className="text-muted-foreground">Đang tải sản phẩm...</p>
          </div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-lg mb-2">Chưa có sản phẩm nào</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? 'Không tìm thấy sản phẩm phù hợp với từ khóa của bạn'
                  : 'Sản phẩm sẽ được cập nhật sớm'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const category = categories.find((c) => c.id === product.category);
              const CategoryIcon = category?.icon || Gamepad2;
              return (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className={`w-10 h-10 rounded-lg ${category?.color || 'bg-gray-500/10 text-gray-600'} flex items-center justify-center flex-shrink-0`}>
                        <CategoryIcon className="w-5 h-5" />
                      </div>
                      <Badge variant="outline">{product.game}</Badge>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xl font-bold text-primary">
                          {formatCurrency(product.price)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Còn {product.stock} sản phẩm
                        </p>
                      </div>
                    </div>
                    <Button
                      className="w-full gap-2"
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Info Section */}
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardContent className="p-8">
            <div className="flex items-center gap-4 mb-4">
              <Shield className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-semibold">Mua bán an toàn</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Chúng tôi cam kết cung cấp dịch vụ mua bán MMO uy tín, an toàn và nhanh chóng.
              Tất cả giao dịch đều được bảo vệ và hỗ trợ 24/7.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-background rounded-lg">
                <h3 className="font-semibold mb-2">Giao hàng nhanh</h3>
                <p className="text-sm text-muted-foreground">Giao hàng trong 5-30 phút</p>
              </div>
              <div className="p-4 bg-background rounded-lg">
                <h3 className="font-semibold mb-2">An toàn tuyệt đối</h3>
                <p className="text-sm text-muted-foreground">Bảo vệ thông tin tài khoản</p>
              </div>
              <div className="p-4 bg-background rounded-lg">
                <h3 className="font-semibold mb-2">Hỗ trợ 24/7</h3>
                <p className="text-sm text-muted-foreground">Đội ngũ hỗ trợ chuyên nghiệp</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
