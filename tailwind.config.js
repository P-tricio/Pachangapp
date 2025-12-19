/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'neon-green': '#39ff14',
                'neon-red': '#ff073a',
                'dark-bg': '#0f172a', // slate-900
            }
        },
    },
    plugins: [],
}
