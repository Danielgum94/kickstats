/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    container: { center: true, padding: '1rem', screens: { lg: '1024px', xl: '1200px' } },
    extend: {
      colors: {
        // פלטת לילה מודרנית + אקסנט ניאון
        ink: '#0B1220',           // רקע ראשי
        surface: 'rgba(255,255,255,0.04)', // כרטיסים (glass)
        border: 'rgba(255,255,255,0.08)',
        linen: '#F3F6F9',        // טקסט בהיר
        muted: '#94A3B8',        // טקסט משני
        primary: '#00E5A8',      // ניאון ירקרק
        accent: '#55CCFF',       // כחול טורקיז
        danger: '#FF6B6B',
      },
      fontFamily: {
        display: ['Heebo', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 40px rgba(0,0,0,.35)'
      },
      borderRadius: {
        '2xl': '1.25rem',
      }
    },
  },
  plugins: [],
}
