// Cloudinary unsigned upload preset (override via NEXT_PUBLIC_CLOUDINARY_*)
const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'h05x5a78';
const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ourspace_unsigned';
const CLOUDINARY_FOLDER =
  process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || 'ourspace';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];

export class ImageUploadError extends Error {
  code: 'invalid-file' | 'too-large' | 'cloudinary' | 'no-url';
  constructor(message: string, code: ImageUploadError['code']) {
    super(message);
    this.name = 'ImageUploadError';
    this.code = code;
  }
}

function validateFile(file: File): void {
  if (!file) {
    throw new ImageUploadError('Không có tệp ảnh nào được chọn', 'invalid-file');
  }
  if (!ACCEPTED_MIME.includes(file.type)) {
    throw new ImageUploadError(
      `Định dạng ảnh không được hỗ trợ (${file.type || 'không rõ'}). Hãy chọn JPG, PNG hoặc WEBP.`,
      'invalid-file'
    );
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new ImageUploadError(
      `Ảnh ${file.name} vượt quá 10MB. Vui lòng chọn ảnh nhỏ hơn.`,
      'too-large'
    );
  }
}

/**
 * Upload ảnh lên Cloudinary. Trả về URL HTTPS nếu thành công.
 * Không fallback base64: lỗi sẽ được ném ra để UI phản hồi trung thực.
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  validateFile(file);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', CLOUDINARY_FOLDER);

  let res: Response;
  try {
    res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );
  } catch (err: any) {
    throw new ImageUploadError(
      'Mất kết nối khi tải ảnh lên Cloudinary. Vui lòng kiểm tra mạng và thử lại.',
      'cloudinary'
    );
  }

  if (!res.ok) {
    let detail = '';
    try {
      const data = await res.json();
      detail = data?.error?.message || '';
    } catch {}
    throw new ImageUploadError(
      detail || `Cloudinary từ chối ảnh (HTTP ${res.status}).`,
      'cloudinary'
    );
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new ImageUploadError('Phản hồi từ Cloudinary không hợp lệ', 'cloudinary');
  }

  if (!data?.secure_url) {
    throw new ImageUploadError(
      'Cloudinary không trả về URL ảnh. Vui lòng thử lại.',
      'no-url'
    );
  }
  return data.secure_url as string;
}

/**
 * Helper dùng cho các form: upload ảnh lên Cloudinary, throw lỗi rõ ràng nếu thất bại.
 * Được sử dụng bởi nhật ký, hành trình và modal upload.
 */
export const uploadImageFile = uploadToCloudinary;

/**
 * Lọc các URL ảnh chỉ giữ URL hợp lệ (http(s)) khi gửi lên server.
 * Tránh lưu blob:/data: vào Postgres.
 */
export function isHttpUpstreamUrl(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    (value.startsWith('https://') || value.startsWith('http://'))
  );
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}