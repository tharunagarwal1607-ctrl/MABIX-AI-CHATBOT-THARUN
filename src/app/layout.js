import './globals.css';

export const metadata = {
  title: 'MABIX - AI Chat',
  description:
    'MABIX - AN INTELLIGENCE BOT. Your intelligent AI assistant powered by MABIX 1.0 (core).',
  keywords: 'AI, chatbot, assistant, MABIX, MABIX 1.0 (core)',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
