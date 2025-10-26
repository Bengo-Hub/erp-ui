/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class', '.app-dark'],
    content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
    plugins: [require('tailwindcss-primeui')],
    theme: {
        extend: {
            animation: {
                'color-wave': 'colorWave 2s ease-in-out infinite',
                'rainbow-fade': 'rainbowFade 6s linear infinite',
                'glow-pulse': 'glowPulse 3s ease-in-out infinite'
            },
            keyframes: {
                fadeUp: {
                    '0%': {
                        opacity: '0',
                        transform: 'translateY(20px) scale(0.8)',
                        color: '#3b82f6'
                    },
                    '100%': {
                        opacity: '1',
                        transform: 'translateY(0) scale(1)',
                        color: 'currentColor'
                    }
                },
                colorWave: {
                    '0%, 100%': {
                        color: '#3b82f6', // blue-500
                        textShadow: '0 0 5px rgba(59, 130, 246, 0.5)'
                    },
                    '50%': {
                        color: '#ec4899', // pink-500
                        textShadow: '0 0 15px rgba(236, 72, 153, 0.8)'
                    }
                },
                rainbowFade: {
                    '0%': { color: '#ef4444', filter: 'brightness(1.2)' }, // red-500
                    '16%': { color: '#f97316', filter: 'brightness(1.2)' }, // orange-500
                    '32%': { color: '#eab308', filter: 'brightness(1.2)' }, // yellow-500
                    '48%': { color: '#22c55e', filter: 'brightness(1.2)' }, // green-500
                    '64%': { color: '#3b82f6', filter: 'brightness(1.2)' }, // blue-500
                    '80%': { color: '#a855f7', filter: 'brightness(1.2)' }, // purple-500
                    '100%': { color: '#ec4899', filter: 'brightness(1.2)' } // pink-500
                },
                glowPulse: {
                    '0%, 100%': {
                        color: 'white',
                        textShadow: '0 0 8px rgba(255,255,255,0.8)'
                    },
                    '50%': {
                        color: '#fbbf24', // amber-400
                        textShadow: '0 0 16px rgba(251, 191, 36, 0.9)'
                    }
                }
            }
        },
        screens: {
            sm: '576px',
            md: '768px',
            lg: '992px',
            xl: '1200px',
            '2xl': '1920px'
        }
    }
};
