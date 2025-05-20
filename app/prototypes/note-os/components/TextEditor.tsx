'use client';

import { useState, useEffect, useRef } from 'react';
import styles from '../styles.module.css';

interface TextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function TextEditor({ content, onChange }: TextEditorProps) {
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize editor content from props only once
  useEffect(() => {
    if (contentEditableRef.current && contentEditableRef.current.innerHTML === '') {
      contentEditableRef.current.innerHTML = content || '';
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Format text handlers
  const formatText = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value || '');
    updateFormatState();
    
    if (contentEditableRef.current) {
      onChange(contentEditableRef.current.innerHTML);
    }
  };

  // Handle content change with debounce
  const handleContentChange = () => {
    if (contentEditableRef.current) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        onChange(contentEditableRef.current?.innerHTML || '');
      }, 300);
    }
  };

  // Update format state based on current selection
  const updateFormatState = () => {
    setIsBold(document.queryCommandState('bold'));
    setIsItalic(document.queryCommandState('italic'));
    setIsUnderline(document.queryCommandState('underline'));
  };

  // Create list
  const createList = (type: 'insertOrderedList' | 'insertUnorderedList') => {
    formatText(type);
  };

  return (
    <div className={styles.textEditor}>
      <div className={styles.editorToolbar}>
        <button 
          className={`${styles.toolbarButton} ${isBold ? styles.active : ''}`} 
          onClick={() => formatText('bold')}
        >
          B
        </button>
        <button 
          className={`${styles.toolbarButton} ${isItalic ? styles.active : ''}`} 
          onClick={() => formatText('italic')}
        >
          I
        </button>
        <button 
          className={`${styles.toolbarButton} ${isUnderline ? styles.active : ''}`} 
          onClick={() => formatText('underline')}
        >
          U
        </button>
        <button 
          className={styles.toolbarButton} 
          onClick={() => formatText('formatBlock', '<h1>')}
        >
          H1
        </button>
        <button 
          className={styles.toolbarButton} 
          onClick={() => formatText('formatBlock', '<h2>')}
        >
          H2
        </button>
        <button 
          className={styles.toolbarButton} 
          onClick={() => createList('insertUnorderedList')}
        >
          • List
        </button>
        <button 
          className={styles.toolbarButton} 
          onClick={() => createList('insertOrderedList')}
        >
          1. List
        </button>
        <button 
          className={styles.toolbarButton} 
          onClick={() => formatText('removeFormat')}
        >
          Clear Format
        </button>
      </div>
      
      <div 
        ref={contentEditableRef}
        className={styles.contentArea}
        contentEditable
        onInput={handleContentChange}
        onBlur={handleContentChange}
        onKeyUp={updateFormatState}
        onMouseUp={updateFormatState}
        suppressContentEditableWarning={true}
      />
    </div>
  );
} 