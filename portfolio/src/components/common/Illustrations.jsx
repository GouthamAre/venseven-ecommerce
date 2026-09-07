import React from 'react';

// Hero Illustration: Developer sitting cross-legged with laptop and stylized contour lines
export const HeroIllustration = ({ className = "w-full max-w-lg" }) => {
  return (
    <div className={`relative flex items-end justify-center ${className}`}>
      <svg
        viewBox="0 0 600 520"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-sm select-none"
      >
        {/* Floor Baseline */}
        <line
          x1="220"
          y1="475"
          x2="590"
          y2="475"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* --- LOWER BODY (Legs sitting cross-legged) --- */}
        {/* Left Thigh / Knee */}
        <path
          d="M330 380 C310 430 320 475 400 475 C440 475 460 440 460 410 C460 380 430 370 390 370 Z"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Right Thigh / Knee */}
        <path
          d="M390 370 C440 370 500 400 500 445 C500 475 460 475 435 475 C410 475 390 440 390 400 Z"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Knee crease separation line */}
        <path
          d="M440 475 C435 420 460 390 470 380"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* --- UPPER BODY / JACKET --- */}
        {/* Main Torso & Sleeves (Solid Black with white contour lines) */}
        <path
          d="M380 200 C395 190 440 185 460 200 C485 220 505 260 510 320 C515 375 480 415 450 415 C420 415 400 410 380 410 C360 410 335 395 335 360 C335 320 350 260 365 220 Z"
          fill="#0a0a0a"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Inner Shirt Collar (White V-Neck) */}
        <path
          d="M410 195 L425 250 L440 195 Z"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Stylized White Contour Lines on Dark Jacket */}
        <path
          d="M425 250 L425 365"
          stroke="#FFFFFF"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <path
          d="M405 225 C390 270 385 320 395 365"
          stroke="#FFFFFF"
          strokeWidth="1.25"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d="M445 225 C460 270 465 320 455 365"
          stroke="#FFFFFF"
          strokeWidth="1.25"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d="M475 250 C490 285 490 330 480 360"
          stroke="#FFFFFF"
          strokeWidth="1.25"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M370 250 C360 285 360 330 370 360"
          stroke="#FFFFFF"
          strokeWidth="1.25"
          strokeLinecap="round"
          opacity="0.7"
        />

        {/* --- LAPTOP --- */}
        {/* Laptop Screen (angled side view) */}
        <path
          d="M310 275 L385 280 L480 380 L400 380 Z"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Laptop Outer Lid (Black angle shadow) */}
        <path
          d="M310 275 C310 320 340 375 350 375 L310 375 Z"
          fill="#000000"
        />
        {/* Laptop Apple/Logo circle */}
        <circle cx="360" cy="320" r="8" fill="#000000" />
        
        {/* Laptop Base / Keyboard Area */}
        <path
          d="M400 376 L485 376 L475 385 L395 385 Z"
          fill="#000000"
        />

        {/* Developer's Hands on keyboard */}
        <path
          d="M410 345 C410 365 425 372 430 372 C435 372 440 365 440 345"
          stroke="#000000"
          strokeWidth="2"
          fill="#FFFFFF"
        />

        {/* --- HEAD & FACE --- */}
        {/* Neck */}
        <path
          d="M415 170 L415 200 L435 200 L435 170 Z"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="2"
        />

        {/* Face Outline */}
        <path
          d="M410 120 C405 155 415 175 425 175 C435 175 445 155 440 120 Z"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Face Features: Eyes, Nose, Smile */}
        <circle cx="420" cy="142" r="1.5" fill="#000000" />
        <circle cx="433" cy="142" r="1.5" fill="#000000" />
        <path d="M425 146 L425 151 L428 151" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M422 158 C425 161 430 161 433 158" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" />

        {/* Hair (Sleek side-parted modern style) */}
        <path
          d="M408 130 C400 120 405 95 425 95 C445 95 452 110 445 125 C440 115 435 110 422 110 C410 110 410 122 408 130 Z"
          fill="#000000"
          stroke="#000000"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Hair Tuft */}
        <path
          d="M418 95 C410 85 425 80 435 90"
          fill="#000000"
        />
      </svg>
    </div>
  );
};

