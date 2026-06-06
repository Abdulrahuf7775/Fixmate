'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Star } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggle = () => setIsOpen(!isOpen);

  return (
    <>
      <header className="bg-white px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <Star className="w-5 h-5 fill-black text-black" />
          <span className="text-lg font-semibold text-gray-900 tracking-tight whitespace-nowrap">FixMate.ai</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
          <Link href="/report" className="hover:text-black transition-colors">Request an Artisan</Link>
          <Link href="/dashboard" className="hover:text-black transition-colors">User Dashboard</Link>
          <Link href="/artisan/register" className="hover:text-black transition-colors">Become an Artisan</Link>
          <Link href="/artisan/dashboard" className="hover:text-black transition-colors">Artisan Hub</Link>
          <Link href="/admin" className="hover:text-black transition-colors">Admin</Link>
          <Link href="/ussd" className="hover:text-black transition-colors">USSD Demo</Link>
          <Link href="/whatsapp" className="hover:text-black transition-colors">WhatsApp Demo</Link>
        </nav>

        {/* Right Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/artisan/dashboard" className="text-sm font-medium text-gray-700 hover:text-black transition-colors">
            Artisan Hub
          </Link>
          <Link href="/report" className="bg-green-700 text-white px-5 py-2.5 rounded-none text-sm font-medium hover:bg-green-800 transition-colors">
            Get started free
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-gray-800" onClick={toggle} aria-label="Toggle Navigation">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Nav Drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white pt-20 flex flex-col h-screen overflow-y-auto w-full">
          <nav className="flex flex-col text-lg font-medium text-gray-800">
          <Link href="/" onClick={toggle} className="py-4 px-6 border-b border-gray-100 block transition-colors hover:bg-gray-50 hover:text-green-600">Home</Link>
            <Link href="/report" onClick={toggle} className="py-4 px-6 border-b border-gray-100 block transition-colors hover:bg-gray-50 hover:text-green-600">Request an Artisan</Link>
            <Link href="/dashboard" onClick={toggle} className="py-4 px-6 border-b border-gray-100 block transition-colors hover:bg-gray-50 hover:text-green-600">User Wallet</Link>
            <Link href="/artisan/dashboard" onClick={toggle} className="py-4 px-6 border-b border-gray-100 block transition-colors hover:bg-gray-50 hover:text-green-600">Artisan Hub</Link>
            <Link href="/admin" onClick={toggle} className="py-4 px-6 border-b border-gray-100 block transition-colors hover:bg-gray-50 hover:text-green-600">Admin Console</Link>
            <Link href="/ussd" onClick={toggle} className="py-4 px-6 border-b border-gray-100 block transition-colors hover:bg-gray-50 hover:text-green-600">USSD Demo</Link>
            <Link href="/whatsapp" onClick={toggle} className="py-4 px-6 border-b border-gray-100 block transition-colors hover:bg-gray-50 hover:text-green-600">WhatsApp Demo</Link>
            <Link href="/artisan/register" onClick={toggle} className="py-4 px-6 border-b border-gray-100 block text-green-700 hover:bg-green-50 transition-colors">Register as Artisan</Link>
          </nav>
        </div>
      )}
    </>
  );
}
