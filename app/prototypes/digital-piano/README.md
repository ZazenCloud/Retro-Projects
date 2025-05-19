# Digital Piano Prototype

A classic MacOS-styled digital piano that you can play with your mouse or keyboard, using the WebAudio API.
Inspired by the "Mac Piano" concept, this version focuses on a clean interface with a separate settings window.

## Features

- Play piano notes with mouse clicks or keyboard (two octaves mapped).
- Selectable waveform sounds (sine, square, triangle, sawtooth) via a separate "Tune" window.
- Classic MacOS interface styling for both piano and settings windows.
- Real-time sound synthesis using WebAudio API with fixed gain to prevent clipping.
- Press `ESC` to stop all currently playing sounds (panic function).

## How to Use

1.  **Playing Notes:**
    *   Click on piano keys with your mouse.
    *   Use your keyboard:
        *   Keys `A, S, D, F, G, H, J`: White keys of the lower octave (C3 to B3).
        *   Keys `W, E, T, Y, U`: Black keys of the lower octave (C#3, D#3, F#3, G#3, A#3).
        *   Keys `K, L, ;, '`: White keys of the higher octave (C4 to F4).
        *   Keys `O, P`: Black keys of the higher octave (C#4, D#4).

2.  **Changing Sound Waveform:**
    *   Click the "Tune..." button located in the top left area of the piano window content.
    *   A "Tune" window will appear.
    *   Use the dropdown in the "Tune" window to select your desired sound wave (Sine, Square, Sawtooth, Triangle).
    *   Close the "Tune" window by clicking its red close button.

3.  **Emergency Stop (Panic):**
    *   If notes get stuck or you want to stop all sound immediately, press the `ESC` key on your keyboard.

## Technical Details

- This piano uses the Web Audio API to generate sounds in real-time.
- Notes are converted to frequencies using the equal-tempered scale formula.
- A fixed maximum gain (`MAX_GAIN_OUTPUT = 0.2`) is applied to oscillators to prevent audio clipping, especially when multiple notes are played.
- Attack and release envelopes are used for smoother note transitions.
- The keyboard layout is designed for two octaves of playability. 