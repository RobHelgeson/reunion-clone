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

        this.init();
    }

    async init() {
        this.setupBoard();
        await this.puzzleGenerator.init();
        await this.loadLevel();
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
        this.render();
    }

    removeSlot(slots, r, c) {
        const idx = slots.findIndex(s => s.r === r && s.c === c);
        if (idx !== -1) slots.splice(idx, 1);
    }

    render() {
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

        this.updateColors();
    }

    updateTilePosition(el, r, c) {
        const gap = 8;
        const size = 60;
        const x = c * (size + gap) + gap;
        const y = r * (size + gap) + gap;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.transform = 'none'; // Clear any previous transform
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
        if (targetR === undefined || targetC === undefined) return;
        if (tile.r === targetR && tile.c === targetC) return;

        // Check if hole
        if (this.isHole(targetR, targetC)) return;

        const occupant = this.tiles.find(t => t.r === targetR && t.c === targetC);

        if (occupant) {
            // Check if occupant is a correct letter (locked)
            const occupantEl = document.querySelector(`.tile[data-id="${occupant.id}"]`);
            if (occupantEl && occupantEl.classList.contains('correct')) {
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
        this.updateUI();
        this.render();
        this.checkWin();
    }

    updateUI() {
        document.getElementById('move-count').textContent = this.moves;
    }

    updateColors() {
        // Reset classes
        document.querySelectorAll('.tile').forEach(el => {
            el.classList.remove('correct', 'present');
        });

        const { greens, yellows } = GameRules.calculateColors(this.tiles, this.solutionGrid, this.gridSize);

        greens.forEach(id => {
            const el = document.querySelector(`.tile[data-id="${id}"]`);
            if(el) el.classList.add('correct');
        });

        yellows.forEach(id => {
            const el = document.querySelector(`.tile[data-id="${id}"]`);
            if (el && !el.classList.contains('correct')) {
                el.classList.add('present');
            }
        });
    }

    checkWin() {
        if (GameRules.checkWin(this.tiles, this.solutionGrid)) {
            document.getElementById('nav-results').classList.remove('disabled');
            this.handleWin();
        }
    }

    handleWin() {
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
}

// Start game
window.addEventListener('DOMContentLoaded', () => {
    new ReunionGame();
});
