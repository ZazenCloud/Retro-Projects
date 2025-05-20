'use client';

import { useState } from 'react';
import styles from '../styles.module.css';

interface NavbarProps {
  onCreateTextNote: () => void;
  onCreateDrawingCanvas: () => void;
  onCreateAudioRecorder: () => void;
  onToggleGrid: () => void;
  showGrid: boolean;
  onGoBack: () => void;
}

export default function Navbar({ 
  onCreateTextNote, 
  onCreateDrawingCanvas, 
  onCreateAudioRecorder,
  onToggleGrid,
  showGrid, 
  onGoBack
}: NavbarProps) {
  return (
    <div className={styles.navbar}>
      <div className={styles.navbarLeftGroup}>
        <button 
          className={`${styles.navbarButton} ${styles.navbarIconButton}`}
          onClick={onGoBack}
          title="Go Back"
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
        </button>
        <div className={styles.navbarBrand}>
          <span style={{ fontWeight: 'bold' }}>N</span>
          {'ote'}
          <span style={{ fontWeight: 'bold' }}>OS</span>
        </div>
        
        <button 
          className={styles.navbarButton} 
          onClick={onCreateTextNote}
        >
          New Note
        </button>
        
        <button 
          className={styles.navbarButton} 
          onClick={onCreateDrawingCanvas}
        >
          New Drawing
        </button>
        
        <button 
          className={styles.navbarButton} 
          onClick={onCreateAudioRecorder}
        >
          New Audio
        </button>
      </div>
      
      <button 
        className={`${styles.navbarButton} ${showGrid ? styles.active : ''}`} 
        onClick={onToggleGrid}
      >
        Grid
      </button>
    </div>
  );
} 