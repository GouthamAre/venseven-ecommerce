import React, { useState } from 'react';
import { skillsData } from '../../data/portfolioData';
import { SkillIcon } from '../common/Illustrations';

export const SkillsSection = () => {
  const [activeSkillId, setActiveSkillId] = useState('javascript');

  return (
    <section id="skills" className="py-24 bg-white border-t border-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2 className="font-sora text-3xl sm:text-4xl font-extrabold text-black tracking-tight">
            My Skills
          </h2>
          <p className="text-zinc-500 text-sm mt-2 max-w-lg mx-auto">
            A specialized toolkit of modern languages, libraries, and frameworks I use to build scalable products.
          </p>
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 sm:gap-6 max-w-5xl mx-auto">
          {skillsData.map((skill) => {
            const isActive = activeSkillId === skill.id;

            return (
              <button
                key={skill.id}
                onClick={() => setActiveSkillId(skill.id)}
                className={`aspect-square p-5 rounded-lg border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300 transform active:scale-95 group cursor-pointer ${
                  isActive
                    ? 'bg-black text-white border-black shadow-lg scale-[1.02]'
                    : 'bg-white text-black border-black hover:bg-black hover:text-white hover:border-black hover:-translate-y-1 hover:shadow-md'
                }`}
              >
                {/* Skill Icon */}
                <div className="flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <SkillIcon name={skill.icon} className="w-9 h-9" />
                </div>

                {/* Skill Name */}
                <span className="font-sora font-bold text-sm sm:text-base tracking-tight text-center">
                  {skill.name}
                </span>

                {/* Subtle category tag visible on focus/active */}
                <span className={`text-[10px] tracking-wider uppercase opacity-60 font-semibold ${isActive ? 'text-zinc-300' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                  {skill.category}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
};
