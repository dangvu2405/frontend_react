/**
 * MMO Shop Service
 * 
 * Service for interacting with MMO Shop API endpoints.
 * This service handles fetching MMO products (Gold, Items, Accounts, Services)
 * and integrates with the existing cart and order system.
 * 
 * @see docs/MMO_SHOP_API_PROMPT.md for API documentation
 */

import axiosInstance from '@/lib/api/axios';
import { apiCache } from '@/utils/apiCache';
import type { ApiListResponse, ApiItemResponse, Pagination } from '@/types/models/common';

export interface MMOProduct {
  id: string;
  name: string;
  category: 'gold' | 'items' | 'accounts' | 'services';
  game: string;
  price: number;
  stock: number;
  description: string;
  image?: string;
  status: 'active' | 'inactive' | 'out_of_stock';
  createdAt: string;
  updatedAt: string;
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
  category?: 'gold' | 'items' | 'accounts' | 'services' | 'all';
  game?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'name_asc';
  inStock?: boolean;
}

export interface MMOProductCategory {
  id: string;
  name: string;
  count: number;
}

export interface MMOShopStats {
  totalProducts: number;
  totalByCategory: {
    gold: number;
    items: number;
    accounts: number;
    services: number;
  };
  totalByStatus: {
    active: number;
    inactive: number;
    out_of_stock: number;
  };
  totalRevenue: number;
  totalOrders: number;
  lowStockProducts: number;
  topGames: Array<{
    game: string;
    productCount: number;
    revenue: number;
  }>;
}

export const mmoShopService = {
  /**
   * Get list of MMO products with filters and pagination
   */
  getProducts: async (params?: GetProductsParams): Promise<{
    products: MMOProduct[];
    pagination?: Pagination;
  }> => {
    const cacheKey = `mmo-products:${JSON.stringify(params || {})}`;
    
    const cached = apiCache.get<{ products: MMOProduct[]; pagination?: Pagination }>(cacheKey);
    if (cached && cached.products && cached.products.length > 0) {
      return cached;
    }

    if (import.meta.env.DEV) {
      console.log('[mmoShopService] Fetching products with params:', params);
    }

    const response = await axiosInstance.get<ApiListResponse<MMOProduct>>(
      '/api/mmo-shop/products',
      { params }
    );

    const responseData = response.data as Record<string, unknown>;
    let products: MMOProduct[] = [];
    let pagination: Pagination | undefined = undefined;

    if (responseData && 'data' in responseData && Array.isArray(responseData.data)) {
      products = responseData.data;
      pagination = responseData.pagination as Pagination | undefined;
    } else if (Array.isArray(responseData)) {
      products = responseData;
    }

    const result = {
      products: products ?? [],
      pagination,
    };

    apiCache.set(cacheKey, result, 5 * 60 * 1000); // Cache for 5 minutes
    return result;
  },

  /**
   * Get single MMO product by ID
   */
  getProduct: async (id: string): Promise<MMOProduct> => {
    const cacheKey = `mmo-product:${id}`;
    
    const cached = apiCache.get<MMOProduct>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await axiosInstance.get<ApiItemResponse<MMOProduct>>(
      `/api/mmo-shop/products/${id}`
    );

    const product = response.data.data;
    if (!product) {
      throw new Error('Product not found');
    }
    apiCache.set(cacheKey, product, 5 * 60 * 1000); // Cache for 5 minutes
    return product;
  },

  /**
   * Get list of available games
   */
  getGames: async (): Promise<string[]> => {
    const cacheKey = 'mmo-games';
    
    const cached = apiCache.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await axiosInstance.get<{ success: boolean; data: string[] }>(
      '/api/mmo-shop/games'
    );

    const games = response.data.data || [];
    apiCache.set(cacheKey, games, 30 * 60 * 1000); // Cache for 30 minutes
    return games;
  },

  /**
   * Get list of categories with product counts
   */
  getCategories: async (): Promise<MMOProductCategory[]> => {
    const cacheKey = 'mmo-categories';
    
    const cached = apiCache.get<MMOProductCategory[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await axiosInstance.get<{
      success: boolean;
      data: MMOProductCategory[];
    }>('/api/mmo-shop/categories');

    const categories = response.data.data || [];
    apiCache.set(cacheKey, categories, 30 * 60 * 1000); // Cache for 30 minutes
    return categories;
  },

  // ========== Admin Endpoints ==========

  /**
   * Create new MMO product (Admin only)
   */
  createProduct: async (data: {
    Ten: string; // Backend expects "Ten" not "name"
    Loai: 'gold' | 'items' | 'accounts' | 'services'; // Backend expects "Loai" not "category"
    Game: string; // Backend expects "Game" not "game"
    Gia: number; // Backend expects "Gia" not "price"
    SoLuong: number; // Backend expects "SoLuong" not "stock"
    MoTa?: string; // Backend expects "MoTa" not "description"
    HinhAnh?: string; // Backend expects "HinhAnh" not "image"
    TrangThai?: 'active' | 'inactive'; // Backend expects "TrangThai" not "status"
  }): Promise<MMOProduct> => {
    const response = await axiosInstance.post<{
      success: boolean;
      message: string;
      data: MMOProduct;
    }>('/admin/mmo-shop/products', data);

    // Clear all cache (simpler approach - MMO products are not cached frequently)
    apiCache.clear();
    
    return response.data.data;
  },

  /**
   * Update MMO product (Admin only)
   */
  updateProduct: async (
    id: string,
    data: Partial<{
      Ten: string;
      Loai: 'gold' | 'items' | 'accounts' | 'services';
      Game: string;
      Gia: number;
      SoLuong: number;
      MoTa: string;
      HinhAnh: string;
      TrangThai: 'active' | 'inactive';
    }>
  ): Promise<MMOProduct> => {
    const response = await axiosInstance.put<{
      success: boolean;
      message: string;
      data: MMOProduct;
    }>(`/admin/mmo-shop/products/${id}`, data);

    // Clear all cache (simpler approach - MMO products are not cached frequently)
    apiCache.clear();
    
    return response.data.data;
  },

  /**
   * Delete MMO product (Admin only)
   */
  deleteProduct: async (id: string): Promise<void> => {
    await axiosInstance.delete<{
      success: boolean;
      message: string;
    }>(`/admin/mmo-shop/products/${id}`);

    // Clear all cache (simpler approach - MMO products are not cached frequently)
    apiCache.clear();
  },

  /**
   * Get MMO shop statistics (Admin only)
   */
  getStats: async (): Promise<MMOShopStats> => {
    const response = await axiosInstance.get<{
      success: boolean;
      data: MMOShopStats;
    }>('/admin/mmo-shop/stats');

    return response.data.data;
  },
};
