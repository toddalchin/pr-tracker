'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-black text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link href="/" className="text-xl font-bold flex items-center">
            <span className="text-blue-500 mr-1">Oh S#!T</span> We&apos;re Famous
          </Link>
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden" 
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
        <nav className="hidden md:flex space-x-8">
          <Link href="/" className="hover:text-blue-300 transition">
            Dashboard
          </Link>
          <Link href="/coverage" className="hover:text-blue-300 transition">
            Coverage
          </Link>
          <Link href="/outreach" className="hover:text-blue-300 transition">
            Outreach
          </Link>
          <Link href="/events" className="hover:text-blue-300 transition">
            Events
          </Link>
          <Link href="/worksheets" className="hover:text-blue-300 transition">
            All Worksheets
          </Link>
        </nav>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="md:hidden pt-4 pb-2 px-2">
          <Link 
            href="/" 
            className="block py-2 hover:bg-gray-800 px-3 rounded"
            onClick={() => setIsMenuOpen(false)}
          >
            Dashboard
          </Link>
          <Link 
            href="/coverage" 
            className="block py-2 hover:bg-gray-800 px-3 rounded"
            onClick={() => setIsMenuOpen(false)}
          >
            Coverage
          </Link>
          <Link 
            href="/outreach" 
            className="block py-2 hover:bg-gray-800 px-3 rounded"
            onClick={() => setIsMenuOpen(false)}
          >
            Outreach
          </Link>
          <Link 
            href="/events" 
            className="block py-2 hover:bg-gray-800 px-3 rounded"
            onClick={() => setIsMenuOpen(false)}
          >
            Events
          </Link>
          <Link 
            href="/worksheets" 
            className="block py-2 hover:bg-gray-800 px-3 rounded"
            onClick={() => setIsMenuOpen(false)}
          >
            All Worksheets
          </Link>
        </nav>
      )}
    </header>
  );
} 