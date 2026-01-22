import { useEffect, useState, useRef } from "react"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import adminService, { type AdminProductPayload, type AdminProductVolumeOptionPayload } from "@/services/adminService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Edit, Plus, Trash2, Search, Filter, CheckSquare, Square } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import type { Category, ChartItem, Product } from "@/types/models"
import { getCloudinaryProductImageUrl } from "@/utils/imageUtils"
import axiosInstance from "@/services/axios"
import { storage } from "@/utils/storage"

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
})

const createDefaultVolumeOption = (value = 100): AdminProductVolumeOptionPayload => ({
  value,
  label: `${value} ml`,
  isDefault: false,
  priceDiff: 0,
  stockDiff: 0,
})

const ensureVolumeOptionList = (
  options?: AdminProductVolumeOptionPayload[],
  fallbackVolume?: number | null,
): AdminProductVolumeOptionPayload[] => {
  let normalized: AdminProductVolumeOptionPayload[] = Array.isArray(options) ? options.filter(Boolean) : []

  if (!normalized.length && fallbackVolume) {
    normalized = [{
      value: fallbackVolume,
      label: `${fallbackVolume} ml`,
      isDefault: true,
      priceDiff: 0,
      stockDiff: 0,
    }]
  }

  if (!normalized.length) {
    normalized = [createDefaultVolumeOption(100)]
  }

  normalized = normalized.map((option) => {
    const value = Number(option.value) || 0
    return {
      value,
      label: option.label?.trim() || `${value} ml`,
      priceDiff: Number(option.priceDiff) || 0,
      stockDiff: Number(option.stockDiff) || 0,
      sku: option.sku?.trim() || undefined,
      isDefault: Boolean(option.isDefault),
    }
  })

  if (!normalized.some((option) => option.isDefault) && normalized.length) {
    normalized[0].isDefault = true
  } else {
    let defaultSet = false
    normalized = normalized.map((option) => {
      if (option.isDefault && !defaultSet) {
        defaultSet = true
        return { ...option, isDefault: true }
      }
      return { ...option, isDefault: false }
    })
    if (!defaultSet && normalized.length) {
      normalized[0].isDefault = true
    }
  }

  return normalized
}

