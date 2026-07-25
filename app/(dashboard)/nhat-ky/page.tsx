'use client';

import { useState, useEffect } from 'react';
import { DiaryEntry, MoodType, WeatherType } from '@/types/diary';
import { useDialogStore } from '@/store/useDialogStore';
import { useDataStore } from '@/store/useDataStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { fileToBase64 } from '@/utils/file';
import { motion, AnimatePresence } from 'framer-motion';

export default function DiaryPage() {
  const { diaryEntries, addDiaryEntry, deleteDiaryEntry } = useDataStore();
  const { isCreateDiaryOpen, openCreateDiary, closeCreateDiary } = useDialogStore();
  const { showToast } = useNotificationStore();

  // Form & Autosave draft state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<MoodType>('happy');
  const [weather, setWeather] = useState<WeatherType>('sunny');
  const [author, setAuthor] = useState<'Kien' | 'Love'>('Kien');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [activeZoomImage, setActiveZoomImage] = useState<string | null>(null);

  // Load draft from LocalStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDraft = localStorage.getItem('ourspace_diary_draft');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setTitle(parsed.title || '');
          setContent(parsed.content || '');
        } catch (e) {}
      }
    }
  }, []);

  // Autosave draft to LocalStorage when typing
  useEffect(() => {
    if (typeof window !== 'undefined' && (title || content)) {
      localStorage.setItem(
        'ourspace_diary_draft',
        JSON.stringify({ title, content })
      );
    }
  }, [title, content]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const base64Results = await Promise.all(
        filesArray.map((file) => fileToBase64(file))
      );
      setSelectedImages((prev) => [...prev, ...base64Results]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;

    addDiaryEntry({
      date: new Date().toISOString().split('T')[0],
      title,
      content,
      mood,
      weather,
      author,
      imageUrls: selectedImages,
    });

    showToast('Đã lưu trang nhật ký ngọt ngào ✨');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ourspace_diary_draft');
    }
    closeCreateDiary();
    setTitle('');
    setContent('');
    setSelectedImages([]);
  };

  const moodEmojis: Record<MoodType, string> = {
    happy: '🥰 Vui vẻ',
    romantic: '💖 Lãng mạn',
    cozy: '☕ Ấm áp',
    miss_you: '🥺 Nhớ thương',
  };

  const weatherIcons: Record<WeatherType, string> = {
    sunny: '☀️ Nắng đẹp',
    rainy: '🌧️ Mưa rào',
    starry: '🌌 Đêm sao',
    cloudy: '☁️ Mây trôi',
  };

  return (
    <main className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-6 sm:p-8 rounded-[2rem] border border-primary/20">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-3xl">menu_book</span>
            Nhật Ký Tình Yêu 📖
          </h1>
          <p className="font-quicksand text-xs sm:text-sm text-on-surface-variant font-semibold mt-1">
            Nơi ghi chép những khoảnh khắc bình dị và cảm xúc mỗi ngày của chúng mình.
          </p>
        </div>

        <button
          onClick={openCreateDiary}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-heading font-bold text-sm shadow-md hover:scale-105 transition-transform flex-shrink-0"
        >
          <span className="material-symbols-outlined text-lg">edit_note</span>
          Viết nhật ký
        </button>
      </div>

      {/* Diary Feed or Empty State */}
      {diaryEntries.length > 0 ? (
        <div className="space-y-6">
          {diaryEntries.map((entry, idx) => (
            <motion.article
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="glass-panel p-6 sm:p-8 rounded-3xl border border-primary/20 hover:border-primary/40 transition-all space-y-4 relative group overflow-hidden"
            >
              {/* Delete button */}
              <button
                onClick={() => {
                  deleteDiaryEntry(entry.id);
                  showToast('Đã xóa bài nhật ký 💖');
                }}
                className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant hover:text-error z-10"
                title="Xóa bài nhật ký"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>

              {/* Entry Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/10 pb-4 pr-8">
                <div className="flex items-center gap-3">
                  <span className="font-heading font-extrabold text-sm text-primary bg-primary-container/40 px-3.5 py-1.5 rounded-full">
                    {entry.date}
                  </span>
                  <span className="font-quicksand text-xs font-bold text-on-surface-variant">
                    Viết bởi: <strong className="text-primary">{entry.author === 'Kien' ? 'Kiên' : 'Trà'}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-heading font-bold text-on-surface-variant">
                  <span className="bg-surface-container px-3 py-1 rounded-full">
                    {moodEmojis[entry.mood]}
                  </span>
                  <span className="bg-surface-container px-3 py-1 rounded-full">
                    {weatherIcons[entry.weather]}
                  </span>
                </div>
              </div>

              {/* Content */}
              {entry.title && (
              <h3 className="font-heading font-extrabold text-lg sm:text-xl text-on-surface">
                {entry.title}
              </h3>
              )}

              <p className="font-quicksand text-xs sm:text-sm text-on-surface-variant font-medium leading-relaxed whitespace-pre-wrap">
                {entry.content}
              </p>

              {/* Attached Photos Grid - Constrained & Overflow-proof */}
              {entry.imageUrls && entry.imageUrls.length > 0 && (
                <div className={`grid gap-3 pt-2 ${
                  entry.imageUrls.length === 1 ? 'grid-cols-1 max-w-md' : entry.imageUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'
                }`}>
                  {entry.imageUrls.map((url, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveZoomImage(url)}
                      className="w-full h-44 sm:h-52 rounded-2xl overflow-hidden shadow-sm border border-primary/15 relative group/img cursor-pointer bg-surface-container"
                    >
                      <img
                        src={url}
                        alt="Nhật ký"
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500 max-w-full"
                      />
                      <div className="absolute inset-0 bg-on-surface/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-2xl">zoom_in</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.article>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl border border-dashed border-primary/30 text-center space-y-4 max-w-md mx-auto my-12">
          <div className="w-16 h-16 rounded-full bg-primary-container text-primary flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-4xl">menu_book</span>
          </div>
          <h3 className="font-heading font-bold text-lg text-primary">Nhật ký đang trống</h3>
          <p className="font-quicksand text-xs text-on-surface-variant font-semibold">
            Hãy viết trang nhật ký đầu tiên cho chúng mình ngay hôm nay nhé!
          </p>
          <button
            onClick={openCreateDiary}
            className="px-6 py-2.5 rounded-full bg-primary text-on-primary font-heading font-bold text-xs shadow-md hover:scale-105 transition-transform"
          >
            Viết nhật ký ngay
          </button>
        </div>
      )}

      {/* Create Diary Modal */}
      <AnimatePresence>
        {isCreateDiaryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-panel w-full max-w-xl p-6 sm:p-8 rounded-3xl bg-surface/95 border-2 border-primary/30 shadow-2xl relative my-8"
            >
              <button
                onClick={closeCreateDiary}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>

              <h3 className="font-heading font-extrabold text-xl text-primary mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined">edit_note</span>
                Ghi nhật ký hôm nay 📖
              </h3>
              <p className="font-quicksand text-xs text-outline mb-4 font-semibold">
                (Tự động lưu nháp khi bạn đang gõ)
              </p>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-heading font-bold text-xs text-on-surface mb-1">
                      Người viết
                    </label>
                    <select
                      value={author}
                      onChange={(e) => setAuthor(e.target.value as 'Kien' | 'Love')}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-primary/20 text-xs font-heading font-bold"
                    >
                      <option value="Kien">Kiên</option>
                      <option value="Love">Trà</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-heading font-bold text-xs text-on-surface mb-1">
                      Tâm trạng
                    </label>
                    <select
                      value={mood}
                      onChange={(e) => setMood(e.target.value as MoodType)}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-primary/20 text-xs font-heading font-bold"
                    >
                      <option value="happy">🥰 Vui vẻ</option>
                      <option value="romantic">💖 Lãng mạn</option>
                      <option value="cozy">☕ Ấm áp</option>
                      <option value="miss_you">🥺 Nhớ thương</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-heading font-bold text-xs text-on-surface mb-1">
                      Thời tiết
                    </label>
                    <select
                      value={weather}
                      onChange={(e) => setWeather(e.target.value as WeatherType)}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-primary/20 text-xs font-heading font-bold"
                    >
                      <option value="sunny">☀️ Nắng đẹp</option>
                      <option value="rainy">🌧️ Mưa rào</option>
                      <option value="starry">🌌 Đêm sao</option>
                      <option value="cloudy">☁️ Mây trôi</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-heading font-bold text-xs text-on-surface mb-1">
                    Tiêu đề nhật ký <span className="text-outline font-medium">(tùy chọn)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Một ngày nắng ấm... (tùy chọn)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-primary/20 text-sm font-heading font-bold"
                  />
                </div>

                <div>
                  <label className="block font-heading font-bold text-xs text-on-surface mb-1">
                    Nội dung trang nhật ký
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Kể lại những khoảnh khắc đáng nhớ trong ngày..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-primary/20 text-xs font-quicksand font-medium"
                  />
                </div>

                {/* Photo Upload Section for Diary */}
                <div>
                  <label className="block font-heading font-bold text-xs text-on-surface mb-1">
                    Đính kèm hình ảnh (Chọn nhiều ảnh cùng lúc 📷)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="diary-images-input"
                  />
                  <label
                    htmlFor="diary-images-input"
                    className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-primary/40 rounded-xl bg-surface-container-low/50 hover:bg-primary-container/20 cursor-pointer text-xs font-heading font-bold text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">add_photo_alternate</span>
                    + Tải ảnh cho trang nhật ký
                  </label>

                  {/* Image Previews */}
                  {selectedImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {selectedImages.map((src, index) => (
                        <div key={index} className="relative h-20 rounded-xl overflow-hidden border border-primary/20 shadow-sm group">
                          <img src={src} alt="preview" className="w-full h-full object-cover max-w-full" />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
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
                    onClick={closeCreateDiary}
                    className="px-5 py-2.5 rounded-full font-heading font-bold text-xs text-on-surface-variant hover:bg-surface-container"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-primary text-on-primary font-heading font-bold text-xs shadow-md hover:scale-105 transition-transform"
                  >
                    Lưu vào nhật ký
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox / Zoom Modal for Diary Photos */}
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
