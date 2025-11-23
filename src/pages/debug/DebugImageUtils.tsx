import { useMemo, useState } from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import {
  getAvatarUrl,
  getDetailImageUrl,
  getImageUrl,
  getProductImageUrl,
  getResponsiveImageSrcSet,
  getSimpleCloudinaryUrl,
  getVideoUrl,
  getCloudinaryProductImageUrl,
} from '@/utils/imageUtils';
import { API_BASE_URL } from '@/constants';
import axiosInstance from '@/services/axios';

const numberOrUndefined = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const DebugImageUtilsPage = () => {
  const [imagePath, setImagePath] = useState<string>('');
  const [videoPath, setVideoPath] = useState<string>('');
  const [width, setWidth] = useState<string>('600');
  const [height, setHeight] = useState<string>('600');
  const [quality, setQuality] = useState<string>('85');
  const [format, setFormat] = useState<string>('auto');
  const [crop, setCrop] = useState<string>('fill');
  const [avatarSize, setAvatarSize] = useState<string>('200');
  const [localImageName, setLocalImageName] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const results = useMemo(() => {
    const parsedWidth = numberOrUndefined(width);
    const parsedHeight = numberOrUndefined(height);
    const parsedQuality = numberOrUndefined(quality);
    const avatarParsed = numberOrUndefined(avatarSize);

    const baseUrl = getImageUrl(imagePath, {
      width: parsedWidth,
      height: parsedHeight,
      quality: parsedQuality,
      format: format === '' ? undefined : (format as 'auto' | 'webp' | 'jpg' | 'png'),
      crop: crop === '' ? undefined : (crop as 'fill' | 'fit' | 'scale' | 'thumb'),
    });

    return {
      base: baseUrl,
      responsive: getResponsiveImageSrcSet(imagePath),
      product: getProductImageUrl(imagePath),
      detail: getDetailImageUrl(imagePath),
      simple: getSimpleCloudinaryUrl(imagePath),
      avatar:
        getAvatarUrl(imagePath, {
          width: avatarParsed,
          height: avatarParsed,
          quality: parsedQuality,
        }) || 'undefined',
      video: getVideoUrl(videoPath, {
        width: parsedWidth,
        height: parsedHeight,
        quality: parsedQuality,
        format: format === '' ? undefined : (format as 'auto' | 'mp4' | 'webm'),
      }),
      productHelper: getCloudinaryProductImageUrl(imagePath),
    };
  }, [avatarSize, crop, format, height, imagePath, quality, videoPath, width]);

  const handleLocalImage = (file?: File | null) => {
    if (!file) {
      setLocalImageName('');
      return;
    }
    setLocalImageName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      if (typeof base64 === 'string') {
        setImagePath(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadToServer = async () => {
    if (!imagePath) {
      setUploadError('Vui lòng nhập hoặc chọn ảnh trước khi upload.');
      return;
    }

    setUploading(true);
    setUploadResult(null);
    setUploadError(null);

    try {
      const response = await axiosInstance.post('/api/upload', {
        image: imagePath,
      });

      const data = response.data;
      setUploadResult(data);

      const returnedUrl = data?.data?.url || data?.url;
      if (returnedUrl) {
        setImagePath(returnedUrl);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Upload thất bại';
      setUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const renderPreview = (label: string, url?: string) => (
    <div className="space-y-2" key={label}>
      <div className="text-sm font-semibold text-muted-foreground">{label}</div>
      <div className="rounded border border-dashed border-border bg-muted/40 p-3 text-xs break-all">
        {url || 'Không có URL'}
      </div>
      {url && (
        <img
          src={url}
          alt={label}
          className="h-48 w-full rounded object-contain border border-border bg-background"
        />
      )}
    </div>
  );

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto py-10 px-4 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Debug Image Utils</h1>
          <p className="text-muted-foreground">
            Nhập đường dẫn ảnh/video để kiểm tra kết quả từ `imageUtils.ts`.
          </p>
          <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Quy trình chuẩn:</p>
            <p>1. Chọn ảnh local → chuyển sang base64.</p>
            <p>2. Bấm "Upload lên Cloudinary qua API" để gửi tới backend `/api/upload`.</p>
            <p>3. Backend upload lên Cloudinary và trả `secure_url`.</p>
            <p>4. URL trả về tự động dùng lại cho các helper bên dưới.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Thiết lập đầu vào</h2>

            <label className="block text-sm font-medium">
              Đường dẫn ảnh
              <input
                type="text"
                className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
                placeholder="/uploads/demo.jpg hoặc products/sample"
                value={imagePath}
                onChange={(e) => setImagePath(e.target.value)}
              />
            </label>

            <div className="space-y-1 text-sm font-medium">
              <div>Chọn ảnh từ máy</div>
              <label className="flex items-center justify-between rounded border border-dashed border-border bg-muted/40 px-3 py-2 text-sm">
                <span className="truncate">
                  {localImageName ? localImageName : 'Nhấn để chọn ảnh (PNG/JPG/WebP)'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleLocalImage(e.target.files?.[0])}
                />
                <span className="ml-2 rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
                  Browse
                </span>
              </label>
              <button
                type="button"
                className="text-xs text-muted-foreground underline"
                onClick={() => {
                  setLocalImageName('');
                  setImagePath('');
                }}
              >
                Xóa ảnh đã chọn
              </button>
              <button
                type="button"
                className="inline-flex items-center rounded bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                onClick={handleUploadToServer}
                disabled={uploading || !imagePath}
              >
                {uploading ? 'Đang upload...' : 'Upload lên Cloudinary qua API'}
              </button>
              {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
            </div>

            <label className="block text-sm font-medium">
              Đường dẫn video
              <input
                type="text"
                className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
                placeholder="videos/demo.mp4"
                value={videoPath}
                onChange={(e) => setVideoPath(e.target.value)}
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm font-medium">
                Width
                <input
                  type="number"
                  min="0"
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                />
              </label>
              <label className="block text-sm font-medium">
                Height
                <input
                  type="number"
                  min="0"
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </label>
              <label className="block text-sm font-medium">
                Quality
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                />
              </label>
              <label className="block text-sm font-medium">
                Avatar size
                <input
                  type="number"
                  min="0"
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
                  value={avatarSize}
                  onChange={(e) => setAvatarSize(e.target.value)}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm font-medium">
                Format
                <select
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                >
                  <option value="auto">auto</option>
                  <option value="webp">webp</option>
                  <option value="jpg">jpg</option>
                  <option value="png">png</option>
                  <option value="">(bỏ trống)</option>
                </select>
              </label>
              <label className="block text-sm font-medium">
                Crop
                <select
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                >
                  <option value="fill">fill</option>
                  <option value="fit">fit</option>
                  <option value="scale">scale</option>
                  <option value="thumb">thumb</option>
                  <option value="">(bỏ trống)</option>
                </select>
              </label>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Kết quả</h2>
            {uploadResult && (
              <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2 text-xs">
                <div className="text-sm font-semibold text-muted-foreground">Kết quả API</div>
                <pre className="whitespace-pre-wrap break-all">
                  {JSON.stringify(uploadResult, null, 2)}
                </pre>
                {uploadResult?.data?.url && (
                  <button
                    type="button"
                    className="text-xs text-primary underline"
                    onClick={() => setImagePath(uploadResult.data.url)}
                  >
                    Dùng URL này cho preview
                  </button>
                )}
              </div>
            )}
            {renderPreview('getImageUrl', results.base)}
            {renderPreview('getProductImageUrl', results.product)}
            {renderPreview('getDetailImageUrl', results.detail)}
            {renderPreview('getSimpleCloudinaryUrl', results.simple)}
            {renderPreview('getCloudinaryProductImageUrl', results.productHelper)}
            {renderPreview('getAvatarUrl', results.avatar)}

            <div className="space-y-2">
              <div className="text-sm font-semibold text-muted-foreground">Responsive SrcSet</div>
              <div className="rounded border border-dashed border-border bg-muted/40 p-3 text-xs break-all">
                {results.responsive || 'Không có dữ liệu'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-muted-foreground">Video URL</div>
              <div className="rounded border border-dashed border-border bg-muted/40 p-3 text-xs break-all">
                {results.video || 'Không có dữ liệu'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DebugImageUtilsPage;

