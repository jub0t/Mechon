import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import icon from 'astro-icon';
import node from '@astrojs/node'; // ✅ Node adapter

export default defineConfig({
    integrations: [
        tailwind({
            config: {
                // Enable future Tailwind optimizations
                purge: ['./src/**/*.{astro,js,ts,jsx,tsx,vue,svelte}'],
                darkMode: 'class',
            },
        }),
        icon(),
    ],
    output: 'server', // ✅ Needed for SSR with node
    adapter: node({
        mode: 'standalone', // ✅ Bundles everything into a single Node app
    }),
    build: {
        format: 'file', // ✅ Outputs .mjs files, best for deployment
        inlineStylesheets: 'auto', // inline critical CSS automatically
    },
    compressHTML: true, // ✅ Minifies HTML output
});
