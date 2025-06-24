"use client";

// Template for creating a new prototype
// To use this template:
// 1. Create a new folder in app/prototypes with your prototype name
// 2. Copy this file and styles.module.css into your new folder
// 3. Create an 'images' folder for your prototype's images
// 4. Rename and customize the component and styles as needed

import styles from './styles.module.css';
import SnakeGame from './components/snake-game';

export default function RetroSnakePage() {
  return (
    <div className={styles.container}>
      <div className={styles.crtScreen}>
        <h1 className={styles.glitchTitle} data-text="SNAKE">
          SNAKE
        </h1>
        
        <div className={styles.gameContainer}>
          <SnakeGame />
        </div>
      </div>
    </div>
  );
} 