import React from 'react';
import { experienceData } from '../../data/portfolioData';
import { CompanyIcon } from '../common/Illustrations';

export const ExperienceSection = () => {
  return (
    <section id="experience" className="py-24 bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
        
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2 className="font-sora text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            My Experience
          </h2>
          <p className="text-zinc-400 text-sm mt-2 max-w-lg mx-auto">
            A track record of engineering leadership and high-impact software delivery at leading global tech organizations.
          </p>
        </div>

        {/* Experience Cards Stack */}
        <div className="space-y-6 max-w-4xl mx-auto">
          {experienceData.map((exp) => (
            <div
              key={exp.id}
              className="bg-[#121216] border border-zinc-800 rounded-xl p-6 sm:p-8 transition-all duration-300 hover:border-zinc-600 hover:bg-[#16161c] hover:-translate-y-0.5 shadow-xl group"
            >
              {/* Header Row: Company Icon, Role Title, and Period */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/60 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <CompanyIcon name={exp.companyLogo} className="w-5 h-5" />
                  </div>
                  <h3 className="font-sora text-base sm:text-lg font-bold text-white tracking-tight">
                    {exp.role}
                  </h3>
                </div>

                <div className="text-xs sm:text-sm font-semibold text-zinc-400 pl-11 sm:pl-0 font-sora">
                  {exp.period}
                </div>
              </div>

              {/* Description Paragraph */}
              <p className="text-zinc-400 text-sm leading-relaxed sm:pl-11 font-normal">
                {exp.description}
              </p>

              {/* Technology Tags */}
              {exp.tags && (
                <div className="flex flex-wrap gap-2 mt-4 sm:pl-11">
                  {exp.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
