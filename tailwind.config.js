module.exports = {
  purge: ['./client-site/**/*.{js,ts,jsx,tsx}', './mesh-app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'unfrm-background': '#1f2b34',
        'unfrm-deepblue': '#1d3557',
        'unfrm-red': '#e42535',
        'unfrm-red-light': '#f08b93',
        'unfrm-cyan': '#7ad7da',
        'unfrm-cyan-light': '#cbf1f2',
        'unfrm-lightblue': '#457b9d',
        'unfrm-midnight-express': '#161e2e',
      },
      minHeight: {
        670: '670px',
        700: '700px',
      },
    },
  },
  variants: {},
  plugins: [],
};
