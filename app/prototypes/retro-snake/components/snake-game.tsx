"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useMediaQuery } from "../hooks/use-media-query"
import styles from "../styles.module.css"

// Game constants
const GRID_SIZE = 20
const GAME_SPEED = 100
const MIN_SNAKE_SEGMENT_SCALE = 0.3; // Minimum segment size as a factor of cellSize
const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
}

// Updated color palettes to match the reference images
const PALETTES = [
  ["#ff00ff", "#00ffff", "#00ff00", "#0066ff", "#ff3399"],
  ["#00ffcc", "#ff33cc", "#3399ff", "#33ff99", "#cc33ff"],
]

// Glitch variation types
type GlitchVariation = "horizontal-bands" | "vertical-streaks" | "pixel-sort" | "digital-blocks" | "signal-loss"

// D-pad button type for handling touch events
type DPadButtonProps = {
  direction: { x: number; y: number };
  label: string;
  icon: string;
  onPress: (direction: { x: number; y: number }) => void;
  disabled: boolean;
}

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glitchCanvasRef = useRef<HTMLCanvasElement>(null)
  const [snake, setSnake] = useState<{ x: number; y: number }[]>([{ x: 10, y: 10 }])
  const [food, setFood] = useState<{ x: number; y: number }>({ x: 5, y: 5 })
  const [direction, setDirection] = useState<{ x: number; y: number }>(DIRECTIONS.RIGHT)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [paused, setPaused] = useState(false)
  const [glitchIntensity, setGlitchIntensity] = useState(0)
  const [colorPalette, setColorPalette] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [currentGlitchVariation, setCurrentGlitchVariation] = useState<GlitchVariation>("horizontal-bands")
  const directionRef = useRef(direction)
  const [directionQueue, setDirectionQueue] = useState<{ x: number; y: number }[]>([]);
  const lastMoveDirectionRef = useRef(direction);
  const isMobile = useMediaQuery("(max-width: 768px)")
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const colorChangeIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const eatSoundRef = useRef<HTMLAudioElement | null>(null)
  const gameOverSoundRef = useRef<HTMLAudioElement | null>(null)
  const [audioInitialized, setAudioInitialized] = useState(false);

  // Initialize audio elements
  const initAudio = () => {
    if (audioInitialized) return;
    try {
      console.log("Initializing audio on user interaction");
      
      const eatSound = new Audio();
      eatSound.src = "/prototypes/retro-snake/eat.mp3";
      eatSound.preload = "auto";
      
      const gameOverSound = new Audio();
      gameOverSound.src = "/prototypes/retro-snake/gameover.mp3";
      gameOverSound.preload = "auto";
      
      console.log("Audio elements created", {
        eatSoundSrc: eatSound.src,
        gameOverSoundSrc: gameOverSound.src
      });

      // Assign to refs first
      eatSoundRef.current = eatSound;
      gameOverSoundRef.current = gameOverSound;
      setAudioInitialized(true);
      console.log("Audio initialized and refs set.");

      // Add error handlers
      eatSound.addEventListener("error", (e) => {
        console.error("Error loading eat sound:", e);
        eatSoundRef.current = null; // Clear ref on error
      });
      
      gameOverSound.addEventListener("error", (e) => {
        console.error("Error loading game over sound:", e);
        gameOverSoundRef.current = null; // Clear ref on error
      });
      
    } catch (error) {
      console.error("Error initializing audio:", error);
      eatSoundRef.current = null;
      gameOverSoundRef.current = null;
    }
  };

  useEffect(() => {
    // Clean up audio elements on unmount
    return () => {
      if (eatSoundRef.current) {
        eatSoundRef.current.pause();
        eatSoundRef.current.src = ""; // Release resources
        eatSoundRef.current = null;
      }
      if (gameOverSoundRef.current) {
        gameOverSoundRef.current.pause();
        gameOverSoundRef.current.src = ""; // Release resources
        gameOverSoundRef.current = null;
      }
    };
  }, []);

  // Set up canvas dimensions
  useEffect(() => {
    const canvas = canvasRef.current
    const glitchCanvas = glitchCanvasRef.current
    if (!canvas || !glitchCanvas) return

    const updateCanvasSize = () => {
      const size = Math.min(window.innerWidth - 40, 600)
      canvas.width = size
      canvas.height = size
      glitchCanvas.width = size
      glitchCanvas.height = size
    }

    updateCanvasSize()
    window.addEventListener("resize", updateCanvasSize)

    return () => window.removeEventListener("resize", updateCanvasSize)
  }, [])

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted && e.key === " ") {
        startGame()
        return
      }

      if (gameOver && e.key === " ") {
        startGame()
        return
      }

      if (e.key === " ") {
        setPaused((prev) => !prev)
        return
      }

      if (paused) return

      let newDirection: { x: number; y: number } | null = null;

      switch (e.key) {
        case "ArrowUp":
          if (lastMoveDirectionRef.current !== DIRECTIONS.DOWN) {
            newDirection = DIRECTIONS.UP;
          }
          break
        case "ArrowDown":
          if (lastMoveDirectionRef.current !== DIRECTIONS.UP) {
            newDirection = DIRECTIONS.DOWN;
          }
          break
        case "ArrowLeft":
          if (lastMoveDirectionRef.current !== DIRECTIONS.RIGHT) {
            newDirection = DIRECTIONS.LEFT;
          }
          break
        case "ArrowRight":
          if (lastMoveDirectionRef.current !== DIRECTIONS.LEFT) {
            newDirection = DIRECTIONS.RIGHT;
          }
          break
      }

      if (newDirection) {
        directionRef.current = newDirection;
        setDirection(newDirection);
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameStarted, paused, gameOver])

  // Generate random food position
  const generateFood = () => {
    const x = Math.floor(Math.random() * GRID_SIZE)
    const y = Math.floor(Math.random() * GRID_SIZE)

    // Make sure food doesn't spawn on snake
    if (snake.some((segment) => segment.x === x && segment.y === y)) {
      return generateFood()
    }

    return { x, y }
  }

  // Select a random glitch variation
  const selectRandomGlitchVariation = () => {
    const variations: GlitchVariation[] = [
      "horizontal-bands",
      "vertical-streaks",
      "pixel-sort",
      "digital-blocks",
      "signal-loss",
    ]

    // Filter out the current variation to ensure we get a different one
    const availableVariations = variations.filter((v) => v !== currentGlitchVariation)
    const randomIndex = Math.floor(Math.random() * availableVariations.length)
    return availableVariations[randomIndex]
  }

  // Start game function
  const startGame = () => {
    if (!audioInitialized) {
      initAudio();
    }
    setSnake([{ x: 10, y: 10 }])
    setFood(generateFood())
    setDirection(DIRECTIONS.RIGHT)
    directionRef.current = DIRECTIONS.RIGHT
    lastMoveDirectionRef.current = DIRECTIONS.RIGHT;
    setDirectionQueue([]);
    setGameOver(false)
    setScore(0)
    setPaused(false)
    setGameStarted(true)

    // Initialize glitch intensity to 0 (no glitches)
    setGlitchIntensity(0)

    // Change color palette periodically
    colorChangeIntervalRef.current = setInterval(() => {
      setColorPalette((prev) => (prev + 1) % PALETTES.length)
    }, 10000)
  }

  // Game loop
  useEffect(() => {
    if (!gameStarted || paused || gameOver) return

    const moveSnake = () => {
      // Now, move the snake using directionRef.current
      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] }
        head.x += directionRef.current.x
        head.y += directionRef.current.y

        // After moving, update the lastMoveDirectionRef to the direction we just moved in
        lastMoveDirectionRef.current = directionRef.current;

        // Check for wall collision (wrap around)
        if (head.x >= GRID_SIZE) head.x = 0
        if (head.x < 0) head.x = GRID_SIZE - 1
        if (head.y >= GRID_SIZE) head.y = 0
        if (head.y < 0) head.y = GRID_SIZE - 1

        // Check for self collision
        if (prevSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
          if (gameOverSoundRef.current && audioInitialized) {
            try {
              console.log("Attempting to play game over sound");
              gameOverSoundRef.current.currentTime = 0;
              const playPromise = gameOverSoundRef.current.play();

              if (playPromise !== undefined) {
                playPromise
                  .then(() => console.log("Game over sound played successfully"))
                  .catch((error) => {
                    console.error("Error playing game over sound:", error);
                  });
              }
            } catch (error) {
              console.error("Error playing game over sound:", error);
            }
          } else {
            console.log("Game over sound reference not available or audio not initialized");
          }
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake]

        // Check for food collision
        if (head.x === food.x && head.y === food.y) {
          if (eatSoundRef.current && audioInitialized) {
            try {
              console.log("Attempting to play eat sound");
              eatSoundRef.current.currentTime = 0;
              const playPromise = eatSoundRef.current.play();

              if (playPromise !== undefined) {
                playPromise
                  .then(() => console.log("Eat sound played successfully"))
                  .catch((error) => {
                    console.error("Error playing eat sound:", error);
                  });
              }
            } catch (error) {
              console.error("Error playing eat sound:", error);
            }
          } else {
            console.log("Eat sound reference not available or audio not initialized");
          }
          setScore((prev) => prev + 5)
          setFood(generateFood())

          // Select a new random glitch variation
          setCurrentGlitchVariation(selectRandomGlitchVariation())

          // Enhanced glitch effect when scoring points - shorter duration
          setGlitchIntensity(1.0) // Maximum intensity

          // Schedule glitch effects to fade out over 1.5 seconds (shorter duration)
          setTimeout(() => setGlitchIntensity(0.8), 300)
          setTimeout(() => setGlitchIntensity(0.6), 600)
          setTimeout(() => setGlitchIntensity(0.4), 900)
          setTimeout(() => setGlitchIntensity(0.2), 1200)
          setTimeout(() => setGlitchIntensity(0), 1500) // Turn off completely after 1.5 seconds
        } else {
          newSnake.pop() // Remove tail if no food eaten
        }

        return newSnake
      })
    }

    gameLoopRef.current = setInterval(moveSnake, GAME_SPEED)

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [gameStarted, paused, gameOver, food])

  // Clean up intervals on unmount or game over
  useEffect(() => {
    if (gameOver) {
      if (colorChangeIntervalRef.current) {
        clearInterval(colorChangeIntervalRef.current)
      }
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }

    return () => {
      if (colorChangeIntervalRef.current) {
        clearInterval(colorChangeIntervalRef.current)
      }
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [gameOver])

  // Apply horizontal bands glitch effect
  const applyHorizontalBandsGlitch = (glitchCtx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // First copy the game canvas to the glitch canvas
    glitchCtx.clearRect(0, 0, canvas.width, canvas.height)
    glitchCtx.drawImage(canvas, 0, 0)

    // Create a clip path to constrain the glitch effects to the canvas bounds
    glitchCtx.save()
    glitchCtx.beginPath()
    glitchCtx.rect(0, 0, canvas.width, canvas.height)
    glitchCtx.clip()
    
    // Horizontal band corruption
    const numBands = Math.floor(Math.random() * 15) + 10
    for (let i = 0; i < numBands; i++) {
      const bandY = Math.floor(Math.random() * canvas.height)
      const bandHeight = Math.floor(Math.random() * 80) + 20
      const bandShift = Math.floor(Math.random() * 100) - 50

      // Get band data
      const imageData = glitchCtx.getImageData(0, bandY, canvas.width, bandHeight)
      const data = imageData.data

      // Apply extreme color corruption to band
      for (let j = 0; j < data.length; j += 4) {
        if (Math.random() < 0.8) {
          // Color channel extreme shifting - using colors from reference
          data[j] = Math.random() < 0.6 ? 255 : Math.random() < 0.6 ? 0 : data[j] // R - more reds/magentas
          data[j + 1] = Math.random() < 0.6 ? 255 : Math.random() < 0.6 ? 0 : data[j + 1] // G - more greens
          data[j + 2] = Math.random() < 0.8 ? 255 : Math.random() < 0.3 ? 0 : data[j + 2] // B - more blues/cyans
        }
      }

      // Apply band with shift
      glitchCtx.putImageData(imageData, bandShift, bandY)
    }

    // Add random scan lines across the entire screen
    const numScanLines = Math.floor(Math.random() * 30) + 20
    for (let i = 0; i < numScanLines; i++) {
      const lineY = Math.floor(Math.random() * canvas.height)
      const lineHeight = Math.floor(Math.random() * 3) + 1

      // Alternate between bright colors and black
      if (Math.random() < 0.7) {
        const lineColor = Math.floor(Math.random() * 5)
        if (lineColor === 0) {
          glitchCtx.fillStyle = "#ff00ff" // Magenta
        } else if (lineColor === 1) {
          glitchCtx.fillStyle = "#00ffff" // Cyan
        } else if (lineColor === 2) {
          glitchCtx.fillStyle = "#00ff00" // Green
        } else if (lineColor === 3) {
          glitchCtx.fillStyle = "#0066ff" // Blue
        } else {
          glitchCtx.fillStyle = "#ff3399" // Pink
        }
      } else {
        glitchCtx.fillStyle = "rgba(0,0,0,0.8)"
      }

      glitchCtx.fillRect(0, lineY, canvas.width, lineHeight)
    }

    // RGB shift
    glitchCtx.globalCompositeOperation = "screen"
    glitchCtx.globalAlpha = 0.8
    glitchCtx.drawImage(canvas, Math.random() * 20 - 10, 0)
    glitchCtx.fillStyle = "rgba(255,0,255,0.4)"
    glitchCtx.fillRect(Math.random() * 20 - 10, 0, canvas.width, canvas.height)
    
    // Restore the clip path
    glitchCtx.restore()
  }

  // Apply vertical streaks glitch effect
  const applyVerticalStreaksGlitch = (glitchCtx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // First copy the game canvas to the glitch canvas
    glitchCtx.clearRect(0, 0, canvas.width, canvas.height)
    glitchCtx.drawImage(canvas, 0, 0)
    
    // Create a clip path to constrain the glitch effects to the canvas bounds
    glitchCtx.save()
    glitchCtx.beginPath()
    glitchCtx.rect(0, 0, canvas.width, canvas.height)
    glitchCtx.clip()

    // Vertical streaking
    const numStreaks = Math.floor(Math.random() * 25) + 15
    for (let i = 0; i < numStreaks; i++) {
      const streakX = Math.floor(Math.random() * canvas.width)
      const streakWidth = Math.floor(Math.random() * 15) + 3
      const streakHeight = Math.floor(Math.random() * 200) + 100
      const streakY = Math.floor(Math.random() * (canvas.height - streakHeight))

      // Get streak data
      const imageData = glitchCtx.getImageData(0, streakY, canvas.width, streakHeight)
      const data = imageData.data

      // Stretch pixels vertically
      for (let y = 0; y < streakHeight; y++) {
        const sourceY = Math.floor(y / 3) % streakHeight
        for (let x = 0; x < streakWidth; x++) {
          const targetIndex = (y * streakWidth + x) * 4
          const sourceIndex = (sourceY * streakWidth + x) * 4

          data[targetIndex] = data[sourceIndex]
          data[targetIndex + 1] = data[sourceIndex + 1]
          data[targetIndex + 2] = data[sourceIndex + 2]
        }
      }

      // Apply color shift to the streak
      for (let j = 0; j < data.length; j += 4) {
        if (Math.random() < 0.7) {
          const color = Math.floor(Math.random() * 5)
          if (color === 0) {
            data[j] = 255
            data[j + 1] = 0
            data[j + 2] = 255 // Magenta
          } else if (color === 1) {
            data[j] = 0
            data[j + 1] = 255
            data[j + 2] = 255 // Cyan
          } else if (color === 2) {
            data[j] = 0
            data[j + 1] = 255
            data[j + 2] = 0 // Green
          } else if (color === 3) {
            data[j] = 0
            data[j + 1] = 102
            data[j + 2] = 255 // Blue
          } else {
            data[j] = 255
            data[j + 1] = 51
            data[j + 2] = 153 // Pink
          }
        }
      }

      glitchCtx.putImageData(imageData, streakX, streakY)
    }

    // Add some horizontal lines for contrast
    const numLines = Math.floor(Math.random() * 10) + 5
    for (let i = 0; i < numLines; i++) {
      const lineY = Math.floor(Math.random() * canvas.height)
      const lineHeight = Math.floor(Math.random() * 5) + 2

      glitchCtx.fillStyle = Math.random() < 0.5 ? "#00ffff" : "#ff00ff"
      glitchCtx.fillRect(0, lineY, canvas.width, lineHeight)
    }

    // RGB shift (vertical direction)
    glitchCtx.globalCompositeOperation = "screen"
    glitchCtx.globalAlpha = 0.8
    glitchCtx.drawImage(canvas, 0, Math.random() * 20 - 10)
    glitchCtx.fillStyle = "rgba(0,255,255,0.4)"
    glitchCtx.fillRect(0, Math.random() * 20 - 10, canvas.width, canvas.height)
    
    // Restore the clip path
    glitchCtx.restore()
  }

  // Apply pixel sort glitch effect
  const applyPixelSortGlitch = (glitchCtx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // First copy the game canvas to the glitch canvas
    glitchCtx.clearRect(0, 0, canvas.width, canvas.height)
    glitchCtx.drawImage(canvas, 0, 0)
    
    // Create a clip path to constrain the glitch effects to the canvas bounds
    glitchCtx.save()
    glitchCtx.beginPath()
    glitchCtx.rect(0, 0, canvas.width, canvas.height)
    glitchCtx.clip()

    // Pixel sorting effect
    const numSortRegions = Math.floor(Math.random() * 5) + 3
    for (let r = 0; r < numSortRegions; r++) {
      const sortY = Math.floor(Math.random() * canvas.height)
      const sortHeight = Math.floor(Math.random() * 60) + 20

      const imageData = glitchCtx.getImageData(0, sortY, canvas.width, sortHeight)
      const data = imageData.data

      // Simple pixel sorting by brightness
      for (let y = 0; y < sortHeight; y++) {
        const row = new Array(canvas.width)
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
          row[x] = {
            brightness,
            r: data[i],
            g: data[i + 1],
            b: data[i + 2],
            a: data[i + 3],
          }
        }

        // Sort pixels by brightness
        row.sort((a, b) => a.brightness - b.brightness)

        // Put sorted pixels back
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4
          data[i] = row[x].r
          data[i + 1] = row[x].g
          data[i + 2] = row[x].b
          data[i + 3] = row[x].a
        }
      }

      glitchCtx.putImageData(imageData, 0, sortY)
    }

    // Add some vertical color streaks
    const numStreaks = Math.floor(Math.random() * 15) + 5
    for (let i = 0; i < numStreaks; i++) {
      const streakX = Math.floor(Math.random() * canvas.width)
      const streakWidth = Math.floor(Math.random() * 10) + 2

      glitchCtx.fillStyle = Math.random() < 0.5 ? "#00ffff" : "#ff00ff"
      glitchCtx.fillRect(streakX, 0, streakWidth, canvas.height)
    }

    // RGB shift (diagonal)
    glitchCtx.globalCompositeOperation = "screen"
    glitchCtx.globalAlpha = 0.8
    glitchCtx.drawImage(canvas, Math.random() * 15 - 7, Math.random() * 15 - 7)
    glitchCtx.fillStyle = "rgba(0,255,0,0.3)"
    glitchCtx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Restore the clip path
    glitchCtx.restore()
  }

  // Apply digital blocks glitch effect
  const applyDigitalBlocksGlitch = (glitchCtx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // First copy the game canvas to the glitch canvas
    glitchCtx.clearRect(0, 0, canvas.width, canvas.height)
    glitchCtx.drawImage(canvas, 0, 0)
    
    // Create a clip path to constrain the glitch effects to the canvas bounds
    glitchCtx.save()
    glitchCtx.beginPath()
    glitchCtx.rect(0, 0, canvas.width, canvas.height)
    glitchCtx.clip()

    // Add random blocks of solid color
    const numBlocks = Math.floor(Math.random() * 12) + 8
    for (let i = 0; i < numBlocks; i++) {
      const blockWidth = Math.floor(Math.random() * 120) + 40
      const blockHeight = Math.floor(Math.random() * 100) + 30
      const blockX = Math.floor(Math.random() * (canvas.width - blockWidth))
      const blockY = Math.floor(Math.random() * (canvas.height - blockHeight))

      // Choose a vibrant color from our palette
      const blockColor = Math.floor(Math.random() * 5)
      if (blockColor === 0) {
        glitchCtx.fillStyle = "rgba(255,0,255,0.7)" // Magenta
      } else if (blockColor === 1) {
        glitchCtx.fillStyle = "rgba(0,255,255,0.7)" // Cyan
      } else if (blockColor === 2) {
        glitchCtx.fillStyle = "rgba(0,255,0,0.7)" // Green
      } else if (blockColor === 3) {
        glitchCtx.fillStyle = "rgba(0,102,255,0.7)" // Blue
      } else {
        glitchCtx.fillStyle = "rgba(255,51,153,0.7)" // Pink
      }

      glitchCtx.fillRect(blockX, blockY, blockWidth, blockHeight)
    }

    // Add pixelated regions
    const numPixelRegions = Math.floor(Math.random() * 6) + 3
    for (let i = 0; i < numPixelRegions; i++) {
      const regionX = Math.floor(Math.random() * canvas.width)
      const regionY = Math.floor(Math.random() * canvas.height)
      const regionWidth = Math.min(Math.floor(Math.random() * 150) + 50, canvas.width - regionX)
      const regionHeight = Math.min(Math.floor(Math.random() * 150) + 50, canvas.height - regionY)
      const blockSize = Math.floor(Math.random() * 15) + 5

      const imageData = glitchCtx.getImageData(regionX, regionY, regionWidth, regionHeight)
      const data = imageData.data

      // Pixelate the region
      for (let y = 0; y < regionHeight; y += blockSize) {
        for (let x = 0; x < regionWidth; x += blockSize) {
          // Sample a pixel from this block
          const pixelIndex = (y * regionWidth + x) * 4
          const r = data[pixelIndex]
          const g = data[pixelIndex + 1]
          const b = data[pixelIndex + 2]

          // Apply the sampled color to the entire block
          for (let by = 0; by < blockSize && y + by < regionHeight; by++) {
            for (let bx = 0; bx < blockSize && x + bx < regionWidth; bx++) {
              const blockPixelIndex = ((y + by) * regionWidth + (x + bx)) * 4
              data[blockPixelIndex] = r
              data[blockPixelIndex + 1] = g
              data[blockPixelIndex + 2] = b
            }
          }
        }
      }

      glitchCtx.putImageData(imageData, regionX, regionY)
    }

    // RGB shift (random direction)
    glitchCtx.globalCompositeOperation = "screen"
    glitchCtx.globalAlpha = 0.7
    const shiftX = Math.random() * 20 - 10
    const shiftY = Math.random() * 20 - 10
    glitchCtx.drawImage(canvas, shiftX, shiftY)
    glitchCtx.fillStyle = "rgba(255,0,0,0.3)"
    glitchCtx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Restore the clip path
    glitchCtx.restore()
  }

  // Apply signal loss glitch effect
  const applySignalLossGlitch = (glitchCtx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // First copy the game canvas to the glitch canvas
    glitchCtx.clearRect(0, 0, canvas.width, canvas.height)
    glitchCtx.drawImage(canvas, 0, 0)
    
    // Create a clip path to constrain the glitch effects to the canvas bounds
    glitchCtx.save()
    glitchCtx.beginPath()
    glitchCtx.rect(0, 0, canvas.width, canvas.height)
    glitchCtx.clip()

    // Create a noisy static effect
    const imageData = glitchCtx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // Apply noise to the entire canvas
    for (let i = 0; i < data.length; i += 4) {
      if (Math.random() < 0.3) {
        const noise = Math.random() < 0.5 ? 255 : 0
        data[i] = noise // R
        data[i + 1] = noise // G
        data[i + 2] = noise // B
      }
    }

    glitchCtx.putImageData(imageData, 0, 0)

    // Add horizontal distortion lines
    const numDistortionLines = Math.floor(Math.random() * 20) + 10
    for (let i = 0; i < numDistortionLines; i++) {
      const lineY = Math.floor(Math.random() * canvas.height)
      const lineHeight = Math.floor(Math.random() * 10) + 5
      const lineShift = Math.floor(Math.random() * 100) - 50

      // Get line data
      const lineData = glitchCtx.getImageData(0, lineY, canvas.width, lineHeight)

      // Apply line with shift
      glitchCtx.putImageData(lineData, lineShift, lineY)
    }

    // Add color bars
    const numColorBars = Math.floor(Math.random() * 8) + 4
    for (let i = 0; i < numColorBars; i++) {
      const barY = Math.floor(Math.random() * canvas.height)
      const barHeight = Math.floor(Math.random() * 30) + 10

      // Choose a vibrant color
      const barColor = Math.floor(Math.random() * 5)
      if (barColor === 0) {
        glitchCtx.fillStyle = "rgba(255,0,255,0.6)" // Magenta
      } else if (barColor === 1) {
        glitchCtx.fillStyle = "rgba(0,255,255,0.6)" // Cyan
      } else if (barColor === 2) {
        glitchCtx.fillStyle = "rgba(0,255,0,0.6)" // Green
      } else if (barColor === 3) {
        glitchCtx.fillStyle = "rgba(0,102,255,0.6)" // Blue
      } else {
        glitchCtx.fillStyle = "rgba(255,51,153,0.6)" // Pink
      }

      glitchCtx.fillRect(0, barY, canvas.width, barHeight)
    }

    // Add VHS tracking lines
    const numTrackingLines = Math.floor(Math.random() * 5) + 3
    for (let i = 0; i < numTrackingLines; i++) {
      const trackingY = Math.floor(Math.random() * canvas.height)
      const trackingHeight = Math.floor(Math.random() * 5) + 2

      glitchCtx.fillStyle = "rgba(255,255,255,0.8)"
      glitchCtx.fillRect(0, trackingY, canvas.width, trackingHeight)
    }

    // RGB shift (subtle)
    glitchCtx.globalCompositeOperation = "screen"
    glitchCtx.globalAlpha = 0.5
    glitchCtx.drawImage(canvas, Math.random() * 10 - 5, 0)
    
    // Restore the clip path
    glitchCtx.restore()
  }

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current
    const glitchCanvas = glitchCanvasRef.current
    if (!canvas || !glitchCanvas) return

    const ctx = canvas.getContext("2d")
    const glitchCtx = glitchCanvas.getContext("2d")
    if (!ctx || !glitchCtx) return

    // Fix to ensure canvas dimensions are precisely the same and all drawing operations are contained
    // This prevents glitch effects from extending beyond boundaries
    const width = canvas.width;
    const height = canvas.height;
    glitchCanvas.width = width;
    glitchCanvas.height = height;

    const cellSize = width / GRID_SIZE

    // Clear canvas with dark blue background (more like the reference images)
    ctx.fillStyle = "#0a0a2a"
    ctx.fillRect(0, 0, width, height)

    // Draw grid lines (faint)
    ctx.strokeStyle = "rgba(0, 255, 255, 0.1)"
    ctx.lineWidth = 0.5
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(i * cellSize, 0)
      ctx.lineTo(i * cellSize, height)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, i * cellSize)
      ctx.lineTo(width, i * cellSize)
      ctx.stroke()
    }

    // Draw food with glow effect
    const currentPalette = PALETTES[colorPalette]
    const foodColor = currentPalette[Math.floor(Math.random() * currentPalette.length)]

    ctx.save()
    ctx.shadowColor = foodColor
    ctx.shadowBlur = 15
    ctx.fillStyle = foodColor
    // Draw square food instead of circle
    ctx.fillRect(food.x * cellSize + cellSize * 0.1, food.y * cellSize + cellSize * 0.1, cellSize * 0.8, cellSize * 0.8)
    ctx.restore()

    // Draw snake with gradient effect
    snake.forEach((segment, index) => {
      const segmentColor = currentPalette[index % currentPalette.length]

      ctx.save()
      ctx.shadowColor = segmentColor
      ctx.shadowBlur = 10
      ctx.fillStyle = segmentColor

      // Head is slightly larger
      if (index === 0) {
        // Draw square head
        ctx.fillRect(
          segment.x * cellSize + cellSize * 0.05,
          segment.y * cellSize + cellSize * 0.05,
          cellSize * 0.9,
          cellSize * 0.9,
        )

        // Draw eyes
        ctx.fillStyle = "white"

        // Determine eye positions based on direction
        let eyeOffsetX1, eyeOffsetY1, eyeOffsetX2, eyeOffsetY2

        if (directionRef.current === DIRECTIONS.RIGHT) {
          eyeOffsetX1 = eyeOffsetX2 = cellSize / 3
          eyeOffsetY1 = -cellSize / 4
          eyeOffsetY2 = cellSize / 4
        } else if (directionRef.current === DIRECTIONS.LEFT) {
          eyeOffsetX1 = eyeOffsetX2 = -cellSize / 3
          eyeOffsetY1 = -cellSize / 4
          eyeOffsetY2 = cellSize / 4
        } else if (directionRef.current === DIRECTIONS.UP) {
          eyeOffsetY1 = eyeOffsetY2 = -cellSize / 3
          eyeOffsetX1 = -cellSize / 4
          eyeOffsetX2 = cellSize / 4
        } else {
          eyeOffsetY1 = eyeOffsetY2 = cellSize / 3
          eyeOffsetX1 = -cellSize / 4
          eyeOffsetX2 = cellSize / 4
        }

        // Square eyes
        ctx.fillRect(
          segment.x * cellSize + cellSize / 2 + eyeOffsetX1 - cellSize / 16,
          segment.y * cellSize + cellSize / 2 + eyeOffsetY1 - cellSize / 16,
          cellSize / 8,
          cellSize / 8,
        )

        ctx.fillRect(
          segment.x * cellSize + cellSize / 2 + eyeOffsetX2 - cellSize / 16,
          segment.y * cellSize + cellSize / 2 + eyeOffsetY2 - cellSize / 16,
          cellSize / 8,
          cellSize / 8,
        )
      } else {
        // Body segments as squares
        const segmentGroup = Math.floor(index / 2); // Group segments in pairs (0-1, 2-3, 4-5, etc.)
        const currentSegmentScale = 0.84 - segmentGroup * 0.012; // Calculate size based on group number
        const segmentRenderScale = Math.max(MIN_SNAKE_SEGMENT_SCALE, currentSegmentScale);

        ctx.fillRect(
          segment.x * cellSize + cellSize * (1 - segmentRenderScale) / 2, // Center the segment
          segment.y * cellSize + cellSize * (1 - segmentRenderScale) / 2, // Center the segment
          cellSize * segmentRenderScale,
          cellSize * segmentRenderScale,
        )
      }

      ctx.restore()
    })

    // Draw score
    ctx.save()
    ctx.fillStyle = "#00ffff"
    ctx.font = "bold 20px 'Courier New', Courier, monospace"
    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    ctx.fillText(`SCORE: ${score}`, 10, 10)
    ctx.restore()

    // Draw game over or start screen
    if (gameOver) {
      ctx.save()
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(0, 0, width, height)

      ctx.fillStyle = "#ff00cc" // Change from #ff0000
      ctx.font = "bold 30px 'Courier New', Courier, monospace"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 30)

      ctx.fillStyle = "#33ffff" // Change from #00ff00
      ctx.font = "16px 'Courier New', Courier, monospace"
      ctx.fillText(`SCORE: ${score}`, canvas.width / 2, canvas.height / 2 + 20)

      ctx.fillStyle = "#ffffff"
      ctx.font = "12px 'Courier New', Courier, monospace"
      ctx.fillText("PRESS SPACE TO RESTART", canvas.width / 2, canvas.height / 2 + 60)
      ctx.restore()
    } else if (!gameStarted) {
      ctx.save()
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = "#33ccff" // Change from #00ffff
      ctx.font = "bold 30px 'Courier New', Courier, monospace"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("SNAKE", canvas.width / 2, canvas.height / 2 - 60)

      ctx.fillStyle = "#ff66ff" // Change from #ff00ff
      ctx.font = "bold 20px 'Courier New', Courier, monospace"
      ctx.fillText("GLITCH EDITION", canvas.width / 2, canvas.height / 2 - 20)

      ctx.fillStyle = "#33ccff"
      ctx.font = "bold 16px 'Courier New', Courier, monospace"
      ctx.fillText("CONTROLS:", canvas.width / 2, canvas.height / 2 + 20)

      ctx.fillStyle = "#ff66ff"
      ctx.font = "14px 'Courier New', Courier, monospace"
      ctx.fillText("Arrow keys to move • Space to pause/start", canvas.width / 2, canvas.height / 2 + 45)
      ctx.fillText("Double tap (mobile) to pause", canvas.width / 2, canvas.height / 2 + 65)

      ctx.fillStyle = "#ffffff"
      ctx.font = "12px 'Courier New', Courier, monospace"
      ctx.fillText("PRESS SPACE TO START", canvas.width / 2, canvas.height / 2 + 100)
      ctx.restore()
    } else if (paused) {
      ctx.save()
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = "#ffff00"
      ctx.font = "bold 30px 'Courier New', Courier, monospace"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2)

      ctx.fillStyle = "#ffffff"
      ctx.font = "12px 'Courier New', Courier, monospace"
      ctx.fillText("PRESS SPACE TO CONTINUE", canvas.width / 2, canvas.height / 2 + 40)
      ctx.restore()
    }

    // Apply glitch effects based on the current variation
    if (glitchIntensity > 0) {
      switch (currentGlitchVariation) {
        case "horizontal-bands":
          applyHorizontalBandsGlitch(glitchCtx, canvas)
          break
        case "vertical-streaks":
          applyVerticalStreaksGlitch(glitchCtx, canvas)
          break
        case "pixel-sort":
          applyPixelSortGlitch(glitchCtx, canvas)
          break
        case "digital-blocks":
          applyDigitalBlocksGlitch(glitchCtx, canvas)
          break
        case "signal-loss":
          applySignalLossGlitch(glitchCtx, canvas)
          break
        default:
          applyHorizontalBandsGlitch(glitchCtx, canvas)
      }
    }
  }, [snake, food, gameOver, score, gameStarted, paused, glitchIntensity, colorPalette, currentGlitchVariation])

  // Touch controls for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!gameStarted) {
      if (!audioInitialized) {
        initAudio();
      }
      startGame()
      return
    }

    if (gameOver) {
      startGame()
      return
    }

    const touch = e.touches[0]
    const touchStartX = touch.clientX
    const touchStartY = touch.clientY

    const handleTouchMove = (e: TouchEvent) => {
      if (paused) return

      const touch = e.touches[0]
      const touchEndX = touch.clientX
      const touchEndY = touch.clientY

      const diffX = touchEndX - touchStartX
      const diffY = touchEndY - touchStartY

      let newDirection: { x: number; y: number } | null = null;

      // Determine swipe direction based on which axis had larger movement
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (diffX > 20 && lastMoveDirectionRef.current !== DIRECTIONS.LEFT) {
          newDirection = DIRECTIONS.RIGHT;
        } else if (diffX < -20 && lastMoveDirectionRef.current !== DIRECTIONS.RIGHT) {
          newDirection = DIRECTIONS.LEFT;
        }
      } else {
        // Vertical swipe
        if (diffY > 20 && lastMoveDirectionRef.current !== DIRECTIONS.UP) {
          newDirection = DIRECTIONS.DOWN;
        } else if (diffY < -20 && lastMoveDirectionRef.current !== DIRECTIONS.DOWN) {
          newDirection = DIRECTIONS.UP;
        }
      }

      if (newDirection) {
        directionRef.current = newDirection;
        setDirection(newDirection);
      }

      document.removeEventListener("touchmove", handleTouchMove);
    }

    const handleTouchEnd = () => {
      document.removeEventListener("touchmove", handleTouchMove);
    }

    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("touchend", handleTouchEnd)
  }

  const handleDoubleTap = () => {
    setPaused((prev) => !prev)
  }
  
  // Handle D-pad button press
  const handleDPadPress = (newDirection: { x: number; y: number }) => {
    if (paused || gameOver || !gameStarted) return;
    
    // Check if the new direction is valid (not opposite to the last move)
    if (
      !(newDirection === DIRECTIONS.UP && lastMoveDirectionRef.current === DIRECTIONS.DOWN) &&
      !(newDirection === DIRECTIONS.DOWN && lastMoveDirectionRef.current === DIRECTIONS.UP) &&
      !(newDirection === DIRECTIONS.LEFT && lastMoveDirectionRef.current === DIRECTIONS.RIGHT) &&
      !(newDirection === DIRECTIONS.RIGHT && lastMoveDirectionRef.current === DIRECTIONS.LEFT)
    ) {
      directionRef.current = newDirection;
      setDirection(newDirection);
    }
  };

  // D-pad button component
  const DPadButton = ({ direction, label, icon, onPress, disabled }: DPadButtonProps) => (
    <button
      className={`${styles.dpadButton} ${styles['dpad-' + label.toLowerCase()]}`}
      onClick={() => !disabled && onPress(direction)}
      disabled={disabled}
      aria-label={label}
      type="button"
    >
      {icon}
    </button>
  );

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Game area - the "television" display */}
      <div className="relative touch-none" onTouchStart={handleTouchStart} onDoubleClick={handleDoubleTap}>
        {/* Game canvas */}
        <canvas ref={canvasRef} className={styles.gameCanvas} />

        {/* Digital noise effect and glitch effects in a containing element */}
        <div className={styles.glitchContainer}>
          {/* Glitch overlay canvas */}
          <canvas
            ref={glitchCanvasRef}
            className={styles.glitchCanvas}
            style={{
              display: glitchIntensity > 0 ? "block" : "none",
            }}
          />

          {/* Digital noise overlay */}
          <div className={styles.digitalNoise}></div>
        </div>

        {isMobile && gameStarted && !gameOver && !paused && (
          <div className="absolute bottom-4 left-0 right-0 text-center text-white text-xs opacity-70">
            Use D-pad below • Double tap to pause
          </div>
        )}
      </div>

      {isMobile && !gameStarted && (
        <div className="mt-4 text-center text-white">
          <p>Tap screen to start</p>
        </div>
      )}
      
      {/* Mobile D-pad controls - Now outside the game area, in the black space below */}
      {isMobile && (
        <div className={styles.dpadOuterContainer}>
          <div className={styles.dpadContainer}>
            <div className={styles.dpad}>
              <DPadButton
                direction={DIRECTIONS.UP}
                label="Up"
                icon="▲"
                onPress={handleDPadPress}
                disabled={!gameStarted || gameOver || paused}
              />
              <div className={styles.dpadMiddleRow}>
                <DPadButton
                  direction={DIRECTIONS.LEFT}
                  label="Left"
                  icon="◀"
                  onPress={handleDPadPress}
                  disabled={!gameStarted || gameOver || paused}
                />
                <div className={styles.dpadCenter}></div>
                <DPadButton
                  direction={DIRECTIONS.RIGHT}
                  label="Right"
                  icon="▶"
                  onPress={handleDPadPress}
                  disabled={!gameStarted || gameOver || paused}
                />
              </div>
              <DPadButton
                direction={DIRECTIONS.DOWN}
                label="Down"
                icon="▼"
                onPress={handleDPadPress}
                disabled={!gameStarted || gameOver || paused}
              />
            </div>
            {!gameStarted && (
              <button
                className={styles.startButton}
                onClick={startGame}
                type="button"
              >
                START
              </button>
            )}
            {gameStarted && !gameOver && (
              <button
                className={styles.pauseButton}
                onClick={() => setPaused(prev => !prev)}
                type="button"
              >
                {paused ? 'RESUME' : 'PAUSE'}
              </button>
            )}
            {gameOver && (
              <button
                className={styles.restartButton}
                onClick={startGame}
                type="button"
              >
                RESTART
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
