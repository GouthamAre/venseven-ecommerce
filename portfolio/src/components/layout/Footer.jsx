import React from 'react';
import { ArrowUp } from 'lucide-react';

export const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-black text-white py-12 border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5">
                <path d="M6 3h7.5a5.5 5.5 0 0 1 0 11H10v7H6V3zm4 3.5v4h3.5a2 2 0 1 0 0-4H10z" />
              </svg>
            </div>
            <span className="font-sora font-extrabold text-xl tracking-tight text-white">
              Personal
            </span>
          </div>

          {/* Copyright text */}
          <div className="text-zinc-500 text-xs sm:text-sm text-center">
            © {new Date().getFullYear()} <span className="text-zinc-300 font-semibold">Evren Shah</span>. All rights reserved. Crafted with clean code & pixel perfection.
          </div>

          {/* Back to top button */}
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all text-xs font-sora font-semibold"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>

        </div>
      </div>
    </footer>
  );
};
