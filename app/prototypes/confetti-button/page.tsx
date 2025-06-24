"use client";

import { useState } from 'react';
import styles from './styles.module.css';
import Link from 'next/link';
import confetti from 'canvas-confetti';

export default function ConfettiButtonPrototype() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [confettiColors, setConfettiColors] = useState(['#FF69B4', '#00FFFF', '#9932CC']);

  const triggerConfetti = () => {
    setIsAnimating(true);
    
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { y: 0.6 },
      colors: confettiColors,
      shapes: ['square'], // Keep the square particles for the pixel look
    });

    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleColorChange = (index: number, color: string) => {
    const newColors = [...confettiColors];
    newColors[index] = color;
    setConfettiColors(newColors);
  };

  const toggleColorPicker = () => {
    setIsColorPickerOpen(!isColorPickerOpen);
  };

  return (
    <div className={styles.container}>
      <div className={styles.buttonContainer}>
        <Link href="/" className={styles.backButton}>←</Link>
      </div>
      
      <div className={styles.window}>
        <div className={styles.windowTitle}>
          Confetti button
        </div>
        <div className={styles.windowContent}>
          <h1 className={styles.title}>Congrats!</h1>
          <button 
            className={`${styles.confettiButton} ${isAnimating ? styles.animate : ''}`}
            onClick={triggerConfetti}
          >
            Celebrate
          </button>
          <button 
            className={styles.settingsButton}
            onClick={toggleColorPicker}
          >
            Change Colors
          </button>
        </div>
      </div>

      {isColorPickerOpen && (
        <>
          <div className={styles.overlay} onClick={toggleColorPicker}></div>
          <div className={styles.colorPickerWindow}>
            <div className={styles.windowTitle}>
              Choose Confetti Colors
            </div>
            <div className={styles.windowContent}>
              <div className={styles.colorPickerContent}>
                {confettiColors.map((color, index) => (
                  <div key={index} className={styles.colorPickerItem}>
                    <label className={styles.colorLabel}>
                      Color {index + 1}:
                    </label>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => handleColorChange(index, e.target.value)}
                      className={styles.colorInput}
                    />
                    <div 
                      className={styles.colorPreview} 
                      style={{ backgroundColor: color }}
                    />
                  </div>
                ))}
                <button 
                  className={styles.closeButton}
                  onClick={toggleColorPicker}
                >
                  Apply Colors
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 