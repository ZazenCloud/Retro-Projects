"use client";

// Template for creating a new prototype
// To use this template:
// 1. Create a new folder in app/prototypes with your prototype name
// 2. Copy this file and styles.module.css into your new folder
// 3. Create an 'images' folder for your prototype's images
// 4. Rename and customize the component and styles as needed

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import styles from './styles.module.css';

// Typography effects array
const effects = [
  'gradient',
  'glitch',
  'variable',
  'liquid',
  'shadow',
  'perspective',
  'kinetic',
  'chromatic'
];

// Modern color palettes with higher contrast and vibrancy
const colorPalettes = [
  // Neon lights
  ['#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#ff3366'],
  // Pastel dream
  ['#fcd4ff', '#c5b3ff', '#99f6e4', '#bef264', '#fde68a'],
  // Cyber punk
  ['#ff0080', '#7928ca', '#00d4ff', '#00ff00', '#ffff00'],
  // Electric
  ['#ff6b6b', '#ffd93d', '#6c5ce7', '#a8e6cf', '#fdcb6e'],
  // Plasma
  ['#0ea5e9', '#6366f1', '#8b5cf6', '#d946ef', '#f472b6'],
  // Laser
  ['#34d399', '#10b981', '#059669', '#047857', '#065f46'],
  // Aurora
  ['#4c1d95', '#6d28d9', '#7c3aed', '#8b5cf6', '#a78bfa'],
  // Candy
  ['#fb7185', '#f472b6', '#c084fc', '#818cf8', '#60a5fa'],
];

// Font weights array (400 is normal, 700 is bold)
const fontWeights = [400, 400, 400, 700]; // 25% chance of being bold

export default function TypographyExperiments() {
  const [text, setText] = useState('Type something...');
  const [inputValue, setInputValue] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [currentPalette, setCurrentPalette] = useState(colorPalettes[0]);
  const [wordStyles, setWordStyles] = useState<Array<{ scale: number; weight: number }>>([]);
  const [globalScale, setGlobalScale] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Function to check and adjust content fit
  const adjustContentFit = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const container = canvas.parentElement;
    if (!container) return;

    // Reset scale to check natural size
    setGlobalScale(1);
    
    // Wait for next frame to get updated measurements
    requestAnimationFrame(() => {
      const containerHeight = container.clientHeight - 100; // Subtract input height and padding
      const contentHeight = canvas.scrollHeight;
      
      if (contentHeight > containerHeight) {
        const newScale = containerHeight / contentHeight;
        setGlobalScale(Math.max(0.3, newScale)); // Don't go smaller than 30% of original size
      }
    });
  };

  useEffect(() => {
    // Split text into words and update state
    const newWords = text.split(' ').filter(word => word.length > 0);
    setWords(newWords);
    
    // Generate random styles for each word
    const newStyles = newWords.map(() => ({
      scale: 0.8 + Math.random() * 0.4,
      weight: fontWeights[Math.floor(Math.random() * fontWeights.length)]
    }));
    setWordStyles(newStyles);
    
    // Change color palette on each input
    setCurrentPalette(colorPalettes[Math.floor(Math.random() * colorPalettes.length)]);

    // Adjust content fit after state updates
    adjustContentFit();
  }, [text]);

  // Add resize listener
  useEffect(() => {
    const handleResize = () => adjustContentFit();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get a random color from the current palette with increased brightness
  const getRandomColor = () => {
    const baseColor = currentPalette[Math.floor(Math.random() * currentPalette.length)];
    return baseColor;
  };

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backButton}>←</Link>
      
      <div 
        ref={canvasRef}
        className={styles.canvas}
        style={{
          '--global-scale': globalScale,
        } as React.CSSProperties}
      >
        {words.map((word, index) => {
          // Get a random effect for this word
          const effect = effects[Math.floor(Math.random() * effects.length)];
          const wordColor = getRandomColor();
          const wordStyle = wordStyles[index] || { scale: 1, weight: 400 };
          
          return (
            <span 
              key={`${word}-${index}`} 
              className={`${styles.word} ${styles[effect]}`}
              style={{
                '--word-color': wordColor,
                '--scale': wordStyle.scale,
                '--weight': wordStyle.weight,
              } as React.CSSProperties}
              data-text={word}
            >
              {effect === 'gradient' ? word : word.split('').map((letter, letterIndex) => (
                <span
                  key={`${letter}-${letterIndex}`}
                  className={styles.letter}
                  style={{
                    '--index': letterIndex,
                    '--total': word.length,
                  } as React.CSSProperties}
                  data-text={letter}
                >
                  {letter}
                </span>
              ))}
              {' '}
            </span>
          );
        })}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => {
          const newValue = e.target.value;
          setInputValue(newValue);
          setText(newValue || 'Type something...');
        }}
        className={styles.input}
        placeholder=""
      />

      {/* SVG Filters */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="liquid">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.01 0.01"
              numOctaves="1"
              seed="1"
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                dur="10s"
                values="0.01 0.01;0.02 0.02;0.01 0.01"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="20"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
    </div>
  );
} 