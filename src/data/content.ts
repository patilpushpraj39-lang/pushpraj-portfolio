export interface Project {
  id: string;
  number: string;
  title: string;
  category: string;
  description: string;
  problem: string;
  role: string;
  year: string;
  stack: string[];
  result: string;
  liveUrl: string;
  githubUrl: string;
  image: string;
  accent: string;
}

export interface Capability {
  category: string;
  items: { name: string; detail: string }[];
}

export interface SocialLink {
  label: string;
  url: string;
  icon: string;
}

export const profile = {
  name: 'Pushpraj Patil',
  firstName: 'Pushpraj',
  initials: 'PP',
  title: 'Engineering Student & Developer',
  tagline: 'Build the future.',
  location: 'Talegaon, Pune',
  timezone: 'Asia/Kolkata',
  email: 'patilpushpraj39@gmail.com',
  available: true,
  portrait: '',
  bio: [
    "I'm an engineering student and developer exploring the space between technology and design. I enjoy turning ideas into thoughtful digital experiences through web development, AI, and interactive design.",
  ],
  stats: [
    { value: '2+', label: 'Years building' },
    { value: '50+', label: 'Projects explored' },
    { value: '3', label: 'Open-source repos' },
  ],
};

export const navLinks = [
  { label: 'Work', href: '#work', index: '01' },
  { label: 'About', href: '#about', index: '02' },
  { label: 'Interact', href: '#interact', index: '03' },
  { label: 'Capabilities', href: '#capabilities', index: '04' },
  { label: 'Contact', href: '#contact', index: '05' },
];

export const marqueeItems = [
  'TypeScript',
  'React',
  'Python',
  'Node.js',
  'Tailwind CSS',
  'Framer Motion',
  'Vite',
  'Supabase',
  'OpenAI API',
  'PostgreSQL',
  'Git',
  'Figma',
];

export const projects: Project[] = [
  {
    id: 'cafe-d-cruze',
    number: '01',
    title: "Cafe D' Cruze",
    category: 'Web Development',
    description:
      'A modern café website designed to present the brand, menu and atmosphere through a clean and engaging web experience.',
    problem: 'Helps the café present its menu, atmosphere, and identity to visitors online.',
    role: 'Web Development / UI',
    year: '2025',
    stack: [],
    result: 'A responsive, visually inviting site that makes the café easy to discover and explore.',
    liveUrl: 'https://cafe-d-cruze-v2-7hpou3mes-patil6.vercel.app',
    githubUrl: '',
    image: '/projects/Screenshot_2026-08-28_133538.png',
    accent: '#A0764E',
  },
  {
    id: 's-square-fitness',
    number: '02',
    title: 'S-Square Fitness',
    category: 'Web Development',
    description:
      'A fitness-focused web experience designed around clear content, responsive layouts and an energetic visual identity.',
    problem: 'Gives the fitness business a clear online presence to showcase services and attract clients.',
    role: 'Web Development / Business',
    year: '2024',
    stack: [],
    result: 'A clean, responsive site that communicates the brand and its offerings effectively.',
    liveUrl: 'https://s-square-fitness-hzgl9obq6-patil6.vercel.app',
    githubUrl: '',
    image: '/projects/Screenshot_2026-08-28_134036.png',
    accent: '#6B8E5A',
  },
  {
    id: 'medicare-reminder-ai',
    number: '03',
    title: 'Medicare Reminder AI',
    category: 'AI / Health Technology',
    description:
      'An AI-assisted medication reminder experience focused on making daily medication schedules easier to manage.',
    problem: 'Helps users keep track of medication timings and maintain healthy routines.',
    role: 'AI / Health Technology',
    year: '2024',
    stack: ['React', 'OpenAI API', 'Tailwind CSS'],
    result: 'A practical reminder tool that combines AI with a simple, accessible interface.',
    liveUrl: 'https://medicare-reminder-9szubwukr-patil6.vercel.app',
    githubUrl: '',
    image: '/projects/Screenshot_2026-09-03_164128.png',
    accent: '#C49A4A',
  },
  {
    id: 'skyline-weather-app',
    number: '04',
    title: 'Skyline Weather App',
    category: 'Web Development / API',
    description:
      'A responsive weather application that presents current weather information through a simple, interactive interface.',
    problem: 'Provides users with quick, accurate weather updates in a readable format.',
    role: 'Web Development / API',
    year: '2023',
    stack: ['JavaScript', 'HTML', 'CSS', 'Weather API'],
    result: 'A lightweight app that fetches and displays live weather data clearly and simply.',
    liveUrl: 'https://patilpushpraj39-lang.github.io/Skyline-Weather-App/',
    githubUrl: '',
    image: '/projects/Screenshot_2026-09-01_224432.png',
    accent: '#8A7B6B',
  },
];

export const capabilities: Capability[] = [
  {
    category: 'Development',
    items: [
      { name: 'React & TypeScript', detail: 'Component architecture, hooks' },
      { name: 'Node.js', detail: 'APIs, server logic' },
      { name: 'Python', detail: 'Scripts, automation, data' },
      { name: 'PostgreSQL & Supabase', detail: 'Schema design, queries' },
    ],
  },
  {
    category: 'AI & Data',
    items: [
      { name: 'OpenAI API', detail: 'Chatbots, text processing' },
      { name: 'Prompt Engineering', detail: 'Practical LLM usage' },
      { name: 'Data Processing', detail: 'Python, pandas' },
      { name: 'ML Basics', detail: 'Learning and exploring' },
    ],
  },
  {
    category: 'Creative Web',
    items: [
      { name: 'Tailwind CSS', detail: 'Utility-first styling' },
      { name: 'Framer Motion', detail: 'Animation, transitions' },
      { name: 'Three.js', detail: '3D web experiences' },
      { name: 'Figma', detail: 'Design, prototyping' },
    ],
  },
  {
    category: 'Tools',
    items: [
      { name: 'Git & GitHub', detail: 'Version control, collaboration' },
      { name: 'Vite', detail: 'Fast dev builds' },
      { name: 'VS Code', detail: 'Primary editor' },
      { name: 'Vercel', detail: 'Deployment, previews' },
    ],
  },
];

export const socials: SocialLink[] = [
  { label: 'Email', url: 'mailto:patilpushpraj39@gmail.com', icon: 'Mail' },
  { label: 'GitHub', url: 'https://github.com/patilpushpraj39-lang', icon: 'Github' },
  { label: 'Instagram', url: 'https://www.instagram.com/_the_pushpraj_patil__/', icon: 'Instagram' },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/pushpraj-patil-aa7320328', icon: 'Linkedin' },
];
