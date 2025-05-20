'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import styles from '../styles.module.css';

interface WindowProps {
  id: string;
  title: string;
  children: ReactNode;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  onClose: () => void;
  onPositionChange: (position: { x: number; y: number }) => void;
  onResize: (size: { width: number; height: number }) => void;
  onFocus: () => void;
  onTitleChange: (title: string) => void;
  isResizable?: boolean;
}

export default function Window({
  id,
  title,
  children,
  position,
  size,
  zIndex,
  onClose,
  onPositionChange,
  onResize,
  onFocus,
  onTitleChange,
  isResizable = true
}: WindowProps) {
  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  const [initialMousePos, setInitialMousePos] = useState({ x: 0, y: 0 });
  const initialAspectRatioRef = useRef(1); // Ref to store initial aspect ratio

  const isInteracting = isDragging || isResizing;

  // Handle window dragging
  useEffect(() => {
    if (!headerRef.current) return;

    const header = headerRef.current;

    const handleMouseDown = (e: MouseEvent) => {
      if (isEditingTitle || (e.target as HTMLElement).closest(`.${styles.windowControl}`)) return;
      
      setIsDragging(true);
      onFocus();
      
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    };

    header.addEventListener('mousedown', handleMouseDown);

    return () => {
      header.removeEventListener('mousedown', handleMouseDown);
    };
  }, [position, onFocus, isEditingTitle]);

  // Handle window resizing
  useEffect(() => {
    if (!resizeHandleRef.current || !isResizable) return;

    const resizeHandle = resizeHandleRef.current;

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      onFocus();
      
      setInitialSize({ width: size.width, height: size.height });
      setInitialMousePos({ x: e.clientX, y: e.clientY });
      initialAspectRatioRef.current = size.width / size.height; // Store aspect ratio
    };

    resizeHandle.addEventListener('mousedown', handleMouseDown);

    return () => {
      resizeHandle.removeEventListener('mousedown', handleMouseDown);
    };
  }, [size, onFocus, isResizable]);

  // Handle mouse move and mouse up events for both dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, e.clientX - dragOffset.x);
        const newY = Math.max(0, e.clientY - dragOffset.y);
        onPositionChange({ x: newX, y: newY });
      } else if (isResizing) {
        const MIN_WIDTH = 450;
        const MIN_HEIGHT = 250;
        const currentInitialAspectRatio = initialAspectRatioRef.current;

        const mouseDx = e.clientX - initialMousePos.x;
        
        let newWidth = initialSize.width + mouseDx;
        let newHeight = newWidth / currentInitialAspectRatio;

        // Apply minimum constraints, maintaining aspect ratio
        if (newWidth < MIN_WIDTH) {
          newWidth = MIN_WIDTH;
          newHeight = newWidth / currentInitialAspectRatio;
        }
        if (newHeight < MIN_HEIGHT) {
          newHeight = MIN_HEIGHT;
          newWidth = newHeight * currentInitialAspectRatio;
          // If adjusting for minHeight made width too small again, re-clamp width.
          // This might slightly break AR if MIN_WIDTH/MIN_HEIGHT define a different AR
          // than the window's initial AR, but ensures both minimums are met.
          newWidth = Math.max(newWidth, MIN_WIDTH);
        }
        
        onResize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, initialSize, initialMousePos, onPositionChange, onResize]);

  // Focus the title div when editing starts
  useEffect(() => {
    if (isEditingTitle && titleRef.current) {
      titleRef.current.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(titleRef.current);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [isEditingTitle]);

  return (
    <div
      ref={windowRef}
      className={styles.window}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex
      }}
      onClick={() => {
        if (!isEditingTitle) onFocus();
      }}
    >
      <div 
        ref={headerRef} 
        className={`${styles.windowHeader} ${isInteracting ? styles.noSelect : ''}`}
      >
        <div className={styles.windowControls}>
          <div 
            className={`${styles.windowControl} ${styles.closeBtn}`} 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >×</div>
        </div>
        <div 
          ref={titleRef}
          className={styles.windowTitle}
          contentEditable={isEditingTitle}
          suppressContentEditableWarning
          onDoubleClick={() => setIsEditingTitle(true)}
          onBlur={(e) => {
            setIsEditingTitle(false);
            onTitleChange(e.currentTarget.textContent || title);
          }}
          onClick={(e) => {
            if (isEditingTitle || document.activeElement === titleRef.current) {
              e.stopPropagation();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              titleRef.current?.blur();
            }
            if (e.key === 'Escape') {
              setIsEditingTitle(false);
              e.currentTarget.textContent = title; 
              titleRef.current?.blur();
            }
          }}
        >{title}</div>
      </div>
      
      <div className={styles.windowContent}>
        {children}
      </div>
      
      {isResizable && (
        <div 
          ref={resizeHandleRef}
          className={styles.resizeHandle}
        ></div>
      )}
    </div>
  );
} 