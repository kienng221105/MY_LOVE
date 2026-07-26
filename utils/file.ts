// Cloudinary unsigned upload preset
const CLOUDINARY_CLOUD_NAME = 'dkienng221105';
const CLOUDINARY_UPLOAD_PRESET = 'ourspace_unsigned';

/**
 * Upload ảnh lên Cloudinary và trả về URL
 * Nếu upload thất bại, fallback về base64 để vẫn hiển thị được trên UI
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'ourspace');

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (!res.ok) throw new Error(`Cloudinary error: ${res.status}`);

    const data = await res.json();
    return data.secure_url as string;
  } catch (err) {
    console.warn('Cloudinary upload failed, using base64 fallback:', err);
    return fileToBase64(file);
  }
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
