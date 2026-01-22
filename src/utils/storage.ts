import type { ProjectIncludesOption } from '@/types/models';

// Storage utility cho localStorage
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  CART: 'cart',
  HEARTS: 'hearts', // Danh sách project IDs đã yêu thích
} as const;

const normalizeIncludesOption = (option?: ProjectIncludesOption | null): ProjectIncludesOption | undefined => {
  if (!option) return undefined;
  const value = Number(option.value);
  if (!Number.isFinite(value)) {
    return undefined;
  }
  return {
    value,
    label: option.label || `${value} ml`,
    priceDiff: Number(option.priceDiff) || 0,
    stockDiff: Number(option.stockDiff) || 0,
    sku: option.sku,
    isDefault: Boolean(option.isDefault),
  };
};

const buildCartItemId = (projectId: string, option?: ProjectIncludesOption | null): string => {
  const suffix = option && option.value !== undefined && option.value !== null
    ? `includes-${option.value}`
    : 'default';
  return `${projectId}::${suffix}`;
};

export interface CartItemInput {
  projectId: string;
  tenSP: string;
  basePrice: number;
  giamGia?: number;
  hinhAnh?: string;
  loaiSP?: string;
  selectedDungTich?: ProjectIncludesOption | null;
  includesOptions?: ProjectIncludesOption[];
}

export interface CartItem {
  id: string;
  projectId: string;
  tenSP: string;
  gia: number;
  basePrice: number;
  giamGia?: number;
  hinhAnh?: string;
  loaiSP?: string;
  quantity: number;
  selectedDungTich?: ProjectIncludesOption;
  includesOptions?: ProjectIncludesOption[];
}

const hydrateCartItem = (raw: unknown): CartItem | null => {
  if (!raw) return null;
  const rawRecord = raw as Record<string, unknown>;
  const idSanPham = rawRecord.IdSanPham as Record<string, unknown> | string | undefined;
  const projectId = rawRecord.projectId || 
    (typeof idSanPham === 'object' && idSanPham?._id ? idSanPham._id : idSanPham) || 
    (typeof rawRecord.id === 'string' ? rawRecord.id.split('::')[0] : null);
  if (!projectId) {
    return null;
  }

  const selectedDungTichValue = rawRecord.selectedDungTich || rawRecord.SelectedDungTich;
  const normalizedIncludes = normalizeIncludesOption(selectedDungTichValue as ProjectIncludesOption | null | undefined);
  const storedBasePrice = Number(rawRecord.basePrice ?? rawRecord.base_price ?? rawRecord.base ?? 0);
  const legacyPrice = Number(rawRecord.gia ?? rawRecord.Gia ?? 0);
  const basePrice = Number.isFinite(storedBasePrice) && storedBasePrice > 0
    ? storedBasePrice
    : Math.max(0, legacyPrice - (normalizedIncludes?.priceDiff || 0));

  const finalPrice = basePrice + (normalizedIncludes?.priceDiff || 0);
  const normalizedId = (typeof rawRecord.id === 'string' && rawRecord.id.includes('::'))
    ? rawRecord.id
    : buildCartItemId(String(projectId), normalizedIncludes);

  const normalizedOptions = Array.isArray(rawRecord.includesOptions)
    ? rawRecord.includesOptions.map(normalizeIncludesOption).filter(Boolean) as ProjectIncludesOption[]
    : undefined;

  return {
    id: normalizedId,
    projectId: String(projectId),
    tenSP: String(rawRecord.tenSP || rawRecord.TenSanPham || 'Đồ án'),
    gia: finalPrice,
    basePrice,
    giamGia: Number(rawRecord.giamGia ?? rawRecord.KhuyenMai ?? 0),
    hinhAnh: String(rawRecord.hinhAnh || rawRecord.HinhAnhChinh || ''),
    loaiSP: String(rawRecord.loaiSP || rawRecord.LoaiSanPham || ''),
    quantity: Math.max(1, Number(rawRecord.quantity ?? rawRecord.SoLuong ?? 1)),
    selectedDungTich: normalizedIncludes || undefined,
    includesOptions: normalizedOptions && normalizedOptions.length ? normalizedOptions : undefined,
  };
};

