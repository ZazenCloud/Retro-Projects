"use client";

import { useState, useEffect, useCallback, useRef, Dispatch, SetStateAction } from 'react';
import styles from './styles.module.css';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const OCTAVES_FOR_DISPLAY = [3, 4]; // Restored for fixed visual layout (17 notes)

const MIN_OCTAVE_OFFSET = -1; // Modified: C3 can now become C2 (instead of C1)
const MAX_OCTAVE_OFFSET = 3;  // Modified: C3 can now become C6 (instead of C5)

const ATTACK_TIME = 0.01; 
const RELEASE_TIME = 0.1;  
const MAX_GAIN_OUTPUT = 0.2; // Reduced further to prevent clipping with multiple notes

// --- Song Playback Data Structures ---
interface SongNote {
  pitch: string; // e.g., 'E5', 'C#4'
  duration: number; // in milliseconds
}

interface Song {
  name: string;
  notes: SongNote[];
  gapBetweenNotes?: number; // Optional: milliseconds, defaults to a value if not set
}

const FUR_ELISE_SNIPPET: Song = {
  name: "Fur Elise",
  gapBetweenNotes: 50, // ms gap after each note's duration before the next starts
  notes: [
    { pitch: 'E4', duration: 200 }, { pitch: 'D#4', duration: 200 },
    { pitch: 'E4', duration: 200 }, { pitch: 'D#4', duration: 200 },
    { pitch: 'E4', duration: 200 }, { pitch: 'B3', duration: 200 },
    { pitch: 'D4', duration: 200 }, { pitch: 'C4', duration: 200 },
    { pitch: 'A3', duration: 400 }, // Longer note
    // Added part 2 (simplified)
    { pitch: 'C3', duration: 200 }, { pitch: 'E3', duration: 200 },
    { pitch: 'A3', duration: 200 }, { pitch: 'B3', duration: 400 }, // Longer note
    // Added part 3 (simplified)
    { pitch: 'E3', duration: 200 }, { pitch: 'G#3', duration: 200 },
    { pitch: 'B3', duration: 200 }, { pitch: 'C4', duration: 400 }, // Longer note
    // Repeat part 1 for more length
    { pitch: 'E4', duration: 200 }, { pitch: 'D#4', duration: 200 },
    { pitch: 'E4', duration: 200 }, { pitch: 'D#4', duration: 200 },
    { pitch: 'E4', duration: 200 }, { pitch: 'B3', duration: 200 },
    { pitch: 'D4', duration: 200 }, { pitch: 'C4', duration: 200 },
    { pitch: 'A3', duration: 400 }, // Longer note
  ],
};

const ODE_TO_JOY_SNIPPET: Song = {
  name: "Ode to Joy",
  gapBetweenNotes: 50,
  notes: [
    // Phrase 1
    { pitch: 'E3', duration: 250 }, { pitch: 'E3', duration: 250 }, 
    { pitch: 'F3', duration: 250 }, { pitch: 'G3', duration: 250 },
    { pitch: 'G3', duration: 250 }, { pitch: 'F3', duration: 250 }, 
    { pitch: 'E3', duration: 250 }, { pitch: 'D3', duration: 250 },
    { pitch: 'C3', duration: 250 }, { pitch: 'C3', duration: 250 }, 
    { pitch: 'D3', duration: 250 }, { pitch: 'E3', duration: 250 },
    { pitch: 'E3', duration: 375 }, { pitch: 'D3', duration: 125 }, { pitch: 'D3', duration: 500 }, // Held note at end of phrase
    // Phrase 2 (similar to phrase 1, slight variation at end)
    { pitch: 'E3', duration: 250 }, { pitch: 'E3', duration: 250 }, 
    { pitch: 'F3', duration: 250 }, { pitch: 'G3', duration: 250 },
    { pitch: 'G3', duration: 250 }, { pitch: 'F3', duration: 250 }, 
    { pitch: 'E3', duration: 250 }, { pitch: 'D3', duration: 250 },
    { pitch: 'C3', duration: 250 }, { pitch: 'C3', duration: 250 }, 
    { pitch: 'D3', duration: 250 }, { pitch: 'E3', duration: 250 },
    { pitch: 'D3', duration: 375 }, { pitch: 'C3', duration: 125 }, { pitch: 'C3', duration: 500 }, // Held note at end of phrase
  ],
};

