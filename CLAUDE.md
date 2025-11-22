# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Reunion is a crossword-style word puzzle game where players drag letter tiles to form valid words and reunite two animals (fox and hedgehog). Built with pure vanilla JavaScript, no build tools or dependencies required.

## Running the Game

Open [index.html](index.html) directly in a web browser. No local server or build step needed.

## Architecture

### Core Classes

- **ReunionGame** ([script.js](script.js)) - Main game controller
  - Manages game state (tiles, moves, solution grid)
  - Coordinates between all other components
  - Handles game lifecycle (init, load, save, win conditions)
  - Uses localStorage for state persistence

- **PuzzleGenerator** ([puzzle_generator.js](puzzle_generator.js)) - Puzzle generation
  - Loads Scrabble dictionary from GitHub on init
  - Generates valid puzzles using backtracking algorithm
  - Organizes words by length (3-7 letters) in Map for efficient lookup
  - Places animals (fox/hedgehog) and solves grid constraints

- **GameRules** ([game_rules.js](game_rules.js)) - Static utility class
  - Win condition logic: all tiles correct + animals adjacent/diagonal
  - Color calculation (green/yellow tiles using letter budget system)
  - Stats tracking (moves, streak, solved count)
  - Word completion detection

- **InputHandler** ([input_handler.js](input_handler.js)) - Drag-and-drop
  - Handles both mouse (dragstart/drop) and touch events
  - Prevents dragging locked (correct) tiles
  - Calculates drop targets (tiles or slots)

- **SoundManager** ([sound_manager.js](sound_manager.js)) - Audio
  - Web Audio API for sound generation (no external files)
  - Distinct sounds for: tile move, correct letter, word complete, win, error
  - User preference saved to localStorage

### Game Grid Structure

- 7 rows × 5 columns
- 6 fixed "holes" at positions (1,1), (1,3), (3,1), (3,3), (5,1), (5,3)
- Animals start at (0,2) and (6,2)
- Forms 4 horizontal words (rows 0, 2, 4, 6) and 3 vertical words (columns 0, 2, 4)

### Color Feedback System

Tiles receive color feedback similar to Wordle:
- **Green** = correct letter in correct position
- **Yellow** = letter exists in that row OR column, but wrong position
- Uses letter budget system to avoid over-marking duplicates

### State Management

- **Current puzzle state** saved to `reunion_current_puzzle` in localStorage
  - Includes: solutionGrid, tiles array, move count
  - Automatically restored on page load
- **Statistics** saved to `reunion_stats`: solved count, total moves, streak
- **Sound preference** saved to `soundEnabled`

## Code Style Notes

- Pure vanilla JavaScript (ES6 classes)
- No build process, bundlers, or transpilation
- CSS custom properties for responsive tile sizing
- Web Audio API for runtime sound generation
