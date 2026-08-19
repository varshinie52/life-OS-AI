import type { Metadata } from "next";
import "./globals.css";
import NavigationWrapper from "@/components/ui/NavigationWrapper";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { LifeOSProvider } from "@/context/LifeOSContext";

export const metadata: Metadata = {
  title: "LifeOS",
  description: "Your entire life, leveled up. An all-in-one productivity operating system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppProvider>
          <LifeOSProvider>
            <AuthProvider>
              <ToastProvider>
                <NavigationWrapper>
                  {children}
                </NavigationWrapper>
              </ToastProvider>
            </AuthProvider>
          </LifeOSProvider>
        </AppProvider>
      </body>
    </html>
  );
}
