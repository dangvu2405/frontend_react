const PLACEHOLDER_IMAGE = 'https://placehold.co/300x300/E5E5EA/000?text=No+Image';
const DEFAULT_API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3001';

// --------- Helpers (bản rút gọn, comment tiếng Việt) ---------
const parseCloudinaryConnectionString = (value: string): string => {
  if (!value) return '';
  const trimmed = value.trim();
  const match = trimmed.match(/^cloudinary:\/\/[^:]+:[^@]+@([^/?]+)/i);
  if (match?.[1]) return match[1];

  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex !== -1 && atIndex < trimmed.length - 1) {
    return trimmed.substring(atIndex + 1).split(/[/?]/)[0] || '';
  }
  return trimmed;
};

const FALLBACK_CLOUDINARY_URL =
  'cloudinary://686864971786299:e2HY_MPTM8XR4vlUDKqmVySC3Rk@dbiabh88k';

const pickCloudinaryUrl = (): string => {
  return (
    [import.meta.env.VITE_CLOUDINARY_URL, import.meta.env.CLOUDINARY_URL, FALLBACK_CLOUDINARY_URL].find(
      (value) => typeof value === 'string' && value.trim()
    )?.trim() || ''
  );
};

const cloudinaryConnectionString = pickCloudinaryUrl();
const CLOUDINARY_CLOUD_NAME = 
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 
  parseCloudinaryConnectionString(cloudinaryConnectionString) ||
  '';

const CLOUDINARY_IMAGE_BASE = CLOUDINARY_CLOUD_NAME
  ? `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`
  : '';
const CLOUDINARY_VIDEO_BASE = CLOUDINARY_CLOUD_NAME
  ? `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload`
  : '';

const isHttpUrl = (value?: string | null): value is string =>
  !!value && (value.startsWith('http://') || value.startsWith('https://'));

const stripLeadingSlash = (value: string) => (value.startsWith('/') ? value.slice(1) : value);

const removeExtension = (value: string) =>
  value.replace(/\.(jpg|jpeg|png|gif|webp|mp4|webm|mov)$/i, '');

const isLocalUploadPath = (value: string) => {
  const normalized = stripLeadingSlash(value);
  return normalized.startsWith('uploads/');
};

const buildLocalUrl = (value: string) => `${DEFAULT_API_BASE}/${stripLeadingSlash(value)}`;

const joinTransforms = (items: (string | undefined | null)[]) =>
  items.filter(Boolean).join(',');

const extractCloudinaryPublicId = (url: string): string | null => {
  if (!url.includes('res.cloudinary.com')) return null;

  // Remove query params
  const cleanedUrl = url.split('?')[0];
  const uploadIndex = cleanedUrl.indexOf('/upload/');
  if (uploadIndex === -1) return null;

  let pathAfterUpload = cleanedUrl.substring(uploadIndex + '/upload/'.length);

  // Remove version prefix (e.g., v1234567890/)
  pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, '');

  // Remove transformation segment (anything before last '/')
  const segments = pathAfterUpload.split('/');
  while (segments.length > 0) {
    const last = segments[segments.length - 1];
    if (last && !last.includes(',')) {
      break;
    }
    segments.pop();
  }

  const lastSegment = segments.pop();
  if (!lastSegment) return null;

  return removeExtension(lastSegment);
};

// --------- Hàm public ---------
export const getImageUrl = (
  imagePath: string | undefined | null,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
    crop?: 'fill' | 'fit' | 'scale' | 'thumb';
  }
): string => {
  if (!imagePath) return PLACEHOLDER_IMAGE;
  if (isHttpUrl(imagePath)) {
    return imagePath.includes('cloudinary.com') && options
      ? applyCloudinaryTransformations(imagePath, options)
      : imagePath;
  }

  if (isLocalUploadPath(imagePath)) {
    return buildLocalUrl(imagePath);
  }

  if (CLOUDINARY_IMAGE_BASE) {
    const transforms = joinTransforms([
      options?.crop || 'fill',
      options?.width ? `w_${options.width}` : '',
      options?.height ? `h_${options.height}` : '',
      options?.quality ? `q_${options.quality}` : 'q_auto',
      `f_${options?.format || 'auto'}`,
    ]);
    return `${CLOUDINARY_IMAGE_BASE}/${transforms}/${stripLeadingSlash(imagePath)}`;
  }

  const localPath = imagePath as string;
  return localPath.startsWith('/') ? localPath : `/${localPath}`;
};

