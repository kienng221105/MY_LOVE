'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useSyncedTimer } from '@/hooks/useSyncedTimer';
import { useDialogStore } from '@/store/useDialogStore';
import { useDataStore } from '@/store/useDataStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { AvatarCropModal } from '@/components/common/AvatarCropModal';
import { IdentitySwitcher } from '@/components/common/IdentitySwitcher';
import { fileToBase64 } from '@/utils/file';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { photos, letters, diaryEntries } = useDataStore();
  const { openUploadModal, openWriteLetter, openCreateDiary } = useDialogStore();

  const handleOpenWriteLetter = () => {
    openWriteLetter();
    router.push('/thu-yeu');
  };

  const handleOpenCreateDiary = () => {
    openCreateDiary();
    router.push('/nhat-ky');
  };
  const { showToast } = useNotificationStore();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const { days, hours, minutes, seconds, isLoading, error, reset } =
    useSyncedTimer();

  // Avatar state
  const [kienAvatar, setKienAvatar] = useState(user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
  const [traAvatar, setTraAvatar] = useState(user?.partnerAvatarUrl || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState('');
  const [cropTarget, setCropTarget] = useState<'kien' | 'tra'>('kien');
  const kienFileRef = useRef<HTMLInputElement>(null);
  const traFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Purge the legacy local anniversary override so the server value is authoritative
    localStorage.removeItem('ourspace_anniversary_date');

    const savedKien = localStorage.getItem('ourspace_avatar_kien');
    if (savedKien) setKienAvatar(savedKien);

    const savedTra = localStorage.getItem('ourspace_avatar_tra');
    if (savedTra) setTraAvatar(savedTra);
  }, []);

  useEffect(() => {
    if (user?.avatarUrl) setKienAvatar(user.avatarUrl);
  }, [user?.avatarUrl]);

  useEffect(() => {
    if (user?.partnerAvatarUrl) setTraAvatar(user.partnerAvatarUrl);
  }, [user?.partnerAvatarUrl]);

  useEffect(() => {
    if (error) showToast(error, 'error');
  }, [error, showToast]);

  const handleResetConfirm = async () => {
    setIsResetting(true);
    try {
      await reset();
      showToast('Đã đặt lại thời gian yêu nhau từ phía máy chủ 💖', 'success');
      setShowResetConfirm(false);
    } catch (err: any) {
      showToast(err?.message || 'Đặt lại thất bại, vui lòng thử lại 💔', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>, target: 'kien' | 'tra') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    setCropImageSrc(base64);
    setCropTarget(target);
    setCropModalOpen(true);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleCropSave = (croppedImage: string) => {
    if (cropTarget === 'kien') {
      setKienAvatar(croppedImage);
      localStorage.setItem('ourspace_avatar_kien', croppedImage);
    } else {
      setTraAvatar(croppedImage);
      localStorage.setItem('ourspace_avatar_tra', croppedImage);
    }
    setCropModalOpen(false);
  };

  return (
    <main className="space-y-8">
      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowResetConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="bg-surface rounded-3xl p-8 max-w-sm w-full shadow-2xl border-2 border-primary/20 text-center space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-4xl text-error">
                  restart_alt
                </span>
              </div>

              {/* Title */}
              <h3 className="font-heading font-extrabold text-xl text-on-surface">
                Người ấy có chắc không? 💔
              </h3>

              {/* Description */}
              <p className="font-quicksand text-sm text-on-surface-variant leading-relaxed">
                Thời gian chúng mình đã bên nhau sẽ được <strong className="text-error">đặt lại từ đầu</strong> kể từ hôm nay. 
                Hành động này không thể hoàn tác.
              </p>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  disabled={isResetting}
                  className="flex-1 py-3 rounded-2xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-heading font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  Thôi, không reset 💕
                </button>
                <button
                  onClick={handleResetConfirm}
                  disabled={isResetting}
                  className="flex-1 py-3 rounded-2xl bg-error hover:bg-error/90 text-on-error font-heading font-bold text-sm transition-all active:scale-95 shadow-lg disabled:opacity-50"
                >
                  {isResetting ? 'Đang đặt lại...' : 'Chắc chắn reset'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Anniversary Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 sm:p-10 rounded-[2.5rem] border-2 border-primary/30 relative overflow-hidden bg-gradient-to-r from-surface-container-low via-surface to-surface-container"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          
          {/* Couple Avatars */}
          <div className="flex items-center gap-4">
            {/* Hidden file inputs */}
            <input
              ref={kienFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleAvatarFileChange(e, 'kien')}
            />
            <input
              ref={traFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleAvatarFileChange(e, 'tra')}
            />

            {/* Kiên's Avatar */}
            <div
              className="relative cursor-pointer group"
              onClick={() => kienFileRef.current?.click()}
              title="Bấm để thay ảnh đại diện Kiên"
            >
              <img
                src={kienAvatar}
                alt="Kiên"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-lg group-hover:brightness-75 transition-all"
              />
              {/* Camera overlay on hover */}
              <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                <span className="material-symbols-outlined text-white text-2xl drop-shadow">photo_camera</span>
              </div>
              <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs shadow">
                ♂
              </span>
            </div>

            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary font-bold animate-bounce">
              <span className="material-symbols-outlined text-2xl">favorite</span>
            </div>

            {/* Trà's Avatar */}
            <div
              className="relative cursor-pointer group"
              onClick={() => traFileRef.current?.click()}
              title="Bấm để thay ảnh đại diện Trà"
            >
              <img
                src={traAvatar}
                alt="Trà"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-lg group-hover:brightness-75 transition-all"
              />
              {/* Camera overlay on hover */}
              <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                <span className="material-symbols-outlined text-white text-2xl drop-shadow">photo_camera</span>
              </div>
              <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs shadow font-bold">
                ♀
              </span>
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="flex-1 max-w-lg">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <p className="font-quicksand text-xs sm:text-sm font-bold text-on-surface-variant uppercase tracking-wider">
                Chúng mình đã bên nhau được 💖
              </p>
              <button
                onClick={() => setShowResetConfirm(true)}
                disabled={isLoading || isResetting}
                title="Đặt lại thời gian bên nhau"
                className="w-7 h-7 rounded-full bg-surface-container-high hover:bg-error/10 text-outline hover:text-error flex items-center justify-center transition-all active:scale-90 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
              <div className="bg-surface-container-lowest p-3 sm:p-4 rounded-2xl border border-primary/20 shadow-sm">
                <span className="font-heading font-extrabold text-2xl sm:text-4xl text-primary">
                  {days}
                </span>
                <span className="block font-quicksand text-[11px] sm:text-xs font-bold text-outline">
                  Ngày
                </span>
              </div>
              <div className="bg-surface-container-lowest p-3 sm:p-4 rounded-2xl border border-primary/20 shadow-sm">
                <span className="font-heading font-extrabold text-2xl sm:text-4xl text-primary">
                  {hours}
                </span>
                <span className="block font-quicksand text-[11px] sm:text-xs font-bold text-outline">
                  Giờ
                </span>
              </div>
              <div className="bg-surface-container-lowest p-3 sm:p-4 rounded-2xl border border-primary/20 shadow-sm">
                <span className="font-heading font-extrabold text-2xl sm:text-4xl text-primary">
                  {minutes}
                </span>
                <span className="block font-quicksand text-[11px] sm:text-xs font-bold text-outline">
                  Phút
                </span>
              </div>
              <div className="bg-surface-container-lowest p-3 sm:p-4 rounded-2xl border border-primary/20 shadow-sm">
                <span className="font-heading font-extrabold text-2xl sm:text-4xl text-primary">
                  {seconds}
                </span>
                <span className="block font-quicksand text-[11px] sm:text-xs font-bold text-outline">
                  Giây
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Identity Switcher — Phân quyền người dùng */}
      <IdentitySwitcher variant="box" />

      {/* Quick Action Bubbles */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={handleOpenWriteLetter}
          className="glass-panel p-5 rounded-3xl text-left hover:scale-105 transition-all group border border-primary/20"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center mb-3 group-hover:rotate-6 transition-transform">
            <span className="material-symbols-outlined text-2xl">mark_email_read</span>
          </div>
          <h4 className="font-heading font-bold text-sm text-primary">Viết thư tay</h4>
          <p className="font-quicksand text-xs text-on-surface-variant font-medium">Gửi lời yêu thương</p>
        </button>

        <button
          onClick={handleOpenCreateDiary}
          className="glass-panel p-5 rounded-3xl text-left hover:scale-105 transition-all group border border-primary/20"
        >
          <div className="w-12 h-12 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center mb-3 group-hover:rotate-6 transition-transform">
            <span className="material-symbols-outlined text-2xl">menu_book</span>
          </div>
          <h4 className="font-heading font-bold text-sm text-secondary">Viết nhật ký</h4>
          <p className="font-quicksand text-xs text-on-surface-variant font-medium">Ghi lại cảm xúc ngày</p>
        </button>

        <button
          onClick={openUploadModal}
          className="glass-panel p-5 rounded-3xl text-left hover:scale-105 transition-all group border border-primary/20"
        >
          <div className="w-12 h-12 rounded-2xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center mb-3 group-hover:rotate-6 transition-transform">
            <span className="material-symbols-outlined text-2xl">add_a_photo</span>
          </div>
          <h4 className="font-heading font-bold text-sm text-tertiary">Thêm kỷ niệm</h4>
          <p className="font-quicksand text-xs text-on-surface-variant font-medium">Lưu giữ bức ảnh đẹp</p>
        </button>

        <Link
          href="/hanh-trinh"
          className="glass-panel p-5 rounded-3xl text-left hover:scale-105 transition-all group border border-primary/20 block"
        >
          <div className="w-12 h-12 rounded-2xl bg-surface-container-high text-primary flex items-center justify-center mb-3 group-hover:rotate-6 transition-transform">
            <span className="material-symbols-outlined text-2xl">timeline</span>
          </div>
          <h4 className="font-heading font-bold text-sm text-primary">Cột mốc mới</h4>
          <p className="font-quicksand text-xs text-on-surface-variant font-medium">Xem lại hành trình</p>
        </Link>
      </section>

      {/* Highlights Grid: Latest Memories, Letters & Diary */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Gallery Preview */}
        <div className="glass-panel p-6 rounded-3xl border border-primary/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-base text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">photo_library</span>
                Kỷ niệm gần đây
              </h3>
              <Link href="/ky-niem" className="font-quicksand text-xs font-bold text-primary hover:underline">
                Xem tất cả &rarr;
              </Link>
            </div>

            {photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {photos.slice(0, 4).map((p) => (
                  <div key={p.id} className="h-28 rounded-2xl overflow-hidden shadow-sm relative group">
                    <img src={p.url} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-surface-container-low p-6 rounded-2xl border border-dashed border-primary/30 text-center space-y-2">
                <span className="material-symbols-outlined text-3xl text-primary/60">add_photo_alternate</span>
                <p className="font-quicksand text-xs font-bold text-on-surface-variant">Chưa có bức ảnh nào</p>
                <button onClick={openUploadModal} className="text-xs font-heading font-bold text-primary hover:underline">
                  + Tải ảnh đầu tiên
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Latest Letter Preview */}
        <div className="glass-panel p-6 rounded-3xl border border-primary/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-base text-secondary flex items-center gap-2">
                <span className="material-symbols-outlined">mail</span>
                Thư yêu mới nhất
              </h3>
              <Link href="/thu-yeu" className="font-quicksand text-xs font-bold text-secondary hover:underline">
                Hòm thư &rarr;
              </Link>
            </div>
            {letters.length > 0 ? (
              <div className="bg-surface-container-low p-4 rounded-2xl border border-primary/10 space-y-2">
                <span className="inline-block px-2.5 py-1 rounded-full bg-primary-container text-on-primary-container text-[11px] font-heading font-bold">
                  Từ: {letters[0].sender}
                </span>
                <h4 className="font-heading font-bold text-sm text-on-surface line-clamp-1">
                  {letters[0].title || 'Thư không tiêu đề 💕'}
                </h4>
                <p className="font-quicksand text-xs text-on-surface-variant line-clamp-2">
                  {letters[0].content}
                </p>
              </div>
            ) : (
              <div className="bg-surface-container-low p-6 rounded-2xl border border-dashed border-secondary/30 text-center space-y-2">
                <span className="material-symbols-outlined text-3xl text-secondary/60">mark_email_read</span>
                <p className="font-quicksand text-xs font-bold text-on-surface-variant">Chưa có lá thư nào</p>
                <button onClick={handleOpenWriteLetter} className="text-xs font-heading font-bold text-secondary hover:underline">
                  + Viết thư đầu tiên
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Latest Diary Entry */}
        <div className="glass-panel p-6 rounded-3xl border border-primary/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-base text-tertiary flex items-center gap-2">
                <span className="material-symbols-outlined">menu_book</span>
                Nhật ký hôm nay
              </h3>
              <Link href="/nhat-ky" className="font-quicksand text-xs font-bold text-tertiary hover:underline">
                Đọc nhật ký &rarr;
              </Link>
            </div>
            {diaryEntries.length > 0 ? (
              <div className="bg-surface-container-low p-4 rounded-2xl border border-primary/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-quicksand text-xs font-bold text-outline">
                    {diaryEntries[0].date}
                  </span>
                  <span className="text-sm">🥰 ☕</span>
                </div>
                <h4 className="font-heading font-bold text-sm text-on-surface line-clamp-1">
                  {diaryEntries[0].title || 'Nhật ký không tiêu đề 📖'}
                </h4>
                <p className="font-quicksand text-xs text-on-surface-variant line-clamp-2">
                  {diaryEntries[0].content}
                </p>
              </div>
            ) : (
              <div className="bg-surface-container-low p-6 rounded-2xl border border-dashed border-tertiary/30 text-center space-y-2">
                <span className="material-symbols-outlined text-3xl text-tertiary/60">menu_book</span>
                <p className="font-quicksand text-xs font-bold text-on-surface-variant">Chưa có bài nhật ký nào</p>
                <button onClick={handleOpenCreateDiary} className="text-xs font-heading font-bold text-tertiary hover:underline">
                  + Ghi nhật ký đầu tiên
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Avatar Crop Modal */}
      <AvatarCropModal
        isOpen={cropModalOpen}
        imageSrc={cropImageSrc}
        personName={cropTarget === 'kien' ? 'Kiên' : 'Trà'}
        onClose={() => setCropModalOpen(false)}
        onSave={handleCropSave}
      />
    </main>
  );
}
