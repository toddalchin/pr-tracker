'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  // Helper function to determine if a link is active
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  // Helper function to get link classes
  const getLinkClasses = (path: string, isMobile = false) => {
    const baseClasses = isMobile 
      ? "block py-3 px-3 rounded-lg transition-colors"
      : "hover:text-yellow-300 transition-colors px-3 py-2 rounded-lg";
    
    if (isActive(path)) {
      return `${baseClasses} bg-white/20 text-yellow-300 font-semibold`;
    }
    return `${baseClasses} hover:bg-white/10`;
  };

  return (
    <header className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white p-2 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="flex items-center hover:scale-105 transition-transform">
            <Image 
              src="/oswf.png" 
              alt="Oh S#!T We're Famous Logo" 
              width={200} 
              height={100}
              className="h-20 w-auto"
              priority
            />
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
        <nav className="hidden md:flex space-x-4">
          <Link href="/" className={getLinkClasses('/')}>
            Dashboard
          </Link>
          <Link href="/coverage" className={getLinkClasses('/coverage')}>
            Coverage
          </Link>
          <Link href="/awards" className={getLinkClasses('/awards')}>
            Awards
          </Link>
          <Link href="/speaking" className={getLinkClasses('/speaking')}>
            Speaking
          </Link>
          <Link href="/content" className={getLinkClasses('/content')}>
            Content
          </Link>
          <Link href="/outreach" className={getLinkClasses('/outreach')}>
            Outreach
          </Link>
          <Link href="/client-permissions" className={getLinkClasses('/client-permissions')}>
            Permissions
          </Link>
          <Link href="/worksheets" className={`${getLinkClasses('/worksheets')} text-sm`}>
            All Data
          </Link>
        </nav>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="md:hidden pt-4 pb-2 px-2 border-t border-white/20 mt-4">
          <Link 
            href="/" 
            className={getLinkClasses('/', true)}
            onClick={() => setIsMenuOpen(false)}
          >
            🏠 Dashboard
          </Link>
          <Link 
            href="/coverage" 
            className={getLinkClasses('/coverage', true)}
            onClick={() => setIsMenuOpen(false)}
          >
            📰 Coverage
          </Link>
          <Link 
            href="/awards" 
            className={getLinkClasses('/awards', true)}
            onClick={() => setIsMenuOpen(false)}
          >
            🏆 Awards
          </Link>
          <Link 
            href="/speaking" 
            className={getLinkClasses('/speaking', true)}
            onClick={() => setIsMenuOpen(false)}
          >
            🎤 Speaking Opportunities
          </Link>
          <Link 
            href="/content" 
            className={getLinkClasses('/content', true)}
            onClick={() => setIsMenuOpen(false)}
          >
            📝 Content Calendar
          </Link>
          <Link 
            href="/outreach" 
            className={getLinkClasses('/outreach', true)}
            onClick={() => setIsMenuOpen(false)}
          >
            📧 Outreach
          </Link>
          <Link 
            href="/client-permissions" 
            className={getLinkClasses('/client-permissions', true)}
            onClick={() => setIsMenuOpen(false)}
          >
            🔐 Client Permissions
          </Link>
          <Link 
            href="/worksheets" 
            className={getLinkClasses('/worksheets', true)}
            onClick={() => setIsMenuOpen(false)}
          >
            📋 All Data
          </Link>
        </nav>
      )}
    </header>
  );
} 