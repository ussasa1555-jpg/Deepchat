import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Deeps Rooms - Privacy Chat',
    short_name: 'Deeps Rooms',
    description: 'Privacy-focused retro chat platform with terminal aesthetics',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#00FF00',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}





