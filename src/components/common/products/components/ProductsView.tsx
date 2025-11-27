import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { MainLayout } from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductsGrid } from '@/components/products';
import type { Product } from '@/types/models';
import { productsService } from '@/services/productsService';

export const ProductsView = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    let active = true;
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Debug: Log API call
        if (import.meta.env.DEV) {
          console.log('📦 [Products Page] Fetching products...', { limit: 60 });
        }
        
        const { products: fetchedProducts } = await productsService.getAllProducts({ limit: 60 });
        
        // Debug: Log API response
        if (import.meta.env.DEV && active) {
          console.log('📦 [Products Page] Products received:', {
            count: fetchedProducts.length,
            data: fetchedProducts,
          });
        }
        
        if (active) {
          setProducts(fetchedProducts);
        }
      } catch (error: any) {
        if (active) {
          if (import.meta.env.DEV) {
            console.error('📦 [Products Page] Error fetching products:', {
              error,
              message: error?.message,
              response: error?.response?.data,
            });
          }
          toast.error(error?.message || 'Không thể tải sản phẩm');
          setProducts([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchProducts();
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => {
    const names = new Set<string>();
    products.forEach((product) => {
      if (typeof product.MaLoaiSanPham === 'object' && product.MaLoaiSanPham?.TenLoaiSanPham) {
        names.add(product.MaLoaiSanPham.TenLoaiSanPham);
      }
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        categoryFilter === 'all' ||
        (typeof product.MaLoaiSanPham === 'object' &&
          product.MaLoaiSanPham?.TenLoaiSanPham?.toLowerCase() === categoryFilter.toLowerCase());
      if (!matchesCategory) return false;
      if (!search.trim()) return true;
      const query = search.toLowerCase();
      return (
        product.TenSanPham?.toLowerCase().includes(query) ||
        product.MoTa?.toLowerCase().includes(query)
      );
    });
  }, [categoryFilter, products, search]);

  return (
    <MainLayout>
      <section className="bg-muted/40 py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm uppercase tracking-wide text-primary">Bộ sưu tập</p>
          <h1 className="mt-2 text-3xl font-bold text-foreground md:text-4xl">
            Khám phá các sản phẩm mới nhất
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Lựa chọn các sản phẩm chất lượng cao với ưu đãi hấp dẫn. Cập nhật mỗi tuần để đảm bảo bạn luôn có trải nghiệm mua sắm tốt nhất.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-background p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <Input
              placeholder="Tìm kiếm sản phẩm, danh mục..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full md:max-w-sm"
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-60">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {categories.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={() => {
            setSearch('');
            setCategoryFilter('all');
          }}>
            Xóa bộ lọc
          </Button>
        </div>

        <div className="mt-8">
          <ProductsGrid
            products={filteredProducts}
            loading={loading}
            emptyMessage="Không tìm thấy sản phẩm nào phù hợp."
            showAddToCartButton
          />
        </div>
      </section>
    </MainLayout>
  );
};

export default ProductsView;

