// Only run Tailwind on our source files, not vendor CSS in node_modules.
module.exports = {
  plugins: [require('autoprefixer')],
};