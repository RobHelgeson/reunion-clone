class ReunionGame {
    constructor() {
        this.gridSize = { rows: 7, cols: 5 };
        this.holes = [
            { r: 1, c: 1 }, { r: 1, c: 3 },
            { r: 3, c: 1 }, { r: 3, c: 3 },
            { r: 5, c: 1 }, { r: 5, c: 3 }
        ];
        this.startPositions = {
            fox: { r: 0, c: 2 },
            hedgehog: { r: 6, c: 2 }
        };

        this.solutionGrid = null;
        this.tiles = [];
        this.moves = 0;
        this.draggedTile = null;

        this.puzzleGenerator = new PuzzleGenerator();
        this.inputHandler = new InputHandler(this);
        this.soundManager = new SoundManager();
        this.correctTiles = new Set(); // Track which tiles are currently correct
        this.completedWords = new Set(); // Track which words are fully complete

        this.init();
    }

    async init() {
        await this.puzzleGenerator.init();

        // Try to load saved state, otherwise generate new puzzle
        const loaded = this.loadState();
        if (!loaded) {
            this.setupBoard();
            await this.loadLevel();
        }

        this.inputHandler.setupDragAndDrop(document.getElementById('game-board'));
        this.setupUIEventListeners();
        document.getElementById('loading-overlay').classList.add('hidden');
    }

    setupBoard() {
        const board = document.getElementById('game-board');
        board.style.gridTemplateColumns = `repeat(${this.gridSize.cols}, var(--tile-size))`;
        board.style.gridTemplateRows = `repeat(${this.gridSize.rows}, var(--tile-size))`;

        board.innerHTML = '';

        for (let r = 0; r < this.gridSize.rows; r++) {
            for (let c = 0; c < this.gridSize.cols; c++) {
                const slot = document.createElement('div');
                slot.className = 'tile-slot';
                slot.dataset.r = r;
                slot.dataset.c = c;

                if (this.isHole(r, c)) {
                    slot.classList.add('hole');
                }

                board.appendChild(slot);
            }
        }
    }

    isHole(r, c) {
        return this.holes.some(h => h.r === r && h.c === c);
    }

    async loadLevel() {
        this.tiles = [];

        // Try to generate a puzzle
        let grid = null;
        let attempts = 0;
        while (!grid && attempts < 10) {
            grid = await this.puzzleGenerator.generateAdvancedPuzzle();
            attempts++;
        }

        if (!grid) {
            console.error("Failed to generate advanced puzzle.");
            alert("Failed to generate a valid puzzle. Please try again.");
            return;
        }

        this.solutionGrid = grid;

        // Clear any saved state when starting a new puzzle
        this.clearState();

        // Now that solutionGrid is set, create tiles
        const availableSlots = [];

        for (let r = 0; r < this.gridSize.rows; r++) {
            for (let c = 0; c < this.gridSize.cols; c++) {
                const char = this.solutionGrid[r][c];
                if (char) {
                    let type = 'letter';
                    let id = `tile-${r}-${c}`;

                    if (char === '🦊') {
                        type = 'animal';
                        id = 'fox';
                    } else if (char === '🦔') {
                        type = 'animal';
                        id = 'hedgehog';
                    }

                    this.tiles.push({
                        id,
                        char,
                        type,
                        r: -1,
                        c: -1,
                        targetR: r,
                        targetC: c,
                        isAnimal: type === 'animal'
                    });
                }

                if (!this.isHole(r, c)) {
                    availableSlots.push({ r, c });
                }
            }
        }

        // Place animals at start positions
        const fox = this.tiles.find(t => t.id === 'fox');
        const hedgehog = this.tiles.find(t => t.id === 'hedgehog');

        if (fox) {
            fox.r = this.startPositions.fox.r;
            fox.c = this.startPositions.fox.c;
            this.removeSlot(availableSlots, fox.r, fox.c);
        }
        if (hedgehog) {
            hedgehog.r = this.startPositions.hedgehog.r;
            hedgehog.c = this.startPositions.hedgehog.c;
            this.removeSlot(availableSlots, hedgehog.r, hedgehog.c);
        }

        // Select 5 random letters to be correct at start
        const letters = this.tiles.filter(t => !t.isAnimal);

        // Filter letters whose target positions are NOT occupied by animals
        const validCandidates = letters.filter(l => {
            const blockedByFox = (fox && l.targetR === fox.r && l.targetC === fox.c);
            const blockedByHedgehog = (hedgehog && l.targetR === hedgehog.r && l.targetC === hedgehog.c);
            return !blockedByFox && !blockedByHedgehog;
        });

        // Shuffle candidates to pick random ones
        this.puzzleGenerator.shuffle(validCandidates);
        const fixedLetters = validCandidates.slice(0, 5);
        const fixedIds = new Set(fixedLetters.map(t => t.id));

        // Place fixed letters
        fixedLetters.forEach(tile => {
            tile.r = tile.targetR;
            tile.c = tile.targetC;
            this.removeSlot(availableSlots, tile.r, tile.c);
        });

        // Scramble remaining tiles
        const remainingLetters = letters.filter(t => !fixedIds.has(t.id));
        this.puzzleGenerator.shuffle(availableSlots);

        remainingLetters.forEach((tile, index) => {
            if (index < availableSlots.length) {
                tile.r = availableSlots[index].r;
                tile.c = availableSlots[index].c;
            }
        });

        this.moves = 0;
        document.getElementById('nav-results').classList.add('disabled');
        this.updateUI();
        this.render(true); // Silent during initial load

        // Save the initial puzzle state
        this.saveState();
    }

    removeSlot(slots, r, c) {
        const idx = slots.findIndex(s => s.r === r && s.c === c);
        if (idx !== -1) slots.splice(idx, 1);
    }

    render(silent = false) {
        const board = document.getElementById('game-board');
        const existingTiles = document.querySelectorAll('.tile');
        existingTiles.forEach(t => t.remove());

        this.tiles.forEach(tile => {
            const el = document.createElement('div');
            el.className = `tile ${tile.type}`;
            if (tile.id === 'fox') el.classList.add('fox');
            if (tile.id === 'hedgehog') el.classList.add('hedgehog');

            el.textContent = tile.char;
            el.dataset.id = tile.id;

            this.updateTilePosition(el, tile.r, tile.c);

            el.draggable = true;

            board.appendChild(el);
        });

        this.updateColors(silent);
    }

    updateTilePosition(el, r, c) {
        // Read CSS custom properties to handle responsive sizing
        const styles = getComputedStyle(document.documentElement);
        const size = parseInt(styles.getPropertyValue('--tile-size'));
        const gap = parseInt(styles.getPropertyValue('--gap'));
        const x = c * (size + gap) + gap;
        const y = r * (size + gap) + gap;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
    }

    setupUIEventListeners() {
        document.getElementById('reset-btn').addEventListener('click', () => {
            if(confirm('Start a new puzzle?')) {
                this.loadLevel();
                this.hideResults();
            }
        });

        document.getElementById('help-btn').addEventListener('click', () => {
            document.getElementById('modal-overlay').classList.remove('hidden');
        });

        document.getElementById('modal-close').addEventListener('click', () => {
            document.getElementById('modal-overlay').classList.add('hidden');
        });

        // Settings
        document.getElementById('settings-btn').addEventListener('click', () => {
            document.getElementById('settings-overlay').classList.remove('hidden');
            // Update toggle state
            document.getElementById('sound-toggle').checked = this.soundManager.isEnabled();
        });

        document.getElementById('settings-close').addEventListener('click', () => {
            document.getElementById('settings-overlay').classList.add('hidden');
        });

        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            this.soundManager.toggle();
            // Play a test sound when enabling
            if (e.target.checked) {
                this.soundManager.playTileMove();
            }
        });

        // Navigation
        document.getElementById('nav-puzzle').addEventListener('click', () => {
            this.scrollToSection('puzzle-section');
            this.updateNav('nav-puzzle');
        });

        document.getElementById('nav-results').addEventListener('click', () => {
            this.showResults(false); // Show stats, false = not a new win
            this.scrollToSection('results-section');
            this.updateNav('nav-results');
        });

        document.getElementById('next-puzzle-btn').addEventListener('click', () => {
            this.loadLevel();
            this.hideResults();
            this.scrollToSection('puzzle-section');
            this.updateNav('nav-puzzle');
        });
    }

    attemptMove(tile, targetR, targetC) {
        // If invalid target or same position, ignore
        if (targetR === undefined || targetC === undefined) {
            this.soundManager.playError();
            return;
        }
        if (tile.r === targetR && tile.c === targetC) return;

        // Check if hole
        if (this.isHole(targetR, targetC)) {
            this.soundManager.playError();
            return;
        }

        const occupant = this.tiles.find(t => t.r === targetR && t.c === targetC);

        if (occupant) {
            // Check if occupant is a correct letter (locked)
            const occupantEl = document.querySelector(`.tile[data-id="${occupant.id}"]`);
            if (occupantEl && occupantEl.classList.contains('correct')) {
                this.soundManager.playError();
                return;
            }

            // Swap
            occupant.r = tile.r;
            occupant.c = tile.c;
        }

        // Move dragged tile
        tile.r = targetR;
        tile.c = targetC;

        this.moves++;
        this.soundManager.playTileMove();
        this.updateUI();

        // Check if this move wins the game
        const isWinningMove = GameRules.checkWin(this.tiles, this.solutionGrid);

        // Render without word complete sound if winning (win sound will play instead)
        this.render(isWinningMove);

        if (isWinningMove) {
            document.getElementById('nav-results').classList.remove('disabled');
            this.handleWin();
        }

        // Save state after every move
        this.saveState();
    }

    updateUI() {
        document.getElementById('move-count').textContent = this.moves;
    }

    updateColors(silent = false) {
        // Track which tiles were already correct BEFORE this update
        const previouslyCorrect = new Set(this.correctTiles);
        const previouslyCompleteWords = new Set(this.completedWords);

        // Clear the current sets
        this.correctTiles.clear();
        this.completedWords.clear();

        // Reset classes
        document.querySelectorAll('.tile').forEach(el => {
            el.classList.remove('correct', 'present');
        });

        const { greens, yellows } = GameRules.calculateColors(this.tiles, this.solutionGrid, this.gridSize);

        // Track newly green tiles for sound effect
        let hasNewGreens = false;

        greens.forEach(id => {
            const el = document.querySelector(`.tile[data-id="${id}"]`);
            if(el) {
                // Add to current correct set
                this.correctTiles.add(id);

                // Check if this is newly green (wasn't in the previous set)
                if (!previouslyCorrect.has(id)) {
                    hasNewGreens = true;
                }
                el.classList.add('correct');
            }
        });

        yellows.forEach(id => {
            const el = document.querySelector(`.tile[data-id="${id}"]`);
            if (el && !el.classList.contains('correct')) {
                el.classList.add('present');
            }
        });

        // Check for complete words
        const checkWordComplete = (positions, wordId) => {
            const allCorrect = positions.every(([r, c]) => {
                const solutionChar = this.solutionGrid[r][c];
                const tile = this.tiles.find(t => t.r === r && t.c === c);

                // If solution expects an animal at this position, check if the correct animal is there
                if (solutionChar === '🦊' || solutionChar === '🦔') {
                    return tile && tile.char === solutionChar;
                }

                // For letter positions: must have a non-animal tile with correct letter
                if (!tile || tile.isAnimal) return false;
                return tile.char === solutionChar;
            });
            if (allCorrect) {
                this.completedWords.add(wordId);
            }
        };

        // Check horizontal words (rows 0, 2, 4, 6)
        const wordRows = [0, 2, 4, 6];
        wordRows.forEach(r => {
            const positions = [];
            for (let c = 0; c < this.gridSize.cols; c++) {
                positions.push([r, c]);
            }
            checkWordComplete(positions, `row-${r}`);
        });

        // Check vertical words (columns 0, 2, 4)
        const wordCols = [0, 2, 4];
        wordCols.forEach(c => {
            const positions = [];
            for (let r = 0; r < this.gridSize.rows; r++) {
                positions.push([r, c]);
            }
            checkWordComplete(positions, `col-${c}`);
        });

        // Play sounds (but not during silent renders)
        if (!silent) {
            // Check if any new words were completed
            let hasNewCompleteWords = false;
            this.completedWords.forEach(wordId => {
                if (!previouslyCompleteWords.has(wordId)) {
                    hasNewCompleteWords = true;
                }
            });

            if (hasNewCompleteWords) {
                // Play word complete sound (takes priority over individual letter sound)
                this.soundManager.playWordComplete();
            } else if (hasNewGreens) {
                // Play sound for new correct letters
                this.soundManager.playCorrect();
            }
        }
    }



    handleWin() {
        // Play win sound
        this.soundManager.playWin();

        // Save stats
        GameRules.saveStats(this.moves, true);

        // Show results
        this.showResults(true);
    }

    showResults(isWin) {
        const resultsSection = document.getElementById('results-section');
        resultsSection.classList.remove('hidden');
        const stats = GameRules.getStats();

        const starsEl = document.getElementById('result-stars');
        const movesEl = document.getElementById('result-moves');

        const stars = isWin ? GameRules.calculateStars(this.moves) : 0;
        let starHtml = '';
        for(let i=0; i<3; i++) {
            if (i < stars) starHtml += '<span class="filled">★</span>';
            else starHtml += '<span>★</span>';
        }
        starsEl.innerHTML = starHtml;

        // Update Moves (YOU)
        movesEl.textContent = isWin ? this.moves : '-';

        // Update Stats
        document.getElementById('stat-solved').textContent = stats.solved;
        const avg = stats.solved > 0 ? (stats.totalMoves / stats.solved).toFixed(1) : "0.0";
        document.getElementById('stat-avg-moves').textContent = avg;
        document.getElementById('stat-streak').textContent = stats.streak || 0;

        // Scroll to results
        setTimeout(() => {
            this.scrollToSection('results-section');
            this.updateNav('nav-results');
        }, 500);
    }

    hideResults() {
        document.getElementById('results-section').classList.add('hidden');
    }

    scrollToSection(id) {
        document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
    }

    updateNav(activeId) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        document.getElementById(activeId).classList.add('active');
    }

    saveState() {
        const state = {
            solutionGrid: this.solutionGrid,
            tiles: this.tiles.map(t => ({
                id: t.id,
                char: t.char,
                type: t.type,
                r: t.r,
                c: t.c,
                targetR: t.targetR,
                targetC: t.targetC,
                isAnimal: t.isAnimal
            })),
            moves: this.moves
        };
        localStorage.setItem('reunion_current_puzzle', JSON.stringify(state));
    }

    loadState() {
        const saved = localStorage.getItem('reunion_current_puzzle');
        if (!saved) return false;

        try {
            const state = JSON.parse(saved);
            this.solutionGrid = state.solutionGrid;
            this.tiles = state.tiles;
            this.moves = state.moves;

            // Setup board DOM elements first
            this.setupBoard();

            // Update UI and render
            this.updateUI();
            this.render(true); // Silent when loading saved state

            // Check if puzzle was already solved
            if (GameRules.checkWin(this.tiles, this.solutionGrid)) {
                document.getElementById('nav-results').classList.remove('disabled');
            }

            return true;
        } catch (e) {
            console.error('Failed to load saved state:', e);
            return false;
        }
    }

    clearState() {
        localStorage.removeItem('reunion_current_puzzle');
    }
}

// Start game
window.addEventListener('DOMContentLoaded', () => {
    new ReunionGame();
});
