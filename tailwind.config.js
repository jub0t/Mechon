// tailwind.config.js

module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx}"],
  theme: {
    darkMode: 'class',
    extend: {
      colors: {
        neutral: {
          10: "hsl(var(--color-neutral-10))",
          15: "hsl(var(--color-neutral-15))",
          20: "hsl(var(--color-neutral-20))",
          85: "hsl(var(--color-neutral-85))",
          90: "hsl(var(--color-neutral-90))",
        },
        primary: {
          100: "hsl(var(--color-primary-100))",
        },
        // Add more color categories if needed
      },
    },
  },
  plugins: [

  ],
};
