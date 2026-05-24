import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Signal-X',
  description: 'Adv. Traffic Control, Surveillance & Emergency Response System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
