import { Inter } from 'next/font/google';
import './globals.css';
import PersistentShell from '../components/ui/PersistentShell';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'HRMS - Workforce Platform',
  description: 'Modern HRMS platform for enterprise workforce management',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#2563eb',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <PersistentShell>{children}</PersistentShell>
      </body>
    </html>
  );
}
