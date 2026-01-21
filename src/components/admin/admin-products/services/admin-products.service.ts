import axiosInstance from '@/services/axios';
import type { Product } from '@/types/models';
import type { AdminProductsFormState } from '../types';

export interface ProductQuery {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
}

const ADMIN_PRODUCTS_ENDPOINT = '/admin/products';
const ADMIN_CATEGORIES_ENDPOINT = '/admin/categories';
const PRODUCT_UPLOAD_ENDPOINT = '/admin/products/upload-image';

const adminProductsService = {
  getProducts(params: ProductQuery) {
    return axiosInstance.get(ADMIN_PRODUCTS_ENDPOINT, { params });
  },

  getCategories() {
    return axiosInstance.get(ADMIN_CATEGORIES_ENDPOINT);
  },

  uploadImage(base64: string) {
    return axiosInstance.post(PRODUCT_UPLOAD_ENDPOINT, { file: base64 });
  },

  createProduct(payload: Partial<AdminProductsFormState>) {
    return axiosInstance.post(ADMIN_PRODUCTS_ENDPOINT, payload);
  },

  updateProduct(productId: string, payload: Partial<AdminProductsFormState>) {
    return axiosInstance.put(`${ADMIN_PRODUCTS_ENDPOINT}/${productId}`, payload);
  },

  deleteProduct(productId: string) {
    return axiosInstance.delete(`${ADMIN_PRODUCTS_ENDPOINT}/${productId}`);
  },

  getProduct(productId: string) {
    return axiosInstance.get<Product>(`${ADMIN_PRODUCTS_ENDPOINT}/${productId}`);
  },
};

export default adminProductsService;

