'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function EntrancePage() {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const { login, isAuthenticated, checkSession } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkSession();
    if (typeof window !== 'undefined') {
      const isAuth = localStorage.getItem('ourspace_auth') === 'true';
      if (isAuth) {
        router.replace('/home');
      }
    }
  }, [router, checkSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim() || isOpening) return;

    const success = await login(passcode);
    if (success) {
      setError(false);
      setIsOpening(true);
      setTimeout(() => {
        router.replace('/home');
      }, 900);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between p-6 sm:p-10 overflow-hidden select-none bg-gradient-to-b from-[#FFF5F6] via-[#FFF0F3] to-[#FFE6EA]">
      {/* Portal Flash Effect on Success */}
      {isOpening && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-50 bg-white flex items-center justify-center pointer-events-none"
        >
          <div className="text-center space-y-4">
            <span className="material-symbols-outlined text-6xl text-primary animate-ping">
              favorite
            </span>
            <p className="font-heading font-extrabold text-2xl text-primary">
              Chào mừng Kiên & Trà trở về góc nhỏ! 💕
            </p>
          </div>
        </motion.div>
      )}

      {/* Header Info */}
      <header className="w-full max-w-4xl flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          <span className="font-heading font-bold text-sm text-primary uppercase tracking-wider">
            OurSpace &bull; Góc Nhỏ Của Chúng Mình
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-md my-auto flex flex-col items-center text-center z-10 space-y-8">
        {/* Heart Gateway Illustration */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative group"
        >
          <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-full glass-panel p-3 border-4 border-white/80 shadow-2xl flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-primary-container/40 to-surface">
            <img
              src="/entrance_illustration.png"
              alt="Gate"
              className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-700"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-primary/10 backdrop-blur-[2px]">
              <span className="material-symbols-outlined text-6xl text-primary drop-shadow-md">
                lock_open
              </span>
            </div>
          </div>
        </motion.div>

        {/* Title and Subtitle */}
        <div className="space-y-2">
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-on-surface tracking-tight">
            Cánh Cửa Tình Yêu 💕
          </h1>
          <p className="font-quicksand font-semibold text-sm sm:text-base text-on-surface-variant max-w-xs mx-auto">
            Góc nhỏ riêng tư bí mật dành cho chúng mình.
          </p>
        </div>

        {/* Passcode Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative">
            <input
              type="password"
              placeholder="Nhập mật mã bí mật"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className={`w-full px-6 py-4 rounded-full text-center font-heading font-bold text-base bg-surface/80 border-2 shadow-inner focus:outline-none transition-all ${
                error
                  ? 'border-error text-error animate-shake'
                  : 'border-primary/30 focus:border-primary text-on-surface'
              }`}
            />
            {error && (
              <p className="text-error font-quicksand text-xs font-bold mt-2">
                Mật mã chưa chính xác. Thử lại nhé! 💔
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isOpening}
            className="w-full py-4 rounded-full bg-primary hover:bg-primary/90 text-on-primary font-heading font-bold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-75"
          >
            <span>Mở cánh cửa</span>
            <span className="material-symbols-outlined text-xl">key</span>
          </button>
        </form>
      </main>

      {/* Footer Note */}
      <footer className="z-10 text-center font-quicksand text-xs font-bold text-outline">
        Được thiết kế riêng cho Kiên 💕 Trà
      </footer>
    </div>
  );
}
