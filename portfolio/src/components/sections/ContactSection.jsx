import React, { useState } from 'react';
import { personalInfo } from '../../data/portfolioData';
import { Mail, Phone, MapPin, Send, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { FaGithub, FaDribbble, FaTwitter, FaDiscord } from 'react-icons/fa';

export const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    website: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setIsSubmitting(true);
    // Simulate network submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({ name: '', email: '', website: '', message: '' });
      setTimeout(() => setIsSubmitted(false), 6000);
    }, 800);
  };

  return (
    <section id="contact" className="py-24 bg-white border-t border-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2 className="font-sora text-3xl sm:text-4xl font-extrabold text-black tracking-tight">
            Contact Me
          </h2>
          <p className="text-zinc-500 text-sm mt-2 max-w-md mx-auto">
            Have a project in mind or looking to hire a lead frontend engineer? Let's build something exceptional together.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start max-w-6xl mx-auto">
          
          {/* Left Column: Interactive Contact Form */}
          <div className="lg:col-span-7 bg-zinc-50 border border-zinc-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
            {isSubmitted ? (
              <div className="py-12 text-center space-y-4 animate-fade-in">
                <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h3 className="font-sora text-xl font-bold text-black">
                  Message Sent Successfully!
                </h3>
                <p className="text-zinc-500 text-sm max-w-sm mx-auto">
                  Thank you for reaching out. I've received your note and will get back to you within 24 hours.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="px-5 py-2 bg-black text-white rounded-lg text-xs font-sora font-semibold hover:bg-zinc-800 transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-sora font-semibold text-xs text-zinc-700 mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Evren Shah"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-sora font-semibold text-xs text-zinc-700 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="hello@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                    />
                  </div>
                  <div>
                    <label className="block font-sora font-semibold text-xs text-zinc-700 mb-1.5">
                      Your Website (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://yourwebsite.com"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-sora font-semibold text-xs text-zinc-700 mb-1.5">
                    How can I help you? *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell me about your product, timeline, or engineering goals..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3.5 bg-black text-white font-sora font-bold text-sm rounded-lg hover:bg-zinc-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'Sending Message...' : 'Get In Touch'}</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Direct Info & Social Channels */}
          <div className="lg:col-span-5 space-y-8 flex flex-col justify-between h-full">
            <div className="space-y-4">
              <span className="text-xs uppercase tracking-widest font-bold text-zinc-400">
                Let's Connect
              </span>
              <h3 className="font-sora text-2xl sm:text-3xl font-extrabold text-black leading-tight">
                Let's talk for Something special.
              </h3>
              <p className="text-zinc-600 text-sm leading-relaxed">
                I seek to push the limits of creativity and technical performance to create high-engaging, memorable experiences for users.
              </p>
            </div>

            {/* Direct Details */}
            <div className="space-y-3.5">
              <a
                href={`mailto:${personalInfo.email}`}
                className="flex items-center gap-3 text-zinc-800 hover:text-black transition-colors font-medium text-sm group"
              >
                <div className="w-10 h-10 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center text-black group-hover:border-black group-hover:bg-black group-hover:text-white transition-all">
                  <Mail className="w-4 h-4" />
                </div>
                <span>{personalInfo.email}</span>
              </a>

              <a
                href={`tel:${personalInfo.phone.replace(/\s/g, '')}`}
                className="flex items-center gap-3 text-zinc-800 hover:text-black transition-colors font-medium text-sm group"
              >
                <div className="w-10 h-10 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center text-black group-hover:border-black group-hover:bg-black group-hover:text-white transition-all">
                  <Phone className="w-4 h-4" />
                </div>
                <span>{personalInfo.phone}</span>
              </a>

              <div className="flex items-center gap-3 text-zinc-800 font-medium text-sm">
                <div className="w-10 h-10 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center text-black">
                  <MapPin className="w-4 h-4" />
                </div>
                <span>{personalInfo.address}</span>
              </div>
            </div>

            {/* Social Channels */}
            <div>
              <span className="block text-xs font-semibold text-zinc-500 mb-3 font-sora">
                Follow me online:
              </span>
              <div className="flex items-center gap-2.5">
                {[
                  { icon: FaGithub, url: 'https://github.com', label: 'GitHub' },
                  { icon: FaTwitter, url: 'https://twitter.com', label: 'Twitter' },
                  { icon: FaDribbble, url: 'https://dribbble.com', label: 'Dribbble' },
                  { icon: FaDiscord, url: 'https://discord.com', label: 'Discord' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={i}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.label}
                      className="w-10 h-10 rounded-lg border-2 border-black flex items-center justify-center text-black hover:bg-black hover:text-white transition-all duration-200"
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