function applyCloudinaryTransformations(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
    crop?: 'fill' | 'fit' | 'scale' | 'thumb';
  }
): string {
  // Tái sử dụng URL có sẵn từ Cloudinary và chèn transform mới
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;
  
  const baseUrl = url.substring(0, uploadIndex + 8);
  const imagePath = url.substring(uploadIndex + 8);
  const transforms = joinTransforms([
    options.crop || 'fill',
    options.width ? `w_${options.width}` : '',
    options.height ? `h_${options.height}` : '',
    options.quality ? `q_${options.quality}` : 'q_auto',
    options.format ? `f_${options.format}` : '',
  ]);

  return `${baseUrl}${transforms}/${imagePath}`;
}

export const getResponsiveImageSrcSet = (
  imagePath: string | undefined | null,
  sizes: number[] = [400, 800, 1200, 1600]
): string =>
  !imagePath
    ? ''
    : sizes
        .map((size) => `${getImageUrl(imagePath, { width: size, quality: 80, format: 'auto' })} ${size}w`)
    .join(', ');

export const getThumbnailUrl = (imagePath: string | undefined | null): string =>
  getImageUrl(imagePath, { width: 300, height: 300, quality: 75, format: 'auto', crop: 'fill' });

export const getSimpleCloudinaryUrl = (imageName: string | undefined | null): string => {
  if (!imageName) return PLACEHOLDER_IMAGE;
  if (isHttpUrl(imageName)) return imageName;
  if (isLocalUploadPath(imageName)) return buildLocalUrl(imageName);
  return CLOUDINARY_IMAGE_BASE
    ? `${CLOUDINARY_IMAGE_BASE}/${stripLeadingSlash(imageName)}`
    : buildLocalUrl(imageName);
};

export const getProjectImageUrl = (
  imagePath: string | undefined | null, 
  useSimpleUrl = false
): string => {
  if (useSimpleUrl) return getSimpleCloudinaryUrl(imagePath);
  return getImageUrl(imagePath, {
    width: 600,
    height: 600,
    quality: 85,
    format: 'auto',
    crop: 'fill',
  });
};

export const getDetailImageUrl = (imagePath: string | undefined | null): string =>
  getImageUrl(imagePath, { width: 1200, height: 1200, quality: 90, format: 'auto', crop: 'fit' });

export const getAvatarUrl = (
  avatarPath: string | undefined | null,
  options?: { width?: number; height?: number; quality?: number }
): string | undefined => {
  if (!avatarPath) return undefined;
  
  // Nếu đã là full URL (http/https), trả về trực tiếp
  if (isHttpUrl(avatarPath)) {
    // Nếu là Cloudinary URL, có thể thêm transformations
    if (avatarPath.includes('cloudinary.com')) {
      // Nếu đã có transformations, giữ nguyên
      if (avatarPath.includes('/image/upload/')) {
        return avatarPath;
      }
      // Nếu chưa có transformations, thêm vào
      if (CLOUDINARY_IMAGE_BASE && options) {
        const transforms = joinTransforms([
          'fill',
          `w_${options.width || 200}`,
          `h_${options.height || 200}`,
          `q_${options.quality || 80}`,
          'f_auto',
        ]);
        // Extract public_id từ URL
        const urlParts = avatarPath.split('/image/upload/');
        if (urlParts.length > 1) {
          const publicId = urlParts[1].split('.')[0]; // Remove extension
          return `${CLOUDINARY_IMAGE_BASE}/${transforms}/${publicId}`;
        }
      }
    }
    return avatarPath;
  }
  
  // Nếu là local upload path
  if (isLocalUploadPath(avatarPath)) {
    return buildLocalUrl(avatarPath);
  }

  // Xử lý Cloudinary public_id hoặc path
  if (CLOUDINARY_IMAGE_BASE) {
    const transforms = joinTransforms([
      'fill',
      `w_${options?.width || 200}`,
      `h_${options?.height || 200}`,
      `q_${options?.quality || 80}`,
      'f_auto',
    ]);

    let cleanPath = removeExtension(stripLeadingSlash(avatarPath));
    // Nếu path không có folder prefix, thêm avatars/
    if (!cleanPath.includes('/') && !cleanPath.startsWith('avatars/')) {
      cleanPath = `avatars/${cleanPath}`;
    }
    return `${CLOUDINARY_IMAGE_BASE}/${transforms}/${cleanPath}`;
  }

  // Fallback: local uploads
  let cleanPath = stripLeadingSlash(avatarPath);
  if (!cleanPath.startsWith('uploads/')) cleanPath = `uploads/${cleanPath}`;
  return `${DEFAULT_API_BASE}/${cleanPath}`;
};

