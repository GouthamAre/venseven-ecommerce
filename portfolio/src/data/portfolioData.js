export const personalInfo = {
  name: "Evren Shah",
  rolePrefix: "Frontend",
  roleSuffix: "Developer",
  location: "India",
  heroBio: "I'm Evren Shah, a passionate Frontend & Full Stack Developer dedicated to crafting engaging, pixel-perfect, and high-performance digital experiences. Specializing in modern JavaScript frameworks, design systems, and robust web applications.",
  email: "evren.shah@example.com",
  phone: "+91 98765 43210",
  address: "Bengaluru, Karnataka, India",
  socials: [
    { name: "GitHub", url: "https://github.com", icon: "github" },
    { name: "Dribbble", url: "https://dribbble.com", icon: "dribbble" },
    { name: "Twitter", url: "https://twitter.com", icon: "twitter" },
    { name: "Discord", url: "https://discord.com", icon: "discord" },
  ],
};

export const skillsData = [
  { id: "git", name: "Git", icon: "git", category: "DevOps & Tools", featured: false },
  { id: "javascript", name: "Javascript", icon: "javascript", category: "Languages", featured: true },
  { id: "sass", name: "Sass/Scss", icon: "sass", category: "Styling", featured: false },
  { id: "nest", name: "Nest.Js", icon: "nest", category: "Backend", featured: false },
  { id: "storybook", name: "Storybook", icon: "storybook", category: "UI & Testing", featured: false },
  { id: "react", name: "React.js", icon: "react", category: "Frontend", featured: false },
  { id: "typescript", name: "TypeScript", icon: "typescript", category: "Languages", featured: false },
  { id: "tailwind", name: "Tailwind CSS", icon: "tailwind", category: "Styling", featured: false },
  { id: "socket", name: "Socket.io", icon: "socket", category: "Realtime", featured: false },
  { id: "nextjs", name: "Next.js", icon: "nextjs", category: "Framework", featured: false },
];

export const experienceData = [
  {
    id: 1,
    company: "Google",
    role: "Lead Software Engineer at Google",
    period: "Nov 2019 - Present",
    companyLogo: "google",
    description: "As a Senior Software Engineer at Google, I played a pivotal role in developing innovative solutions for Google's core search algorithms. Collaborating with a dynamic team of engineers, I contributed to the enhancement of search accuracy and efficiency, optimizing user experiences for millions of users worldwide.",
    tags: ["React", "TypeScript", "Search Infrastructure", "Microservices", "Web Performance"],
  },
  {
    id: 2,
    company: "Youtube",
    role: "Software Engineer at Youtube",
    period: "Jan 2017 - Oct 2019",
    companyLogo: "youtube",
    description: "At Youtube, I served as a Software Engineer, focusing on the design and implementation of backend systems for the social media giant's dynamic platform. Working on projects that involved large-scale data processing and user engagement features, I leveraged my expertise to ensure seamless functionality and scalability.",
    tags: ["Distributed Systems", "Video Pipeline", "Node.js", "gRPC", "Kafka"],
  },
  {
    id: 3,
    company: "Apple",
    role: "Junior Software Engineer at Apple",
    period: "Jan 2016 - Dec 2017",
    companyLogo: "apple",
    description: "During my tenure at Apple, I held the role of Software Architect, where I played a key role in shaping the architecture of mission-critical software projects. Responsible for designing scalable and efficient systems, I provided technical leadership to a cross-functional team.",
    tags: ["Swift", "Core Architecture", "Design Systems", "RESTful APIs", "CI/CD"],
  },
];

export const aboutData = {
  title: "About Me",
  paragraphs: [
    "I'm a passionate, self-proclaimed designer who specializes in full stack development (React.js & Node.js). I am very enthusiastic about bringing the technical and visual aspects of digital products to life. User experience, pixel perfect design, and writing clear, readable, highly performant code matters to me.",
    "I began my journey as a web developer in 2015, and since then, I've continued to grow and evolve as a developer, taking on new challenges and learning the latest technologies along the way. Now, in my early thirties, 7 years after starting my web development journey, I'm building cutting-edge web applications using modern technologies such as Next.js, TypeScript, Nest.js, Tailwindcss, Supabase and much more.",
    "When I'm not in full-on developer mode, you can find me hovering around on twitter or on indie hacker, witnessing the journey of early startups or enjoying some free time. You can follow me on Twitter where I share tech-related bites and build in public, or you can follow me on GitHub."
  ],
  stats: [
    { label: "Years Experience", value: "8+" },
    { label: "Completed Projects", value: "50+" },
    { label: "Global Clients", value: "30+" },
    { label: "Code Commits", value: "4.2k+" },
  ]
};

