import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/ui/Sidebar";
import TopNav from "@/components/ui/TopNav";
import NavigationWrapper from "@/components/ui/NavigationWrapper";
import { AppProvider } from "@/context/AppContext";

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
          <NavigationWrapper>
            {children}
          </NavigationWrapper>
        </AppProvider>
      </body>
    </html>
  );
}
