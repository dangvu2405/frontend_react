import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { projectsService } from '@/services/projectsService';
import type { Project, ProjectIncludesOption } from '@/types/models/product';
import { storage, type CartItemInput } from '@/utils/storage';
import { reviewService, type RatingStats } from '@/services/reviewService';
import { toast } from 'sonner';
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Truck, 
  ShieldCheck, 
  ArrowLeft,
  Minus,
  Plus
} from 'lucide-react';
import { ProjectsGrid } from '@/components/projects';
import { ProjectReviews } from '@/components/ProjectReviews';
import { getCloudinaryProjectImageUrl } from '@/utils/imageUtils';
import { heartService } from '@/services/heartService';
import { useAuth } from '@/contexts/AuthContext';

const FALLBACK_IMAGE = 'https://placehold.co/600x600/E5E5EA/000?text=No+Image';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [relatedProjects, setRelatedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [selectedIncludes, setSelectedIncludes] = useState<ProjectIncludesOption | undefined>(undefined);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingHeart, setIsTogglingHeart] = useState(false);

  const includesOptions = useMemo<ProjectIncludesOption[]>(() => {
    if (!project) return [];
    const rawOptions = project.DungTichOptions;
    let normalized = Array.isArray(rawOptions) ? rawOptions.filter(Boolean) : [];
    if (!normalized.length) {
      const fallback = project.DungTich;
      if (fallback && Number(fallback) > 0) {
        normalized = [{ value: Number(fallback), label: `${fallback} ml`, isDefault: true }];
      }
    }
    if (!normalized.length) return [];
    if (!normalized.some(opt => opt.isDefault)) {
      normalized[0].isDefault = true;
    }
    return normalized;
  }, [project]);

  useEffect(() => {
    if (!includesOptions.length) {
      setSelectedIncludes(undefined);
      return;
    }
    setSelectedIncludes(includesOptions.find(opt => opt.isDefault) || includesOptions[0]);
  }, [includesOptions]);

  const projectId = useMemo(() => {
    if (project?._id) return String(project._id);
    return id || '';
  }, [project?._id, id]);

  useEffect(() => {
    if (!projectId) {
      setIsFavorite(false);
      return;
    }
    setIsFavorite(storage.isHeart(projectId));
  }, [projectId]);

  useEffect(() => {
    const handleHeartsUpdate = () => {
      if (projectId) {
        setIsFavorite(storage.isHeart(projectId));
      }
    };

    window.addEventListener('hearts:updated', handleHeartsUpdate);
    return () => window.removeEventListener('hearts:updated', handleHeartsUpdate);
  }, [projectId]);

  const shareUrl = useMemo(() => {
    if (!projectId) return typeof window !== 'undefined' ? window.location.href : '';
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/projects/${projectId}`;
    }
    return `/projects/${projectId}`;
  }, [projectId]);

  // Fetch project detail
  useEffect(() => {
    let isMounted = true;

    const fetchProjectDetail = async () => {
      if (!id) {
        navigate('/projects');
        return;
      }

      try {
        setLoading(true);
        const projectData = await projectsService.getProjectById(id);
        
        if (!isMounted) return;

        if (!projectData) {
          toast.error('Không tìm thấy đồ án');
          navigate('/projects');
          return;
        }

        // ✅ Map data từ API response với các field mới
        const projectRaw = projectData as unknown as Record<string, unknown>;
        
        // Map các field từ API response
        const project: Project = {
          ...projectData,
          // Map title fields
          TenSanPham: (projectRaw.TieuDe || projectRaw.TenSanPham || 'Đồ án') as string,
          TieuDe: (projectRaw.TieuDe || projectRaw.TenSanPham || 'Đồ án') as string,
          
          // Map description
          MoTa: (projectRaw.MoTa || '') as string,
          
          // Map price fields
          Gia: Number(projectRaw.Gia || 0),
          KhuyenMai: Number(projectRaw.KhuyenMai || 0),
          finalPrice: Number(projectRaw.finalPrice || projectRaw.Gia || 0),
          
          // Map category
          MaLoaiSanPham: projectRaw.MaLoaiDoAn || projectRaw.MaLoaiSanPham || null,
          MonHoc: (projectRaw.MonHoc || '') as string,
          CapDo: (projectRaw.CapDo || '') as string,
          
          // Map tech stack and features
          CongNghe: Array.isArray(projectRaw.CongNghe) ? projectRaw.CongNghe as string[] : [],
          TinhNang: Array.isArray(projectRaw.TinhNang) ? projectRaw.TinhNang as string[] : [],
          BaoGom: Array.isArray(projectRaw.BaoGom) ? projectRaw.BaoGom as string[] : [],
          
          // Map images - use AnhPreview if available, otherwise use HinhAnhChinh/HinhAnhPhu
          HinhAnhChinh: (() => {
            const mainImg = projectRaw.AnhPreview?.[0] || projectRaw.HinhAnhChinh || '';
            if (typeof mainImg === 'string' && (mainImg.startsWith('http://') || mainImg.startsWith('https://'))) {
              return mainImg;
            }
            return getCloudinaryProjectImageUrl(mainImg as string) || FALLBACK_IMAGE;
          })(),
          HinhAnhPhu: (() => {
            const previewImages = Array.isArray(projectRaw.AnhPreview) 
              ? projectRaw.AnhPreview.slice(1) 
              : (Array.isArray(projectRaw.HinhAnhPhu) ? projectRaw.HinhAnhPhu : []);
            return previewImages.map((img: unknown) => {
              const imgStr = String(img || '');
              if (imgStr && (imgStr.startsWith('http://') || imgStr.startsWith('https://'))) {
                return imgStr;
              }
              return getCloudinaryProjectImageUrl(imgStr) || FALLBACK_IMAGE;
            });
          })(),
          AnhPreview: Array.isArray(projectRaw.AnhPreview) 
            ? projectRaw.AnhPreview.map((img: unknown) => {
                const imgStr = String(img || '');
                if (imgStr && (imgStr.startsWith('http://') || imgStr.startsWith('https://'))) {
                  return imgStr;
                }
                return getCloudinaryProjectImageUrl(imgStr) || FALLBACK_IMAGE;
              })
            : [],
          
          // Map demo link
          LinkDemo: (projectRaw.LinkDemo || '') as string,
          
          // Map academic info
          DiemSo: (projectRaw.DiemSo || '') as string,
          NamThucHien: Number(projectRaw.NamThucHien || 0),
          Truong: (projectRaw.Truong || '') as string,
          
          // Map tags
          Tags: Array.isArray(projectRaw.Tags) ? projectRaw.Tags as string[] : [],
          
          // Map rating and stats
          DanhGia: Number(projectRaw.DanhGia || 0),
          SoLuongDanhGia: Number(projectRaw.SoLuongDanhGia || 0),
          SoLuotTai: Number(projectRaw.SoLuotTai || 0),
          
          // Map other fields
          DaBan: Number(projectRaw.DaBan || 0),
          SoLuong: Number(projectRaw.SoLuong || 0),
          TrangThai: (projectRaw.TrangThai || 'available') as string,
          IsFeatured: Boolean(projectRaw.IsFeatured || false),
          
          // Keep includes options if exists
          DungTichOptions: Array.isArray(projectRaw.DungTichOptions) 
            ? projectRaw.DungTichOptions as ProjectIncludesOption[]
            : [],
          DungTich: projectRaw.DungTich,
        } as Project;

        setProject(project);
        setSelectedImage(0); // Reset về ảnh đầu tiên khi load đồ án mới

        // Fetch rating stats từ reviews
        try {
          const stats = await reviewService.getProjectRatingStats(id);
          if (isMounted) {
            setRatingStats(stats);
          }
        } catch (statsError) {
          // Nếu không lấy được stats, để null (sẽ hiển thị mặc định)
          if (import.meta.env.DEV) {
            console.warn('Could not fetch rating stats:', statsError);
          }
        }

        // Fetch related projects (same category)
        try {
          // Lấy category name từ project
          const categoryName = typeof project.MaLoaiSanPham === 'object' && project.MaLoaiSanPham
            ? project.MaLoaiSanPham.TenLoaiSanPham
            : '';
          
          if (categoryName) {
            const categoryProjects = await projectsService.getProjectsByCategory(categoryName);
          const related = categoryProjects
              .filter((p) => {
                const pId = p._id || (p as unknown as Record<string, unknown>).id;
              return pId !== id;
            })
            .slice(0, 4)
              .map((p) => ({
                ...p,
                DaBan: p.DaBan || 0, // Ensure DaBan field exists
                // Transform ảnh qua Cloudinary
                HinhAnhChinh: getCloudinaryProjectImageUrl(p.HinhAnhChinh || '') || FALLBACK_IMAGE,
                HinhAnhPhu: Array.isArray(p.HinhAnhPhu) 
                  ? p.HinhAnhPhu.map((img: string) => getCloudinaryProjectImageUrl(img) || FALLBACK_IMAGE)
                  : [],
              }));

          setRelatedProjects(related);
          } else {
            setRelatedProjects([]);
          }
        } catch (relatedError) {
          if (import.meta.env.DEV) {
            console.warn('Could not fetch related projects:', relatedError);
          }
          setRelatedProjects([]);
        }
      } catch (error: unknown) {
        if (!isMounted) return;
        if (import.meta.env.DEV) {
          console.error('Error fetching project:', error);
        }
        toast.error('Không thể tải thông tin đồ án');
        navigate('/projects');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProjectDetail();

    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  const handleQuantityChange = (delta: number) => {
    if (!project) return;
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= project.SoLuong) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = useCallback(() => {
    if (!project) return;

    // Lấy category name
    const categoryName = typeof project.MaLoaiSanPham === 'object' && project.MaLoaiSanPham
      ? project.MaLoaiSanPham.TenLoaiSanPham
      : 'Đồ án';

    const item: CartItemInput = {
      projectId: String(project._id),
      tenSP: project.TenSanPham,
      basePrice: project.Gia,
      giamGia: project.KhuyenMai || 0,
      hinhAnh: project.HinhAnhChinh,
      loaiSP: categoryName,
      selectedDungTich: selectedIncludes || includesOptions[0],
      includesOptions: includesOptions.length ? includesOptions : undefined,
    };

    storage.addCartItem(item, quantity);
    window.dispatchEvent(new CustomEvent('cart:updated'));
    toast.success(`Đã thêm ${quantity} đồ án vào giỏ hàng`);
  }, [project, quantity, selectedIncludes, includesOptions]);

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  const handleAddToCartRelated = useCallback((relatedProject: Project, selectedIncludesOption?: ProjectIncludesOption) => {
    // Lấy category name
    const categoryName = typeof relatedProject.MaLoaiSanPham === 'object' && relatedProject.MaLoaiSanPham
      ? relatedProject.MaLoaiSanPham.TenLoaiSanPham
      : 'Đồ án';

    const options = relatedProject.DungTichOptions && relatedProject.DungTichOptions.length
      ? relatedProject.DungTichOptions
      : (relatedProject.DungTich ? [{ value: relatedProject.DungTich, label: `${relatedProject.DungTich} ml`, isDefault: true }] : []);
    const defaultSelection = selectedIncludesOption || options.find(opt => opt.isDefault) || options[0];

    const item: CartItemInput = {
      projectId: String(relatedProject._id),
      tenSP: relatedProject.TenSanPham,
      basePrice: relatedProject.Gia,
      giamGia: relatedProject.KhuyenMai || 0,
      hinhAnh: relatedProject.HinhAnhChinh,
      loaiSP: categoryName,
      selectedDungTich: defaultSelection,
      includesOptions: options.length ? options : undefined,
    };
    storage.addCartItem(item, 1);
    window.dispatchEvent(new CustomEvent('cart:updated'));
    toast.success('Đã thêm vào giỏ hàng');
  }, []);

  const handleToggleHeart = useCallback(async () => {
    if (!projectId || !project || isTogglingHeart) return;

    const nextState = !isFavorite;
    setIsTogglingHeart(true);

    try {
      if (nextState) {
        storage.addHeart(projectId);
        if (isAuthenticated) {
          try {
            await heartService.addHeart(projectId);
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error('Không thể đồng bộ yêu thích lên server:', error);
            }
          }
        }
        toast.success('Đã thêm vào danh sách yêu thích');
      } else {
        storage.removeHeart(projectId);
        if (isAuthenticated) {
          try {
            await heartService.removeHeart(projectId);
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error('Không thể xoá yêu thích trên server:', error);
            }
          }
        }
        toast.success('Đã bỏ khỏi danh sách yêu thích');
      }
      setIsFavorite(nextState);
    } catch {
      toast.error('Không thể cập nhật danh sách yêu thích');
    } finally {
      setIsTogglingHeart(false);
    }
  }, [isAuthenticated, isFavorite, isTogglingHeart, project, projectId]);

  const handleShareProject = useCallback(async () => {
    if (!project || !projectId) return;

    const url = shareUrl || (typeof window !== 'undefined' ? window.location.href : '');
    const shareData = {
      title: project.TenSanPham,
      text: project.MoTa || 'Xem đồ án này trên cửa hàng của chúng tôi',
      url,
    };

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(shareData);
        toast.success('Đã mở hộp thoại chia sẻ');
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success('Đã sao chép link đồ án');
        return;
      }

      if (typeof window !== 'undefined') {
        window.prompt('Sao chép đường dẫn đồ án:', url);
        toast.success('Link đồ án đã sẵn sàng để sao chép');
      }
    } catch (error: unknown) {
      const errorRecord = error as Record<string, unknown>;
      if (errorRecord?.name !== 'AbortError') {
        toast.error('Không thể chia sẻ đồ án');
      }
    }
  }, [project, projectId, shareUrl]);

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="text-muted-foreground mt-4">Đang tải đồ án...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return null;
  }

  // ✅ Tính toán từ data đúng format
  const isSoldOut = project.SoLuong <= 0;
  const discount = project.KhuyenMai || 0;
  const basePrice = project.Gia;
  const variantBasePrice = basePrice + (selectedIncludes?.priceDiff || 0);
  const discountedPrice = discount > 0 ? Math.round(variantBasePrice * (1 - discount / 100)) : variantBasePrice;
  const savings = Math.max(0, variantBasePrice - discountedPrice);
  const includesText = selectedIncludes?.label || (project.DungTich ? `${Number.isInteger(project.DungTich) ? project.DungTich : parseFloat(project.DungTich.toFixed(2).replace(/\.?0+$/, ''))} ml` : null);
  
  // Lấy category name
  const categoryName = typeof project.MaLoaiSanPham === 'object' && project.MaLoaiSanPham
    ? project.MaLoaiSanPham.TenLoaiSanPham
    : 'Đồ án';

  return (
    <MainLayout>
      {/* Breadcrumb */}
      <section className="bg-muted/30 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách đồ án</span>
          </button>
        </div>
      </section>

      {/* Project Detail */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Project Images */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted border-2 border-border">
                {(() => {
                  // ✅ Tạo mảng tất cả ảnh: ảnh chính + ảnh phụ
                  const allImages = [
                    project.HinhAnhChinh || FALLBACK_IMAGE,
                    ...(Array.isArray(project.HinhAnhPhu) ? project.HinhAnhPhu : [])
                  ].filter(Boolean); // Loại bỏ các giá trị null/undefined/empty
                  
                  const currentImage = allImages[selectedImage] || allImages[0] || FALLBACK_IMAGE;
                  
                  return (
                    <img
                      src={currentImage}
                      alt={project.TenSanPham}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  );
                })()}
                {discount > 0 && (
                  <div className="absolute top-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    -{discount}%
                  </div>
                )}
                {isSoldOut && (
                  <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
                    <span className="bg-destructive text-destructive-foreground px-6 py-3 rounded-lg font-bold text-lg">
                      HẾT HÀNG
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnail images */}
              {(() => {
                // ✅ Tạo mảng tất cả ảnh: ảnh chính + ảnh phụ
                const allImages = [
                  project.HinhAnhChinh || FALLBACK_IMAGE,
                  ...(Array.isArray(project.HinhAnhPhu) ? project.HinhAnhPhu : [])
                ].filter(Boolean); // Loại bỏ các giá trị null/undefined/empty
                
                // Chỉ hiển thị thumbnail nếu có nhiều hơn 1 ảnh
                if (allImages.length <= 1) return null;
                
                return (
                  <div className="grid grid-cols-4 gap-2">
                    {allImages.slice(0, 4).map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage === idx
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${project.TenSanPham} ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = FALLBACK_IMAGE;
                          }}
                        />
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Project Info */}
            <div className="space-y-6">
              {/* Category */}
              <div>
                <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-full">
                  {categoryName}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl font-bold text-foreground">{project.TenSanPham}</h1>

              {/* Rating & Sold */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const avgRating = ratingStats?.avgRating || 0;
                      const filled = star <= Math.round(avgRating);
                      return (
                        <span 
                          key={star} 
                          className={filled ? 'text-primary' : 'text-muted'}
                        >
                          ★
                        </span>
                      );
                    })}
                  </div>
                  <span className="text-muted-foreground">
                    ({ratingStats?.totalReviews || 0} đánh giá)
                    {ratingStats && ratingStats.avgRating > 0 && (
                      <span className="ml-1 font-semibold text-foreground">
                        {ratingStats.avgRating.toFixed(1)}/5
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-4 w-px bg-border" />
                <span className="text-muted-foreground">
                  Đã bán: <span className="font-semibold text-foreground">{project.DaBan}</span>
                </span>
                {includesText && (
                  <>
                    <div className="h-4 w-px bg-border" />
                    <span className="text-muted-foreground">
                      Bao gồm: <span className="font-semibold text-foreground">{includesText}</span>
                    </span>
                  </>
                )}
              </div>

              {includesOptions.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Bao gồm</p>
                  <div className="flex flex-wrap gap-2">
                    {includesOptions.map((option) => (
                      <button
                        key={`detail-includes-${option.value}`}
                        onClick={() => setSelectedIncludes(option)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          Number(selectedIncludes?.value) === Number(option.value)
                            ? 'bg-teal-600 text-white shadow-md'
                            : 'bg-white dark:bg-card text-gray-700 dark:text-foreground border-2 border-gray-200 dark:border-border hover:border-teal-300'
                        }`}
                      >
                        {option.label || `${option.value} ml`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Price */}
              <Card className="bg-muted/30">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-bold text-primary">
                        {discountedPrice.toLocaleString('vi-VN')}₫
                      </span>
                      {discount > 0 && (
                        <span className="text-xl text-muted-foreground line-through">
                          {variantBasePrice.toLocaleString('vi-VN')}₫
                        </span>
                      )}
                    </div>
                    {discount > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Tiết kiệm: <span className="font-semibold text-destructive">{savings.toLocaleString('vi-VN')}₫</span>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Stock Status */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Tình trạng:</p>
                {isSoldOut ? (
                  <span className="text-destructive font-semibold">Hết hàng</span>
                ) : project.SoLuong <= 10 ? (
                  <span className="text-primary font-semibold">
                    ⚠️ Chỉ còn {project.SoLuong} đồ án
                  </span>
                ) : (
                  <span className="text-foreground font-semibold">
                    ✓ Còn hàng ({project.SoLuong} đồ án)
                  </span>
                )}
              </div>

              {/* Quantity Selector */}
              {!isSoldOut && (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Số lượng:</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border-2 border-border rounded-lg">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="h-12 w-12"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-16 text-center font-semibold text-lg">
                        {quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= project.SoLuong}
                        className="h-12 w-12"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {project.SoLuong} đồ án có sẵn
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={isSoldOut}
                  variant="outline"
                  className="flex-1 h-14 text-base font-semibold"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Thêm vào giỏ
                </Button>
                <Button
                  onClick={handleBuyNow}
                  disabled={isSoldOut}
                  className="flex-1 h-14 text-base font-semibold bg-primary hover:bg-primary/90"
                >
                  Mua & Tải về
                </Button>
              </div>

              {/* Secondary Actions */}
              <div className="flex gap-3">
                <Button
                  variant={isFavorite ? 'default' : 'outline'}
                  size="icon"
                  className={`h-12 w-12 ${isFavorite ? 'bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-500/20 dark:text-red-300' : ''}`}
                  onClick={handleToggleHeart}
                  disabled={isTogglingHeart}
                  aria-label={isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                  aria-pressed={isFavorite}
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12"
                  onClick={handleShareProject}
                  aria-label="Chia sẻ đồ án"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Benefits */}
              <div className="space-y-3 pt-6 border-t border-border">
                <div className="flex items-center gap-3 text-sm">
                  <Truck className="w-5 h-5 text-primary" />
                  <span>Miễn phí vận chuyển cho đơn hàng trên 500.000₫</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span>Cam kết 100% hàng chính hãng</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span>Đổi trả trong vòng 7 ngày nếu có lỗi từ nhà sản xuất</span>
                </div>
              </div>

            </div>
          </div>

          {/* Project Description */}
          <div className="mt-16 space-y-8">
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Mô tả đồ án</h2>
                <div className="prose prose-lg max-w-none text-muted-foreground">
                  <p className="whitespace-pre-line">{project.MoTa || 'Chưa có mô tả'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Academic Info */}
            {((project as unknown as Record<string, unknown>).MonHoc || (project as unknown as Record<string, unknown>).CapDo || (project as unknown as Record<string, unknown>).Truong || (project as unknown as Record<string, unknown>).DiemSo) && (
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-6">Thông tin học thuật</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(project as unknown as Record<string, unknown>).MonHoc && (
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="font-medium">Môn học:</span>
                        <span>{(project as unknown as Record<string, unknown>).MonHoc as string}</span>
                      </div>
                    )}
                    {(project as unknown as Record<string, unknown>).CapDo && (
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="font-medium">Cấp độ:</span>
                        <span>{(project as unknown as Record<string, unknown>).CapDo as string}</span>
                      </div>
                    )}
                    {(project as unknown as Record<string, unknown>).Truong && (
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="font-medium">Trường:</span>
                        <span>{(project as unknown as Record<string, unknown>).Truong as string}</span>
                      </div>
                    )}
                    {(project as unknown as Record<string, unknown>).DiemSo && (
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="font-medium">Điểm số:</span>
                        <span className="font-semibold text-primary">{(project as unknown as Record<string, unknown>).DiemSo as string}</span>
                      </div>
                    )}
                    {(project as unknown as Record<string, unknown>).NamThucHien && Number((project as unknown as Record<string, unknown>).NamThucHien) > 0 && (
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="font-medium">Năm thực hiện:</span>
                        <span>{Number((project as unknown as Record<string, unknown>).NamThucHien)}</span>
                      </div>
                    )}
                    {(project as unknown as Record<string, unknown>).SoLuotTai && Number((project as unknown as Record<string, unknown>).SoLuotTai) > 0 && (
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="font-medium">Lượt tải:</span>
                        <span>{Number((project as unknown as Record<string, unknown>).SoLuotTai).toLocaleString('vi-VN')}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tech Stack */}
            {Array.isArray((project as unknown as Record<string, unknown>).CongNghe) && (project as unknown as Record<string, unknown>).CongNghe.length > 0 && (
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-6">Công nghệ sử dụng</h2>
                  <div className="flex flex-wrap gap-2">
                    {((project as unknown as Record<string, unknown>).CongNghe as string[]).map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            {Array.isArray((project as unknown as Record<string, unknown>).TinhNang) && (project as unknown as Record<string, unknown>).TinhNang.length > 0 && (
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-6">Tính năng chính</h2>
                  <ul className="space-y-2">
                    {((project as unknown as Record<string, unknown>).TinhNang as string[]).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary mt-1">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Includes */}
            {Array.isArray((project as unknown as Record<string, unknown>).BaoGom) && (project as unknown as Record<string, unknown>).BaoGom.length > 0 && (
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-6">Bao gồm</h2>
                  <ul className="space-y-2">
                    {((project as unknown as Record<string, unknown>).BaoGom as string[]).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Preview Images Gallery */}
            {Array.isArray((project as unknown as Record<string, unknown>).AnhPreview) && (project as unknown as Record<string, unknown>).AnhPreview.length > 0 && (
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-6">Hình ảnh preview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {((project as unknown as Record<string, unknown>).AnhPreview as string[]).map((img, idx) => (
                      <div key={idx} className="aspect-video rounded-lg overflow-hidden border border-border">
                        <img
                          src={img}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          onClick={() => window.open(img, '_blank')}
                          onError={(e) => {
                            e.currentTarget.src = FALLBACK_IMAGE;
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Demo Link */}
            {(project as unknown as Record<string, unknown>).LinkDemo && (
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-6">Demo</h2>
                  <a
                    href={(project as unknown as Record<string, unknown>).LinkDemo as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <span>Xem Demo</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {Array.isArray((project as unknown as Record<string, unknown>).Tags) && (project as unknown as Record<string, unknown>).Tags.length > 0 && (
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-6">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {((project as unknown as Record<string, unknown>).Tags as string[]).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Info */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Thông tin chi tiết</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="font-medium">Danh mục:</span>
                    <span>{categoryName}</span>
                  </div>
                  {includesText && (
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="font-medium">Bao gồm:</span>
                      <span>{includesText}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="font-medium">Tình trạng:</span>
                    <span>{isSoldOut ? 'Hết hàng' : 'Còn hàng'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="font-medium">Đã bán:</span>
                    <span>{project.DaBan} đồ án</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="font-medium">Mã đồ án:</span>
                    <span className="font-mono text-sm">{String(project._id || project.id || '').slice(-8).toUpperCase()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Project Reviews */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold mb-8">Đánh giá đồ án</h2>
            <ProjectReviews projectId={id!} />
          </div>

          {/* Related Projects */}
          {relatedProjects.length > 0 && (
            <div className="mt-16">
              <h2 className="text-3xl font-bold mb-8">Đồ án liên quan</h2>
              <ProjectsGrid
                projects={relatedProjects}
                loading={false}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                onAddToCart={handleAddToCartRelated}
              />
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}

