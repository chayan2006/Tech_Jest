import React, { useEffect } from 'react';

/**
 * InstagramFeed component embeds the Instagram profile feed.
 * It loads Instagram's embed script and renders a blockquote for the profile.
 * Note: Instagram only supports embedding individual posts via oEmbed.
 * This implementation uses the profile URL in an iframe as a simple preview.
 */
export const InstagramFeed = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.instagram.com/embed.js';
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <section className="instagram-feed" style={{
      marginTop: '2rem',
      padding: '1rem',
      borderRadius: '12px',
      background: 'rgba(255,255,255,0.1)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.2)',
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Follow us on Instagram</h2>
      {/* Instagram embed for the profile - using iframe as fallback */}
      <iframe
        src="https://www.instagram.com/techjest_?embed=true"
        width="100%"
        height="500"
        style={{ border: 'none', borderRadius: '8px' }}
        scrolling="no"
        allowTransparency="true"
        title="Instagram Feed"
      ></iframe>
    </section>
  );
};
