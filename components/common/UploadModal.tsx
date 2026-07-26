'use client';

import { useState } from 'react';
import { useDialogStore } from '@/store/useDialogStore';
import { useDataStore } from '@/store/useDataStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { uploadImageFile, isHttpUpstreamUrl } from '@/utils/file';
import { AnimatePresence, motion } from 'framer-motion';

interface PendingItem {
  id: string;
  previewUrl: string;
  file: File;
  uploading: boolean;
  uploadedUrl?: string;
  error?: string;
}

export function UploadModal() {
  const { isUploadModalOpen, closeUploadModal } = useDialogStore();
  const { addPhoto } = useDataStore();
  const { showToast } = useNotificationStore();

  const [pending, setPending] = useState<PendingItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  if (!isUploadModalOpen) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      enqueueFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      enqueueFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const enqueueFiles = (files: File[]) => {
    const items: PendingItem[] = files.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      previewUrl: URL.createObjectURL(file),
      file,
      uploading: true,
    }));
    setPending((prev) => [...prev, ...items]);

    void Promise.allSettled(
      files.map((file, index) =>
        uploadImageFile(file).then((url) => ({ index, url }))
      )
    ).then((results) => {
      setPending((prev) =>
        prev.map((item) => {
          const slot = items.findIndex((i) => i.id === item.id);
          if (slot === -1) return item;
          const result = results[slot];
          if (!result || result.status === 'rejected') {
            const reason = result?.reason as any;
            return {
              ...item,
              uploading: false,
              error: reason?.message || 'Lỗi không xác định',
            };
          }
          return {
            ...item,
            uploading: false,
            uploadedUrl: result.value.url,
          };
        })
      );

      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0) {
        showToast(`Không upload được ${failed} ảnh. Vui lòng thử lại.`, 'error');
      }
    });
  };

  const removeItem = (id: string) => {
    setPending((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSave = async () => {
    if (isSaving) return;
    const completed = pending.filter((p) => p.uploadedUrl && !p.error);
    if (completed.length === 0) {
      showToast('Vui lòng chờ ảnh upload xong hoặc thêm ảnh mới', 'info');
      return;
    }
    setIsSaving(true);
    try {
      for (const item of completed) {
        const url = item.uploadedUrl as string;
        if (!isHttpUpstreamUrl(url)) continue;
        await addPhoto({
          url,
          title: item.file.name.replace(/\.[^/.]+$/, ''),
          date: new Date().toISOString(),
          caption: 'Kỷ niệm mới thêm',
        });
      }
      showToast('Tải ảnh kỷ niệm thành công! 💖');
      setPending([]);
      closeUploadModal();
    } catch (err: any) {
      showToast(
        err?.message || 'Không lưu được ảnh vào album, vui lòng thử lại 💔',
        'error'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const hasReadyItems = pending.some((p) => p.uploadedUrl && !p.error);
  const isAnyUploading = pending.some((p) => p.uploading);

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
              accept="image/jpeg,image/png,image/webp,image/gif"
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
          {pending.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-2 mb-4 pr-1">
              {pending.map((item) => (
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
                    <p className="font-quicksand text-[11px] text-outline font-semibold">
                      {item.error
                        ? `Lỗi: ${item.error}`
                        : item.uploading
                          ? 'Đang upload...'
                          : 'Đã upload xong'}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
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
              disabled={!hasReadyItems || isAnyUploading || isSaving}
              className="px-6 py-2.5 rounded-full bg-primary text-on-primary font-heading font-bold text-xs shadow-md hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu vào Album'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}