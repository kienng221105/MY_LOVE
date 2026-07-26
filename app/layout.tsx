import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Be_Vietnam_Pro, Quicksand } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/common/Providers';
import { SakuraBackground } from '@/components/common/SakuraBackground';
import { ToastContainer } from '@/components/common/ToastContainer';
import { UploadModal } from '@/components/common/UploadModal';
import { ChangePasswordModal } from '@/components/common/ChangePasswordModal';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-plus-jakarta-sans',
  weight: ['700', '800'],
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-be-vietnam-pro',
  weight: ['400', '500', '700'],
});

const quicksand = Quicksand({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-quicksand',
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'OurSpace 💕 - Cánh cửa tình yêu của chúng mình',
  description: 'Góc nhỏ riêng tư bí mật dành cho hai đứa.',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${plusJakartaSans.variable} ${beVietnamPro.variable} ${quicksand.variable}`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="antialiased font-sans bg-background text-on-surface relative min-h-screen">
        <Providers>
          <SakuraBackground />
          <ToastContainer />
          <UploadModal />
          <ChangePasswordModal />
          {children}
        </Providers>
      </body>
    </html>
  );
}
