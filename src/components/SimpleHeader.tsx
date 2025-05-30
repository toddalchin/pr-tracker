'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function SimpleHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const headerStyle = {
    background: 'linear-gradient(to right, #9333ea, #ec4899, #dc2626)',
    color: 'white',
    padding: '16px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const logoStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    textDecoration: 'none',
    color: 'white'
  };

  const navStyle = {
    display: 'flex',
    gap: '24px'
  };

  const linkStyle = {
    color: 'white',
    textDecoration: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    transition: 'background-color 0.2s'
  };

  return (
    <header style={headerStyle}>
      <div style={containerStyle}>
        <Link href="/" style={logoStyle}>
          🎯 PR Tracker
        </Link>

        <nav style={navStyle}>
          <Link href="/" style={linkStyle}>
            Analytics
          </Link>
          <Link href="/dashboard" style={linkStyle}>
            Dashboard
          </Link>
          <Link href="/coverage" style={linkStyle}>
            Coverage
          </Link>
          <Link href="/events" style={linkStyle}>
            Events
          </Link>
        </nav>
      </div>
    </header>
  );
} 