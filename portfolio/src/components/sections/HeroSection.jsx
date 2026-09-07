import React from 'react';
import { HeroIllustration } from '../common/Illustrations';
import { personalInfo } from '../../data/portfolioData';
import {
  FaGithub,
  FaDribbble,
  FaTwitter,
  FaDiscord,
  FaLinkedinIn,
} from 'react-icons/fa';

export const HeroSection = ({ onOpenResume }) => {
  const socialIcons = [
    { id: 'github', icon: FaGithub, label: 'GitHub', url: 'https://github.com', active: true },
    { id: 'dribbble', icon: FaDribbble, label: 'Dribbble', url: 'https://dribbble.com' },
    { id: 'twitter', icon: FaTwitter, label: 'Twitter', url: 'https://twitter.com' },
    { id: 'discord', icon: FaDiscord, label: 'Discord', url: 'https://discord.com' },
  ];

  return (
    <section className="relative min-h-[92vh] flex items-center pt-28 pb-16 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Hero Text & Socials */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-7 z-10">
            
            {/* Main Headline */}
            <div className="space-y-1 sm:space-y-2">
              <h1 className="font-sora text-3xl sm:text-4xl lg:text-5xl tracking-tight text-zinc-900 leading-[1.15]">
                <span className="font-light text-zinc-800">Hello I’am </span>
                <span className="font-extrabold text-black">{personalInfo.name}.</span>
              </h1>

              <div className="font-sora text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-[1.15] flex flex-wrap items-center gap-x-3.5">
                <span className="font-extrabold text-black">
                  {personalInfo.rolePrefix}
                </span>
                <span className="outline-text font-extrabold tracking-tight">
                  {personalInfo.roleSuffix}
                </span>
              </div>

              <h2 className="font-sora text-3xl sm:text-4xl lg:text-5xl tracking-tight text-zinc-900 leading-[1.15]">
                <span className="font-light text-zinc-800">Based In </span>
                <span className="font-extrabold text-black">{personalInfo.location}.</span>
              </h2>
            </div>

            {/* Bio Description Paragraph */}
            <p className="text-zinc-500 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
              {personalInfo.heroBio}
            </p>

            {/* Social Buttons & Actions */}
            <div className="pt-3 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                {socialIcons.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.label}
                      className={`w-12 h-12 rounded-lg flex items-center justify-center border-2 transition-all duration-200 ${
                        item.active
                          ? 'bg-black text-white border-black hover:bg-zinc-800'
                          : 'bg-white text-black border-black hover:bg-black hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>

              {/* Quick Action Button for Mobile / Extra conversion */}
              <a
                href="#contact"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border-2 border-black font-sora font-bold text-sm bg-transparent hover:bg-black hover:text-white transition-all duration-200"
              >
                Let’s Talk 🚀
              </a>
            </div>

          </div>

          {/* Right Column: Hand-drawn Style Hero Vector Illustration */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end items-center relative">
            <HeroIllustration className="w-full max-w-md sm:max-w-lg lg:max-w-xl" />
          </div>

        </div>
      </div>
    </section>
  );
};
