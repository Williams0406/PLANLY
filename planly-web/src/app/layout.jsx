import './globals.css';

export const metadata = {
  title: 'Planly — Organiza. Divide. Disfruta.',
  description: 'La app de viajes grupales más completa',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}