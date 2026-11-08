import React from 'react';

interface HeartTransitionOverlayProps {
  isExpanding: boolean;
  isFadingOut: boolean;
}

export const HeartTransitionOverlay: React.FC<HeartTransitionOverlayProps> = ({
  isExpanding,
  isFadingOut
}) => {
  if (!isExpanding && !isFadingOut) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] grid place-items-center bg-[radial-gradient(circle,_#210d19_0%,_#080f1d_95%)] pointer-events-none transition-opacity duration-1000 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="grid place-items-center scale-40 anim-heart-grow will-change-transform">
        <svg
          className="w-28 h-28 fill-[#ff2d55] drop-shadow-[0_0_45px_rgba(255,45,85,0.95)]"
          viewBox="0 0 24 24"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>
    </div>
  );
};
