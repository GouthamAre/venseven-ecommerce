import React from 'react';
import { resumeData } from '../../data/portfolioData';
import { X, Printer, Download, Mail, Phone, MapPin, Globe } from 'lucide-react';

export const ResumeModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Generate text/markdown or printable resume trigger
    const element = document.createElement('a');
    const resumeText = `
${resumeData.name.toUpperCase()} - ${resumeData.title}
Location: ${resumeData.location} | Email: ${resumeData.email} | Phone: ${resumeData.phone}
Website: ${resumeData.website}

SUMMARY:
${resumeData.summary}

CORE SKILLS:
${resumeData.skills.join(', ')}

EXPERIENCE:
${resumeData.experience.map(exp => `
• ${exp.role} at ${exp.company} (${exp.period}) - ${exp.location}
${exp.points.map(pt => `  - ${pt}`).join('\n')}
`).join('\n')}

EDUCATION:
${resumeData.education.map(edu => `
• ${edu.degree}
  ${edu.institution} (${edu.period}) - ${edu.grade}
`).join('\n')}
    `.trim();

    const file = new Blob([resumeText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${resumeData.name.replace(/\s+/g, '_')}_Resume.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      
      {/* Modal Container */}
      <div className="bg-white text-black w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-zinc-200">
        
        {/* Modal Actions Bar */}
        <div className="bg-zinc-950 text-white px-6 py-4 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="font-sora font-bold text-sm sm:text-base">
              Resume Preview — {resumeData.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 text-xs font-semibold hover:bg-zinc-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors ml-2"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Content */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-8 print:p-0">
          
          {/* Resume Header */}
          <div className="border-b border-zinc-200 pb-6">
            <h1 className="font-sora font-extrabold text-3xl sm:text-4xl text-black tracking-tight">
              {resumeData.name}
            </h1>
            <p className="font-sora font-bold text-lg text-zinc-700 mt-1">
              {resumeData.title}
            </p>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-zinc-600 mt-3.5">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-zinc-900" />
                {resumeData.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-zinc-900" />
                {resumeData.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-zinc-900" />
                {resumeData.phone}
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-zinc-900" />
                {resumeData.website}
              </span>
            </div>
          </div>

          {/* Professional Summary */}
          <div>
            <h2 className="font-sora font-bold text-sm tracking-wider uppercase text-zinc-900 mb-2 border-b border-zinc-200 pb-1">
              Professional Summary
            </h2>
            <p className="text-zinc-700 text-sm leading-relaxed">
              {resumeData.summary}
            </p>
          </div>

          {/* Technical Skills */}
          <div>
            <h2 className="font-sora font-bold text-sm tracking-wider uppercase text-zinc-900 mb-3 border-b border-zinc-200 pb-1">
              Core Technical Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {resumeData.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 bg-zinc-100 border border-zinc-300 rounded text-xs font-semibold text-zinc-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Work Experience */}
          <div>
            <h2 className="font-sora font-bold text-sm tracking-wider uppercase text-zinc-900 mb-4 border-b border-zinc-200 pb-1">
              Work Experience
            </h2>
            <div className="space-y-6">
              {resumeData.experience.map((exp, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <h3 className="font-sora font-bold text-base text-black">
                      {exp.role} <span className="font-normal text-zinc-600">at</span> {exp.company}
                    </h3>
                    <span className="text-xs font-semibold text-zinc-500 font-sora">
                      {exp.period} | {exp.location}
                    </span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-zinc-700 text-xs sm:text-sm pl-1">
                    {exp.points.map((pt, pIdx) => (
                      <li key={pIdx} className="leading-relaxed">
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div>
            <h2 className="font-sora font-bold text-sm tracking-wider uppercase text-zinc-900 mb-3 border-b border-zinc-200 pb-1">
              Education
            </h2>
            {resumeData.education.map((edu, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-sm">
                <div>
                  <h3 className="font-sora font-bold text-black">{edu.degree}</h3>
                  <p className="text-zinc-600 text-xs">{edu.institution} — {edu.grade}</p>
                </div>
                <span className="text-xs font-semibold text-zinc-500 font-sora mt-1 sm:mt-0">
                  {edu.period}
                </span>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};
