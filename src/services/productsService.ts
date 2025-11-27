import axiosInstance from "./axios";
import { apiCache } from "@/utils/apiCache";
import type { ApiItemResponse, ApiListResponse, Pagination, Product, ProductVolumeOption } from "@/types/models";

const normalizeVolumeOptions = (options?: ProductVolumeOption[], fallbackVolume?: number | null): ProductVolumeOption[] => {
  let normalized: ProductVolumeOption[] = Array.isArray(options) ? options.filter(Boolean) : [];

  if (!normalized.length && fallbackVolume) {
    normalized = [{
      value: fallbackVolume,
      label: `${fallbackVolume} ml`,
      isDefault: true,
    }];
  }

  normalized = normalized.map((option, index) => {
    const value = Number(option.value);
    if (!Number.isFinite(value) || value < 0) return null;

    return {
      value,
      label: option.label || `${value} ml`,
      priceDiff: option.priceDiff || 0,
      stockDiff: option.stockDiff || 0,
      sku: option.sku,
      isDefault: option.isDefault ?? index === 0,
    };
  }).filter(Boolean) as ProductVolumeOption[];

  if (!normalized.some(option => option.isDefault) && normalized.length) {
    normalized[0].isDefault = true;
  }

  return normalized;
};

const normalizeProduct = (product: Product): Product => {
  const options = normalizeVolumeOptions(product.DungTichOptions, product.DungTich);
  const derivedVolume = options.find(opt => opt.isDefault)?.value;
  return {
    ...product,
    DungTichOptions: options,
    DungTich: product.DungTich ?? derivedVolume,
  };
};

export const productsService = {
  getAllProducts: async (params?: { page?: number; limit?: number }): Promise<{ products: Product[]; pagination?: Pagination }> => {
    try {
      const cacheKey = `products:${JSON.stringify(params || {})}`;
      
      const cached = apiCache.get<{ products: Product[]; pagination?: Pagination }>(cacheKey);
      if (cached && cached.products && cached.products.length > 0) {
        return cached;
      }

      if (import.meta.env.DEV) {
        console.log('[productsService] Fetching products with params:', params);
      }

      const response = await axiosInstance.get<ApiListResponse<Product>>("/api/products", { params });
      const responseData = response.data as any;

      if (import.meta.env.DEV) {
        console.log('[productsService] Raw response for getAllProducts:', responseData);
      }
      
      let products: Product[] = [];
      let pagination: Pagination | undefined = undefined;
      
      if (responseData && 'data' in responseData && Array.isArray(responseData.data)) {
        products = responseData.data;
        pagination = responseData.pagination;
      } else if (Array.isArray(responseData)) {
        products = responseData;
      } else if (responseData && 'products' in responseData && Array.isArray(responseData.products)) {
        products = responseData.products;
        pagination = responseData.pagination;
      } else if (responseData && typeof responseData === 'object') {
        for (const key of Object.keys(responseData)) {
          if (Array.isArray(responseData[key])) {
            products = responseData[key];
            if (responseData.pagination) {
              pagination = responseData.pagination;
            }
            break;
          }
        }
      }
      
      const result = {
        products: (products ?? []).map(normalizeProduct),
        pagination: pagination
      };

      if (result.products.length > 0) {
        apiCache.set(cacheKey, result, 5 * 60 * 1000);
      }

      return result;
    } catch (error: any) {
      throw error;
    }
  },

  getProductById: async (id: string): Promise<Product | null> => {
    try {
      const cacheKey = `product:${id}`;
      
      const cached = apiCache.get<Product>(cacheKey);
      if (cached) {
        return cached;
      }

      if (import.meta.env.DEV) {
        console.log(`[productsService] Fetching product detail: ${id}`);
      }

      const response = await axiosInstance.get<ApiItemResponse<Product>>(`/api/products/${id}`);
      const responseData = response.data as any;

      if (import.meta.env.DEV) {
        console.log('[productsService] Raw response for getProductById:', responseData);
      }
      
      let product: Product | null = null;
      
      // ✅ Backend trả { success, product } - check 'product' trước
      if (responseData && 'product' in responseData && responseData.product) {
        product = responseData.product as Product;
      } else if (responseData && 'data' in responseData && responseData.data) {
        // Fallback: nếu có 'data' thì dùng
        product = responseData.data as Product;
      } else if (responseData && typeof responseData === 'object' && !responseData.success && !Array.isArray(responseData)) {
        // Fallback: nếu responseData chính là product object
        if (responseData._id || responseData.id) {
          product = responseData as Product;
        }
      }

      if (product) {
        const normalizedProduct = normalizeProduct(product);
        apiCache.set(cacheKey, normalizedProduct, 10 * 60 * 1000);
        return normalizedProduct;
      }

      return null;
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error(`Error fetching product ${id}:`, error);
      }
      throw error;
    }
  },

  getProductsByCategory: async (category: string): Promise<Product[]> => {
    try {
      const response = await axiosInstance.get<ApiListResponse<Product>>(`/api/products?loaiSP=${category}`);
      const responseData = response.data as unknown as ApiListResponse<Product>;
      return (responseData && 'data' in responseData ? responseData.data : []) ?? [];
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error(`Error fetching products by category ${category}:`, error);
      }
      throw error;
    }
  },

  searchProducts: async (keyword: string): Promise<Product[]> => {
    try {
      const response = await axiosInstance.get<ApiListResponse<Product>>(`/api/products/search?q=${keyword}`);
      const responseData = response.data as unknown as ApiListResponse<Product>;
      return (responseData && 'data' in responseData ? responseData.data : []) ?? [];
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error(`Error searching products with keyword ${keyword}:`, error);
      }
      throw error;
    }
  },
};