// About Me Illustration: Developer with folded arms inside a rounded square frame
export const AboutIllustration = ({ className = "w-full max-w-md" }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 500 520"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-sm select-none"
      >
        {/* Outer Square Rounded Frame */}
        <rect
          x="35"
          y="35"
          width="430"
          height="430"
          rx="28"
          fill="none"
          stroke="#000000"
          strokeWidth="2.5"
        />

        {/* --- CHARACTER --- */}
        {/* Dark Jacket Body */}
        <path
          d="M130 500 C125 430 150 320 200 290 C220 278 280 278 300 290 C350 320 375 430 370 500 Z"
          fill="#050505"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* White Shirt Collar with Lapel Lines */}
        <path
          d="M230 195 L250 260 L270 195 Z"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M230 195 L220 230 L250 260 L280 230 L270 195"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Folded Arms - Left Arm */}
        <path
          d="M160 380 C180 320 230 320 280 350 L270 410 C220 370 180 370 160 380 Z"
          fill="#050505"
          stroke="#000000"
          strokeWidth="2.5"
        />

        {/* Folded Hands / Forearms (White with black knuckle lines) */}
        <path
          d="M180 370 C220 350 300 350 340 375 C350 385 340 405 320 410 C270 415 220 415 170 395 C165 385 170 375 180 370 Z"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Hand Finger Details */}
        <path d="M190 380 C210 370 240 370 260 382" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
        <path d="M185 390 C205 380 235 380 255 392" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
        <path d="M180 400 C200 390 230 390 250 402" stroke="#000000" strokeWidth="2" strokeLinecap="round" />

        {/* Right Arm Fold Overlay */}
        <path
          d="M340 375 C320 430 260 460 200 460 C150 460 130 420 130 390"
          stroke="#000000"
          strokeWidth="2.5"
          fill="none"
        />

        {/* Neck */}
        <path
          d="M235 165 L235 200 L265 200 L265 165 Z"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="2"
        />

        {/* Face */}
        <path
          d="M230 115 C220 155 235 185 250 185 C265 185 280 155 270 115 Z"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Eyes, Nose, Friendly Smile */}
        <ellipse cx="243" cy="138" rx="2" ry="3" fill="#000000" />
        <ellipse cx="260" cy="138" rx="2" ry="3" fill="#000000" />
        <path d="M251 142 L251 150 L256 150" stroke="#000000" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M246 159 C251 164 258 164 263 159" stroke="#000000" strokeWidth="1.75" strokeLinecap="round" />

        {/* Hair (Voluminous wavy top with fade) */}
        <path
          d="M225 125 C215 105 220 85 235 75 C245 70 255 70 265 75 C280 82 285 100 275 125 C265 110 240 110 225 125 Z"
          fill="#050505"
          stroke="#000000"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Hair Tuft Curve */}
        <path
          d="M220 100 C220 80 240 70 255 70 C270 70 280 80 275 95"
          stroke="#000000"
          strokeWidth="2"
          fill="#050505"
        />
      </svg>
    </div>
  );
};

// Vector Skill Badges
export const SkillIcon = ({ name, className = "w-8 h-8" }) => {
  switch (name) {
    case 'git':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.59 13.41L10.59 21.41C11.37 22.19 12.63 22.19 13.41 21.41L21.41 13.41C22.19 12.63 22.19 11.37 21.41 10.59L13.41 2.59C12.63 1.81 11.37 1.81 10.59 2.59L2.59 10.59C1.81 11.37 1.81 12.63 2.59 13.41ZM14.83 13.41C14.41 14.19 13.62 14.74 12.69 14.92V17.59C13.29 17.84 13.71 18.42 13.71 19.1C13.71 20.05 12.95 20.81 12 20.81C11.05 20.81 10.29 20.05 10.29 19.1C10.29 18.42 10.71 17.84 11.31 17.59V14.92C10.38 14.74 9.59 14.19 9.17 13.41C8.75 12.63 8.75 11.69 9.17 10.91L11.31 8.77V8.59C10.71 8.34 10.29 7.76 10.29 7.09C10.29 6.14 11.05 5.38 12 5.38C12.95 5.38 13.71 6.14 13.71 7.09C13.71 7.76 13.29 8.34 12.69 8.59V8.77L14.83 10.91C15.25 11.69 15.25 12.63 14.83 13.41Z" />
        </svg>
      );
    case 'javascript':
      return (
        <div className="font-extrabold text-2xl tracking-tighter border-2 border-current px-2 py-0.5 rounded leading-none">
          JS
        </div>
      );
    case 'sass':
      return (
        <span className="font-serif italic font-extrabold text-2xl tracking-tight">
          Sass
        </span>
      );
    case 'nest':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L15 6L21 7L18 12L21 18L15 17L12 22L9 17L3 18L6 12L3 7L9 6L12 2Z" />
        </svg>
      );
    case 'storybook':
      return (
        <div className="font-black text-2xl tracking-tighter border-2 border-current px-2 py-0.5 rounded-sm bg-current">
          <span className="text-white invert dark:invert-0">S</span>
        </div>
      );
    case 'socket':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="9" />
          <path d="M13 6L9 13H14L11 18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'react':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="2.5" fill="currentColor" />
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(0 12 12)" />
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
        </svg>
      );
    case 'typescript':
      return (
        <div className="font-extrabold text-2xl tracking-tighter border-2 border-current px-2 py-0.5 rounded leading-none">
          TS
        </div>
      );
    case 'tailwind':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.336 6.182 14.975 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.336 13.382 8.975 12 6.001 12z" />
        </svg>
      );
    case 'nextjs':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10 5.523 0 10-4.477 10-10C22 6.477 17.523 2 12 2zm3.3 14.6l-4.7-6.2v6.2H9.2V7.4h1.5l4.7 6.2V7.4h1.4v9.2h-1.5z" />
        </svg>
      );
    default:
      return (
        <div className="font-bold text-xl uppercase">
          {name.slice(0, 2)}
        </div>
      );
  }
};

// Company Logos (Google, YouTube, Apple)
export const CompanyIcon = ({ name, className = "w-6 h-6" }) => {
  switch (name) {
    case 'google':
      return (
        <svg className={className} viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.34 24 12 24z" />
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z" />
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="#FF0000">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case 'apple':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.8 1.1-1.92.98-3.04-.95.04-2.1.63-2.78 1.43-.59.69-1.12 1.83-.98 2.92 1.06.08 2.13-.53 2.78-1.31z" />
        </svg>
      );
    default:
      return null;
  }
};
