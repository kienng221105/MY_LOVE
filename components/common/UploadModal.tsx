'use client';

import { useDialogStore } from '@/store/useDialogStore';
import { useUpload } from '@/hooks/useUpload';
import { useDataStore } from '@/store/useDataStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { uploadToCloudinary } from '@/utils/file';
import { AnimatePresence, motion } from 'framer-motion';

export function UploadModal() {
  const { isUploadModalOpen, closeUploadModal } = useDialogStore();
  const { files, isUploading, addFiles, removeFile, clearAll } = useUpload();
  const { addPhoto } = useDataStore();
  const { showToast } = useNotificationStore();

  if (!isUploadModalOpen) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const handleSave = async () => {
    const cloudinaryPhotos = await Promise.all(
      files.map(async (f) => {
        const url = await uploadToCloudinary(f.file);
        return {
          url,
          title: f.file.name.replace(/\.[^/.]+$/, ''),
          date: new Date().toISOString().split('T')[0],
          caption: 'Kỷ niệm mới thêm',
        };
      })
    );

    cloudinaryPhotos.forEach((photo) => addPhoto(photo));

    showToast('Tải ảnh kỷ niệm thành công! 💖');
    clearAll();
    closeUploadModal();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="glass-panel w-full max-w-lg p-6 rounded-3xl bg-surface/95 border-2 border-primary/30 shadow-2xl relative"
        >
          {/* Close button */}
          <button
            onClick={closeUploadModal}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>

          <h3 className="font-heading font-extrabold text-xl text-primary mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined">cloud_upload</span>
            Thêm ảnh kỷ niệm mới ✨
          </h3>
          <p className="font-quicksand text-xs text-on-surface-variant mb-4 font-semibold">
            Tải những khoảnh khắc yêu thương của hai đứa lên góc nhỏ bí mật.
          </p>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-primary/40 rounded-2xl p-6 text-center bg-surface-container-low/50 hover:bg-primary-container/20 transition-colors cursor-pointer mb-4"
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload-input"
            />
            <label htmlFor="file-upload-input" className="cursor-pointer flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
              </div>
              <p className="font-heading font-bold text-sm text-on-surface">
                Kéo thả ảnh vào đây hoặc <span className="text-primary underline">chọn từ máy</span>
              </p>
              <p className="font-quicksand text-xs text-outline font-medium">
                Hỗ trợ JPG, PNG, WEBP (Tối đa 10MB)
              </p>
            </label>
          </div>

          {/* Upload items preview list */}
          {files.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-2 mb-4 pr-1">
              {files.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 bg-surface-container rounded-xl border border-primary/10"
                >
                  <img
                    src={item.previewUrl}
                    alt="preview"
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-xs text-on-surface truncate">
                      {item.file.name}
                    </p>
                    <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(item.id)}
                    className="text-on-surface-variant hover:text-error"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={closeUploadModal}
              className="px-5 py-2.5 rounded-full font-heading font-bold text-xs text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={files.length === 0 || isUploading}
              className="px-6 py-2.5 rounded-full bg-primary text-on-primary font-heading font-bold text-xs shadow-md hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
            >
              Lưu vào Album
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
