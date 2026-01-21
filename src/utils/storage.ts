import type { ProductVolumeOption } from '@/types/models';

// Storage utility cho localStorage
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  CART: 'cart',
  HEARTS: 'hearts', // Danh sách product IDs đã yêu thích
} as const;

const normalizeVolumeOption = (option?: ProductVolumeOption | null): ProductVolumeOption | undefined => {
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

const buildCartItemId = (productId: string, option?: ProductVolumeOption | null): string => {
  const suffix = option && option.value !== undefined && option.value !== null
    ? `volume-${option.value}`
    : 'default';
  return `${productId}::${suffix}`;
};

export interface CartItemInput {
  productId: string;
  tenSP: string;
  basePrice: number;
  giamGia?: number;
  hinhAnh?: string;
  loaiSP?: string;
  selectedDungTich?: ProductVolumeOption | null;
  volumeOptions?: ProductVolumeOption[];
}

export interface CartItem {
  id: string;
  productId: string;
  tenSP: string;
  gia: number;
  basePrice: number;
  giamGia?: number;
  hinhAnh?: string;
  loaiSP?: string;
  quantity: number;
  selectedDungTich?: ProductVolumeOption;
  volumeOptions?: ProductVolumeOption[];
}

const hydrateCartItem = (raw: unknown): CartItem | null => {
  if (!raw) return null;
  const rawRecord = raw as Record<string, unknown>;
  const idSanPham = rawRecord.IdSanPham as Record<string, unknown> | string | undefined;
  const productId = rawRecord.productId || 
    (typeof idSanPham === 'object' && idSanPham?._id ? idSanPham._id : idSanPham) || 
    (typeof rawRecord.id === 'string' ? rawRecord.id.split('::')[0] : null);
  if (!productId) {
    return null;
  }

  const selectedDungTichValue = rawRecord.selectedDungTich || rawRecord.SelectedDungTich;
  const normalizedVolume = normalizeVolumeOption(selectedDungTichValue as ProductVolumeOption | null | undefined);
  const storedBasePrice = Number(rawRecord.basePrice ?? rawRecord.base_price ?? rawRecord.base ?? 0);
  const legacyPrice = Number(rawRecord.gia ?? rawRecord.Gia ?? 0);
  const basePrice = Number.isFinite(storedBasePrice) && storedBasePrice > 0
    ? storedBasePrice
    : Math.max(0, legacyPrice - (normalizedVolume?.priceDiff || 0));

  const finalPrice = basePrice + (normalizedVolume?.priceDiff || 0);
  const normalizedId = (typeof rawRecord.id === 'string' && rawRecord.id.includes('::'))
    ? rawRecord.id
    : buildCartItemId(String(productId), normalizedVolume);

  const normalizedOptions = Array.isArray(rawRecord.volumeOptions)
    ? rawRecord.volumeOptions.map(normalizeVolumeOption).filter(Boolean) as ProductVolumeOption[]
    : undefined;

  return {
    id: normalizedId,
    productId: String(productId),
    tenSP: String(rawRecord.tenSP || rawRecord.TenSanPham || 'Sản phẩm'),
    gia: finalPrice,
    basePrice,
    giamGia: Number(rawRecord.giamGia ?? rawRecord.KhuyenMai ?? 0),
    hinhAnh: String(rawRecord.hinhAnh || rawRecord.HinhAnhChinh || ''),
    loaiSP: String(rawRecord.loaiSP || rawRecord.LoaiSanPham || ''),
    quantity: Math.max(1, Number(rawRecord.quantity ?? rawRecord.SoLuong ?? 1)),
    selectedDungTich: normalizedVolume || undefined,
    volumeOptions: normalizedOptions && normalizedOptions.length ? normalizedOptions : undefined,
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
    const normalizedSelected = normalizeVolumeOption(item.selectedDungTich);
    const normalizedOptions = Array.isArray(item.volumeOptions)
      ? item.volumeOptions.map(normalizeVolumeOption).filter(Boolean) as ProductVolumeOption[]
      : undefined;
    const defaultOption = normalizedSelected
      || normalizedOptions?.find(opt => opt?.isDefault)
      || normalizedOptions?.[0];

    const basePrice = Number(item.basePrice) || 0;
    const finalBasePrice = basePrice + (defaultOption?.priceDiff || 0);

    const cartId = buildCartItemId(item.productId, defaultOption);
    const current = storage.getCart();
    const index = current.findIndex(p => p.id === cartId);

    if (index >= 0) {
      current[index].quantity = Math.max(1, (current[index].quantity || 0) + qty);
    } else {
      current.push({
        id: cartId,
        productId: item.productId,
        tenSP: item.tenSP,
        gia: finalBasePrice,
        basePrice,
        giamGia: item.giamGia || 0,
        hinhAnh: item.hinhAnh || '',
        loaiSP: item.loaiSP || '',
        quantity: qty,
        selectedDungTich: defaultOption || undefined,
        volumeOptions: normalizedOptions && normalizedOptions.length ? normalizedOptions : undefined,
      });
    }

    storage.setCart(current);
    return current;
  },

  updateCartItemQuantity: (productId: string, quantity: number): CartItem[] => {
    const current = storage.getCart();
    const idx = current.findIndex(p => p.id === productId);
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

  updateCartItemVolume: (cartItemId: string, option: ProductVolumeOption): CartItem[] => {
    const normalizedOption = normalizeVolumeOption(option);
    if (!normalizedOption) return storage.getCart();

    const current = storage.getCart();
    const idx = current.findIndex(item => item.id === cartItemId);
    if (idx === -1) return current;

    const target = current[idx];
    const productId = target.productId || (typeof target.id === 'string' ? target.id.split('::')[0] : '');
    if (!productId) return current;

    const basePrice = Number(target.basePrice ?? target.gia) || 0;
    const newId = buildCartItemId(productId, normalizedOption);
    const finalPrice = basePrice + (normalizedOption.priceDiff || 0);

    const duplicateIndex = current.findIndex((item, position) => position !== idx && item.id === newId);
    if (duplicateIndex >= 0) {
      current[duplicateIndex].quantity = Math.max(1, (current[duplicateIndex].quantity || 0) + (target.quantity || 1));
      current.splice(idx, 1);
    } else {
      current[idx] = {
        ...target,
        id: newId,
        productId,
        gia: finalPrice,
        selectedDungTich: normalizedOption,
        volumeOptions: target.volumeOptions?.map(opt => ({
          ...(opt || {}),
          isDefault: Number(opt?.value) === Number(normalizedOption.value)
        }))
      };
    }

    storage.setCart(current);
    return current;
  },

  removeCartItem: (productId: string): CartItem[] => {
    const current = storage.getCart().filter(p => p.id !== productId);
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

  setHearts: (productIds: string[]): void => {
    localStorage.setItem(STORAGE_KEYS.HEARTS, JSON.stringify(productIds));
    window.dispatchEvent(new CustomEvent('hearts:updated'));
  },

  addHeart: (productId: string): void => {
    const hearts = storage.getHearts();
    if (!hearts.includes(productId)) {
      storage.setHearts([...hearts, productId]);
    }
  },

  removeHeart: (productId: string): void => {
    const hearts = storage.getHearts();
    storage.setHearts(hearts.filter(id => id !== productId));
  },

  isHeart: (productId: string): boolean => {
    const hearts = storage.getHearts();
    return hearts.includes(productId);
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