export default function AdminProductsPage() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [categorySalesChart, setCategorySalesChart] = useState<ChartItem[]>([])
  const [priceTrendChart, setPriceTrendChart] = useState<ChartItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10
  
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [stockFilter, setStockFilter] = useState<string>("all")
  
  // Multi-select states
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)

  // Form states
  const [formData, setFormData] = useState<AdminProductPayload>({
    TenSanPham: "",
    MoTa: "",
    Gia: 0,
    KhuyenMai: 0,
    SoLuong: 0,
    DungTichOptions: ensureVolumeOptionList(),
    MaLoaiSanPham: "",
    HinhAnhChinh: "",
    HinhAnhPhu: [],
  })
  const [submitting, setSubmitting] = useState(false)

  const updateVolumeOptions = (updater: AdminProductVolumeOptionPayload[] | ((prev: AdminProductVolumeOptionPayload[]) => AdminProductVolumeOptionPayload[])) => {
    setFormData((prev) => {
      const previousOptions = prev.DungTichOptions ?? ensureVolumeOptionList([], prev.DungTich ?? null)
      const nextOptions = typeof updater === "function" ? updater(previousOptions) : updater
      return {
        ...prev,
        DungTichOptions: ensureVolumeOptionList(nextOptions, prev.DungTich ?? null),
      }
    })
  }

  const handleAddVolumeOption = () => {
    updateVolumeOptions((prev) => [
      ...prev,
      createDefaultVolumeOption(100 + prev.length * 10),
    ])
  }

  const handleRemoveVolumeOption = (index: number) => {
    updateVolumeOptions((prev) => {
      if (prev.length <= 1) {
        toast.error("Cần ít nhất một dung tích")
        return prev
      }
      const next = prev.filter((_, idx) => idx !== index)
      return next
    })
  }

  const handleVolumeOptionChange = (
    index: number,
    field: keyof AdminProductVolumeOptionPayload,
    value: string | number,
  ) => {
    updateVolumeOptions((prev) =>
      prev.map((option, idx) =>
        idx === index
          ? {
              ...option,
              [field]: field === "value" || field === "priceDiff" || field === "stockDiff" ? Number(value) : value,
            }
          : option,
      ),
    )
  }

  const handleSetDefaultVolumeOption = (index: number) => {
    updateVolumeOptions((prev) =>
      prev.map((option, idx) => ({
        ...option,
        isDefault: idx === index,
      })),
    )
  }
  
  // Image preview states
  const [mainImagePreview, setMainImagePreview] = useState<string>("")
  const [subImagePreviews, setSubImagePreviews] = useState<string[]>(["", "", ""])
  const [mainImageUploading, setMainImageUploading] = useState(false)
  const [subImageUploading, setSubImageUploading] = useState<boolean[]>([false, false, false])
  
  // Track if categories have been fetched
  const categoriesFetchedRef = useRef(false)

  // Fetch categories on mount - chỉ fetch một lần
  const fetchCategories = async () => {
    // Nếu đã có categories hoặc đã fetch rồi, không fetch lại
    if (categories.length > 0 || categoriesFetchedRef.current) {
      return;
    }
    try {
      categoriesFetchedRef.current = true
      const categoriesRes = await adminService.getCategories()
      
      // Parse response - normalizeResponse đã giữ lại structure
      const responseData = categoriesRes?.data
      let categoriesData: Category[] = []
      
      if (responseData) {
        if (responseData && typeof responseData === 'object' && !Array.isArray(responseData) && 'success' in responseData && 'data' in responseData) {
          // data có thể là array hoặc object có categories
          if (Array.isArray(responseData.data)) {
            categoriesData = responseData.data
          } else if (responseData.data && typeof responseData.data === 'object' && 'categories' in responseData.data) {
            categoriesData = Array.isArray(responseData.data.categories) ? responseData.data.categories : []
          }
        } else if (Array.isArray(responseData)) {
          categoriesData = responseData
        } else if (responseData && typeof responseData === 'object' && !Array.isArray(responseData) && 'data' in responseData) {
          if (Array.isArray(responseData.data)) {
            categoriesData = responseData.data
          } else if (responseData.data && typeof responseData.data === 'object' && 'categories' in responseData.data) {
            categoriesData = Array.isArray(responseData.data.categories) ? responseData.data.categories : []
          }
        }
      }
      
      // Đảm bảo categoriesData luôn là array
      if (!Array.isArray(categoriesData)) {
        categoriesData = []
      }
      
      setCategories(categoriesData)
      
      if (categoriesData.length === 0) {
        console.warn("Không có danh mục nào. Vui lòng tạo danh mục trước khi thêm sản phẩm.")
      }
    } catch (err: unknown) {
      categoriesFetchedRef.current = false // Reset on error
      console.error("Error fetching categories:", err)
      toast.error("Không thể tải danh sách danh mục")
    }
  }

  useEffect(() => {
    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, categoryFilter])
  
  // Reset selected products when filter changes
  useEffect(() => {
    setSelectedProducts(new Set())
    setIsSelectMode(false)
  }, [categoryFilter, stockFilter, searchQuery])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params: Record<string, string | number> = {
        page: currentPage,
        limit: pageSize,
      }
      
      if (categoryFilter !== "all") {
        params.categoryId = categoryFilter
      }
      
      const productsRes = await adminService.getProducts(params)
      
      // Debug log trong development
      if (import.meta.env.DEV) {
        console.log('📥 Products Response Raw:', {
          hasResponse: !!productsRes,
          responseData: productsRes?.data,
          responseDataType: productsRes?.data ? (Array.isArray(productsRes.data) ? 'array' : typeof productsRes.data) : 'undefined',
          responseDataKeys: productsRes?.data && !Array.isArray(productsRes.data) && typeof productsRes.data === 'object' ? Object.keys(productsRes.data) : 'N/A',
        })
      }
      
      // Parse response - normalizeResponse đã giữ lại pagination
      const responseData = productsRes?.data
      let productsData: Product[] = []
      let pagination: { totalPages?: number; total?: number } | undefined

      if (responseData) {
        if (responseData && typeof responseData === 'object' && !Array.isArray(responseData) && 'success' in responseData && 'data' in responseData) {
          if (Array.isArray(responseData.data)) {
            productsData = responseData.data
            pagination = (responseData as Record<string, unknown>).pagination as { totalPages?: number; total?: number } | undefined
          }
        } else if (Array.isArray(responseData)) {
          productsData = responseData
        } else if (responseData && typeof responseData === 'object' && !Array.isArray(responseData) && 'data' in responseData) {
          if (Array.isArray(responseData.data)) {
            productsData = responseData.data
            pagination = (responseData as Record<string, unknown>).pagination as { totalPages?: number; total?: number } | undefined
          }
        }
      }
      
      if (!Array.isArray(productsData)) {
        productsData = []
      }
      
      // Debug log sau khi parse
      if (import.meta.env.DEV) {
        console.log('📥 Products Parsed:', {
          productsCount: productsData.length,
          pagination: pagination,
          totalPages: pagination?.totalPages,
          total: pagination?.total
        })
      }

      setProducts(productsData)
      if (pagination) {
        setTotalPages(pagination.totalPages || 1)
        setTotal(pagination.total || 0)
      }
      
      // Chỉ update charts lần đầu hoặc khi cần thiết (không fetch 1000 products mỗi lần)
      // Charts sẽ được update khi có thay đổi dữ liệu (create/update/delete)
      if (currentPage === 1) {
        // Chỉ fetch all products cho charts ở trang đầu tiên
        const allProductsParams = { ...params, page: 1, limit: 1000 }
        const allProductsRes = await adminService.getProducts(allProductsParams)
        const allProductsResponseData = allProductsRes?.data
        
        let allProductsData: Product[] = []
        
        if (allProductsResponseData) {
          if (allProductsResponseData && typeof allProductsResponseData === 'object' && !Array.isArray(allProductsResponseData) && 'success' in allProductsResponseData && 'data' in allProductsResponseData) {
            if (Array.isArray(allProductsResponseData.data)) {
              allProductsData = allProductsResponseData.data
            }
          } else if (Array.isArray(allProductsResponseData)) {
            allProductsData = allProductsResponseData
          } else if (allProductsResponseData && typeof allProductsResponseData === 'object' && !Array.isArray(allProductsResponseData) && 'data' in allProductsResponseData) {
            if (Array.isArray(allProductsResponseData.data)) {
              allProductsData = allProductsResponseData.data
            }
          }
        }
        
        if (!Array.isArray(allProductsData)) {
          allProductsData = []
        }
        
        updateCharts(allProductsData)
      }
    } catch (err: unknown) {
      console.error("Error fetching data:", err)
      toast.error("Không thể tải dữ liệu")
    } finally {
      setLoading(false)
    }
  }
  
  // Filter products locally by search query and stock
  // Đảm bảo products luôn là array
  const filteredProducts = (Array.isArray(products) ? products : []).filter((product) => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const categoryName = typeof product.MaLoaiSanPham === "string" 
        ? "Không phân loại" 
        : product.MaLoaiSanPham?.TenLoaiSanPham ?? "Không phân loại"
      
      const matchesSearch = (
        product.TenSanPham?.toLowerCase().includes(query) ||
        product.MoTa?.toLowerCase().includes(query) ||
        categoryName.toLowerCase().includes(query)
      )
      if (!matchesSearch) return false
    }
    
    // Stock filter
    if (stockFilter !== "all") {
      switch (stockFilter) {
        case "out":
          if (product.SoLuong !== 0) return false
          break
        case "low":
          if (product.SoLuong >= 10 || product.SoLuong === 0) return false
          break
        case "in":
          if (product.SoLuong < 10) return false
          break
      }
    }
    
    return true
  })
  
  const handleToggleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(filteredProducts.map(product => product._id)))
    }
  }
  
  const handleToggleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
  }
  
  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm")
      return
    }
    
    try {
      setSubmitting(true)
      const promises = Array.from(selectedProducts).map(productId =>
        adminService.deleteProduct(productId)
      )
      
      await Promise.all(promises)
      toast.success(`Đã xóa ${selectedProducts.size} sản phẩm thành công`)
      setSelectedProducts(new Set())
      setIsSelectMode(false)
      await fetchData()
      if (currentPage !== 1) {
        const allProductsRes = await adminService.getProducts({ page: 1, limit: 1000 })
        const allProductsDataRaw = (allProductsRes as unknown as Record<string, unknown>)?.data;
        const allProductsData = Array.isArray(allProductsDataRaw) ? allProductsDataRaw : 
          (allProductsDataRaw && typeof allProductsDataRaw === 'object' && 'data' in allProductsDataRaw && Array.isArray((allProductsDataRaw as Record<string, unknown>).data)) 
            ? (allProductsDataRaw as Record<string, unknown>).data as Product[]
            : [];
        updateCharts(allProductsData)
      }
    } catch (err: unknown) {
      console.error("Error bulk deleting products:", err)
      toast.error("Không thể xóa một số sản phẩm")
    } finally {
      setSubmitting(false)
    }
  }

  const updateCharts = (productsData: Product[]) => {
    // Đảm bảo productsData luôn là array
    if (!Array.isArray(productsData)) {
      productsData = []
    }
    
    // Chart theo category
    const categoryMap = new Map<string, ChartItem>()
    productsData.forEach((product) => {
      const categoryName = typeof product.MaLoaiSanPham === "string" 
        ? "Không phân loại" 
        : product.MaLoaiSanPham?.TenLoaiSanPham ?? "Không phân loại"
      
    if (!categoryMap.has(categoryName)) {
      categoryMap.set(categoryName, { name: categoryName, sold: 0, revenue: 0 })
    }
    const catData = categoryMap.get(categoryName)!
    catData.sold = (catData.sold ?? 0) + product.DaBan
    catData.revenue = (catData.revenue ?? 0) + product.DaBan * product.Gia
    })
    setCategorySalesChart(Array.from(categoryMap.values()))

    // Chart theo price range
    const priceRanges: ChartItem[] = [
      { name: "< 1 triệu", sold: 0 },
      { name: "1-2 triệu", sold: 0 },
      { name: "2-3 triệu", sold: 0 },
      { name: "3-4 triệu", sold: 0 },
      { name: "4-5 triệu", sold: 0 },
      { name: "> 5 triệu", sold: 0 },
    ]
    
    productsData.forEach((product) => {
      const price = product.Gia
      let rangeIndex = 0
      if (price >= 5000000) rangeIndex = 5
      else if (price >= 4000000) rangeIndex = 4
      else if (price >= 3000000) rangeIndex = 3
      else if (price >= 2000000) rangeIndex = 2
      else if (price >= 1000000) rangeIndex = 1
      
      const targetRange = priceRanges[rangeIndex] || priceRanges[0]
      targetRange.sold = (targetRange.sold ?? 0) + product.DaBan
    })
    setPriceTrendChart(priceRanges)
  }

  const openCreateDialog = () => {
    // Chỉ fetch categories nếu chưa có
    if (categories.length === 0) {
      fetchCategories()
    }
    
    setEditingProduct(null)
    setFormData({
      TenSanPham: "",
      MoTa: "",
      Gia: 0,
      KhuyenMai: 0,
      SoLuong: 0,
      DungTichOptions: ensureVolumeOptionList(),
      MaLoaiSanPham: "",
      HinhAnhChinh: "",
      HinhAnhPhu: [],
    })
    setMainImagePreview("")
    setSubImagePreviews(["", "", ""])
    setIsDialogOpen(true)
  }

  const resolvePreviewUrl = (path?: string | null) => {
    if (!path) return ""
    if (path.startsWith("http")) return path
    if (path.startsWith("/uploads")) return path
    return getCloudinaryProductImageUrl(path)
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    const hinhAnhPhu = product.HinhAnhPhu || []
    const normalizedVolumes = ensureVolumeOptionList(product.DungTichOptions as AdminProductVolumeOptionPayload[] | undefined, product.DungTich ?? null)
    setFormData({
      TenSanPham: product.TenSanPham,
      MoTa: product.MoTa || "",
      Gia: product.Gia,
      KhuyenMai: product.KhuyenMai || 0,
      SoLuong: product.SoLuong,
      DungTichOptions: normalizedVolumes,
      // MaLoaiSanPham: ObjectId của LoaiSanPham trong database
      // Nếu đã populate thì lấy _id, nếu chưa thì đã là string (ObjectId)
      MaLoaiSanPham: typeof product.MaLoaiSanPham === "string" 
        ? product.MaLoaiSanPham 
        : product.MaLoaiSanPham?._id || "",
      HinhAnhChinh: product.HinhAnhChinh || "",
      HinhAnhPhu: hinhAnhPhu,
    })
    // Set previews
    setMainImagePreview(resolvePreviewUrl(product.HinhAnhChinh))
    setSubImagePreviews([
      resolvePreviewUrl(hinhAnhPhu[0]),
      resolvePreviewUrl(hinhAnhPhu[1]),
      resolvePreviewUrl(hinhAnhPhu[2]),
    ])
    setIsDialogOpen(true)
  }

  const uploadImageToCloudinary = async (base64: string) => {
    try {
      // Debug: Kiểm tra token trước khi gửi request
      const token = storage.getToken();
      if (!token && import.meta.env.DEV) {
        console.warn('⚠️ No token found in localStorage before upload');
      }

      const response = await axiosInstance.post('/api/upload', {
        image: base64,
      })

      const data = response.data
      if (!data?.success || !data?.data?.url) {
        throw new Error(data?.message || "Không thể upload ảnh lên Cloudinary")
      }

      return {
        url: data.data.url as string,
        publicId: data.data.public_id as string,
      }
    } catch (error: unknown) {
      // Debug: Log chi tiết lỗi
      if (import.meta.env.DEV) {
        const errorRecord = error as Record<string, unknown>;
        console.error('Upload error:', {
          message: errorRecord?.message,
          response: (errorRecord?.response as Record<string, unknown>)?.data,
          status: (errorRecord?.response as Record<string, unknown>)?.status,
          token: storage.getToken() ? 'present' : 'missing'
        });
      }
      const errorRecord = error as Record<string, unknown>;
      const errorMsg = (((errorRecord?.response as Record<string, unknown>)?.data as Record<string, unknown>)?.message as string | undefined) || 
        (errorRecord?.message as string | undefined) || "Không thể upload ảnh lên Cloudinary";
      throw new Error(errorMsg)
    }
  }

  const handleImageChange = (file: File | null, index: number = -1) => {
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Vui lòng chọn file ảnh")
      return
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 5MB")
      return
    }
    
    const reader = new FileReader()
    reader.onload = async (e) => {
      const result = e.target?.result as string

      if (index === -1) {
        setMainImagePreview(result)
        setMainImageUploading(true)
      } else {
        const newPreviews = [...subImagePreviews]
        newPreviews[index] = result
        setSubImagePreviews(newPreviews)
        setSubImageUploading((prev) => {
          const next = [...prev]
          next[index] = true
          return next
        })
      }

      try {
        const uploaded = await uploadImageToCloudinary(result)
        if (index === -1) {
          setFormData((prev) => ({
            ...prev,
            HinhAnhChinh: uploaded.url,
          }))
        } else {
          setFormData((prev) => {
            const updated = [...(prev.HinhAnhPhu || [])]
            updated[index] = uploaded.url
            return {
              ...prev,
              HinhAnhPhu: updated.filter((img) => img && img.trim() !== ""),
            }
          })
        }
        toast.success("Upload ảnh thành công")
      } catch (error: unknown) {
        const errorMsg = (error as Record<string, unknown>)?.message as string | undefined;
        toast.error(errorMsg || "Không thể upload ảnh. Vui lòng thử lại")
        if (index === -1) {
          setMainImagePreview("")
          setFormData((prev) => ({ ...prev, HinhAnhChinh: "" }))
        } else {
          setSubImagePreviews((prev) => {
            const next = [...prev]
            next[index] = ""
            return next
          })
          setFormData((prev) => {
            const updated = [...(prev.HinhAnhPhu || [])]
            updated.splice(index, 1)
            return { ...prev, HinhAnhPhu: updated }
          })
        }
      } finally {
        if (index === -1) {
          setMainImageUploading(false)
        } else {
          setSubImageUploading((prev) => {
            const next = [...prev]
            next[index] = false
            return next
          })
        }
      }
    }
    reader.readAsDataURL(file)
  }

  const removeImage = (index: number = -1) => {
    if (index === -1) {
      setMainImagePreview("")
      setFormData({ ...formData, HinhAnhChinh: "" })
    } else {
      const newPreviews = [...subImagePreviews]
      newPreviews[index] = ""
      setSubImagePreviews(newPreviews)
      
      const newHinhAnhPhu = [...(formData.HinhAnhPhu || [])]
      newHinhAnhPhu.splice(index, 1)
      setFormData({ ...formData, HinhAnhPhu: newHinhAnhPhu })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.TenSanPham || !formData.TenSanPham.trim()) {
      toast.error("Vui lòng nhập tên sản phẩm")
      return
    }
    
    if (!formData.MaLoaiSanPham) {
      toast.error("Vui lòng chọn loại sản phẩm")
      return
    }
    
    if (!formData.HinhAnhChinh || !formData.HinhAnhChinh.trim()) {
      toast.error("Vui lòng chọn và upload ảnh chính cho sản phẩm")
      return
    }

    if (mainImageUploading || subImageUploading.some((status) => status)) {
      toast.error("Đang upload ảnh, vui lòng đợi hoàn tất")
      return
    }

    // Validate number fields
    if (formData.Gia === undefined || formData.Gia === null || formData.Gia < 0) {
      toast.error("Giá sản phẩm phải lớn hơn hoặc bằng 0")
      return
    }
    
    if (formData.SoLuong === undefined || formData.SoLuong === null || formData.SoLuong < 0) {
      toast.error("Số lượng phải lớn hơn hoặc bằng 0")
      return
    }
    
    if (formData.KhuyenMai !== undefined && (formData.KhuyenMai < 0 || formData.KhuyenMai > 100)) {
      toast.error("Khuyến mãi phải từ 0 đến 100%")
      return
    }

    try {
      setSubmitting(true)
      
      const sanitizedVolumeOptions = ensureVolumeOptionList(formData.DungTichOptions, formData.DungTich ?? null)
        .map((option) => ({
          ...option,
          value: Math.max(0, Number(option.value) || 0),
          label: option.label?.trim() || `${option.value} ml`,
          priceDiff: Number(option.priceDiff) || 0,
          stockDiff: Number(option.stockDiff) || 0,
          sku: option.sku?.trim() || undefined,
        }))
        .filter((option) => option.value > 0)

      if (!sanitizedVolumeOptions.length) {
        toast.error("Vui lòng thêm ít nhất một dung tích hợp lệ")
        return
      }

      const defaultVolume = sanitizedVolumeOptions.find((option) => option.isDefault) || sanitizedVolumeOptions[0]
      sanitizedVolumeOptions.forEach((option) => {
        option.isDefault = option === defaultVolume
      })

      // Prepare payload - đảm bảo đúng kiểu dữ liệu
      const payload: AdminProductPayload = {
        TenSanPham: formData.TenSanPham.trim(),
        MoTa: formData.MoTa?.trim() || "",
        Gia: Number(formData.Gia) || 0,
        KhuyenMai: Number(formData.KhuyenMai) || 0,
        DungTich: defaultVolume?.value,
        DungTichOptions: sanitizedVolumeOptions,
        SoLuong: Number(formData.SoLuong) || 0,
        MaLoaiSanPham: formData.MaLoaiSanPham, // ObjectId của LoaiSanPham
        HinhAnhChinh: formData.HinhAnhChinh?.trim() || "",
        HinhAnhPhu: (formData.HinhAnhPhu || []).filter(img => img && img.trim() !== ""),
      }
      
      if (editingProduct) {
        await adminService.updateProduct(editingProduct._id, payload)
        toast.success("Cập nhật sản phẩm thành công")
      } else {
        await adminService.createProduct(payload)
        toast.success("Thêm sản phẩm thành công")
      }
      
      setIsDialogOpen(false)
      // Refresh data và update charts
      await fetchData()
      // Nếu đang ở trang 1, charts đã được update trong fetchData
      // Nếu không, cần fetch lại để update charts
      if (currentPage !== 1) {
        const allProductsRes = await adminService.getProducts({ page: 1, limit: 1000 })
        const allProductsDataRaw = (allProductsRes as unknown as Record<string, unknown>)?.data;
        const allProductsData = Array.isArray(allProductsDataRaw) ? allProductsDataRaw : 
          (allProductsDataRaw && typeof allProductsDataRaw === 'object' && 'data' in allProductsDataRaw && Array.isArray((allProductsDataRaw as Record<string, unknown>).data)) 
            ? (allProductsDataRaw as Record<string, unknown>).data as Product[]
            : [];
        updateCharts(allProductsData)
      }
    } catch (err: unknown) {
      console.error("Error submitting product:", err)
      const errorRecord = err as Record<string, unknown>;
      const errorMsg = (((errorRecord?.response as Record<string, unknown>)?.data as Record<string, unknown>)?.message as string | undefined) || "Có lỗi xảy ra";
      toast.error(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  const openDeleteDialog = (product: Product) => {
    setDeletingProduct(product)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingProduct) return

    try {
      await adminService.deleteProduct(deletingProduct._id)
      toast.success("Xóa sản phẩm thành công")
      setIsDeleteDialogOpen(false)
      await fetchData()
      // Update charts sau khi xóa
      if (currentPage !== 1) {
        const allProductsRes = await adminService.getProducts({ page: 1, limit: 1000 })
        const allProductsDataRaw = (allProductsRes as unknown as Record<string, unknown>)?.data;
        const allProductsData = Array.isArray(allProductsDataRaw) ? allProductsDataRaw : 
          (allProductsDataRaw && typeof allProductsDataRaw === 'object' && 'data' in allProductsDataRaw && Array.isArray((allProductsDataRaw as Record<string, unknown>).data)) 
            ? (allProductsDataRaw as Record<string, unknown>).data as Product[]
            : [];
        updateCharts(allProductsData)
      }
    } catch (err: unknown) {
      console.error("Error deleting product:", err)
      const errorRecord = err as Record<string, unknown>;
      const errorMsg = (((errorRecord?.response as Record<string, unknown>)?.data as Record<string, unknown>)?.message as string | undefined) || "Không thể xóa sản phẩm"
      toast.error(errorMsg)
    }
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: "Hết hàng", color: "text-red-600" }
    if (stock < 10) return { text: "Sắp hết", color: "text-orange-600" }
    return { text: "Còn hàng", color: "text-green-600" }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý sản phẩm</h1>
          <p className="text-muted-foreground">
            Quản lý danh sách sản phẩm và tồn kho
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isSelectMode ? "default" : "outline"}
            onClick={() => {
              setIsSelectMode(!isSelectMode)
              if (isSelectMode) {
                setSelectedProducts(new Set())
              }
            }}
          >
            {isSelectMode ? (
              <>
                <CheckSquare className="mr-2 h-4 w-4" />
                Đã chọn: {selectedProducts.size}
              </>
            ) : (
              <>
                <CheckSquare className="mr-2 h-4 w-4" />
                Chọn nhiều
              </>
            )}
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm sản phẩm
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên sản phẩm, mô tả, danh mục..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm whitespace-nowrap">Danh mục:</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {(Array.isArray(categories) ? categories : []).map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>
                    {cat.TenLoaiSanPham}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Stock Filter */}
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">Tồn kho:</Label>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Tồn kho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="in">Còn hàng (≥10)</SelectItem>
                <SelectItem value="low">Sắp hết (1-9)</SelectItem>
                <SelectItem value="out">Hết hàng (0)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Clear Filters */}
          {(categoryFilter !== "all" || stockFilter !== "all" || searchQuery) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCategoryFilter("all")
                setStockFilter("all")
                setSearchQuery("")
              }}
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>
        
        {/* Bulk Actions */}
        {isSelectMode && selectedProducts.size > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <span className="text-sm font-medium">
              Đã chọn {selectedProducts.size} sản phẩm:
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={submitting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa sản phẩm
            </Button>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartAreaInteractive
          data={categorySalesChart}
          loading={loading}
          title="Doanh số theo danh mục"
          description="Số lượng bán và doanh thu theo từng danh mục sản phẩm"
        />
        <ChartAreaInteractive
          data={priceTrendChart}
          loading={loading}
          title="Phân bổ theo giá"
          description="Số lượng sản phẩm bán được theo phân khúc giá"
        />
      </div>

      {/* Products Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                {isSelectMode && (
                  <th className="px-4 py-3 text-center w-12">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={handleToggleSelectAll}
                    >
                      {selectedProducts.size === filteredProducts.length && filteredProducts.length > 0 ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                  </th>
                )}
                <th className="px-4 py-3 text-left text-sm font-medium">Tên sản phẩm</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Danh mục</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Giá</th>
                {/* <th className="px-4 py-3 text-right text-sm font-medium">Giá khuyến mãi</th> */}
                <th className="px-4 py-3 text-center text-sm font-medium">Tồn kho</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Đã bán</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isSelectMode ? 8 : 7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Đang tải...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={isSelectMode ? 8 : 7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {searchQuery ? "Không tìm thấy sản phẩm phù hợp" : "Chưa có sản phẩm nào"}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  // MaLoaiSanPham có thể là string (ObjectId) hoặc object (đã populate từ database)
                  const categoryName = typeof product.MaLoaiSanPham === "string" 
                    ? "Không phân loại" 
                    : product.MaLoaiSanPham?.TenLoaiSanPham ?? "Không phân loại"
                  const stockStatus = getStockStatus(product.SoLuong)
                  
                  return (
                    <tr 
                      key={product._id} 
                      className={`border-b hover:bg-muted/50 ${selectedProducts.has(product._id) ? 'bg-primary/5' : ''}`}
                    >
                      {isSelectMode && (
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleToggleSelectProduct(product._id)}
                          >
                            {selectedProducts.has(product._id) ? (
                              <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </Button>
                        </td>
                      )}
                      <td className="px-4 py-3 text-sm font-medium">{product.TenSanPham}</td>
                      <td className="px-4 py-3 text-sm">{categoryName}</td>
                      <td className="px-4 py-3 text-right text-sm">
                        {currencyFormatter.format(product.Gia)}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">{product.SoLuong}</td>
                      <td className="px-4 py-3 text-center text-sm">{product.DaBan}</td>
                      <td className={`px-4 py-3 text-center text-sm font-medium ${stockStatus.color}`}>
                        {stockStatus.text}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditDialog(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openDeleteDialog(product)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Hiển thị {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, total)} trong tổng số {total} sản phẩm
            {searchQuery && ` (${filteredProducts.length} kết quả tìm kiếm)`}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage > 1) setCurrentPage(currentPage - 1)
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPage(pageNum)
                      }}
                      isActive={currentPage === pageNum}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin sản phẩm. Các trường có dấu * là bắt buộc.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="TenSanPham">Tên sản phẩm *</Label>
                <Input
                  id="TenSanPham"
                  value={formData.TenSanPham}
                  onChange={(e) => setFormData({ ...formData, TenSanPham: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="MaLoaiSanPham">Loại sản phẩm *</Label>
                {categories.length === 0 ? (
                  <div className="space-y-2">
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Chưa có loại sản phẩm nào" />
                      </SelectTrigger>
                    </Select>
                    <p className="text-xs text-destructive">
                      ⚠️ Chưa có loại sản phẩm nào. Vui lòng tạo loại sản phẩm trước khi thêm sản phẩm.
                    </p>
                  </div>
                ) : (
                  <Select
                    value={formData.MaLoaiSanPham}
                    onValueChange={(value) => {
                      // MaLoaiSanPham là ObjectId của LoaiSanPham trong database
                      setFormData({ ...formData, MaLoaiSanPham: value })
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại sản phẩm" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Array.isArray(categories) ? categories : []).map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.TenLoaiSanPham}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="MoTa">Mô tả</Label>
                <Textarea
                  id="MoTa"
                  value={formData.MoTa}
                  onChange={(e) => setFormData({ ...formData, MoTa: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Ảnh chính *</Label>
                <div className="flex items-center gap-4">
                  <div className="relative w-32 h-32 border-2 border-dashed border-border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                    {mainImagePreview ? (
                      <>
                        <img 
                          src={mainImagePreview} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(-1)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-destructive/90"
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground text-center px-2">Chưa có ảnh</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        handleImageChange(file, -1)
                      }}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Chọn ảnh chính cho sản phẩm (JPG, PNG, tối đa 5MB)
                    </p>
                    {formData.HinhAnhChinh && (
                      <p className="text-xs text-blue-600 mt-1">
                        Ảnh: {formData.HinhAnhChinh}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ảnh phụ (tối đa 3 ảnh)</Label>
                <div className="grid grid-cols-3 gap-4">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="space-y-2">
                      <div className="relative w-full aspect-square border-2 border-dashed border-border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                        {subImagePreviews[index] ? (
                          <>
                            <img 
                              src={subImagePreviews[index]} 
                              alt={`Preview ${index + 1}`} 
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-destructive/90"
                            >
                              ×
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground text-center px-2">Ảnh {index + 1}</span>
                        )}
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          handleImageChange(file, index)
                        }}
                        className="cursor-pointer text-xs"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Chọn tối đa 3 ảnh phụ cho sản phẩm (JPG, PNG, tối đa 5MB mỗi ảnh)
                </p>
                {(formData.HinhAnhPhu || []).length > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    Đã chọn: {(formData.HinhAnhPhu || []).join(", ")}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="Gia">Giá (VNĐ) *</Label>
                <Input
                  id="Gia"
                  type="number"
                  min="0"
                  value={formData.Gia}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : Number(e.target.value);
                    setFormData({ ...formData, Gia: isNaN(value) ? 0 : Math.max(0, value) });
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="KhuyenMai">Giảm giá (%)</Label>
                <Input
                  id="KhuyenMai"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.KhuyenMai || 0}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : Number(e.target.value);
                    setFormData({ ...formData, KhuyenMai: isNaN(value) ? 0 : Math.max(0, Math.min(100, value)) });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="SoLuong">Số lượng *</Label>
                <Input
                  id="SoLuong"
                  type="number"
                  min="0"
                  value={formData.SoLuong || 0}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : Number(e.target.value);
                    setFormData({ ...formData, SoLuong: isNaN(value) ? 0 : Math.max(0, value) });
                  }}
                  required
                />
              </div>
            </div>

            {/* DungTichOptions Section */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Dung tích sản phẩm *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddVolumeOption}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Thêm dung tích
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Thêm các dung tích có sẵn cho sản phẩm. Ít nhất một dung tích là bắt buộc.
              </p>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {formData.DungTichOptions && formData.DungTichOptions.length > 0 ? (
                  formData.DungTichOptions.map((option, index) => (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg space-y-3 ${
                        option.isDefault ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium">
                            Dung tích {index + 1}
                            {option.isDefault && (
                              <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                                Mặc định
                              </span>
                            )}
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefaultVolumeOption(index)}
                            disabled={option.isDefault}
                            className="h-8 text-xs"
                          >
                            {option.isDefault ? 'Đã chọn' : 'Đặt mặc định'}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveVolumeOption(index)}
                            disabled={formData.DungTichOptions && formData.DungTichOptions.length <= 1}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-5">
                        <div className="space-y-2">
                          <Label htmlFor={`volume-value-${index}`} className="text-xs">
                            Dung tích (ml) *
                          </Label>
                          <Input
                            id={`volume-value-${index}`}
                            type="number"
                            min="1"
                            value={option.value || ''}
                            onChange={(e) =>
                              handleVolumeOptionChange(index, 'value', Number(e.target.value) || 0)
                            }
                            required
                            className="h-9"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`volume-label-${index}`} className="text-xs">
                            Nhãn hiển thị
                          </Label>
                          <Input
                            id={`volume-label-${index}`}
                            type="text"
                            value={option.label || ''}
                            onChange={(e) =>
                              handleVolumeOptionChange(index, 'label', e.target.value)
                            }
                            placeholder={`${option.value || 0} ml`}
                            className="h-9"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`volume-priceDiff-${index}`} className="text-xs">
                            Chênh lệch giá (VNĐ)
                          </Label>
                          <Input
                            id={`volume-priceDiff-${index}`}
                            type="number"
                            value={option.priceDiff || 0}
                            onChange={(e) =>
                              handleVolumeOptionChange(
                                index,
                                'priceDiff',
                                Number(e.target.value) || 0
                              )
                            }
                            placeholder="0"
                            className="h-9"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`volume-stockDiff-${index}`} className="text-xs">
                            Chênh lệch tồn kho
                          </Label>
                          <Input
                            id={`volume-stockDiff-${index}`}
                            type="number"
                            value={option.stockDiff || 0}
                            onChange={(e) =>
                              handleVolumeOptionChange(
                                index,
                                'stockDiff',
                                Number(e.target.value) || 0
                              )
                            }
                            placeholder="0"
                            className="h-9"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`volume-sku-${index}`} className="text-xs">
                            SKU
                          </Label>
                          <Input
                            id={`volume-sku-${index}`}
                            type="text"
                            value={option.sku || ''}
                            onChange={(e) =>
                              handleVolumeOptionChange(index, 'sku', e.target.value)
                            }
                            placeholder="Mã SKU"
                            className="h-9"
                          />
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>• Giá = Giá cơ bản + Chênh lệch giá</p>
                        <p>• Tồn kho = Tồn kho cơ bản + Chênh lệch</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 border border-dashed border-border rounded-lg text-center text-sm text-muted-foreground">
                    Chưa có dung tích nào. Nhấn "Thêm dung tích" để thêm.
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Đang xử lý..." : editingProduct ? "Cập nhật" : "Thêm mới"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa sản phẩm</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa sản phẩm "{deletingProduct?.TenSanPham}"? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

