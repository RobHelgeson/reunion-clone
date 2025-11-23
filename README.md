# 🦊 Reunion Clone 🦔

A delightful crossword-style word puzzle game where you reunite two adorable animals by solving interconnected words. Built with pure vanilla JavaScript—no build tools, no dependencies, just good old-fashioned web development!

**🎮 [Play it now!](https://robhelgeson.github.io/reunion-clone/)**

Or download and open `index.html` locally in your browser—no server required!

## 🎮 About

This project is a loving recreation of [Merriam-Webster's Reunion game](https://www.merriam-webster.com/games/reunion), built as an experiment to explore modern AI-assisted development workflows. We used **Google's Gemini Pro 3** and the new **Antigravity IDE** to develop this game, pushing the boundaries of what's possible with AI pair programming.

### Inspiration

The original Reunion game by Merriam-Webster combines the best parts of crossword puzzles and Wordle-style feedback. We loved the concept so much that we wanted to recreate it from scratch, adding our own touches along the way.

## ✨ Features

### Core Gameplay
- **Drag-and-Drop Interface** - Smooth, intuitive tile movement with support for both mouse and touch events
- **Smart Color Feedback** - Wordle-style green/yellow system to guide your solving:
  - 🟩 **Green**: Correct letter in the correct position
  - 🟨 **Yellow**: Letter belongs in that row OR column, but wrong spot
- **Animal Reunion** - Guide the fox and hedgehog together by solving all the words
- **Dynamic Puzzle Generation** - Every puzzle is procedurally generated using a comprehensive Scrabble dictionary
- **Win Detection** - All tiles must be correct AND animals must be adjacent/diagonal

### Quality of Life
- **Auto-Save** - Your progress is saved automatically to localStorage after every move
- **Statistics Tracking** - Keep track of your performance:
  - Average moves per puzzle
  - Total puzzles solved
  - Current winning streak
- **Star Rating System** - Earn 1-3 stars based on move efficiency:
  - ⭐⭐⭐ Under 20 moves
  - ⭐⭐ Under 30 moves
  - ⭐ 30+ moves
- **Share Results** - Share your victory with friends

### Customization
- **Dark Mode** - Switch between classic green/yellow and stylish blue/purple/red color schemes
- **Sound Effects** - Procedurally generated audio feedback using Web Audio API:
  - Tile movement sounds
  - Correct letter placement
  - Word completion fanfare
  - Victory celebration
  - Error feedback
- **Reset Stats** - Start fresh whenever you want

### Polish
- **Responsive Design** - Scales beautifully from mobile to desktop
- **No External Dependencies** - Runs entirely in the browser, no server needed
- **Fast Load Times** - Minimal footprint, maximum fun
- **Smooth Animations** - CSS transitions for a polished feel

## 🏗️ Code Structure

This project is organized into clean, modular classes that each handle a specific responsibility:

### Core Classes

#### **`ReunionGame`** ([script.js](script.js))
The main game controller and orchestrator.
- Manages game state (tiles, moves, solution grid)
- Coordinates between all other components
- Handles game lifecycle (init, load, save, win conditions)
- Uses localStorage for state persistence
- Implements dark mode theming

**Key Methods:**
- `init()` - Loads dictionary and initializes game
- `loadLevel()` - Generates a new puzzle
- `attemptMove()` - Handles tile placement logic
- `updateColors()` - Applies color feedback to tiles
- `handleWin()` - Triggers win sequence and saves stats

#### **`PuzzleGenerator`** ([puzzle_generator.js](puzzle_generator.js))
Procedural puzzle generation engine.
- Loads 80,000+ word Scrabble dictionary from GitHub on init
- Organizes words by length (3-7 letters) in Map for efficient lookup
- Uses backtracking algorithm to generate valid puzzle grids
- Places animals (fox/hedgehog) and validates grid constraints
- Ensures all horizontal and vertical words are valid

**Algorithm Highlights:**
- Smart word selection with backtracking
- Conflict resolution for intersecting words
- Validation of all word combinations

#### **`GameRules`** ([game_rules.js](game_rules.js))
Static utility class for game logic.
- **Win Condition Logic**: All tiles correct + animals adjacent/diagonal
- **Color Calculation**: Green/yellow tiles using letter budget system (similar to Wordle)
- **Stats Tracking**: Moves, streak, solved count
- **Word Completion Detection**: Checks if entire rows/columns are solved

**Key Methods:**
- `checkWin(tiles, solutionGrid)` - Validates victory conditions
- `calculateColors(tiles, solutionGrid)` - Wordle-style feedback system
- `calculateStars(moves)` - Star rating based on efficiency
- `saveStats()` / `getStats()` - Persistent statistics

#### **`InputHandler`** ([input_handler.js](input_handler.js))
Drag-and-drop interaction manager.
- Handles both mouse events (dragstart/drop) and touch events
- Prevents dragging locked (correct) tiles
- Calculates drop targets (tiles or slots)
- Custom drag image for better UX
- Smart swap logic when dropping on occupied tiles

#### **`SoundManager`** ([sound_manager.js](sound_manager.js))
Procedural audio generation.
- Uses Web Audio API for sound generation (no external audio files!)
- Distinct sounds for different game events:
  - `playTileMove()` - Subtle movement feedback
  - `playCorrect()` - Single letter correct
  - `playWordComplete()` - Entire word solved
  - `playWin()` - Victory fanfare
  - `playError()` - Invalid move
- User preference saved to localStorage

### Game Grid Structure

The puzzle uses a carefully designed 7×5 grid:
- **7 rows × 5 columns**
- **6 fixed "holes"** at positions (1,1), (1,3), (3,1), (3,3), (5,1), (5,3)
- **Animal start positions**: Fox at (0,2), Hedgehog at (6,2)
- **Word configuration**:
  - 4 horizontal words (rows 0, 2, 4, 6)
  - 3 vertical words (columns 0, 2, 4)

This creates an elegant crossword-style grid where animals and holes break up the words naturally.

### State Management

All game state is persisted to localStorage for seamless resume:

- **`reunion_current_puzzle`** - Current puzzle state
  - Solution grid
  - Tile positions
  - Move count
  - Automatically restored on page load

- **`reunion_stats`** - Player statistics
  - Solved count
  - Total moves across all games
  - Current winning streak

- **`reunion_dark_mode`** - Theme preference

- **`soundEnabled`** - Audio preference

## 🛠️ Technology Stack

- **Pure Vanilla JavaScript** (ES6 classes)
- **CSS Custom Properties** for responsive design
- **Web Audio API** for runtime sound generation
- **LocalStorage API** for persistence
- **No build process, bundlers, or transpilation**
- **No external dependencies or frameworks**

## 🚀 Getting Started

1. Clone this repository
2. Open `index.html` in your favorite modern browser
3. Start solving puzzles!

That's it. No `npm install`, no build step, no configuration. Just pure web development.

## 🎯 Game Rules

1. **Drag letters** to form valid words in every row and column
2. **Green tiles** mean the letter is correct and in the right position (these become locked)
3. **Yellow tiles** mean the letter belongs somewhere in that row OR column
4. **Animals and holes** act as word breakers in the grid
5. **Win condition**: Solve all words AND move the fox and hedgehog next to each other (adjacent or diagonal)

## 🎨 Code Style

This project follows clean, readable JavaScript practices:
- Pure vanilla JavaScript (no frameworks)
- Class-based architecture for clear separation of concerns
- Minimal comments (code should be self-documenting)
- No build tooling - what you see is what runs
- CSS custom properties for maintainable styling
- Progressive enhancement approach

## 📝 Development Notes

This project was built as an experiment in AI-assisted development using **Gemini Pro 3** and the **Antigravity IDE**. The vibe was fairly casual and exploratory—we didn't obsess over perfection but instead focused on making rapid progress and getting to a working game quickly.

The result? We went from concept to a fully playable game with sound effects, dark mode, statistics, and smooth gameplay in record time. It's a testament to what's possible when you embrace the "move fast and build things" mentality with modern AI tools.

Key learnings:
- AI pair programming can dramatically accelerate development velocity
- Sometimes "good enough" is actually great—shipped beats perfect
- Rapid iteration leads to a finished product faster than meticulous planning
- Vanilla JavaScript remains powerful and elegant for straightforward projects
- The best way to learn new tools (like Gemini Pro 3 & Antigravity) is to just build something

## 🤝 Contributing

Feel free to fork this project and make it your own! Some ideas for enhancements:
- Daily puzzle mode with shareable results
- Difficulty levels (different grid sizes)
- Hint system
- Multiplayer/competitive mode
- Additional themes and customization
- Accessibility improvements

## 📄 License

This is a learning project inspired by Merriam-Webster's Reunion. Built for educational purposes and as an exploration of AI-assisted development.

## 🙏 Credits

- Original game concept: [Merriam-Webster's Reunion](https://www.merriam-webster.com/games/reunion)
- Dictionary source: [Scrabble word list](https://raw.githubusercontent.com/redbo/scrabble/master/dictionary.txt)
- Built with: Google Gemini Pro 3 & Antigravity IDE
- Font: [Outfit](https://fonts.google.com/specimen/Outfit) by Google Fonts

---

Made with ❤️ and a lot of AI assistance. Now go reunite those animals! 🦊🦔
