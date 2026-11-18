import forms from '@tailwindcss/forms';
import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
        extend: {
            colors: {
                ink: '#1A2130',
                navy: {
                    DEFAULT: '#1F2544',
                    mid: '#304463',
                    deep: '#161b33',
                },
                mist: '#F5F7F8',
                brand: '#3FA2F6',
                leaf: {
                    50: '#eef6f1',
                    700: '#1a5c3a',
                    800: '#0f3d2e',
                    900: '#0a2a20',
                },
                mango: {
                    400: '#e8b84a',
                    500: '#d4a017',
                    600: '#b8860b',
                },
                seat: {
                    open: '#FF8F00',
                    hover: '#478CCF',
                    taken: '#508D4E',
                    screen: '#2980b9',
                },
                stone: {
                    soft: '#f2f5f0',
                },
            },
            fontFamily: {
                display: ['Poppins', ...defaultTheme.fontFamily.sans],
                sans: ['Poppins', ...defaultTheme.fontFamily.sans],
                script: ['Caveat', 'cursive', ...defaultTheme.fontFamily.sans],
                rounded: ['Nunito', ...defaultTheme.fontFamily.sans],
                'serif-display': ['Libre Baskerville', ...defaultTheme.fontFamily.serif],
            },
            borderRadius: {
                lg: '0.5rem',
            },
            boxShadow: {
                cinema: '0 18px 40px rgba(0, 0, 0, 0.35)',
                ticket: '4px 4px 0 0 #1A2130',
            },
            keyframes: {
                'fade-up': {
                    '0%': { opacity: '0', transform: 'translateY(12px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'poster-in': {
                    '0%': { opacity: '0', transform: 'translateX(-16px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
            },
            animation: {
                'fade-up': 'fade-up 0.55s ease-out both',
                'poster-in': 'poster-in 0.35s ease-out both',
            },
        },
    },
    plugins: [forms],
};
