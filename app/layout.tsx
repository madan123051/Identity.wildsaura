import "./globals.css";
import { AuthProvider } from "@/lib/authContext";

export const metadata = {
  title: "WildSaura Identity",
  description: "One identity for all WildSaura apps",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <AuthProvider>
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}