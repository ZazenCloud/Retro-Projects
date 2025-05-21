'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './styles.module.css';
import Window from './components/Window';
import TextEditor from './components/TextEditor';
import DrawingCanvas from './components/DrawingCanvas';
import Navbar from './components/Navbar';
import AudioRecorder from './components/AudioRecorder';

export default function NoteOS() {
  const router = useRouter();
  const [windows, setWindows] = useState<Array<{
    id: string;
    title: string;
    type: 'text' | 'drawing' | 'audio';
    content: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    zIndex: number;
  }>>([]);
  
  const [highestZIndex, setHighestZIndex] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const isInitialLoadRef = useRef(true);
  const skipNextSaveRef = useRef(false);
  
  // Load windows from localStorage only once on component mount
  useEffect(() => {
    const savedWindows = localStorage.getItem('note-os-windows');
    if (savedWindows) {
      try {
        const parsed = JSON.parse(savedWindows);
        setWindows(parsed);
        
        // Find the highest z-index
        const maxZ = parsed.reduce((max: number, w: any) => Math.max(max, w.zIndex), 0);
        setHighestZIndex(maxZ > 100 ? maxZ : 100);
      } catch (e) {
        console.error('Failed to parse saved windows', e);
      }
    }
    isInitialLoadRef.current = false;
  }, []);

  // Save windows to localStorage whenever they change
  useEffect(() => {
    // Skip saving during initial load and when explicitly skipped
    if (isInitialLoadRef.current || skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    
    localStorage.setItem('note-os-windows', JSON.stringify(windows));
  }, [windows]);

  // Create a new text note
  const createTextNote = () => {
    const newZ = highestZIndex + 1;
    setHighestZIndex(newZ);
    
    const newWindow = {
      id: `text-${Date.now()}`,
      title: 'Text Note',
      type: 'text' as 'text' | 'drawing' | 'audio',
      content: '',
      position: { x: 50 + (windows.length * 20) % 200, y: 50 + (windows.length * 20) % 200 },
      size: { width: 450, height: 350 },
      zIndex: newZ
    };
    setWindows(currentWindows => [...currentWindows, newWindow]);
  };

  // Create a new drawing canvas
  const createDrawingCanvas = () => {
    const newZ = highestZIndex + 1;
    setHighestZIndex(newZ);
    
    const newWindow = {
      id: `drawing-${Date.now()}`,
      title: 'Drawing',
      type: 'drawing' as 'text' | 'drawing' | 'audio',
      content: '',
      position: { x: 70 + (windows.length * 20) % 200, y: 70 + (windows.length * 20) % 200 },
      size: { width: 500, height: 400 },
      zIndex: newZ
    };
    setWindows(currentWindows => [...currentWindows, newWindow]);
  };

  // Create a new audio recorder
  const createAudioRecorder = () => {
    const newZ = highestZIndex + 1;
    setHighestZIndex(newZ);
    
    const newWindow = {
      id: `audio-${Date.now()}`,
      title: 'Audio Note',
      type: 'audio' as 'text' | 'drawing' | 'audio',
      content: '',
      position: { x: 90 + (windows.length * 20) % 200, y: 90 + (windows.length * 20) % 200 },
      size: { width: 350, height: 200 },
      zIndex: newZ
    };
    setWindows(currentWindows => [...currentWindows, newWindow]);
  };

  // Toggle grid visibility
  const toggleGrid = () => {
    setShowGrid(!showGrid);
  };

  // Update window position
  const updateWindowPosition = (id: string, position: { x: number; y: number }) => {
    setWindows(currentWindows => currentWindows.map(window => 
      window.id === id ? { ...window, position } : window
    ));
  };

  // Update window content
  const updateWindowContent = (id: string, content: string) => {
    setWindows(currentWindows => currentWindows.map(window => {
      if (window.id === id) {
        return { ...window, content };
      }
      return window;
    }));
  };

  // Update window title
  const updateWindowTitle = (id: string, title: string) => {
    setWindows(currentWindows => currentWindows.map(window => {
      if (window.id === id) {
        return { ...window, title };
      }
      return window;
    }));
  };

  // Close window
  const closeWindow = (id: string) => {
    skipNextSaveRef.current = true;
    const updatedWindowsForLS = windows.filter(w => w.id !== id);
    localStorage.setItem('note-os-windows', JSON.stringify(updatedWindowsForLS));
    
    setWindows(currentWindows => currentWindows.filter(w => w.id !== id));
  };

  // Bring window to front
  const bringToFront = (id: string) => {
    const newZ = highestZIndex + 1;
    setHighestZIndex(newZ);
    
    setWindows(currentWindows => currentWindows.map(window => 
      window.id === id ? { ...window, zIndex: newZ } : window
    ));
  };

  // Resize window
  const resizeWindow = (id: string, size: { width: number; height: number }) => {
    setWindows(currentWindows => currentWindows.map(window => 
      window.id === id ? { ...window, size } : window
    ));
  };

  const handleGoBack = () => {
    router.push('/');
  };

  return (
    <div className={styles.noteOS}>
      <Navbar 
        onCreateTextNote={createTextNote} 
        onCreateDrawingCanvas={createDrawingCanvas}
        onCreateAudioRecorder={createAudioRecorder}
        onToggleGrid={toggleGrid}
        showGrid={showGrid}
        onGoBack={handleGoBack}
      />
      
      <div className={`${styles.desktop} ${showGrid ? styles.showGrid : ''}`}>
        {windows.map(window => (
          <Window
            key={window.id}
            id={window.id}
            title={window.title}
            position={window.position}
            size={window.size}
            zIndex={window.zIndex}
            onClose={() => closeWindow(window.id)}
            onPositionChange={(position) => updateWindowPosition(window.id, position)}
            onResize={(size) => resizeWindow(window.id, size)}
            onFocus={() => bringToFront(window.id)}
            onTitleChange={(title) => updateWindowTitle(window.id, title)}
            isResizable={window.type !== 'audio'}
          >
            {window.type === 'text' ? (
              <TextEditor
                content={window.content}
                onChange={(content) => updateWindowContent(window.id, content)}
              />
            ) : window.type === 'drawing' ? (
              <DrawingCanvas
                content={window.content}
                onChange={(content) => updateWindowContent(window.id, content)}
              />
            ) : (
              <AudioRecorder
                content={window.content}
                onChange={(content) => updateWindowContent(window.id, content)}
              />
            )}
          </Window>
        ))}
      </div>
    </div>
  );
}