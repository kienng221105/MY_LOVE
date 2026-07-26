'use client';

import { useState, useEffect } from 'react';
import { DiaryEntry, MoodType, WeatherType } from '@/types/diary';
import { useDialogStore } from '@/store/useDialogStore';
import { useDataStore } from '@/store/useDataStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { uploadImageFile, isHttpUpstreamUrl } from '@/utils/file';
import { formatDateTime } from '@/utils/date';
import { motion, AnimatePresence } from 'framer-motion';

interface PendingImage {
  id: string;
  url: string;
  uploading: boolean;
  error?: string;
}

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
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [activeZoomImage, setActiveZoomImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
          if (!placeholders.find((p) => p.id === item.id)) return item;
          const result = results.find(
            (r) => r.status === 'fulfilled' && r.value.index === placeholders.indexOf(item)
          );
          if (!result) return { ...item, uploading: false, error: 'Lỗi không xác định' };
          const fulfilled = result as PromiseFulfilledResult<{ index: number; url: string }>;
          return {
            ...item,
            url: fulfilled.value.url,
            uploading: false,
            error: undefined,
          };
        })
      );

      const failureMessages = results
        .map((r, i) => ({ r, i }))
        .filter(({ r }) => r.status === 'rejected')
        .map(({ i }) => filesArray[i]?.name)
        .filter(Boolean);
      if (failureMessages.length) {
        showToast(
          `Không upload được: ${failureMessages.join(', ')}`,
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
    if (!content.trim() || isSaving) return;

    const stillUploading = pendingImages.some((p) => p.uploading);
    if (stillUploading) {
      showToast('Ảnh đang upload, vui lòng đợi hoàn tất 📷', 'info');
      return;
    }

    const completedImages = pendingImages.filter((p) => !p.error);
    const imageUrls = completedImages
      .map((p) => p.url)
      .filter((url) => isHttpUpstreamUrl(url));

    setIsSaving(true);
    try {
      await addDiaryEntry({
        date: new Date().toISOString(),
        title,
        content,
        mood,
        weather,
        author,
        imageUrls,
      });

      showToast('Đã lưu trang nhật ký ngọt ngào ✨');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ourspace_diary_draft');
      }
      closeCreateDiary();
      setTitle('');
      setContent('');
      setPendingImages([]);
    } catch (err: any) {
      showToast(
        err?.message || 'Không lưu được nhật ký, vui lòng thử lại 💔',
        'error'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const moodOptions: { value: MoodType; emoji: string; label: string }[] = [
    { value: 'happy', emoji: '🥰', label: 'Vui vẻ' },
    { value: 'romantic', emoji: '💖', label: 'Lãng mạn' },
    { value: 'cozy', emoji: '☕', label: 'Ấm áp' },
    { value: 'miss_you', emoji: '🥺', label: 'Nhớ thương' },
    { value: 'excited', emoji: '🤩', label: 'Hào hứng' },
    { value: 'proud', emoji: '🥹', label: 'Tự hào' },
    { value: 'grateful', emoji: '🙏', label: 'Biết ơn' },
    { value: 'playful', emoji: '😜', label: 'Tinh nghịch' },
    { value: 'thoughtful', emoji: '💭', label: 'Suy tư' },
    { value: 'tired', emoji: '😴', label: 'Mệt mỏi' },
    { value: 'anxious', emoji: '😟', label: 'Lo lắng' },
    { value: 'heartbroken', emoji: '💔', label: 'Buồn nhiều' },
  ];

  const weatherOptions: { value: WeatherType; emoji: string; label: string }[] = [
    { value: 'sunny', emoji: '☀️', label: 'Nắng đẹp' },
    { value: 'partly_cloudy', emoji: '⛅', label: 'Nắng nhẹ mây' },
    { value: 'cloudy', emoji: '☁️', label: 'Mây trôi' },
    { value: 'rainy', emoji: '🌧️', label: 'Mưa rào' },
    { value: 'thunder', emoji: '⛈️', label: 'Mưa giông' },
    { value: 'snowy', emoji: '❄️', label: 'Tuyết rơi' },
    { value: 'foggy', emoji: '🌫️', label: 'Sương mù' },
    { value: 'windy', emoji: '🌬️', label: 'Gió mạnh' },
    { value: 'starry', emoji: '🌌', label: 'Đêm sao' },
    { value: 'rainbow', emoji: '🌈', label: 'Cầu vồng' },
  ];

  const moodEmojis: Record<MoodType, string> = Object.fromEntries(
    moodOptions.map((m) => [m.value, `${m.emoji} ${m.label}`])
  ) as Record<MoodType, string>;

  const weatherIcons: Record<WeatherType, string> = Object.fromEntries(
    weatherOptions.map((w) => [w.value, `${w.emoji} ${w.label}`])
  ) as Record<WeatherType, string>;

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
                deleteDiaryEntry(entry.id)
                  .then(() => showToast('Đã xóa bài nhật ký 💖'))
                  .catch((err: any) =>
                    showToast(
                      err?.message || 'Không xóa được nhật ký',
                      'error'
                    )
                  );
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
                    {formatDateTime(entry.date)}
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-heading font-bold text-xs text-on-surface mb-1">
                      Người viết
                    </label>
                    <select
                      value={author}
                      onChange={(e) => setAuthor(e.target.value as 'Kien' | 'Love')}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-primary/20 font-heading font-bold"
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
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-primary/20 font-heading font-bold"
                    >
                      {moodOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.emoji} {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-heading font-bold text-xs text-on-surface mb-1">
                      Thời tiết
                    </label>
                    <select
                      value={weather}
                      onChange={(e) => setWeather(e.target.value as WeatherType)}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-primary/20 font-heading font-bold"
                    >
                      {weatherOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.emoji} {opt.label}
                        </option>
                      ))}
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
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-primary/20 font-heading font-bold"
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
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-primary/20 font-quicksand font-medium"
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
                    onClick={closeCreateDiary}
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
                    {isSaving ? 'Đang lưu...' : 'Lưu vào nhật ký'}
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
