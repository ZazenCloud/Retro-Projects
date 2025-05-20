'use client';

import Link from "next/link";
import styles from './styles/home.module.css';
import { retro, pixelFont } from './fonts';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

export default function Home() {
  // State to track if the app is "minimized"
  const [isMinimized, setIsMinimized] = useState(false);
  // State to track if the app is in fullscreen mode
  const [isFullScreen, setIsFullScreen] = useState(false);
  // Reference to the main container element
  const containerRef = useRef<HTMLDivElement>(null);

  // Effect to track fullscreen changes
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(
        !!(document.fullscreenElement || 
        // @ts-ignore - Vendor prefixed properties
        document.webkitFullscreenElement || 
        // @ts-ignore - Vendor prefixed properties
        document.mozFullScreenElement || 
        // @ts-ignore - Vendor prefixed properties
        document.msFullscreenElement)
      );
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    document.addEventListener('mozfullscreenchange', handleFullScreenChange);
    document.addEventListener('MSFullscreenChange', handleFullScreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullScreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullScreenChange);
    };
  }, []);

  // Add your prototypes to this array
  const prototypes = [
    {
      title: 'Getting started',
      description: 'How to create a prototype',
      path: '/prototypes/example'
    },
    {
      title: 'Confetti button',
      description: 'An interactive button that creates a colorful confetti explosion',
      path: '/prototypes/confetti-button'
    },
    {
      title: 'Digital Piano',
      description: 'A classic MacOS-styled digital piano you can play with keyboard or mouse',
      path: '/prototypes/digital-piano'
    },
    {
      title: 'Typography Experiments',
      description: 'Explore creative typography effects with CSS and SVG',
      path: '/prototypes/typography-experiments'
    },
    {
      title: 'NoteOS',
      description: 'A note-taking app with cyberpunk vibes',
      path: '/prototypes/note-os'
    },
    // Add your new prototypes here like this:
    // {
    //   title: 'Your new prototype',
    //   description: 'A short description of what this prototype does',
    //   path: '/prototypes/my-new-prototype'
    // },
  ];

  // Function to close the window
  const handleCloseWindow = () => {
    window.close();
    // If window.close() doesn't work (which is common in many browsers),
    // we can navigate to about:blank as a fallback
    if (window.location === window.parent.location) {
      window.location.href = "about:blank";
    }
  };

  // Function to simulate minimize window
  const handleMinimizeWindow = () => {
    setIsMinimized(true);
  };

  // Function to maximize window or toggle fullscreen
  const handleMaximizeWindow = () => {
    if (isMinimized) {
      // If minimized, restore window but maintain fullscreen state
      setIsMinimized(false);
    } else {
      // If not minimized, toggle fullscreen
      toggleFullScreen();
    }
  };

  // Function to toggle fullscreen
  const toggleFullScreen = () => {
    if (!containerRef.current) return;

    if (!isFullScreen) {
      // Enter fullscreen
      const element = containerRef.current;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        (element as any).msRequestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  return (
    <div ref={containerRef} className={`${styles.container} ${retro.className} ${isFullScreen ? styles.fullscreen : ''}`}>
      {isMinimized ? (
        <div className={styles.minimizedWindow}>
          <div className={styles.windowControls}>
            <span onClick={handleCloseWindow}></span>
            <span onClick={handleMinimizeWindow}></span>
            <span onClick={handleMaximizeWindow}></span>
          </div>
          <span className={styles.minimizedText}>Zen's Projects</span>
        </div>
      ) : (
        <>
          <div className={styles.y2kElements}>
            <div className={styles.palmTree}></div>
            <div className={styles.sunset}></div>
          </div>
          
          <div className={styles.contentWrapper}>
            <header className={styles.header}>
              <div className={styles.windowControls}>
                <span onClick={handleCloseWindow}></span>
                <span onClick={handleMinimizeWindow}></span>
                <span onClick={handleMaximizeWindow}></span>
              </div>
              <h1 className={pixelFont.className}>Zen's Projects</h1>
            </header>

            <main>
              <section className={styles.grid}>
                {/* Goes through the prototypes list (array) to create cards */}
                {prototypes.map((prototype, index) => (
                  <Link 
                    key={index}
                    href={prototype.path} 
                    className={styles.card}
                  >
                    <h3>{prototype.title}</h3>
                    <p>{prototype.description}</p>
                    <div className={styles.statueImage}></div>
                  </Link>
                ))}
              </section>
            </main>
            
            <footer className={styles.footer}>
              <p>© {new Date().getFullYear()} AESTHETIC COMPUTING</p>
            </footer>
          </div>
        </>
      )}
    </div>
  );
}
