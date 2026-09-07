import React, { useState, useEffect } from 'react';
import { Download, Menu, X } from 'lucide-react';

export const Navbar = ({ onOpenResume }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Active section spy
      const sections = ['about', 'skills', 'experience', 'projects', 'contact'];
      const scrollPosition = window.scrollY + 200;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'About Me', href: '#about', id: 'about' },
    { label: 'Skills', href: '#skills', id: 'skills' },
    { label: 'Experience', href: '#experience', id: 'experience' },
    { label: 'Project', href: '#projects', id: 'projects' },
    { label: 'Contact Me', href: '#contact', id: 'contact' },
  ];

  const handleScrollTo = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-zinc-100 py-3.5'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between">
        {/* Brand Logo */}
        <a
          href="#"
          className="flex items-center gap-2.5 group cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          {/* Stylized P Logo Mark */}
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-105">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4.5 h-4.5"
            >
              <path d="M6 3h7.5a5.5 5.5 0 0 1 0 11H10v7H6V3zm4 3.5v4h3.5a2 2 0 1 0 0-4H10z" />
            </svg>
          </div>
          <span className="font-sora font-extrabold text-xl tracking-tight text-black">
            Personal
          </span>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={link.href}
              onClick={(e) => handleScrollTo(e, link.href)}
              className={`font-sora font-semibold text-[15px] transition-colors relative py-1 ${
                activeSection === link.id
                  ? 'text-black font-bold'
                  : 'text-zinc-700 hover:text-black'
              }`}
            >
              {link.label}
              {activeSection === link.id && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-black rounded-full animate-fade-in" />
              )}
            </a>
          ))}
        </nav>

        {/* Right CTA: Resume Button */}
        <div className="hidden md:flex items-center">
          <button
            onClick={onOpenResume}
            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-md font-sora font-semibold text-sm hover:bg-zinc-800 transition-all duration-200 active:scale-95 shadow-sm"
          >
            <span>Resume</span>
            <Download className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={onOpenResume}
            className="flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded text-xs font-semibold"
          >
            <span>Resume</span>
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-black hover:bg-zinc-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-zinc-200 shadow-xl px-6 py-6 animate-slide-up">
          <nav className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleScrollTo(e, link.href)}
                className={`font-sora text-base font-semibold py-2 border-b border-zinc-100 ${
                  activeSection === link.id ? 'text-black font-bold' : 'text-zinc-600'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};
