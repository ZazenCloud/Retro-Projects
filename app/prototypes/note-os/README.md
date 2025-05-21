# NoteOS Prototype

NoteOS reimagines digital note-taking through the lens of classic operating system interfaces and Cyberpunk aesthetics. It provides a flexible window-based organization system allowing users to create and arrange multiple notes and drawings spatially.

## Features

### 1. Window Management System
- **Draggable Windows**: Click and drag window headers to reposition them
- **Resizable Windows**: Drag the handle in the bottom-right corner to resize windows
- **Window Controls**: Close and minimize buttons in each window header
- **Z-index Management**: Clicking a window brings it to the front
- **Persistence**: Windows remember their position, size, and content between sessions (via localStorage)

### 2. Text Notes
- **Rich Text Editing**: Format text with bold, italic, underline, headings, and lists
- **Auto-save**: All changes are automatically saved
- **Copy/Paste**: Full support for copying and pasting content

### 3. Drawing Canvas
- **Freehand Drawing**: Draw with customizable color and stroke width
- **Undo/Redo**: Full undo and redo functionality for all drawing actions
- **Export**: Export your drawings as PNG files
- **Auto-save**: Drawings are automatically saved with the note

### 4. Audio Recording
- **Voice Recording**: Record audio directly within the application
- **Playback Controls**: Play, pause, and seek through recordings
- **Delete Recordings**: Remove unwanted audio recordings
- **Auto-save**: Audio recordings are automatically saved with the note

## Technology Stack
- **Next.js**: React framework for the frontend
- **TypeScript**: For type-safe components and logic
- **CSS Modules**: For component-scoped styling
- **HTML5 Canvas API**: For the drawing functionality
- **Web Audio API**: For audio recording and playback

## How to Use

1. **Create a New Note**: 
   - Click "New Note" in the navbar to create a text note
   - Use the formatting buttons to style your text

2. **Create a Drawing**:
   - Click "New Drawing" in the navbar to create a drawing canvas
   - Use the color picker and stroke width slider to customize your drawing tool
   - Draw on the canvas by clicking and dragging
   - Use the undo/redo buttons to correct mistakes
   - Click "Export" to save your drawing as a PNG file

3. **Record Audio**:
   - Click "New Audio" in the navbar to create an audio recorder
   - Click "Record" to start recording
   - Click "Stop" to end the recording
   - Use the audio player controls to play back your recording
   - Click the red trash button to delete the recording

4. **Window Management**:
   - Drag windows by their headers to reposition them
   - Resize windows using the handle in the bottom-right corner
   - Click on a window to bring it to the front
   - Click the X button to close a window