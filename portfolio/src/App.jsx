import React, { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { HeroSection } from './components/sections/HeroSection';
import { SkillsSection } from './components/sections/SkillsSection';
import { ExperienceSection } from './components/sections/ExperienceSection';
import { AboutSection } from './components/sections/AboutSection';
import { ProjectsSection } from './components/sections/ProjectsSection';
import { ContactSection } from './components/sections/ContactSection';
import { Footer } from './components/layout/Footer';
import { ResumeModal } from './components/modals/ResumeModal';
import { ProjectModal } from './components/modals/ProjectModal';

export function App() {
  const [isResumeOpen, setIsResumeOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  return (
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white flex flex-col font-sans">
      
      {/* Top Sticky Header */}
      <Navbar onOpenResume={() => setIsResumeOpen(true)} />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 1. Hero Section (Light) */}
        <HeroSection onOpenResume={() => setIsResumeOpen(true)} />

        {/* 2. Skills Section (Light) */}
        <SkillsSection />

        {/* 3. Experience Section (Dark) */}
        <ExperienceSection />

        {/* 4. About Me Section (Light) */}
        <AboutSection />

        {/* 5. Projects Section (Dark) */}
        <ProjectsSection onSelectProject={(project) => setSelectedProject(project)} />

        {/* 6. Contact Me Section (Light) */}
        <ContactSection />
      </main>

      {/* Footer (Dark) */}
      <Footer />

      {/* Interactive Modals */}
      <ResumeModal
        isOpen={isResumeOpen}
        onClose={() => setIsResumeOpen(false)}
      />

      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />

    </div>
  );
}

export default App;
