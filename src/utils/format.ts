/**
 * Format utilities
 */

/**
 * Format number as Vietnamese currency
 * @param value - Number to format
 * @returns Formatted currency string (e.g., "1.000.000 ₫")
 */
export const formatCurrency = (value: number): string => {
  return value.toLocaleString('vi-VN', { 
    style: 'currency', 
    currency: 'VND',
    maximumFractionDigits: 0 
  });
};

/**
 * Format number as Vietnamese currency without currency symbol
 * @param value - Number to format
 * @returns Formatted number string (e.g., "1.000.000")
 */
export const formatNumber = (value: number): string => {
  return value.toLocaleString('vi-VN');
};

