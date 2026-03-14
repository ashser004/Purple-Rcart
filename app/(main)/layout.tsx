"use client";

import { ReactNode } from "react";
import BottomNav from "@/components/shared/BottomNav";
import ToastProvider from "@/components/shared/Toast";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <main>{children}</main>
      <BottomNav />
    </ToastProvider>
  );
}