const TWINKLE_TWINKLE_SNIPPET: Song = {
  name: "Twinkle Twinkle",
  gapBetweenNotes: 75,
  notes: [
    { pitch: 'C3', duration: 300 }, { pitch: 'C3', duration: 300 },
    { pitch: 'G3', duration: 300 }, { pitch: 'G3', duration: 300 },
    { pitch: 'A3', duration: 300 }, { pitch: 'A3', duration: 300 },
    { pitch: 'G3', duration: 600 }, 
    { pitch: 'F3', duration: 300 }, { pitch: 'F3', duration: 300 },
    { pitch: 'E3', duration: 300 }, { pitch: 'E3', duration: 300 },
    { pitch: 'D3', duration: 300 }, { pitch: 'D3', duration: 300 },
    { pitch: 'C3', duration: 600 },
  ],
};

const MINUET_IN_G_SNIPPET: Song = {
  name: "Minuet in G",
  gapBetweenNotes: 60,
  notes: [
    { pitch: 'D4', duration: 300 }, { pitch: 'G3', duration: 150 }, { pitch: 'A3', duration: 150 }, { pitch: 'B3', duration: 150 }, { pitch: 'C4', duration: 150 },
    { pitch: 'D4', duration: 300 }, { pitch: 'G3', duration: 300 }, { pitch: 'G3', duration: 300 }, 
    { pitch: 'E4', duration: 300 }, { pitch: 'C4', duration: 150 }, { pitch: 'D4', duration: 150 }, { pitch: 'E4', duration: 150 }, { pitch: 'F#4', duration: 150 },
    { pitch: 'G4', duration: 300 }, { pitch: 'G3', duration: 300 }, { pitch: 'G3', duration: 300 },
  ],
};

const AVAILABLE_SONGS_DATA: Song[] = [
  FUR_ELISE_SNIPPET, 
  ODE_TO_JOY_SNIPPET, 
  TWINKLE_TWINKLE_SNIPPET, 
  MINUET_IN_G_SNIPPET
];
const DEFAULT_GAP_BETWEEN_NOTES = 50; // ms
// --- End Song Playback Data Structures ---

// Maps keyboard press to a specific note on the fixed visual layout
const KEY_PRESS_TO_NOTE: Record<string, string> = {
  'a': 'C3', 'w': 'C#3', 's': 'D3', 'e': 'D#3', 'd': 'E3', 'f': 'F3',
  't': 'F#3', 'g': 'G3', 'y': 'G#3', 'h': 'A3', 'u': 'A#3', 'j': 'B3',
  'k': 'C4', 'o': 'C#4', 'l': 'D4', 'p': 'D#4', ';': 'E4'
};

// Maps a note on the fixed visual layout back to its keyboard key for labelling
const NOTE_TO_KEY_LABEL: Record<string, string> = {};
for (const [key, note] of Object.entries(KEY_PRESS_TO_NOTE)) {
  NOTE_TO_KEY_LABEL[note] = key;
}

// Set page background color
const usePageBackground = (color: string) => {
  useEffect(() => {
    // Save original styles
    const originalStyle = window.getComputedStyle(document.body);
    const originalBg = originalStyle.backgroundColor;
    const originalMargin = originalStyle.margin;
    const originalPadding = originalStyle.padding;
    
    // Apply new styles
    document.body.style.backgroundColor = color;
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    
    // Cleanup function to restore original styles
    return () => {
      document.body.style.backgroundColor = originalBg;
      document.body.style.margin = originalMargin;
      document.body.style.padding = originalPadding;
    };
  }, [color]);
};

// Draggable Hook
const useDraggable = (initialPosition = { x: 50, y: 50 }) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 }); // Stores offset of mouse click from element top-left
  const elementRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (elementRef.current) {
      setIsDragging(true);
      // Calculate offset from element's top-left to the mouse click position
      dragOffsetRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
      // Prevent text selection while dragging
      e.preventDefault(); 
    }
  }, [position.x, position.y]);

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (isDragging) {
      let newX = e.clientX - dragOffsetRef.current.x;
      let newY = e.clientY - dragOffsetRef.current.y;
      
      // Optional: Add boundary checks if needed, e.g.:
      // if (elementRef.current) {
      //   const parent = elementRef.current.parentElement;
      //   if (parent) {
      //     const parentRect = parent.getBoundingClientRect();
      //     const elemRect = elementRef.current.getBoundingClientRect();
      //     newX = Math.max(0, Math.min(newX, parentRect.width - elemRect.width));
      //     newY = Math.max(0, Math.min(newY, parentRect.height - elemRect.height));
      //   }
      // }
      setPosition({ x: newX, y: newY });
    }
  }, [isDragging]);

  useEffect(() => {
    // Use window event listeners for mousemove and mouseup to allow dragging outside the element
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    } else {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, onMouseMove, onMouseUp]);

  return { position, onMouseDownDraggable: onMouseDown, elementRef, isDragging };
};

