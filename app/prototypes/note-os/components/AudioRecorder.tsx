'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './AudioRecorder.module.css';

interface AudioRecorderProps {
  content: string; // This might be used to store the audio file URL or some metadata
  onChange: (newContent: string) => void;
}

export default function AudioRecorder({ content, onChange }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(content || null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleStartRecording = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
          setIsRecording(false);
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const url = URL.createObjectURL(audioBlob);
          setAudioURL(url);
          onChange(url); // Save the URL as content
          // Stop the tracks to release the microphone
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Error accessing microphone:', err);
        // Handle error (e.g., show a message to the user)
      }
    } else {
      console.error('getUserMedia not supported on your browser!');
      // Handle case where media devices are not supported
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  // Clean up URL object when component unmounts or audioURL changes
  useEffect(() => {
    return () => {
      if (audioURL && audioURL.startsWith('blob:')) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);
  
  // Set initial audio URL if content exists
  useEffect(() => {
    if (content && content !== audioURL) {
      setAudioURL(content);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  return (
    <div className={styles.audioRecorder}>
      {!isRecording && !audioURL && (
        <button onClick={handleStartRecording} className={styles.recordControlButton}>
          Record
        </button>
      )}
      {isRecording && (
        <button onClick={handleStopRecording} className={styles.recordControlButton}>
          Stop
        </button>
      )}
      {audioURL && (
        <div className={styles.audioPlayerContainer}>
          <audio src={audioURL} controls className={styles.audioPlayer} />
          <button 
            onClick={() => {
              setAudioURL(null); 
              onChange(''); // Clear content
            }} 
            className={`${styles.button} ${styles.deleteButton}`}
            title="Delete recording"
          >
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
} 