export const getVideoUrl = (
  videoPath: string | undefined | null,
  options?: { width?: number; height?: number; quality?: 'auto' | number; format?: 'auto' | 'mp4' | 'webm' },
  version?: string
): string => {
  if (!videoPath) return '';
  if (isHttpUrl(videoPath)) return videoPath;
  if (isLocalUploadPath(videoPath)) return buildLocalUrl(videoPath);
  if (!CLOUDINARY_VIDEO_BASE) {
    const localVideoPath = videoPath as string;
    return localVideoPath.startsWith('/') ? localVideoPath : `/${localVideoPath}`;
  }

  const transforms = joinTransforms([
    options?.width ? `w_${options.width}` : '',
    options?.height ? `h_${options.height}` : '',
    options?.quality ? `q_${options.quality === 'auto' ? 'auto' : options.quality}` : '',
    options?.format ? `f_${options.format === 'auto' ? 'auto' : options.format}` : '',
  ]);

  let cleanPath = removeExtension(stripLeadingSlash(videoPath));
  if (!cleanPath.startsWith('videos/')) cleanPath = `videos/${cleanPath}`;

    const versionString = version ? `/v${version}` : '';
  const transformString = transforms ? `/${transforms}` : '';
  return `${CLOUDINARY_VIDEO_BASE}${versionString}${transformString}/${cleanPath}`;
};

export const getCloudinaryProjectImageUrl = (imageName: string): string => {
  if (!imageName) return PLACEHOLDER_IMAGE;
  
  // Nếu là URL đầy đủ (http/https), sử dụng trực tiếp
  if (isHttpUrl(imageName)) {
    const extractedId = extractCloudinaryPublicId(imageName);
    if (!extractedId) {
      return imageName;
    }
    imageName = extractedId;
  }
  
  // Nếu là path từ luxury_project_images (Cloudinary public_id), xử lý như Cloudinary path
  if (imageName.startsWith('luxury_project_images/')) {
    // Đây là Cloudinary public_id, xử lý như path Cloudinary bình thường
    const normalized = stripLeadingSlash(imageName);
    return `${CLOUDINARY_IMAGE_BASE}/w_500,h_500,c_fill,f_auto,q_auto/${normalized}`;
  }
  
  if (isLocalUploadPath(imageName)) return buildLocalUrl(imageName);
  if (!CLOUDINARY_IMAGE_BASE) return buildLocalUrl(imageName);

  const normalized = stripLeadingSlash(imageName);
  const hasVersionPrefix = /^v\d+\//.test(normalized);
  const hasProjectsPrefix = normalized.startsWith('projects/');
  const hasTransformsPrefix = normalized.startsWith('w_') || normalized.startsWith('c_');

  if (hasVersionPrefix || hasProjectsPrefix || hasTransformsPrefix) {
    // Đã là Cloudinary path hoàn chỉnh (ví dụ: v123/projects/abc.jpg)
    return `${CLOUDINARY_IMAGE_BASE}/${normalized}`;
  }

  let cleanImageName = removeExtension(normalized);
  if (!cleanImageName.startsWith('projects/')) cleanImageName = `projects/${cleanImageName}`;

  return `${CLOUDINARY_IMAGE_BASE}/w_500,h_500,c_fill,f_auto,q_20/${cleanImageName}`;
};