// Convert note name (e.g., "C4") to frequency in Hz
const noteToFrequency = (baseNoteWithOctave: string, octaveOffset: number): number => {
  const noteNameOnly = baseNoteWithOctave.slice(0, -1).replace(/[0-9]/g, '');
  const originalOctave = parseInt(baseNoteWithOctave.slice(-1));
  const targetOctave = originalOctave + octaveOffset;

  if (isNaN(targetOctave)) { // Should not happen with valid input
    console.error("Invalid note format for frequency calculation:", baseNoteWithOctave);
    return 440; // Default to A4
  }

  const A4 = 440;
  const noteIndex = NOTES.indexOf(noteNameOnly);
  // Calculate semitones from A4, considering the target octave
  const semitonesFromA4 = noteIndex - NOTES.indexOf('A') + ((targetOctave - 4) * 12);
  return A4 * Math.pow(2, semitonesFromA4 / 12);
};

// Settings Window Component
const SettingsWindow = ({ isOpen, onClose, waveform, setWaveform, waveformOptions }: {
  isOpen: boolean;
  onClose: () => void;
  waveform: OscillatorType;
  setWaveform: Dispatch<SetStateAction<OscillatorType>>;
  waveformOptions: { label: string; value: OscillatorType }[];
}) => {
  const { position, onMouseDownDraggable, elementRef, isDragging } = useDraggable({ x: 0, y: 0 }); // Initial position relative to its slot

  if (!isOpen) return null;

  return (
    <div 
      ref={elementRef}
      className={`${styles.macWindow} ${styles.settingsWindow}`}
      style={{
        position: 'absolute',
        left: position.x + 'px',
        top: position.y + 'px',
        transform: 'none',
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      <div 
        className={styles.windowHeader}
        onMouseDown={onMouseDownDraggable}
        style={{ cursor: 'grab' }}
      >
        <div className={styles.windowControls}>
          <span className={styles.closeButton} onClick={onClose}></span>
          <span className={styles.minimizeButton}></span>
          <span className={styles.zoomButton}></span>
        </div>
        <div className={styles.windowTitle}>Wave Types</div>
      </div>
      <div className={styles.windowContent}>
        <div className={styles.controlGroup}>
          {waveformOptions.map(option => (
            <div key={option.value} className={styles.radioOption}>
              <input
                type="radio"
                id={`waveform-${option.value}`}
                name="waveform"
                value={option.value}
                checked={waveform === option.value}
                onChange={(e) => setWaveform(e.target.value as OscillatorType)}
                className={styles.radioButton}
              />
              <label htmlFor={`waveform-${option.value}`} className={styles.radioLabel}>
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Waveform Display Component
const WaveformWindow = ({ 
  isOpen,
  analyserNode,
  animationFrameRef,
}: {
  isOpen: boolean;
  analyserNode: AnalyserNode | null;
  animationFrameRef: React.MutableRefObject<number | undefined>;
}) => {
  const { position, onMouseDownDraggable, elementRef, isDragging } = useDraggable({ x: 0, y: 0 }); // Initial position relative to its slot
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataArrayRef = useRef<Float32Array | null>(null);
  const lastUpdateTimeRef = useRef(0);
  const [isCanvasDrawn, setIsCanvasDrawn] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !isOpen) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;
    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 1024;

    if (!dataArrayRef.current || dataArrayRef.current.length !== bufferLength) {
      dataArrayRef.current = new Float32Array(bufferLength); // Initialized with zeros
    }
    const currentDataArray = dataArrayRef.current;

    // Function to draw a single frame (can be called for initial draw and animation loop)
    const drawFrame = () => {
      ctx.fillStyle = '#1d1d1d';
      ctx.fillRect(0, 0, width, height);
      
      ctx.beginPath();
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      
      const sliceWidth = width / bufferLength;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const v = currentDataArray[i]; 
        const y = (v * height * 0.4) + centerY;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.stroke();
    };

    // Perform the initial draw immediately
    drawFrame(); 
    setIsCanvasDrawn(true); // Signal that canvas has been drawn

    const UPDATE_INTERVAL = 40; 

    const animationLoop = (timestamp: number) => {
      animationFrameRef.current = requestAnimationFrame(animationLoop);
      
      if (analyserNode && timestamp - lastUpdateTimeRef.current > UPDATE_INTERVAL) {
        analyserNode.getFloatTimeDomainData(currentDataArray);
        lastUpdateTimeRef.current = timestamp;
      }
      drawFrame(); // Redraw with potentially updated data
    };

    lastUpdateTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(animationLoop); // Start the animation loop

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, analyserNode, animationFrameRef]);

  if (!isOpen) return null;

  return (
    <div 
      ref={elementRef}
      className={`${styles.macWindow} ${styles.waveformWindowStyling}`}
      style={{
        position: 'absolute',
        left: position.x + 'px',
        top: position.y + 'px',
        transform: 'none',
        cursor: isDragging ? 'grabbing' : 'default',
        // width and height are set by CSS class .waveformWindowStyling
      }}
    >
      <div 
        className={styles.windowHeader}
        onMouseDown={onMouseDownDraggable}
        style={{ cursor: 'grab' }}
      >
        <div className={styles.windowControls}>
          <span className={styles.closeButton}></span>
          <span className={styles.minimizeButton}></span>
          <span className={styles.zoomButton}></span>
        </div>
        <div className={styles.windowTitle}>Waveform</div>
      </div>
      <div className={styles.windowContent} style={{ position: 'relative' }}>
        {!isCanvasDrawn && (
          <div 
            style={{
              width: '100%',
              height: '200px',
              backgroundColor: '#1d1d1d',
              position: 'relative',
            }}
          >
            <div 
              style={{
                position: 'absolute',
                top: '50%',
                left: '0',
                width: '100%',
                height: '2px',
                backgroundColor: '#00ff00',
                transform: 'translateY(-50%)',
              }}
            />
          </div>
        )}
        <canvas 
          ref={canvasRef} 
          width={348}
          height={200} 
          style={{
            display: isCanvasDrawn ? 'block' : 'none',
          }}
        />
      </div>
    </div>
  );
};

// Play Songs Window Component
const PlaySongsWindow = ({
  isOpen,
  onClose,
  selectedSong,
  setSelectedSong,
  onPlay,
  onStop,
  availableSongs,
  isSongPlaying,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedSong: string;
  setSelectedSong: Dispatch<SetStateAction<string>>;
  onPlay: () => void;
  onStop: () => void;
  availableSongs: string[];
  isSongPlaying: boolean;
}) => {
  const { position, onMouseDownDraggable, elementRef, isDragging } = useDraggable({ x: 0, y: 0 }); // Initial position relative to its slot

  if (!isOpen) return null;

  const handlePlayStopClick = () => {
    if (isSongPlaying) {
      onStop();
    } else {
      onPlay();
    }
  };

  return (
    <div
      ref={elementRef}
      className={`${styles.macWindow} ${styles.playSongsWindow}`}
      style={{
        position: 'absolute',
        left: position.x + 'px',
        top: position.y + 'px',
        transform: 'none',
        cursor: isDragging ? 'grabbing' : 'default',
        // minWidth is set by CSS class .playSongsWindow
      }}
    >
      <div
        className={styles.windowHeader}
        onMouseDown={onMouseDownDraggable}
        style={{ cursor: 'grab' }}
      >
        <div className={styles.windowControls}>
          <span className={styles.closeButton} onClick={onClose}></span>
          <span className={styles.minimizeButton}></span>
          <span className={styles.zoomButton}></span>
        </div>
        <div className={styles.windowTitle}>Songs</div>
      </div>
      <div className={styles.windowContent}>
        <div className={styles.controlGroup}>
          <label htmlFor="song-select" className={styles.songLabel}>Song:</label>
          <select 
            id="song-select"
            value={selectedSong} 
            onChange={(e) => setSelectedSong(e.target.value)}
            className={styles.songDropdown}
            disabled={isSongPlaying} // Optionally disable dropdown while playing
          >
            {availableSongs.map(song => (
              <option key={song} value={song}>{song}</option>
            ))}
          </select>
        </div>
        <div className={`${styles.controlGroup} ${styles.playControls}`}>
          <button onClick={handlePlayStopClick} className={styles.macButton}>
            {isSongPlaying ? 'Stop' : 'Play'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Add this hook after the other imports
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

export default function DigitalPiano() {
  const [activeKeys, setActiveKeys] = useState<string[]>([]);
  const [waveform, setWaveform] = useState<OscillatorType>('sine');
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [isWaveformWindowOpen, setIsWaveformWindowOpen] = useState(true);
  const [isPlaySongsWindowOpen, setIsPlaySongsWindowOpen] = useState(true);
  const [selectedSong, setSelectedSong] = useState<string>(AVAILABLE_SONGS_DATA[0]?.name || '');
  const [isSongCurrentlyPlaying, setIsSongCurrentlyPlaying] = useState(false);
  const [octaveOffset, setOctaveOffset] = useState<number>(0);
  const isMobile = useIsMobile();
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const oscillatorsRef = useRef<Map<string, { oscillator: OscillatorNode, gain: GainNode }>>(new Map());
  const noteStopTimeoutIdsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const keysPressedRef = useRef<Map<string, number>>(new Map());
  const animationFrameRef = useRef<number | undefined>(undefined);
  const songPlaybackTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const waveformRef = useRef(waveform); // Ref to hold the current waveform
  const playNextSongNoteRef = useRef<((songNotes: SongNote[], noteIndex: number, gap: number) => void) | null>(null);

  // Define waveformOptions here
  const waveformOptions: { label: string; value: OscillatorType }[] = [
    { label: "sine", value: "sine" },
    { label: "square", value: "square" },
    { label: "sawtooth", value: "sawtooth" },
    { label: "triangle", value: "triangle" },
  ];

  const { position: pianoPosition, onMouseDownDraggable: onPianoMouseDown, elementRef: pianoRef, isDragging: isPianoDragging } = useDraggable({ x: 614, y: 200 }); // Adjusted initial Y to 30px
  
  // Apply the grey background to the whole page
  usePageBackground('#eee');

  useEffect(() => {
    waveformRef.current = waveform;
  }, [waveform]);

  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048; // Kept original fftSize for detail
      // smoothingTimeConstant can be kept low or at default for less visual smoothing of the data itself
      analyserRef.current.smoothingTimeConstant = 0.1; 
      analyserRef.current.connect(audioContextRef.current.destination);
    }
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        stopAllSounds(); 
        audioContextRef.current.close();
      }
    };
  }, []);

  const stopAllSounds = useCallback(() => {
    const audioContext = audioContextRef.current;
    if (audioContext) {
      oscillatorsRef.current.forEach(({ oscillator, gain }, note) => {
        try {
          const now = audioContext.currentTime;
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(gain.gain.value, now);
          gain.gain.linearRampToValueAtTime(0.0001, now + 0.05);
          oscillator.stop(now + 0.05);
        } catch (e) { /* Ignore errors */ }
        
        if (noteStopTimeoutIdsRef.current.has(note)) {
          clearTimeout(noteStopTimeoutIdsRef.current.get(note)!);
          noteStopTimeoutIdsRef.current.delete(note);
        }
      });
      oscillatorsRef.current.clear();
      keysPressedRef.current.clear();
      setActiveKeys([]);
    }
  }, [setActiveKeys]);

  const playNote = useCallback((baseNoteWithOctave: string) => {
    if (!audioContextRef.current || audioContextRef.current.state === 'suspended') {
        audioContextRef.current?.resume();
    }
    if (!audioContextRef.current || !analyserRef.current) return;

    const audioContext = audioContextRef.current;
    const now = audioContext.currentTime;
    const uniqueKeyForOscillator = `${baseNoteWithOctave}-${octaveOffset}`; // Ensure unique oscillator per effective pitch

    if (oscillatorsRef.current.has(uniqueKeyForOscillator)) {
      const existing = oscillatorsRef.current.get(uniqueKeyForOscillator)!;
      existing.gain.gain.cancelScheduledValues(now);
      existing.gain.gain.setValueAtTime(existing.gain.gain.value, now);
      existing.gain.gain.linearRampToValueAtTime(0.0001, now + 0.01);
      try {
        existing.oscillator.stop(now + 0.01);
      } catch (e) { /* Already stopped */ }
      oscillatorsRef.current.delete(uniqueKeyForOscillator);
      if (noteStopTimeoutIdsRef.current.has(uniqueKeyForOscillator)) {
        clearTimeout(noteStopTimeoutIdsRef.current.get(uniqueKeyForOscillator)!);
        noteStopTimeoutIdsRef.current.delete(uniqueKeyForOscillator);
      }
    }

    setActiveKeys(prev => {
      if (!prev.includes(baseNoteWithOctave)) return [...prev, baseNoteWithOctave];
      return prev;
    });

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = waveformRef.current;
    oscillator.frequency.value = noteToFrequency(baseNoteWithOctave, octaveOffset);

    const actualGain = MAX_GAIN_OUTPUT;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(actualGain, now + ATTACK_TIME);

    oscillator.connect(gainNode);
    gainNode.connect(analyserRef.current);
    oscillator.start(now);
    
    oscillator.onended = () => {
        const currentOscData = oscillatorsRef.current.get(uniqueKeyForOscillator);
        if (currentOscData && currentOscData.oscillator === oscillator) {
            oscillatorsRef.current.delete(uniqueKeyForOscillator);
        }
        if (noteStopTimeoutIdsRef.current.has(uniqueKeyForOscillator)) {
            clearTimeout(noteStopTimeoutIdsRef.current.get(uniqueKeyForOscillator)!);
            noteStopTimeoutIdsRef.current.delete(uniqueKeyForOscillator);
        }
    };
    oscillatorsRef.current.set(uniqueKeyForOscillator, { oscillator, gain: gainNode });
  }, [setActiveKeys, octaveOffset]);

  const stopNote = useCallback((baseNoteWithOctave: string, fixedOctaveOffset?: number) => {
    const offsetToUse = typeof fixedOctaveOffset === 'number' ? fixedOctaveOffset : octaveOffset;
    const uniqueKeyForOscillator = `${baseNoteWithOctave}-${offsetToUse}`;
    const oscillatorData = oscillatorsRef.current.get(uniqueKeyForOscillator);
    const audioContext = audioContextRef.current;

    if (oscillatorData && audioContext) {
      const { oscillator, gain } = oscillatorData;
      const now = audioContext.currentTime;

      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + RELEASE_TIME);

      try {
          oscillator.stop(now + RELEASE_TIME + 0.01);
      } catch(e) { /* ignore */ }
      
      setActiveKeys(prev => prev.filter(key => key !== baseNoteWithOctave));

      if (noteStopTimeoutIdsRef.current.has(uniqueKeyForOscillator)) {
        clearTimeout(noteStopTimeoutIdsRef.current.get(uniqueKeyForOscillator)!);
        noteStopTimeoutIdsRef.current.delete(uniqueKeyForOscillator);
      }
      
      const timeoutId = setTimeout(() => {
        const currentData = oscillatorsRef.current.get(uniqueKeyForOscillator);
        if (currentData && currentData.oscillator === oscillator) {
             oscillatorsRef.current.delete(uniqueKeyForOscillator);
        }
        noteStopTimeoutIdsRef.current.delete(uniqueKeyForOscillator);
      }, (RELEASE_TIME + 0.05) * 1000);
      noteStopTimeoutIdsRef.current.set(uniqueKeyForOscillator, timeoutId);
    } else {
      if (typeof fixedOctaveOffset === 'undefined') {
         setActiveKeys(prev => prev.filter(key => key !== baseNoteWithOctave));
      }
    }
  }, [setActiveKeys, octaveOffset]);

  const playNextSongNote = useCallback((songNotes: SongNote[], noteIndex: number, gap: number) => {
    if (noteIndex >= songNotes.length) {
      setIsSongCurrentlyPlaying(false); // Song finished
      return;
    }

    const note = songNotes[noteIndex];
    const octaveOffsetForThisNoteInstance = octaveOffset; // Capture current octaveOffset for this specific note instance

    playNote(note.pitch); // playNote will use the octaveOffset from its closure (which matches the one captured above)

    const noteStopTimeout = setTimeout(() => {
      stopNote(note.pitch, octaveOffsetForThisNoteInstance); // Pass the captured offset to stopNote
    }, note.duration);

    const nextNoteDelay = note.duration + gap;
    const nextNotePlayTimeout = setTimeout(() => {
      if (playNextSongNoteRef.current) {
        playNextSongNoteRef.current(songNotes, noteIndex + 1, gap); // Call via ref
      }
    }, nextNoteDelay);

    songPlaybackTimeoutsRef.current.push(noteStopTimeout, nextNotePlayTimeout);
  }, [playNote, stopNote, setIsSongCurrentlyPlaying, octaveOffset]);

  useEffect(() => {
    playNextSongNoteRef.current = playNextSongNote;
  }, [playNextSongNote]);

  const handlePlaySong = useCallback(() => {
    if (isSongCurrentlyPlaying) return;

    const songData = AVAILABLE_SONGS_DATA.find(s => s.name === selectedSong);
    if (!songData) {
      console.error("Selected song data not found:", selectedSong);
      return;
    }

    songPlaybackTimeoutsRef.current.forEach(clearTimeout);
    songPlaybackTimeoutsRef.current = [];
    stopAllSounds();

    setIsSongCurrentlyPlaying(true);
    const gap = songData.gapBetweenNotes || DEFAULT_GAP_BETWEEN_NOTES;
    playNextSongNote(songData.notes, 0, gap);
  }, [selectedSong, playNextSongNote, isSongCurrentlyPlaying, stopAllSounds]);

  const handleStopSong = useCallback(() => {
    setIsSongCurrentlyPlaying(false);
    songPlaybackTimeoutsRef.current.forEach(clearTimeout);
    songPlaybackTimeoutsRef.current = [];
    stopAllSounds();
  }, [stopAllSounds, setIsSongCurrentlyPlaying]);

  const decreaseOctave = useCallback(() => {
    setOctaveOffset(prev => Math.max(MIN_OCTAVE_OFFSET, prev - 1));
  }, []);

  const increaseOctave = useCallback(() => {
    setOctaveOffset(prev => Math.min(MAX_OCTAVE_OFFSET, prev + 1));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopAllSounds();
        setActiveKeys([]);
        keysPressedRef.current.clear();
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        const currentIndex = waveformOptions.findIndex(option => option.value === waveform);
        const nextIndex = (currentIndex + 1) % waveformOptions.length;
        setWaveform(waveformOptions[nextIndex].value);
        return;
      }

      if (e.key === ' ') { // Spacebar
        e.preventDefault();
        if (isSongCurrentlyPlaying) {
          handleStopSong();
        } else {
          handlePlaySong();
        }
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (isSongCurrentlyPlaying) {
          handleStopSong(); // Stop current song before changing
        }
        const songNames = AVAILABLE_SONGS_DATA.map(s => s.name);
        const currentIndex = songNames.indexOf(selectedSong);
        let nextIndex = currentIndex;

        if (e.key === 'ArrowLeft') {
          nextIndex = (currentIndex - 1 + songNames.length) % songNames.length;
        } else if (e.key === 'ArrowRight') {
          nextIndex = (currentIndex + 1) % songNames.length;
        }

        if (songNames[nextIndex]) {
          setSelectedSong(songNames[nextIndex]);
        }
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (e.key === 'ArrowUp') {
          increaseOctave();
        } else if (e.key === 'ArrowDown') {
          decreaseOctave();
        }
        return;
      }

      if (e.repeat) return;
      const targetNote = KEY_PRESS_TO_NOTE[e.key.toLowerCase()];

      if (targetNote && !keysPressedRef.current.has(e.key.toLowerCase())) {
        keysPressedRef.current.set(e.key.toLowerCase(), octaveOffset);
        playNote(targetNote);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keyLower = e.key.toLowerCase();
      const targetNote = KEY_PRESS_TO_NOTE[keyLower];
      if (targetNote && keysPressedRef.current.has(keyLower)) {
        const originalOctaveOffset = keysPressedRef.current.get(keyLower);
        stopNote(targetNote, originalOctaveOffset);
        keysPressedRef.current.delete(keyLower);
      }
    };

    const handleBlur = () => {
      stopAllSounds();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [playNote, stopNote, stopAllSounds, waveform, waveformOptions]);

  return (
    <div className={styles.container}>
      {/* Add navigation button */}
      <a href="/" className={styles.navigationButton}>←</a>

      {/* Add help button and window */}
      <button className={styles.helpButton}>?</button>
      <div className={styles.helpWindow}>
        <div className={styles.helpContent}>
          <h3>Keyboard Controls</h3>
          <ul>
            <li>Space: Play/Stop current song</li>
            <li>↑/↓: Change octave</li>
            <li>←/→: Change song</li>
            <li>TAB: Change waveform</li>
            <li>ESC: Stop frozen keys</li>
          </ul>
        </div>
      </div>

      {/* Piano Window - Always first */}
      <div 
        ref={pianoRef}
        className={`${styles.macWindow} ${styles.pianoWindow}`}
        style={{
          position: isMobile ? 'static' : 'absolute',
          left: !isMobile ? pianoPosition.x + 'px' : undefined,
          top: !isMobile ? pianoPosition.y + 'px' : undefined,
          transform: 'none',
          cursor: isPianoDragging ? 'grabbing' : 'default',
        }}
      >
        <div 
          className={styles.windowHeader}
          onMouseDown={onPianoMouseDown}
          style={{ cursor: 'grab' }}
        >
          <div className={styles.windowControls}>
            <span className={styles.closeButton}></span>
            <span className={styles.minimizeButton}></span>
            <span className={styles.zoomButton}></span>
          </div>
          <span 
            className={`${styles.octaveArrow} ${styles.octaveArrowLeft}`}
            onClick={decreaseOctave}
          >
            ←
          </span>
          <div className={styles.windowTitle}>Piano</div>
          <span 
            className={`${styles.octaveArrow} ${styles.octaveArrowRight}`}
            onClick={increaseOctave}
          >
            →
          </span>
        </div>
        
        <div className={styles.windowContent}>
          <div className={styles.keyboard}>
            {OCTAVES_FOR_DISPLAY.map(octave => (
              <div key={octave} className={styles.octave}>
                {/* First render all white keys to establish the base layout */}
                {NOTES.filter(note => !note.includes('#')).map(noteName => {
                  const fullNote = `${noteName}${octave}`;
                  // Logic for 17-note layout: only C,D,E for octave 4 from keyboard letters
                  if (octave === 4 && !['C', 'D', 'E', 'C#', 'D#'].includes(noteName)) {
                     if (KEY_PRESS_TO_NOTE[';'] === fullNote || 
                         KEY_PRESS_TO_NOTE['p'] === fullNote || 
                         KEY_PRESS_TO_NOTE['l'] === fullNote || 
                         KEY_PRESS_TO_NOTE['o'] === fullNote || 
                         KEY_PRESS_TO_NOTE['k'] === fullNote ) {
                       // Keep C4,D4,E4 and their sharps based on KEY_PRESS_TO_NOTE
                     } else {
                        if (!noteName.includes('#')) return null; // Hide other white keys in octave 4 not in mapping
                     }
                  }
                  const isActive = activeKeys.includes(fullNote);
                  const keyboardKeyLabel = NOTE_TO_KEY_LABEL[fullNote] || '';
                  
                  return (
                    <div
                      key={fullNote}
                      className={`${styles.whiteKey} ${isActive ? styles.active : ''}`}
                      onMouseDown={() => playNote(fullNote)}
                      onMouseUp={() => stopNote(fullNote)}
                      onMouseLeave={() => {
                        if (oscillatorsRef.current.has(`${fullNote}-${octaveOffset}`) && activeKeys.includes(fullNote)) {
                           stopNote(fullNote);
                        }
                      }}
                      onTouchStart={(e) => { e.preventDefault(); playNote(fullNote); }}
                      onTouchEnd={(e) => { e.preventDefault(); stopNote(fullNote); }}
                      data-note={fullNote}
                    >
                      <span className={styles.noteLabel}>
                        {keyboardKeyLabel ? keyboardKeyLabel : noteName}
                        {!keyboardKeyLabel && <sub>{octave}</sub>}
                      </span>
                    </div>
                  );
                })}
                
                {/* Then render all black keys on top */}
                {NOTES.filter(note => note.includes('#')).map(noteName => {
                  const fullNote = `${noteName}${octave}`;
                   // Logic for 17-note layout: only C#, D# for octave 4 from keyboard letters
                   if (octave === 4 && !['C', 'D', 'E', 'C#', 'D#'].includes(noteName)) {
                    if (KEY_PRESS_TO_NOTE[';'] === fullNote || 
                        KEY_PRESS_TO_NOTE['p'] === fullNote || 
                        KEY_PRESS_TO_NOTE['l'] === fullNote || 
                        KEY_PRESS_TO_NOTE['o'] === fullNote || 
                        KEY_PRESS_TO_NOTE['k'] === fullNote ) {
                      // Keep C4,D4,E4 and their sharps based on KEY_PRESS_TO_NOTE
                    } else {
                       if (noteName.includes('#')) return null; // Hide other black keys in octave 4 not in mapping
                    }
                 }
                  const isActive = activeKeys.includes(fullNote);
                  const keyboardKeyLabel = NOTE_TO_KEY_LABEL[fullNote] || '';
                  
                  return (
                    <div
                      key={fullNote}
                      className={`${styles.blackKey} ${isActive ? styles.active : ''}`}
                      onMouseDown={() => playNote(fullNote)}
                      onMouseUp={() => stopNote(fullNote)}
                      onMouseLeave={() => {
                        if (oscillatorsRef.current.has(`${fullNote}-${octaveOffset}`) && activeKeys.includes(fullNote)) {
                           stopNote(fullNote);
                        }
                      }}
                      onTouchStart={(e) => { e.preventDefault(); playNote(fullNote); }}
                      onTouchEnd={(e) => { e.preventDefault(); stopNote(fullNote); }}
                      data-note={fullNote}
                    >
                      {keyboardKeyLabel && (
                        <span className={styles.keyboardKeyLabel}>{keyboardKeyLabel}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Other Windows Container */}
      <div className={styles.horizontalWindowsContainer}>
        {/* Wave Types */}
        <div className={`${styles.windowSlot} ${styles.settingsSlot}`}>
          <SettingsWindow 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
            waveform={waveform} 
            setWaveform={setWaveform}
            waveformOptions={waveformOptions}
          />
        </div>

        {/* Waveform */}
        <div className={`${styles.windowSlot} ${styles.waveformSlot}`}>
          <WaveformWindow 
            isOpen={isWaveformWindowOpen}
            analyserNode={analyserRef.current}
            animationFrameRef={animationFrameRef}
          />
        </div>

        {/* Songs */}
        <div className={`${styles.windowSlot} ${styles.playSongsSlot}`}>
          <PlaySongsWindow
            isOpen={isPlaySongsWindowOpen}
            onClose={() => setIsPlaySongsWindowOpen(false)}
            selectedSong={selectedSong}
            setSelectedSong={setSelectedSong}
            onPlay={handlePlaySong}
            onStop={handleStopSong}
            availableSongs={AVAILABLE_SONGS_DATA.map(s => s.name)}
            isSongPlaying={isSongCurrentlyPlaying}
          />
        </div>
      </div>
    </div>
  );
} 