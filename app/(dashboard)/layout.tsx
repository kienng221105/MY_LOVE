'use client';

import { HeaderNav } from '@/components/common/HeaderNav';
import { useAuthStore } from '@/store/useAuthStore';
import { useDataStore } from '@/store/useDataStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { checkSession } = useAuthStore();
  const { initData } = useDataStore();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    void checkSession().then(() => {
      if (typeof window !== 'undefined') {
        const isAuth = localStorage.getItem('ourspace_auth') === 'true';
        if (!isAuth) {
          router.replace('/');
        } else {
          setIsAuthorized(true);
        }
      }
    });
    void initData();
  }, [router, checkSession, initData]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">
            favorite
          </span>
          <p className="font-heading font-bold text-xs text-primary">
            Đang chuẩn bị góc nhỏ... 💕
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-12">
      <HeaderNav />
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>
    </div>
  );
}
