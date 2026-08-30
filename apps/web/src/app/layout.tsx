import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { AppShell } from '@/components/app-shell';
import { PageHeaderProvider } from '@/components/page-header';
import { AuthProvider } from '@/lib/auth';
import './globals.css';

const display = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
});

const body = Inter({
  variable: '--font-body',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CoBuild — Find people to build with',
  description:
    'Discover projects, meet compatible collaborators, and build together.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full overflow-hidden`}>
      <body className="flex h-full flex-col overflow-hidden antialiased">
        <AuthProvider>
          <PageHeaderProvider>
            <AppShell>{children}</AppShell>
          </PageHeaderProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
