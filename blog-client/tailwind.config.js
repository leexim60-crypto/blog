/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      /* 与 src/assets/style.css 里的设计 token 保持一致，
         这样在模板里用工具类也不会跑出设计系统之外 */
      colors: {
        ink: {
          900: '#04060d',
          850: '#060a14',
          800: '#080e1b',
          700: '#0c1425',
          600: '#111c33',
        },
        aurora: {
          a: '#6ea8ff',
          b: '#a78bfa',
          c: '#5eead4',
        },
        ember: '#ffb86b',
      },
      fontFamily: {
        sans: ['Inter Tight', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'sans-serif'],
        serif: ['Instrument Serif', 'Songti SC', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        xs: '8px',
        s: '12px',
        m: '18px',
        l: '26px',
      },
      maxWidth: {
        shell: '72rem',
        read: '44rem',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
        spring: 'cubic-bezier(0.34, 1.4, 0.5, 1)',
      },
      keyframes: {
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          to: { backgroundPosition: '200% center' },
        },
      },
      animation: {
        'float-slow': 'float-slow 6s ease-in-out infinite',
        shimmer: 'shimmer 4s linear infinite',
      },
    },
  },
  plugins: [],
}
