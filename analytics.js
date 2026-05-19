// Vercel Web Analytics
// For vanilla JavaScript projects, we use the CDN import
import { inject } from 'https://cdn.jsdelivr.net/npm/@vercel/analytics@1/dist/index.mjs';

inject({
  mode: 'auto',
  debug: false
});
