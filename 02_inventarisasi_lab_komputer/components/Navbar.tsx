// components/Navbar.tsx
import Link from "next/link";
import { HardDrive } from "lucide-react";
import React from "react";

interface NavbarProps {
  children?: React.ReactNode;
}

export default function Navbar({ children }: NavbarProps) {
  return (
    <nav className="bg-blue-900 text-white p-4 shadow-lg sticky top-0 z-40">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <HardDrive className="h-6 w-6 text-blue-300" />
            <h1 className="text-xl font-bold">
              LabInventory Pro{" "}
              <span className="text-[10px] bg-blue-700 px-2 py-0.5 rounded-full ml-1 font-normal tracking-wide italic">
                v4.2
              </span>
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/inventory" className="text-blue-200 hover:text-white transition-colors">Inventaris</Link>
            <Link href="/settings" className="text-blue-200 hover:text-white transition-colors">Pengaturan</Link>
          </div>
        </div>
        {children && <div className="flex items-center gap-4">{children}</div>}
      </div>
    </nav>
  );
}
