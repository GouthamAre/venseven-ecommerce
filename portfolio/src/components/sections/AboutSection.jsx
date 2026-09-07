import React from 'react';
import { AboutIllustration } from '../common/Illustrations';
import { aboutData } from '../../data/portfolioData';

export const AboutSection = () => {
  return (
    <section id="about" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Framed Line-art Developer Avatar */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <AboutIllustration className="w-full max-w-sm sm:max-w-md" />
          </div>

          {/* Right Column: About Content */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            
            {/* Section Title */}
            <h2 className="font-sora text-3xl sm:text-4xl font-extrabold text-black tracking-tight">
              {aboutData.title}
            </h2>

            {/* Paragraphs matching screenshot 4 */}
            <div className="space-y-4 text-zinc-600 text-sm sm:text-[15px] leading-relaxed font-normal">
              {aboutData.paragraphs.map((para, index) => (
                <p key={index}>
                  {para}
                </p>
              ))}
            </div>

            {/* Metric Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-zinc-100">
              {aboutData.stats.map((stat, idx) => (
                <div key={idx} className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3.5 text-center">
                  <div className="font-sora font-extrabold text-xl sm:text-2xl text-black">
                    {stat.value}
                  </div>
                  <div className="text-[11px] font-semibold text-zinc-500 mt-0.5">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
