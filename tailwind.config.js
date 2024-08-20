const { join } = require('path');
const { skeleton } = require('@skeletonlabs/tw-plugin');

module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}', join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}')],
  theme: {
    extend: {},
  },
  plugins: [
    skeleton({
      themes: { preset: ["skeleton"] }
    }),
  ],
};