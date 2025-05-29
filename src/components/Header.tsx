'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-3 hover:scale-105 transition-transform">
            <Image 
              src="/oswf.png" 
              alt="Oh S#!T We're Famous Logo" 
              width={40} 
              height={40}
              className="rounded-full"
            />
            <div className="text-xl font-bold">
              <span className="text-yellow-300">Oh S#!T</span>{' '}
              <span className="text-white">We&apos;re Famous</span>
            </div>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden hover:bg-white/20 p-2 rounded-lg transition-colors" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
            />
          </svg>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6">
          <Link href="/" className="hover:text-yellow-300 transition-colors px-3 py-2 rounded-lg hover:bg-white/10">
            Dashboard
          </Link>
          <Link href="/analytics" className="hover:text-yellow-300 transition-colors px-3 py-2 rounded-lg hover:bg-white/10">
            Analytics
          </Link>
          <Link href="/coverage" className="hover:text-yellow-300 transition-colors px-3 py-2 rounded-lg hover:bg-white/10">
            Coverage
          </Link>
          <Link href="/outreach" className="hover:text-yellow-300 transition-colors px-3 py-2 rounded-lg hover:bg-white/10">
            Outreach
          </Link>
          <Link href="/events" className="hover:text-yellow-300 transition-colors px-3 py-2 rounded-lg hover:bg-white/10">
            Events
          </Link>
          <Link href="/worksheets" className="hover:text-yellow-300 transition-colors px-3 py-2 rounded-lg hover:bg-white/10">
            All Data
          </Link>
        </nav>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="md:hidden pt-4 pb-2 px-2 border-t border-white/20 mt-4">
          <Link 
            href="/" 
            className="block py-3 hover:bg-white/10 px-3 rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            🏠 Dashboard
          </Link>
          <Link 
            href="/analytics" 
            className="block py-3 hover:bg-white/10 px-3 rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            📊 Analytics
          </Link>
          <Link 
            href="/coverage" 
            className="block py-3 hover:bg-white/10 px-3 rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            📰 Coverage
          </Link>
          <Link 
            href="/outreach" 
            className="block py-3 hover:bg-white/10 px-3 rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            📧 Outreach
          </Link>
          <Link 
            href="/events" 
            className="block py-3 hover:bg-white/10 px-3 rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            🎤 Events
          </Link>
          <Link 
            href="/worksheets" 
            className="block py-3 hover:bg-white/10 px-3 rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            📋 All Data
          </Link>
        </nav>
      )}
    </header>
  );
} 