export const storage = {
  // Token methods
  getToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  setToken: (token: string): void => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  removeToken: (): void => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  // Refresh Token methods
  getRefreshToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  setRefreshToken: (token: string): void => {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  removeRefreshToken: (): void => {
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  // User methods
  getUser: () => {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },

  setUser: (user: unknown): void => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  removeUser: (): void => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },
  // Cart basic storage
  getCart: (): CartItem[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CART);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.map(hydrateCartItem).filter((item): item is CartItem => Boolean(item));
    } catch {
      return [];
    }
  },
  setCart: (cart: CartItem[]): void => {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart || []));
  },
  removeCart: (): void => {
    localStorage.removeItem(STORAGE_KEYS.CART);
  },

  // Cart helpers
  addCartItem: (item: CartItemInput, quantity: number = 1): CartItem[] => {
    const qty = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;
    const normalizedSelected = normalizeIncludesOption(item.selectedDungTich);
    const normalizedOptions = Array.isArray(item.includesOptions)
      ? item.includesOptions.map(normalizeIncludesOption).filter(Boolean) as ProjectIncludesOption[]
      : undefined;
    const defaultOption = normalizedSelected
      || normalizedOptions?.find(opt => opt?.isDefault)
      || normalizedOptions?.[0];

    const basePrice = Number(item.basePrice) || 0;
    const finalBasePrice = basePrice + (defaultOption?.priceDiff || 0);

    const cartId = buildCartItemId(item.projectId, defaultOption);
    const current = storage.getCart();
    const index = current.findIndex(p => p.id === cartId);

    if (index >= 0) {
      current[index].quantity = Math.max(1, (current[index].quantity || 0) + qty);
    } else {
      current.push({
        id: cartId,
        projectId: item.projectId,
        tenSP: item.tenSP,
        gia: finalBasePrice,
        basePrice,
        giamGia: item.giamGia || 0,
        hinhAnh: item.hinhAnh || '',
        loaiSP: item.loaiSP || '',
        quantity: qty,
        selectedDungTich: defaultOption || undefined,
        includesOptions: normalizedOptions && normalizedOptions.length ? normalizedOptions : undefined,
      });
    }

    storage.setCart(current);
    return current;
  },

  updateCartItemQuantity: (projectId: string, quantity: number): CartItem[] => {
    const current = storage.getCart();
    const idx = current.findIndex(p => p.id === projectId);
    if (idx === -1) return current;
    const qty = Math.floor(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      current.splice(idx, 1);
    } else {
      current[idx].quantity = qty;
    }
    storage.setCart(current);
    return current;
  },

  updateCartItemIncludes: (cartItemId: string, option: ProjectIncludesOption): CartItem[] => {
    const normalizedOption = normalizeIncludesOption(option);
    if (!normalizedOption) return storage.getCart();

    const current = storage.getCart();
    const idx = current.findIndex(item => item.id === cartItemId);
    if (idx === -1) return current;

    const target = current[idx];
    const projectId = target.projectId || (typeof target.id === 'string' ? target.id.split('::')[0] : '');
    if (!projectId) return current;

    const basePrice = Number(target.basePrice ?? target.gia) || 0;
    const newId = buildCartItemId(projectId, normalizedOption);
    const finalPrice = basePrice + (normalizedOption.priceDiff || 0);

    const duplicateIndex = current.findIndex((item, position) => position !== idx && item.id === newId);
    if (duplicateIndex >= 0) {
      current[duplicateIndex].quantity = Math.max(1, (current[duplicateIndex].quantity || 0) + (target.quantity || 1));
      current.splice(idx, 1);
    } else {
      current[idx] = {
        ...target,
        id: newId,
        projectId,
        gia: finalPrice,
        selectedDungTich: normalizedOption,
        includesOptions: target.includesOptions?.map(opt => ({
          ...(opt || {}),
          isDefault: Number(opt?.value) === Number(normalizedOption.value)
        }))
      };
    }

    storage.setCart(current);
    return current;
  },

  removeCartItem: (projectId: string): CartItem[] => {
    const current = storage.getCart().filter(p => p.id !== projectId);
    storage.setCart(current);
    return current;
  },

  clearCart: (): void => {
    storage.setCart([]);
  },

  getCartItemCount: (): number => {
    return storage.getCart().reduce((sum, p) => sum + (p.quantity || 0), 0);
  },

  getCartTotal: (): number => {
    return storage.getCart().reduce((sum, p) => {
      const unit = Number(p.gia) || 0;
      const discount = Number(p.giamGia) || 0;
      const finalUnit = discount > 0 ? Math.round(unit * (1 - discount / 100)) : unit;
      return sum + finalUnit * (p.quantity || 0);
    }, 0);
  },

  // Heart (Favorite) methods
  getHearts: (): string[] => {
    try {
      const hearts = localStorage.getItem(STORAGE_KEYS.HEARTS);
      if (!hearts) return [];
      const parsed = JSON.parse(hearts);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  setHearts: (projectIds: string[]): void => {
    localStorage.setItem(STORAGE_KEYS.HEARTS, JSON.stringify(projectIds));
    window.dispatchEvent(new CustomEvent('hearts:updated'));
  },

  addHeart: (projectId: string): void => {
    const hearts = storage.getHearts();
    if (!hearts.includes(projectId)) {
      storage.setHearts([...hearts, projectId]);
    }
  },

  removeHeart: (projectId: string): void => {
    const hearts = storage.getHearts();
    storage.setHearts(hearts.filter(id => id !== projectId));
  },

  isHeart: (projectId: string): boolean => {
    const hearts = storage.getHearts();
    return hearts.includes(projectId);
  },

  removeHearts: (): void => {
    localStorage.removeItem(STORAGE_KEYS.HEARTS);
    window.dispatchEvent(new CustomEvent('hearts:updated'));
  },

  // Clear all
  clearAll: (): void => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.CART);
    localStorage.removeItem(STORAGE_KEYS.HEARTS);
  },
};
