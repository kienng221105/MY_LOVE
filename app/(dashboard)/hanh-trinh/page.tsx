'use client';

import { useState } from 'react';
import { MemoryMilestone } from '@/types/memory';
import { useDataStore } from '@/store/useDataStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { uploadImageFile, isHttpUpstreamUrl } from '@/utils/file';
import { formatDate } from '@/utils/date';
import { motion, AnimatePresence } from 'framer-motion';

interface PendingImage {
  id: string;
  url: string;
  uploading: boolean;
  error?: string;
}

export default function JourneyPage() {
  const { memories, addMemory, toggleFavoriteMemory } = useDataStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { showToast } = useNotificationStore();

  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<MemoryMilestone['category']>('special');
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [activeZoomImage, setActiveZoomImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filteredMemories =
    selectedCategory === 'all'
      ? memories
      : memories.filter((m) => m.category === selectedCategory);

  const toggleFavorite = async (id: string) => {
    try {
      await toggleFavoriteMemory(id);
      showToast('Đã cập nhật mốc kỷ niệm yêu thích 💖');
    } catch (err: any) {
      showToast(
        err?.message || 'Không cập nhật được yêu thích, vui lòng thử lại',
        'error'
      );
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const placeholders: PendingImage[] = filesArray.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        url: URL.createObjectURL(file),
        uploading: true,
      }));
      setPendingImages((prev) => [...prev, ...placeholders]);

      const results = await Promise.allSettled(
        filesArray.map((file, index) =>
          uploadImageFile(file).then((url) => ({ index, url }))
        )
      );

      setPendingImages((prev) =>
        prev.map((item) => {
          const slot = placeholders.findIndex((p) => p.id === item.id);
          if (slot === -1) return item;
          const result = results[slot];
          if (result.status === 'rejected') {
            const message =
              (result.reason && result.reason.message) || 'Lỗi không xác định';
            return { ...item, uploading: false, error: message };
          }
          return {
            ...item,
            url: result.value.url,
            uploading: false,
            error: undefined,
          };
        })
      );

      const failures = results
        .map((r, i) => ({ r, i }))
        .filter(({ r }) => r.status === 'rejected');
      if (failures.length) {
        showToast(
          `Không upload được ${failures.length} ảnh. Vui lòng thử lại.`,
          'error'
        );
      }
      e.target.value = '';
    }
  };

  const removeImage = (id: string) => {
    setPendingImages((prev) => prev.filter((p) => p.id !== id));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || isSaving) return;

    if (pendingImages.some((p) => p.uploading)) {
      showToast('Ảnh đang upload, vui lòng đợi hoàn tất 📷', 'info');
      return;
    }

    const imageUrls = pendingImages
      .filter((p) => !p.error)
      .map((p) => p.url)
      .filter(isHttpUpstreamUrl);
    const cover = imageUrls[0] || '';

    setIsSaving(true);
    try {
      await addMemory({
        title,
        date,
        location,
        description,
        category,
        imageUrl: cover,
        imageUrls,
      });

      showToast('Đã thêm cột mốc mới vào hành trình! ✨');
      setIsAddModalOpen(false);
      setTitle('');
      setDate('');
      setLocation('');
      setDescription('');
      setPendingImages([]);
    } catch (err: any) {
      showToast(
        err?.message || 'Không lưu được cột mốc, vui lòng thử lại 💔',
        'error'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-6 sm:p-8 rounded-[2rem] border border-primary/20">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-3xl">timeline</span>
            Hành Trình Tình Yêu 💕
          </h1>
          <p className="font-quicksand text-xs sm:text-sm text-on-surface-variant font-semibold mt-1">
            Những cột mốc ngọt ngào ghi dấu từng bước chân của Kiên & Trà.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-heading font-bold text-sm shadow-md hover:scale-105 transition-transform flex-shrink-0"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          Thêm cột mốc mới
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'all', label: 'Tất cả cột mốc' },
          { id: 'first_meet', label: 'Lần đầu gặp' },
          { id: 'anniversary', label: 'Kỷ niệm yêu' },
          { id: 'travel', label: 'Chuyến đi xa' },
          { id: 'date_night', label: 'Hẹn hò' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-5 py-2 rounded-full font-heading font-bold text-xs whitespace-nowrap transition-all ${
              selectedCategory === tab.id
                ? 'bg-primary text-on-primary shadow-sm scale-105'
                : 'bg-surface-container/70 text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Vertical Timeline or Empty State */}
      {filteredMemories.length > 0 ? (
        <div className="relative border-l-4 border-primary/30 ml-4 sm:ml-8 pl-6 sm:pl-10 space-y-8 my-6">
          {filteredMemories.map((m, idx) => {
            const imagesToDisplay = m.imageUrls && m.imageUrls.length > 0 ? m.imageUrls : m.imageUrl ? [m.imageUrl] : [];
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative group"
              >
                {/* Timeline Heart Dot */}
                <div className="absolute -left-[35px] sm:-left-[51px] top-1.5 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md group-hover:scale-125 transition-transform">
                  <span className="material-symbols-outlined text-sm">favorite</span>
                </div>

                {/* Card Content */}
                <div className="glass-panel p-6 rounded-3xl border border-primary/20 hover:border-primary/40 transition-all space-y-4 overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full bg-primary-container text-on-primary-container font-heading font-bold text-xs mb-1">
                        {formatDate(m.date)}
                      </span>
                      <h3 className="font-heading font-extrabold text-lg sm:text-xl text-on-surface">
                        {m.title}
                      </h3>
                    </div>

                    <button
                      onClick={() => toggleFavorite(m.id)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                        m.isFavorite ? 'text-primary bg-primary-container/50' : 'text-outline hover:text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {m.isFavorite ? 'favorite' : 'favorite_border'}
                      </span>
                    </button>
                  </div>

                  <p className="font-quicksand text-xs sm:text-sm text-on-surface-variant font-medium leading-relaxed">
                    {m.description}
                  </p>

                  {m.location && (
                    <p className="font-quicksand text-xs text-primary font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">location_on</span>
                      {m.location}
                    </p>
                  )}

                  {/* Multiple Photos Grid - Constrained & Overflow-proof */}
                  {imagesToDisplay.length > 0 && (
                    <div className={`grid gap-3 pt-2 ${
                      imagesToDisplay.length === 1 ? 'grid-cols-1 max-w-md' : imagesToDisplay.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'
                    }`}>
                      {imagesToDisplay.map((imgUrl, i) => (
                        <div
                          key={i}
                          onClick={() => setActiveZoomImage(imgUrl)}
                          className="w-full h-44 sm:h-52 rounded-2xl overflow-hidden shadow-inner group/img relative cursor-pointer border border-primary/15 bg-surface-container"
                        >
                          <img
                            src={imgUrl}
                            alt={m.title}
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500 max-w-full"
                          />
                          <div className="absolute inset-0 bg-on-surface/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-2xl">zoom_in</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl border border-dashed border-primary/30 text-center space-y-4 max-w-md mx-auto my-12">
          <div className="w-16 h-16 rounded-full bg-primary-container text-primary flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-4xl">timeline</span>
          </div>
          <h3 className="font-heading font-bold text-lg text-primary">Chưa có cột mốc nào</h3>
          <p className="font-quicksand text-xs text-on-surface-variant font-medium">
            Hãy thêm cột mốc đáng nhớ đầu tiên trên hành trình tình yêu của chúng mình nhé!
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-2.5 rounded-full bg-primary text-on-primary font-heading font-bold text-xs shadow-md hover:scale-105 transition-transform"
          >
            Thêm cột mốc ngay
          </button>
        </div>
      )}

      {/* Add Memory Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-panel w-full max-w-lg p-6 rounded-3xl bg-surface/95 border-2 border-primary/30 shadow-2xl relative my-8"
            >
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>

              <h3 className="font-heading font-extrabold text-xl text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">add_location_alt</span>
                Thêm cột mốc đáng nhớ 💖
              </h3>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block font-heading font-bold text-xs text-on-surface mb-1">
                    Tên cột mốc
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Chuyến đi Đà Lạt đầu tiên..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-primary/20 text-sm font-heading font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-heading font-bold text-xs text-on-surface mb-1">
                      Ngày diễn ra
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-primary/20 font-heading font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-heading font-bold text-xs text-on-surface mb-1">
                      Địa điểm
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Đà Lạt"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-primary/20 font-heading font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-heading font-bold text-xs text-on-surface mb-1">
                    Mô tả kỷ niệm
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Viết vài dòng cảm xúc ngọt ngào..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-primary/20 font-quicksand font-medium"
                  />
                </div>

                {/* Multiple Photo Upload Field */}
                <div>
                  <label className="block font-heading font-bold text-xs text-on-surface mb-1">
                    Tải ảnh kỷ niệm (Có thể chọn nhiều ảnh cùng lúc 📸)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="journey-images-input"
                  />
                  <label
                    htmlFor="journey-images-input"
                    className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-primary/40 rounded-xl bg-surface-container-low/50 hover:bg-primary-container/20 cursor-pointer text-xs font-heading font-bold text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">add_photo_alternate</span>
                    + Chọn ảnh từ thiết bị
                  </label>

                  {/* Image Previews */}
                  {pendingImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {pendingImages.map((p) => (
                        <div key={p.id} className="relative h-20 rounded-xl overflow-hidden border border-primary/20 shadow-sm group">
                          <img src={p.url} alt="preview" className="w-full h-full object-cover max-w-full" />
                          {p.uploading && (
                            <div className="absolute inset-0 bg-on-surface/60 flex items-center justify-center text-white text-[10px] font-heading font-bold">
                              Đang tải...
                            </div>
                          )}
                          {p.error && (
                            <div className="absolute inset-0 bg-error/80 flex items-center justify-center text-white text-[10px] font-heading font-bold text-center px-1">
                              {p.error}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(p.id)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-on-surface/70 text-white flex items-center justify-center hover:bg-error transition-colors"
                          >
                            <span className="material-symbols-outlined text-xs">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
<button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-full font-heading font-bold text-xs text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-full bg-primary text-on-primary font-heading font-bold text-xs shadow-md hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu cột mốc'}
                </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox / Zoom Modal for Journey Photos */}
      <AnimatePresence>
        {activeZoomImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-3xl w-full glass-panel p-4 rounded-3xl bg-surface/95 border-2 border-primary/30 shadow-2xl"
            >
              <button
                onClick={() => setActiveZoomImage(null)}
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
              <div className="max-h-[80vh] overflow-hidden rounded-2xl flex items-center justify-center">
                <img
                  src={activeZoomImage}
                  alt="Zoom"
                  className="max-h-[75vh] max-w-full object-contain rounded-xl"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
