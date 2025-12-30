// Polyfills for Node.js APIs in the browser
(window as any).process = {
  env: {
    NODE_ENV: 'development'
  },
  browser: true
};

// Additional polyfills if needed
(window as any).global = window;
