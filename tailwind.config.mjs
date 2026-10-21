/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,ts,tsx}'],
  theme: { extend: { fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] }, colors: { ink: '#15251e', forest: '#155c42', mint: '#c7f36b', paper: '#f8faf7' }, boxShadow: { soft: '0 20px 60px rgba(20, 47, 34, .08)' } } },
  plugins: [],
};

