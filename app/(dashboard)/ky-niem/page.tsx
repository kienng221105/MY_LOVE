'use client';

import { useState } from 'react';
import { Photo } from '@/types/gallery';
import { useDialogStore } from '@/store/useDialogStore';
import { useDataStore } from '@/store/useDataStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { ImageLightbox } from '@/components/common/ImageLightbox';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate } from '@/utils/date';
import DateRangeFilter, {
  EMPTY_DATE_RANGE,
  isDateInRange,
  type DateRangeFilterValue,
} from '@/components/common/DateRangeFilter';

export default function GalleryPage() {
  const { photos, albums, deletePhoto } = useDataStore();
  const [activeAlbum, setActiveAlbum] = useState<string>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeFilterValue>(EMPTY_DATE_RANGE);
  const { openUploadModal } = useDialogStore();
  const { showToast } = useNotificationStore();

  const filteredPhotos =
    (activeAlbum === 'all'
      ? photos
      : photos.filter((p) => p.albumId === activeAlbum)
    ).filter((p) => isDateInRange(p.date, dateRange));

  const handleDelete = (id: string) => {
    deletePhoto(id);
    setSelectedPhoto(null);
    showToast('Đã xóa bức ảnh khỏi Album 💖');
  };

  return (
    <main className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-6 sm:p-8 rounded-[2rem] border border-primary/20">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-3xl">photo_library</span>
            Album Kỷ Niệm 🌸
          </h1>
          <p className="font-quicksand text-xs sm:text-sm text-on-surface-variant font-semibold mt-1">
            Góc lưu giữ những khoảnh khắc rạng rỡ và ngọt ngào nhất của chúng mình.
          </p>
        </div>

        <button
          onClick={openUploadModal}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-heading font-bold text-sm shadow-md hover:scale-105 transition-transform flex-shrink-0"
        >
          <span className="material-symbols-outlined text-lg">add_a_photo</span>
          Tải ảnh mới
        </button>
      </div>

      {/* Album Filters */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {albums.map((album) => (
          <button
            key={album.id}
            onClick={() => setActiveAlbum(album.id)}
            className={`px-5 py-2.5 rounded-full font-heading font-bold text-xs whitespace-nowrap flex items-center gap-2 transition-all ${
              activeAlbum === album.id
                ? 'bg-primary text-on-primary shadow-sm scale-105'
                : 'bg-surface-container/70 text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span>{album.name}</span>
          </button>
        ))}
      </div>

      <DateRangeFilter
        value={dateRange}
        onChange={setDateRange}
        totalCount={
          activeAlbum === 'all' ? photos.length : photos.filter((p) => p.albumId === activeAlbum).length
        }
        filteredCount={filteredPhotos.length}
      />

      {/* Photo Grid or Empty State */}
      {filteredPhotos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredPhotos.map((photo, idx) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedPhoto(photo)}
              className="glass-panel p-3 rounded-3xl border border-primary/20 hover:border-primary/40 cursor-pointer group transition-all hover:scale-[1.02]"
            >
              <div className="h-64 sm:h-72 rounded-2xl overflow-hidden relative shadow-sm">
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-on-surface/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end text-white">
                  <p className="font-heading font-bold text-sm truncate">{photo.title}</p>
                  <p className="font-quicksand text-xs opacity-90">{formatDate(photo.date)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl border border-dashed border-primary/30 text-center space-y-4 max-w-md mx-auto my-12">
          <div className="w-16 h-16 rounded-full bg-primary-container text-primary flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>
          </div>
          <h3 className="font-heading font-bold text-lg text-primary">
            {photos.length === 0
              ? 'Chưa có bức ảnh nào'
              : 'Không có ảnh trong khoảng thời gian này'}
          </h3>
          <p className="font-quicksand text-xs text-on-surface-variant font-medium">
            {photos.length === 0
              ? 'Hãy tải lên những khoảnh khắc đáng nhớ đầu tiên của chúng mình nhé!'
              : 'Thử chọn album khác hoặc bấm Tất cả để xem toàn bộ ảnh.'}
          </p>
          {photos.length === 0 ? (
            <button
              onClick={openUploadModal}
              className="px-6 py-2.5 rounded-full bg-primary text-on-primary font-heading font-bold text-xs shadow-md hover:scale-105 transition-transform"
            >
              Tải ảnh ngay
            </button>
          ) : (
            <button
              onClick={() => setDateRange(EMPTY_DATE_RANGE)}
              className="px-6 py-2.5 rounded-full bg-primary text-on-primary font-heading font-bold text-xs shadow-md hover:scale-105 transition-transform"
            >
              Xem tất cả ảnh
            </button>
          )}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl w-full glass-panel p-4 sm:p-6 rounded-3xl bg-surface/95 border-2 border-primary/30 shadow-2xl flex flex-col md:flex-row gap-6"
            >
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>

              <div className="flex-1 h-80 md:h-[450px] rounded-2xl overflow-hidden shadow-md relative group/lightbox bg-black/5">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.title}
                  className="w-full h-full object-cover cursor-zoom-in"
                  onClick={() => setLightboxSrc(selectedPhoto.url)}
                />
                <button
                  onClick={() => setLightboxSrc(selectedPhoto.url)}
                  className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-md text-white font-heading font-bold text-xs flex items-center gap-1 opacity-0 group-hover/lightbox:opacity-100 transition-opacity hover:bg-primary"
                  title="Mở lightbox ảnh gốc — giữ nguyên size gốc"
                >
                  <span className="material-symbols-outlined text-base">open_in_full</span>
                  Xem ảnh gốc
                </button>
                <p className="absolute bottom-3 left-3 px-2 py-1 rounded-full bg-black/55 backdrop-blur-md text-white font-quicksand text-[10px] opacity-0 group-hover/lightbox:opacity-100 transition-opacity">
                  Bấm để xem ảnh gốc size đầy đủ
                </p>
              </div>

              <div className="w-full md:w-80 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <span className="inline-block px-3 py-1 rounded-full bg-primary-container text-on-primary-container font-heading font-bold text-xs">
                    {formatDate(selectedPhoto.date)}
                  </span>
                  <h3 className="font-heading font-extrabold text-xl text-primary">
                    {selectedPhoto.title}
                  </h3>
                  {selectedPhoto.location && (
                    <p className="font-quicksand text-xs font-bold text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">location_on</span>
                      {selectedPhoto.location}
                    </p>
                  )}
                  <p className="font-quicksand text-xs text-on-surface-variant font-medium leading-relaxed">
                    {selectedPhoto.caption}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-primary/10">
                  <button
                    onClick={() => handleDelete(selectedPhoto.id)}
                    className="flex items-center gap-1 text-xs font-heading font-bold text-error hover:underline"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                    Xóa bức ảnh
                  </button>
                  <button
                    onClick={() => setSelectedPhoto(null)}
                    className="px-5 py-2 rounded-full bg-primary text-on-primary font-heading font-bold text-xs shadow"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ImageLightbox — giữ size gốc ảnh (bỏ Cloudinary transform) */}
      <ImageLightbox
        src={lightboxSrc}
        alt={selectedPhoto?.title}
        title={selectedPhoto?.title}
        caption={selectedPhoto?.caption}
        date={selectedPhoto ? formatDate(selectedPhoto.date) : undefined}
        onClose={() => setLightboxSrc(null)}
      />
    </main>
  );
}
