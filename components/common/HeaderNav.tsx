'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useDialogStore } from '@/store/useDialogStore';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/home', label: 'Trang Chủ', icon: 'home' },
  { path: '/hanh-trinh', label: 'Hành Trình', icon: 'timeline' },
  { path: '/ky-niem', label: 'Kỷ Niệm', icon: 'photo_library' },
  { path: '/thu-yeu', label: 'Thư Yêu', icon: 'mail' },
  { path: '/nhat-ky', label: 'Nhật Ký', icon: 'menu_book' },
];

export function HeaderNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const { openChangePassword } = useDialogStore();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-surface/80 border-b border-primary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo / Brand Name */}
        <Link href="/home" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-xl">favorite</span>
          </div>
          <span className="font-heading font-extrabold text-lg text-primary tracking-tight">
            OurSpace <span className="text-xs font-normal text-outline">💕 Kiên & Trà</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-container-low/60 p-1.5 rounded-full border border-primary/10">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`relative px-4 py-2 rounded-full font-heading font-bold text-xs flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'text-on-primary'
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary rounded-full shadow-sm"
                    transition={{ type: 'spring', duration: 0.5 }}
                  />
                )}
                <span className="material-symbols-outlined text-base relative z-10">
                  {item.icon}
                </span>
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Password Change & Logout */}
        <div className="flex items-center gap-2">
          <button
            onClick={openChangePassword}
            className="p-2 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
            title="Đổi mật mã bí mật"
          >
            <span className="material-symbols-outlined text-xl">key</span>
          </button>

          <button
            onClick={handleLogout}
            className="p-2 rounded-full text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors"
            title="Đăng xuất khỏi góc nhỏ"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-lg border-t border-primary/10 px-2 py-2 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all ${
                isActive ? 'text-primary font-bold' : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span className="font-heading text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
