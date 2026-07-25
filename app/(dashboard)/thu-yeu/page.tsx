'use client';

import { useState } from 'react';
import { LoveLetter } from '@/types/letter';
import { useDialogStore } from '@/store/useDialogStore';
import { useDataStore } from '@/store/useDataStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function LettersPage() {
  const { letters, addLetter, markLetterRead } = useDataStore();
  const [activeLetter, setActiveLetter] = useState<LoveLetter | null>(null);
  const { isWriteLetterOpen, openWriteLetter, closeWriteLetter } = useDialogStore();
  const { showToast } = useNotificationStore();

  // Form state
  const [sender, setSender] = useState('Kiên');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [openDate, setOpenDate] = useState('');

  const handleOpenLetter = (letter: LoveLetter) => {
    setActiveLetter(letter);
    if (!letter.isRead) {
      markLetterRead(letter.id);
    }
  };

  const handleWriteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;

    addLetter({
      sender,
      recipient: sender === 'Kiên' ? 'Trà' : 'Kiên',
      title,
      content,
      sentDate: new Date().toISOString().split('T')[0],
      openDate: openDate || undefined,
      isRead: false,
      bgStyle: 'pink',
    });

    showToast('Đã gửi bức thư tình ngọt ngào 💌');
    closeWriteLetter();
    setTitle('');
    setContent('');
    setOpenDate('');
  };

  return (
    <main className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-6 sm:p-8 rounded-[2rem] border border-primary/20">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-3xl">mark_email_read</span>
            Hòm Thư Tình Yêu 💌
          </h1>
          <p className="font-quicksand text-xs sm:text-sm text-on-surface-variant font-semibold mt-1">
            Nơi cất giữ những tâm tư, nỗi nhớ và lời hứa chân thành của chúng mình.
          </p>
        </div>

        <button
          onClick={openWriteLetter}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-heading font-bold text-sm shadow-md hover:scale-105 transition-transform flex-shrink-0"
        >
          <span className="material-symbols-outlined text-lg">edit_square</span>
          Viết thư mới
        </button>
      </div>

      {/* Letters Grid or Empty State */}
      {letters.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {letters.map((letter, idx) => (
            <motion.div
              key={letter.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              onClick={() => handleOpenLetter(letter)}
              className="glass-panel p-6 rounded-3xl border border-primary/20 hover:border-primary/40 cursor-pointer group transition-all hover:scale-[1.02] flex flex-col justify-between space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-primary-container text-on-primary-container font-heading font-bold text-xs">
                  Từ: {letter.sender}
                </span>
                <span className="font-quicksand text-xs text-outline font-semibold">
                  {letter.sentDate}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="font-heading font-bold text-base text-on-surface group-hover:text-primary transition-colors">
                  {letter.title || 'Thư không tiêu đề 💕'}
                </h3>
                <p className="font-quicksand text-xs text-on-surface-variant line-clamp-3 leading-relaxed">
                  {letter.content}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-primary/10">
                <span className="font-quicksand text-[11px] font-bold text-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">drafts</span>
                  Chạm để đọc thư
                </span>
                {!letter.isRead && (
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl border border-dashed border-primary/30 text-center space-y-4 max-w-md mx-auto my-12">
          <div className="w-16 h-16 rounded-full bg-primary-container text-primary flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-4xl">mark_email_read</span>
          </div>
          <h3 className="font-heading font-bold text-lg text-primary">Hòm thư đang trống</h3>
          <p className="font-quicksand text-xs text-on-surface-variant font-semibold">
            Gửi lá thư tình yêu ngọt ngào đầu tiên cho người ấy ngay nhé!
          </p>
          <button
            onClick={openWriteLetter}
            className="px-6 py-2.5 rounded-full bg-primary text-on-primary font-heading font-bold text-xs shadow-md hover:scale-105 transition-transform"
          >
            Viết thư ngay
          </button>
        </div>
      )}

      {/* Envelope Opening / Read Letter Modal */}
      <AnimatePresence>
        {activeLetter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="glass-panel w-full max-w-xl p-8 rounded-3xl bg-surface/95 border-2 border-primary/40 shadow-2xl relative"
            >
              <button
                onClick={() => setActiveLetter(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>

              <div className="text-center mb-6">
                <span className="inline-block p-3 rounded-full bg-primary-container text-primary mb-2">
                  <span className="material-symbols-outlined text-3xl">favorite</span>
                </span>
                <h3 className="font-heading font-extrabold text-2xl text-primary">
                  {activeLetter.title || 'Thư không tiêu đề 💕'}
                </h3>
                <p className="font-quicksand text-xs font-bold text-on-surface-variant mt-1">
                  Người gửi: {activeLetter.sender} &bull; Ngày gửi: {activeLetter.sentDate}
                </p>
              </div>

              <div className="bg-surface-container-low p-6 rounded-2xl border border-primary/20 max-h-72 overflow-y-auto font-quicksand text-sm text-on-surface leading-relaxed whitespace-pre-wrap shadow-inner">
                {activeLetter.content}
              </div>

              <div className="flex items-center justify-center pt-6">
                <button
                  onClick={() => setActiveLetter(null)}
                  className="px-8 py-3 rounded-full bg-primary text-on-primary font-heading font-bold text-sm shadow-md hover:scale-105 transition-transform"
                >
                  Gấp thư lại 💕
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Write Letter Modal */}
      <AnimatePresence>
        {isWriteLetterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-panel w-full max-w-lg p-6 rounded-3xl bg-surface/95 border-2 border-primary/30 shadow-2xl relative"
            >
              <button
                onClick={closeWriteLetter}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>

              <h3 className="font-heading font-extrabold text-xl text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">edit_square</span>
                Viết lá thư yêu thương 💌
              </h3>

              <form onSubmit={handleWriteSubmit} className="space-y-4">
                <div>
                  <label className="block font-heading font-bold text-xs text-on-surface mb-1">
                    Người gửi
                  </label>
                  <select
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-primary/20 text-xs font-heading font-bold"
                  >
                    <option value="Kiên">Kiên</option>
                    <option value="Trà">Trà</option>
                  </select>
                </div>

                <div>
                  <label className="block font-heading font-bold text-xs text-on-surface mb-1">
                    Tiêu đề thư <span className="text-outline font-medium">(tùy chọn)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập tiêu đề ngọt ngào... (tùy chọn)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-primary/20 text-sm font-heading font-bold"
                  />
                </div>

                <div>
                  <label className="block font-heading font-bold text-xs text-on-surface mb-1">
                    Nội dung thư
                  </label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Viết những suy nghĩ, tình cảm chân thành..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-primary/20 text-xs font-quicksand font-medium"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeWriteLetter}
                    className="px-5 py-2.5 rounded-full font-heading font-bold text-xs text-on-surface-variant hover:bg-surface-container"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-primary text-on-primary font-heading font-bold text-xs shadow-md hover:scale-105 transition-transform"
                  >
                    Gửi thư tình
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