export const projectsData = [
  {
    number: "01",
    title: "Crypto Screener Application",
    type: "crypto",
    description: "I'm Kalvin Doe Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to specimen book.",
    extendedDescription: "A comprehensive real-time cryptocurrency tracking and analytics platform with interactive Candlestick charts, multi-currency conversion, portfolio watchlist management, and instant market alert triggers powered by WebSockets.",
    techStack: ["React 19", "TypeScript", "Tailwind CSS", "Chart.js", "CoinGecko API", "WebSocket"],
    demoUrl: "https://crypto-screener-demo.example.com",
    githubUrl: "https://github.com/evrenshah/crypto-screener-app",
    featuredColor: "#10b981",
  },
  {
    number: "02",
    title: "Euphoria - Ecommerce (Apparels) Website Template",
    type: "ecommerce",
    description: "I'm Kalvin Doe Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to specimen book.",
    extendedDescription: "A full-featured, lightning-fast apparel e-commerce storefront with dynamic product filtering, seamless cart drawer, Stripe checkout integration, wishlist synchronization, and responsive mobile-first UI components.",
    techStack: ["Next.js", "React", "Tailwind CSS", "Stripe API", "Redux Toolkit", "Framer Motion"],
    demoUrl: "https://euphoria-ecommerce-demo.example.com",
    githubUrl: "https://github.com/evrenshah/euphoria-ecommerce-template",
    featuredColor: "#6366f1",
  },
  {
    number: "03",
    title: "Blog Website Template",
    type: "blog",
    description: "I'm Kalvin Doe Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to specimen book.",
    extendedDescription: "An editorial-grade design publication blog template featuring Markdown/MDX authoring, reading time estimation, syntax highlighted code blocks, search indexing, and customizable light/dark themes.",
    techStack: ["React", "Gatsby", "GraphQL", "Tailwind CSS", "MDX", "Algolia"],
    demoUrl: "https://design-blog-demo.example.com",
    githubUrl: "https://github.com/evrenshah/blog-website-template",
    featuredColor: "#f59e0b",
  },
];

export const resumeData = {
  name: "Evren Shah",
  title: "Lead Frontend & Full Stack Software Engineer",
  location: "Bengaluru, Karnataka, India",
  email: "evren.shah@example.com",
  phone: "+91 98765 43210",
  website: "https://evrenshah.dev",
  summary: "Results-driven Software Engineer with 8+ years of expertise in designing and engineering scalable, high-performance web applications. Proven track record at Google, YouTube, and Apple leading frontend architecture, improving core system performance by 40%, and mentoring high-performing engineering teams.",
  skills: [
    "JavaScript (ES6+)", "TypeScript", "React.js", "Next.js", "Nest.js",
    "Node.js", "Tailwind CSS", "Sass/SCSS", "GraphQL", "REST APIs",
    "Docker", "Git/GitHub", "Storybook", "Socket.io", "PostgreSQL", "Jest/RTL"
  ],
  experience: [
    {
      company: "Google",
      role: "Lead Software Engineer",
      period: "2019 - Present",
      location: "Bengaluru / Mountain View",
      points: [
        "Spearheaded the redesign of core web search interface components, driving 18% improvement in Core Web Vitals across millions of users.",
        "Architected reusable micro-frontend systems using React and TypeScript, reducing deployment cycles by 35%.",
        "Mentored 12+ engineers and established code quality standards across cross-functional teams."
      ]
    },
    {
      company: "YouTube",
      role: "Software Engineer",
      period: "2017 - 2019",
      location: "San Bruno, CA / Remote",
      points: [
        "Engineered real-time video engagement telemetry and comment processing pipelines with WebSocket and Node.js.",
        "Optimized frontend bundle size by 28% through aggressive code splitting and asset pipeline automation."
      ]
    },
    {
      company: "Apple",
      role: "Junior Software Engineer",
      period: "2016 - 2017",
      location: "Cupertino, CA",
      points: [
        "Collaborated on internal design system component library adopted by 20+ engineering squads.",
        "Implemented automated unit and end-to-end testing suites increasing test coverage from 60% to 92%."
      ]
    }
  ],
  education: [
    {
      degree: "Bachelor of Technology in Computer Science & Engineering",
      institution: "National Institute of Technology (NIT)",
      period: "2012 - 2016",
      grade: "First Class with Distinction"
    }
  ]
};
