import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';

export const metadata = {
  title: 'OffboardIQ — AI-Powered Knowledge Capture',
  description: 'Protect institutional knowledge when employees depart. AI-driven interviews, risk assessment, and knowledge transfer.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
