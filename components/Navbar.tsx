"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center bg-green-700 text-sm font-black text-white">F</span>
            <span className="text-lg font-semibold tracking-normal text-gray-950 whitespace-nowrap">FixMate</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-gray-700 md:flex">
            <Link href="/report" className="hover:text-black">Request an Artisan</Link>
            <Link href="/dashboard" className="hover:text-black">User Dashboard</Link>
            <Link href="/artisan/register" className="hover:text-black">Become an Artisan</Link>
            <Link href="/artisan/dashboard" className="hover:text-black">Artisan Hub</Link>
            <Link href="/admin" className="hover:text-black">Admin</Link>
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <Link href="/report" className="bg-green-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-800">
              Get Started
            </Link>
          </div>

          <button className="border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900 md:hidden" onClick={() => setIsOpen((open) => !open)}>
            {isOpen ? "Close" : "Menu"}
          </button>
        </div>
      </header>

      {isOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-20 md:hidden">
          <nav className="flex flex-col text-lg font-medium text-gray-800">
            <Link href="/" onClick={() => setIsOpen(false)} className="border-b border-gray-100 px-6 py-4">Home</Link>
            <Link href="/report" onClick={() => setIsOpen(false)} className="border-b border-gray-100 px-6 py-4">Request an Artisan</Link>
            <Link href="/dashboard" onClick={() => setIsOpen(false)} className="border-b border-gray-100 px-6 py-4">User Dashboard</Link>
            <Link href="/artisan/register" onClick={() => setIsOpen(false)} className="border-b border-gray-100 px-6 py-4">Become an Artisan</Link>
            <Link href="/artisan/dashboard" onClick={() => setIsOpen(false)} className="border-b border-gray-100 px-6 py-4">Artisan Hub</Link>
            <Link href="/admin" onClick={() => setIsOpen(false)} className="border-b border-gray-100 px-6 py-4">Admin Console</Link>
          </nav>
        </div>
      )}
    </>
  );
}
