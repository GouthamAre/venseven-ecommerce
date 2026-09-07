import React from 'react';
import { projectsData } from '../../data/portfolioData';
import { CryptoMockup, EuphoriaMockup, BlogMockup } from '../common/ProjectMockups';
import { ExternalLink, Code2 } from 'lucide-react';

export const ProjectsSection = ({ onSelectProject }) => {
  const renderMockup = (type) => {
    switch (type) {
      case 'crypto':
        return <CryptoMockup />;
      case 'ecommerce':
        return <EuphoriaMockup />;
      case 'blog':
        return <BlogMockup />;
      default:
        return <CryptoMockup />;
    }
  };

  return (
    <section id="projects" className="py-24 bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        
        {/* Section Heading */}
        <div className="text-center mb-20">
          <h2 className="font-sora text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            My Projects
          </h2>
          <p className="text-zinc-400 text-sm mt-2 max-w-lg mx-auto">
            Selected case studies featuring full-stack architectures, interactive design systems, and consumer apps.
          </p>
        </div>

        {/* Alternating Project Rows */}
        <div className="space-y-24">
          {projectsData.map((project, index) => {
            const isEven = index % 2 === 1;

            return (
              <div
                key={project.number}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center group"
              >
                {/* Mockup Column */}
                <div
                  className={`lg:col-span-6 cursor-pointer ${
                    isEven ? 'lg:order-2' : 'lg:order-1'
                  }`}
                  onClick={() => onSelectProject(project)}
                >
                  {renderMockup(project.type)}
                </div>

                {/* Info Column */}
                <div
                  className={`lg:col-span-6 flex flex-col justify-center space-y-4 ${
                    isEven ? 'lg:order-1' : 'lg:order-2'
                  }`}
                >
                  {/* Number */}
                  <span className="font-sora font-extrabold text-3xl sm:text-4xl text-white tracking-tighter">
                    {project.number}
                  </span>

                  {/* Project Title */}
                  <h3 className="font-sora text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
                    {project.title}
                  </h3>

                  {/* Description Paragraph matching screenshot */}
                  <p className="text-zinc-400 text-sm sm:text-[15px] leading-relaxed font-normal">
                    {project.description}
                  </p>

                  {/* Tech stack badges */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {project.techStack.slice(0, 4).map((tech, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* External Link Action Button */}
                  <div className="pt-3 flex items-center gap-3">
                    <button
                      onClick={() => onSelectProject(project)}
                      className="inline-flex items-center justify-center p-3 rounded-lg border border-zinc-700 text-zinc-300 hover:text-white hover:border-white hover:bg-zinc-900 transition-all duration-200"
                      aria-label={`View ${project.title} details`}
                    >
                      <ExternalLink className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onSelectProject(project)}
                      className="text-xs font-sora font-bold text-zinc-400 hover:text-white transition-colors"
                    >
                      View Case Study & Live Demo →
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
