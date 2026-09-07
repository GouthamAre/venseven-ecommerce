import React from 'react';
import { X, ExternalLink, Github, Layers, Sparkles, Check } from 'lucide-react';
import { CryptoMockup, EuphoriaMockup, BlogMockup } from '../common/ProjectMockups';

export const ProjectModal = ({ project, onClose }) => {
  if (!project) return null;

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      
      {/* Modal Card */}
      <div className="bg-[#0f1015] text-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-zinc-800">
        
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950">
          <div className="flex items-center gap-3">
            <span className="font-sora font-extrabold text-sm px-2.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
              {project.number}
            </span>
            <h2 className="font-sora font-bold text-base sm:text-lg text-white">
              {project.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          
          {/* Mockup Preview Visual */}
          <div className="w-full">
            {renderMockup(project.type)}
          </div>

          {/* Project Details */}
          <div className="space-y-4">
            <h3 className="font-sora font-bold text-xl text-white">
              About this Project
            </h3>
            <p className="text-zinc-300 text-sm leading-relaxed">
              {project.extendedDescription || project.description}
            </p>
          </div>

          {/* Tech Stack */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-sora font-bold uppercase tracking-wider text-zinc-400">
              <Layers className="w-4 h-4" />
              <span>Technologies & Libraries</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((tech, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-zinc-900 border border-zinc-700/80 rounded-lg text-xs font-medium text-zinc-200"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Key Features */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-sora font-bold uppercase tracking-wider text-zinc-400">
              <Sparkles className="w-4 h-4" />
              <span>Key Highlights</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
              <div className="flex items-start gap-2 bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/60">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Pixel-perfect responsive layout across all device viewports</span>
              </div>
              <div className="flex items-start gap-2 bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/60">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Sub-second render latency & optimized bundle sizes</span>
              </div>
              <div className="flex items-start gap-2 bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/60">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Modular reusable design token architecture</span>
              </div>
              <div className="flex items-start gap-2 bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/60">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>End-to-end type safety & modern state management</span>
              </div>
            </div>
          </div>

          {/* Action Links */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-zinc-800">
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-lg bg-white text-black font-sora font-bold text-xs flex items-center gap-2 hover:bg-zinc-200 transition-colors shadow-md"
            >
              <span>Live Demonstration</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-sora font-bold text-xs flex items-center gap-2 hover:border-zinc-500 hover:bg-zinc-800 transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              <span>Source Code</span>
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};
