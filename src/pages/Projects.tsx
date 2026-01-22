import { MainLayout } from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Suspense, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { projectsService } from '@/services/projectsService';
import type { Project, Category, ProjectIncludesOption } from '@/types/models/product';
import adminService from '@/services/adminService';
import { toast } from 'sonner';
import { storage, type CartItemInput } from '@/utils/storage';
import { getCloudinaryProjectImageUrl } from '@/utils/imageUtils';
import { ProjectsGrid } from '@/components/projects';

const NO_IMAGE_PLACEHOLDER = 'https://placehold.co/600x600/E5E5EA/000?text=No+Image';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const projectsPerPage = 12;
  const LOAD_ALL_LIMIT = 200;
  const deferredQuery = useDeferredValue(query);
  
  // Filter states
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [priceRange, setPriceRange] = useState<string>('all');
  const [discountFilter, setDiscountFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('default');

  const handleAddToCart = useCallback((project: Project, selectedIncludes?: ProjectIncludesOption) => {
    // Lấy category name
    const categoryName = typeof project.MaLoaiSanPham === 'object' && project.MaLoaiSanPham
      ? project.MaLoaiSanPham.TenLoaiSanPham
      : 'Đồ án';

    const item: CartItemInput = {
      projectId: String(project._id || (project as unknown as Record<string, unknown>).id || ''),
      tenSP: project.TenSanPham || '',
      basePrice: project.Gia || 0,
      giamGia: project.KhuyenMai || 0,
      hinhAnh: project.HinhAnhChinh || '',
      loaiSP: categoryName,
      selectedDungTich: selectedIncludes,
      includesOptions: project.DungTichOptions,
    };
    storage.addCartItem(item, 1);
    window.dispatchEvent(new CustomEvent('cart:updated'));
    toast.success('Đã thêm vào giỏ hàng');
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await adminService.getCategories();
        const responseData = response.data;
        // ✅ Backend trả về: { success, message, data: Category[] }
        const categoriesData = Array.isArray(responseData?.data) 
          ? responseData.data 
          : (Array.isArray(responseData) ? responseData : []);
        setCategories(categoriesData);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error fetching categories:', error);
        }
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchProjects = async () => {
      try {
        setLoading(true);
        const result = await projectsService.getAllProjects({
          page: 1,
          limit: LOAD_ALL_LIMIT
        });
        
        if (!isMounted) return;

        const apiProjects = result.projects || [];
        // ✅ Đơn giản hóa: chỉ transform ảnh, giữ nguyên các field khác từ API
        const normalized: Project[] = apiProjects.map((raw: Project) => ({
          ...raw,
          // Chỉ transform ảnh qua Cloudinary
          HinhAnhChinh: getCloudinaryProjectImageUrl(raw.HinhAnhChinh) || NO_IMAGE_PLACEHOLDER,
          HinhAnhPhu: Array.isArray(raw.HinhAnhPhu) && raw.HinhAnhPhu.length > 0
            ? raw.HinhAnhPhu.map((img: string) => getCloudinaryProjectImageUrl(img) || NO_IMAGE_PLACEHOLDER)
            : [],
        }));

        setProjects(normalized);
        setTotalProjects(normalized.length);
      } catch (error: unknown) {
        if (!isMounted) return;
        
        const errorRecord = error as Record<string, unknown>;
        const status = errorRecord?.status || (errorRecord?.response as Record<string, unknown>)?.status;
        
        // Don't show error toast for 404 (API not implemented yet)
        if (status !== 404) {
          if (import.meta.env.DEV) {
            console.error('Error fetching projects:', error);
          }
          const errorMsg = errorRecord?.message as string | undefined;
          toast.error(errorMsg || 'Không thể tải đồ án');
        } else if (import.meta.env.DEV) {
          console.warn('Projects API not implemented yet (404). Showing empty state.');
        }
        
        // Set empty array on error
        setProjects([]);
        setTotalProjects(0);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProjects();
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const getCategoryName = (project: Project) => {
    if (typeof project.MaLoaiSanPham === 'object' && project.MaLoaiSanPham) {
      return project.MaLoaiSanPham.TenLoaiSanPham;
    }
    return '';
  };

  const filtered = useMemo(
    () => {
      let result = projects;

      // Search filter
      if (deferredQuery) {
        result = result.filter((p) =>
          (p.TenSanPham || '').toLowerCase().includes(deferredQuery.toLowerCase()) ||
            (p.MoTa || '').toLowerCase().includes(deferredQuery.toLowerCase())
        );
      }

      // Category filter
      if (selectedCategories.size > 0) {
        result = result.filter((p) => {
          const categoryNames = Array.from(selectedCategories);
          const projectCategoryName = getCategoryName(p);
          return categoryNames.some(catName => projectCategoryName === catName);
        });
      }

      // Price range filter
      if (priceRange !== 'all') {
        result = result.filter((p) => {
          const price = p.Gia;
          switch (priceRange) {
            case 'under-1m':
              return price < 1000000;
            case '1m-2m':
              return price >= 1000000 && price < 2000000;
            case '2m-3m':
              return price >= 2000000 && price < 3000000;
            case '3m-5m':
              return price >= 3000000 && price < 5000000;
            case 'over-5m':
              return price >= 5000000;
            default:
              return true;
          }
        });
      }

      // Discount filter
      if (discountFilter !== 'all') {
        result = result.filter((p) => {
          switch (discountFilter) {
            case 'has-discount':
              return (p.KhuyenMai || 0) > 0;
            case 'no-discount':
              return (p.KhuyenMai || 0) === 0;
            default:
              return true;
          }
        });
      }

      // Stock filter
      if (stockFilter !== 'all') {
        result = result.filter((p) => {
          switch (stockFilter) {
            case 'in-stock':
              return p.SoLuong > 0;
            case 'out-of-stock':
              return p.SoLuong === 0;
            case 'low-stock':
              return p.SoLuong > 0 && p.SoLuong < 10;
            default:
              return true;
          }
        });
      }

      // Sort
      if (sortBy !== 'default') {
        result = [...result].sort((a, b) => {
          switch (sortBy) {
            case 'price-asc':
              return a.Gia - b.Gia;
            case 'price-desc':
              return b.Gia - a.Gia;
            case 'name-asc':
              return a.TenSanPham.localeCompare(b.TenSanPham);
            case 'name-desc':
              return b.TenSanPham.localeCompare(a.TenSanPham);
            case 'discount-desc':
              return (b.KhuyenMai || 0) - (a.KhuyenMai || 0);
            default:
              return 0;
          }
        });
      }

      return result;
    },
    [projects, deferredQuery, selectedCategories, priceRange, discountFilter, stockFilter, sortBy]
  );

  const totalFiltered = filtered.length;
  const computedTotalPages = Math.max(1, Math.ceil(totalFiltered / projectsPerPage));

  useEffect(() => {
    if (currentPage > computedTotalPages) {
      setCurrentPage(computedTotalPages);
    }
  }, [computedTotalPages, currentPage]);

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * projectsPerPage;
    return filtered.slice(start, start + projectsPerPage);
  }, [filtered, currentPage, projectsPerPage]);

  const handleCategoryToggle = (categoryName: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryName)) {
      newSelected.delete(categoryName);
    } else {
      newSelected.add(categoryName);
    }
    setSelectedCategories(newSelected);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const clearFilters = () => {
    setSelectedCategories(new Set());
    setPriceRange('all');
    setDiscountFilter('all');
    setStockFilter('all');
    setSortBy('default');
    setQuery('');
    setCurrentPage(1);
  };

  const hasActiveFilters = selectedCategories.size > 0 || priceRange !== 'all' || discountFilter !== 'all' || stockFilter !== 'all' || sortBy !== 'default';

  return (
    <MainLayout>
      <section className="bg-gradient-to-br from-primary/5 to-secondary/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Đồ án</h1>
          <p className="text-lg text-muted-foreground">Khám phá bộ sưu tập đồ án cao cấp chính hãng</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters || deferredQuery ? 'Kết quả tìm kiếm' : 'Tổng số đồ án'}
              </p>
              <p className="text-3xl font-bold text-primary">
                {hasActiveFilters || deferredQuery ? filtered.length : totalProjects}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm kiếm đồ án..."
                className="pl-12 bg-muted border-input"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Mặc định</SelectItem>
                  <SelectItem value="price-asc">Giá: Thấp → Cao</SelectItem>
                  <SelectItem value="price-desc">Giá: Cao → Thấp</SelectItem>
                  <SelectItem value="name-asc">Tên: A → Z</SelectItem>
                  <SelectItem value="name-desc">Tên: Z → A</SelectItem>
                  <SelectItem value="discount-desc">Giảm giá nhiều nhất</SelectItem>
                </SelectContent>
              </Select>
              <Sheet>
                <SheetTrigger asChild>
            <Button variant="outline" className="border-border">
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              Bộ lọc
                    {hasActiveFilters && (
                      <span className="ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {[selectedCategories.size, priceRange !== 'all' ? 1 : 0, discountFilter !== 'all' ? 1 : 0, stockFilter !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Bộ lọc đồ án</SheetTitle>
                    <SheetDescription>
                      Lọc đồ án theo danh mục, giá, khuyến mãi và tồn kho
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="mt-6 space-y-6">
                    {/* Categories */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Danh mục</Label>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {categories.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Đang tải danh mục...</p>
                        ) : (
                          categories.map((category) => (
                            <div key={category._id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`category-${category._id}`}
                                checked={selectedCategories.has(category.TenLoaiSanPham)}
                                onCheckedChange={() => handleCategoryToggle(category.TenLoaiSanPham)}
                              />
                              <Label
                                htmlFor={`category-${category._id}`}
                                className="text-sm font-normal cursor-pointer flex-1"
                              >
                                {category.TenLoaiSanPham}
                              </Label>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Price Range */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Khoảng giá</Label>
                      <Select value={priceRange} onValueChange={setPriceRange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn khoảng giá" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả</SelectItem>
                          <SelectItem value="under-1m">Dưới 1 triệu</SelectItem>
                          <SelectItem value="1m-2m">1 - 2 triệu</SelectItem>
                          <SelectItem value="2m-3m">2 - 3 triệu</SelectItem>
                          <SelectItem value="3m-5m">3 - 5 triệu</SelectItem>
                          <SelectItem value="over-5m">Trên 5 triệu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Discount */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Khuyến mãi</Label>
                      <Select value={discountFilter} onValueChange={setDiscountFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn khuyến mãi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả</SelectItem>
                          <SelectItem value="has-discount">Có khuyến mãi</SelectItem>
                          <SelectItem value="no-discount">Không khuyến mãi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Stock */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Tồn kho</Label>
                      <Select value={stockFilter} onValueChange={setStockFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn tồn kho" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả</SelectItem>
                          <SelectItem value="in-stock">Còn hàng</SelectItem>
                          <SelectItem value="low-stock">Sắp hết hàng</SelectItem>
                          <SelectItem value="out-of-stock">Hết hàng</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        onClick={clearFilters}
                        className="w-full"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Xóa tất cả bộ lọc
            </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <Suspense
            fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-72 rounded-3xl bg-muted animate-pulse"
                  />
                ))}
              </div>
            }
          >
            <ProjectsGrid
              projects={paginatedProjects}
              loading={loading}
              emptyMessage="Không có đồ án nào"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              showSoldQuantity={true}
              showAddToCartButton={true}
              onAddToCart={handleAddToCart}
              showPagination={!deferredQuery}
              pagination={{
                currentPage,
                totalPages: computedTotalPages,
                onPageChange: handlePageChange
              }}
            />
          </Suspense>
        </div>
      </section>
    </MainLayout>
  );
}

