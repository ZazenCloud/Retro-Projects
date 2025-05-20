'use client';

import { useState, useRef, useEffect } from 'react';
import styles from '../styles.module.css';

interface DrawingCanvasProps {
  content: string;
  onChange: (content: string) => void;
}

export default function DrawingCanvas({ content, onChange }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  
  const latestContentRef = useRef(content);
  const strokeWidthRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    latestContentRef.current = content;
  }, [content]);

  // Function to update slider track fill
  const updateSliderFill = (value: number, max: number) => {
    if (strokeWidthRef.current) {
      const percentage = (value / max) * 100;
      strokeWidthRef.current.style.setProperty('--fill-percentage', `${percentage}%`);
    }
  };

  // Update slider fill when strokeWidth changes or on mount
  useEffect(() => {
    updateSliderFill(strokeWidth, 20); // Assuming max strokeWidth is 20
  }, [strokeWidth]);

  // Effect for handling canvas resize and redrawing based on latestContentRef
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const redrawCanvasWithCurrentContent = (targetWidth: number, targetHeight: number) => {
      if (targetWidth <= 0 || targetHeight <= 0) return; // Avoid invalid canvas sizes

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const currentContentToDraw = latestContentRef.current;
      if (currentContentToDraw) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Stretch image to fit
        };
        img.onerror = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          console.error("DrawingCanvas: Failed to load image from content for redraw.");
        };
        img.src = currentContentToDraw;
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || !entries.length) return;
      const { width, height } = entries[0].contentRect;
      redrawCanvasWithCurrentContent(width, height);
    });

    resizeObserver.observe(canvas);

    // Initial draw: ResizeObserver will trigger redrawCanvasWithCurrentContent on observe
    // with the initial computed size of the canvas element.

    return () => {
      resizeObserver.unobserve(canvas);
      resizeObserver.disconnect();
    };
  }, []); // Empty dependency array: runs once on mount

  // Effect for explicitly redrawing ONLY when `content` prop changes
  // (e.g., undo, redo, initial load if content is passed after mount)
  useEffect(() => {
    const canvas = canvasRef.current;
    // Ensure canvas is mounted and has dimensions before trying to draw. 
    // ResizeObserver effect is responsible for setting initial dimensions.
    if (!canvas || !canvas.getContext || canvas.width <= 0 || canvas.height <= 0) return; 
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // latestContentRef is already up-to-date due to its own effect.
    // This effect redraws using the new `content` (which is latestContentRef.current).
    if (content) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.onerror = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        console.error("DrawingCanvas: Failed to load image from content prop change.");
      };
      img.src = content;
    } else {
      // If content becomes empty (e.g. after a clear action that updates the prop)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [content]); // Runs when `content` prop changes

  // Save canvas state to undo stack before drawing
  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const currentState = canvas.toDataURL();
    setUndoStack((prevStack) => [...prevStack, currentState]);
    setRedoStack([]); // Clear redo stack on new action
  };

  // Start drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    saveCanvasState();
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    setIsDrawing(true);
  };

  // Draw line
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  // Stop drawing
  const stopDrawing = () => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.closePath();
    setIsDrawing(false);
    
    const newContent = canvas.toDataURL();
    onChange(newContent);
  };

  // Undo last drawing action
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const currentCanvasState = canvas.toDataURL();
    setRedoStack((prevStack) => [...prevStack, currentCanvasState]);

    const newUndoStack = [...undoStack];
    const lastState = newUndoStack.pop();
    setUndoStack(newUndoStack);
    
    if (lastState) {
      onChange(lastState); // This will trigger the useEffect watching `content` to redraw
    }
  };

  // Redo last undone action
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const currentCanvasState = canvas.toDataURL();
    setUndoStack((prevStack) => [...prevStack, currentCanvasState]);
    
    const newRedoStack = [...redoStack];
    const nextState = newRedoStack.pop();
    setRedoStack(newRedoStack);
    
    if (nextState) {
      onChange(nextState); // This will trigger the useEffect watching `content` to redraw
    }
  };

  // Clear canvas
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    saveCanvasState(); // Save current state before clearing, so clear is undoable
    onChange(''); // Set content to empty, will trigger useEffect to clear and redraw
  };

  // Export drawing as PNG
  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className={styles.drawingCanvas}>
      <div className={styles.canvasToolbar}>
        <input 
          type="color" 
          value={color} 
          onChange={(e) => setColor(e.target.value)} 
          className={styles.colorPicker}
        />
        <input 
          ref={strokeWidthRef}
          type="range" 
          min="1" 
          max="20" 
          value={strokeWidth} 
          onChange={(e) => setStrokeWidth(parseInt(e.target.value))} 
          className={styles.strokeWidth}
        />
        <button 
          className={styles.toolbarButton} 
          onClick={handleUndo}
          disabled={undoStack.length === 0}
        >
          Undo
        </button>
        <button 
          className={styles.toolbarButton} 
          onClick={handleRedo}
          disabled={redoStack.length === 0}
        >
          Redo
        </button>
        <button 
          className={styles.toolbarButton} 
          onClick={handleClear}
        >
          Clear
        </button>
        <button 
          className={styles.toolbarButton} 
          onClick={handleExport}
        >
          Export
        </button>
      </div>
      
      <canvas 
        ref={canvasRef}
        className={styles.canvas}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
} 