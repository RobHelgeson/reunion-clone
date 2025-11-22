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

        this.init();
    }

    async init() {
        this.setupBoard();
        await this.loadDictionary();
        await this.loadLevel();
        this.setupEventListeners();
        document.getElementById('loading-overlay').classList.add('hidden');
    }

    async loadDictionary() {
        try {
            const response = await fetch('https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt');
            const text = await response.text();
            const words = text.split('\n').map(w => w.trim().toUpperCase()).filter(w => w.length >= 3 && w.length <= 7);

            // Organize by length
            this.wordMap = new Map();
            words.forEach(w => {
                if (!this.wordMap.has(w.length)) this.wordMap.set(w.length, []);
                this.wordMap.get(w.length).push(w);
            });



            console.log("Dictionary loaded:", words.length + " words");
        } catch (e) {
            console.error("Failed to load online dictionary.", e);
            this.wordMap = new Map();
            alert("Failed to load dictionary. Please check your internet connection.");
        }
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
        let success = false;
        let attempts = 0;
        while (!success && attempts < 10) {
            success = await this.generateAdvancedPuzzle();
            attempts++;
        }

        if (!success) {
            console.error("Failed to generate advanced puzzle.");
            alert("Failed to generate a valid puzzle. Please try again.");
            return;
        }

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
        this.shuffle(validCandidates);
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
        this.shuffle(availableSlots);

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

    async generateAdvancedPuzzle() {
        // Initialize empty grid
        const grid = Array(7).fill(null).map(() => Array(5).fill(null));

        // 1. Pick Animal Positions
        // Ensure they don't create gaps < 3 letters
        const animalConfigs = [
            [{r:0, c:0}, {r:1, c:0}],
            [{r:5, c:0}, {r:6, c:0}],
            [{r:0, c:4}, {r:1, c:4}],
            [{r:5, c:4}, {r:6, c:4}]
        ];
        const config = animalConfigs[Math.floor(Math.random() * animalConfigs.length)];

        grid[config[0].r][config[0].c] = '🦊';
        grid[config[1].r][config[1].c] = '🦔';

        // 2. Identify Slots
        const slots = this.identifySlots(grid);

        // 3. Solve
        // Sort slots by length (longer first) or connectivity?
        // Let's sort by length descending for now.
        slots.sort((a, b) => b.len - a.len);

        return this.solveGrid(grid, slots, 0);
    }

    identifySlots(grid) {
        const slots = [];

        // Horizontal
        for (let r = 0; r < 7; r++) {
            let start = -1;
            for (let c = 0; c < 5; c++) {
                if (!this.isHole(r, c) && !this.isAnimal(grid[r][c])) {
                    if (start === -1) start = c;
                } else {
                    if (start !== -1) {
                        const len = c - start;
                        if (len >= 3) slots.push({ type: 'row', r, c: start, len });
                        start = -1;
                    }
                }
            }
            if (start !== -1) {
                const len = 5 - start;
                if (len >= 3) slots.push({ type: 'row', r, c: start, len });
            }
        }

        // Vertical
        for (let c = 0; c < 5; c++) {
            let start = -1;
            for (let r = 0; r < 7; r++) {
                if (!this.isHole(r, c) && !this.isAnimal(grid[r][c])) {
                    if (start === -1) start = r;
                } else {
                    if (start !== -1) {
                        const len = r - start;
                        if (len >= 3) slots.push({ type: 'col', r: start, c, len });
                        start = -1;
                    }
                }
            }
            if (start !== -1) {
                const len = 7 - start;
                if (len >= 3) slots.push({ type: 'col', r: start, c, len });
            }
        }

        return slots;
    }

    isAnimal(char) {
        return char === '🦊' || char === '🦔';
    }

    solveGrid(grid, slots, index) {
        if (index >= slots.length) return true; // All slots filled

        const slot = slots[index];

        // Get current pattern
        let pattern = '';
        for(let i=0; i<slot.len; i++) {
            if (slot.type === 'row') pattern += (grid[slot.r][slot.c + i] || '.');
            else pattern += (grid[slot.r + i][slot.c] || '.');
        }

        // Find candidates
        const regex = new RegExp('^' + pattern + '$');
        const candidates = (this.wordMap.get(slot.len) || []).filter(w => regex.test(w));

        // Shuffle candidates for randomness
        this.shuffle(candidates);

        // Try candidates (limit to first 50 to avoid infinite loops)
        for (let i = 0; i < Math.min(candidates.length, 50); i++) {
            const word = candidates[i];

            // Apply word
            const backup = []; // Store overwritten chars to restore on backtrack
            for(let k=0; k<slot.len; k++) {
                if (slot.type === 'row') {
                    backup.push(grid[slot.r][slot.c + k]);
                    grid[slot.r][slot.c + k] = word[k];
                } else {
                    backup.push(grid[slot.r + k][slot.c]);
                    grid[slot.r + k][slot.c] = word[k];
                }
            }

            // Recurse
            if (this.solveGrid(grid, slots, index + 1)) {
                this.solutionGrid = grid;
                return true;
            }

            // Backtrack
            for(let k=0; k<slot.len; k++) {
                if (slot.type === 'row') {
                    grid[slot.r][slot.c + k] = backup[k];
                } else {
                    grid[slot.r + k][slot.c] = backup[k];
                }
            }
        }

        return false;
    }





    removeSlot(slots, r, c) {
        const idx = slots.findIndex(s => s.r === r && s.c === c);
        if (idx !== -1) slots.splice(idx, 1);
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
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

    setupEventListeners() {
        const board = document.getElementById('game-board');

        board.addEventListener('dragstart', (e) => {
            const tileEl = e.target.closest('.tile');
            if (!tileEl) return;

            // Prevent dragging correct tiles
            if (tileEl.classList.contains('correct')) {
                e.preventDefault();
                return;
            }

            this.draggedTile = this.tiles.find(t => t.id === tileEl.dataset.id);
            if (!this.draggedTile) return;

            // Delay adding the class so the browser captures the element style BEFORE it changes opacity/scale
            setTimeout(() => {
                tileEl.classList.add('dragging');
            }, 0);

            // Required for Firefox and some other browsers to initiate drag
            e.dataTransfer.setData('text/plain', tileEl.dataset.id);
            e.dataTransfer.effectAllowed = 'move';
        });

        board.addEventListener('dragend', (e) => {
            if (!e.target.classList.contains('tile')) return;
            e.target.classList.remove('dragging');
            this.draggedTile = null;
        });

        board.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        board.addEventListener('drop', (e) => {
            e.preventDefault();
            if (!this.draggedTile) return;

            const { r, c } = this.getTargetFromEvent(e);
            this.attemptMove(this.draggedTile, r, c);
            this.draggedTile = null;
        });

        // Touch Events for Mobile
        board.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) return; // Ignore multi-touch

            const tileEl = e.target.closest('.tile');
            if (!tileEl) return;

            // Prevent dragging correct tiles
            if (tileEl.classList.contains('correct')) return;

            // Prevent default to stop scrolling immediately
            e.preventDefault();

            const tile = this.tiles.find(t => t.id === tileEl.dataset.id);
            if (!tile) return;

            this.draggedTile = tile;
            tileEl.classList.add('dragging');

            // Calculate offset to keep finger relative to tile position
            const rect = tileEl.getBoundingClientRect();
            const touch = e.touches[0];
            this.dragOffset = {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };

            // Remove transition for instant movement
            tileEl.style.transition = 'none';
        }, { passive: false });

        board.addEventListener('touchmove', (e) => {
            if (!this.draggedTile) return;
            e.preventDefault(); // Prevent scrolling

            const touch = e.touches[0];
            const boardRect = board.getBoundingClientRect();
            const tileEl = document.querySelector(`.tile[data-id="${this.draggedTile.id}"]`);

            if (tileEl) {
                const x = touch.clientX - boardRect.left - this.dragOffset.x;
                const y = touch.clientY - boardRect.top - this.dragOffset.y;
                tileEl.style.left = `${x}px`;
                tileEl.style.top = `${y}px`;
            }
        }, { passive: false });

        board.addEventListener('touchend', (e) => {
            if (!this.draggedTile) return;
            e.preventDefault();

            const tileEl = document.querySelector(`.tile[data-id="${this.draggedTile.id}"]`);

            // Temporarily hide tile to find what's underneath
            tileEl.style.display = 'none';
            const touch = e.changedTouches[0];
            const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
            tileEl.style.display = ''; // Restore

            const { r, c } = this.getTargetFromElement(targetEl);
            this.attemptMove(this.draggedTile, r, c);

            this.draggedTile = null;
            // Re-render will restore transitions and snap to grid
            this.render();
        });

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

    getTargetFromEvent(e) {
        let targetR, targetC;
        // Check if dropped on a tile
        const targetTileEl = e.target.closest('.tile');
        if (targetTileEl) {
            const targetTile = this.tiles.find(t => t.id === targetTileEl.dataset.id);
            if (targetTile) {
                targetR = targetTile.r;
                targetC = targetTile.c;
            }
        } else {
            // Check if dropped on a slot
            const slot = e.target.closest('.tile-slot');
            if (slot && !slot.classList.contains('hole')) {
                targetR = parseInt(slot.dataset.r);
                targetC = parseInt(slot.dataset.c);
            }
        }
        return { r: targetR, c: targetC };
    }

    getTargetFromElement(el) {
        if (!el) return { r: undefined, c: undefined };

        let targetR, targetC;
        const targetTileEl = el.closest('.tile');
        if (targetTileEl) {
            const targetTile = this.tiles.find(t => t.id === targetTileEl.dataset.id);
            if (targetTile) {
                targetR = targetTile.r;
                targetC = targetTile.c;
            }
        } else {
            const slot = el.closest('.tile-slot');
            if (slot && !slot.classList.contains('hole')) {
                targetR = parseInt(slot.dataset.r);
                targetC = parseInt(slot.dataset.c);
            }
        }
        return { r: targetR, c: targetC };
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

    calculateStars() {
        if (this.moves < 20) return 3;
        if (this.moves < 30) return 2;
        return 1;
    }

    updateColors() {
        // Reset classes
        document.querySelectorAll('.tile').forEach(el => {
            el.classList.remove('correct', 'present');
        });

        const greens = new Set();
        const yellows = new Set();

        // 1. Identify Green (Correct) tiles
        this.tiles.forEach(tile => {
            if (tile.isAnimal) return;

            const targetChar = this.solutionGrid[tile.r][tile.c];
            if (targetChar === tile.char) {
                greens.add(tile.id);
                const el = document.querySelector(`.tile[data-id="${tile.id}"]`);
                if(el) el.classList.add('correct');
            }
        });

        // 2. Identify Yellows (Present) - Row by Row
        for (let r = 0; r < this.gridSize.rows; r++) {
            for (let c = 0; c < this.gridSize.cols; c++) {
                // Skip if not start of a valid segment
                if (this.isHole(r, c) || this.isAnimalChar(this.solutionGrid[r][c])) continue;

                // Find end of segment
                let endC = c;
                while (endC < this.gridSize.cols && !this.isHole(r, endC) && !this.isAnimalChar(this.solutionGrid[r][endC])) {
                    endC++;
                }
                // Segment is from c to endC - 1
                this.processSegment(greens, yellows, {r, c}, {r, c: endC - 1}, 'row');

                // Advance c
                c = endC;
            }
        }

        // 3. Identify Yellows (Present) - Col by Col
        for (let c = 0; c < this.gridSize.cols; c++) {
            for (let r = 0; r < this.gridSize.rows; r++) {
                if (this.isHole(r, c) || this.isAnimalChar(this.solutionGrid[r][c])) continue;

                let endR = r;
                while (endR < this.gridSize.rows && !this.isHole(endR, c) && !this.isAnimalChar(this.solutionGrid[endR][c])) {
                    endR++;
                }

                this.processSegment(greens, yellows, {r, c}, {r: endR - 1, c}, 'col');

                r = endR;
            }
        }

        // Apply Yellow classes
        yellows.forEach(id => {
            const el = document.querySelector(`.tile[data-id="${id}"]`);
            if (el && !el.classList.contains('correct')) {
                el.classList.add('present');
            }
        });
    }

    isAnimalChar(char) {
        return ['🦊', '🦔'].includes(char);
    }

    processSegment(greens, yellows, start, end, type) {
        // Count targets in solution
        const targetCounts = {};
        const segmentTiles = [];

        if (type === 'row') {
            for (let c = start.c; c <= end.c; c++) {
                const char = this.solutionGrid[start.r][c];
                targetCounts[char] = (targetCounts[char] || 0) + 1;

                // Find tile at this position
                const tile = this.tiles.find(t => t.r === start.r && t.c === c);
                if (tile) segmentTiles.push(tile);
            }
        } else {
            for (let r = start.r; r <= end.r; r++) {
                const char = this.solutionGrid[r][start.c];
                targetCounts[char] = (targetCounts[char] || 0) + 1;

                const tile = this.tiles.find(t => t.r === r && t.c === start.c);
                if (tile) segmentTiles.push(tile);
            }
        }

        // Decrement for Greens
        segmentTiles.forEach(tile => {
            if (greens.has(tile.id)) {
                if (targetCounts[tile.char] > 0) {
                    targetCounts[tile.char]--;
                }
            }
        });

        // Assign Yellows to remaining
        // We sort tiles by position to ensure left-to-right / top-to-bottom priority
        segmentTiles.sort((a, b) => {
            if (a.r !== b.r) return a.r - b.r;
            return a.c - b.c;
        });

        segmentTiles.forEach(tile => {
            if (!greens.has(tile.id) && !tile.isAnimal) {
                if (targetCounts[tile.char] > 0) {
                    yellows.add(tile.id);
                    targetCounts[tile.char]--;
                }
            }
        });
    }

    checkWin() {
        const allGreen = this.tiles.every(t => {
            if (t.isAnimal) return true;
            const target = this.solutionGrid[t.r][t.c];
            return target === t.char;
        });

        if (allGreen) {
            // Check animals connected
            const fox = this.tiles.find(t => t.id === 'fox');
            const hedgehog = this.tiles.find(t => t.id === 'hedgehog');

            const dr = Math.abs(fox.r - hedgehog.r);
            const dc = Math.abs(fox.c - hedgehog.c);
            const isConnected = (dr <= 1 && dc <= 1 && (dr + dc > 0)); // Adjacent including diagonals

            if (isConnected) {
                document.getElementById('nav-results').classList.remove('disabled');
                this.handleWin();
            }
        }
    }

    handleWin() {
        // Save stats
        const stats = this.getStats();
        stats.solved++;
        stats.totalMoves += this.moves;
        stats.streak = (stats.streak || 0) + 1; // Increment streak
        localStorage.setItem('reunion_stats', JSON.stringify(stats));

        // Show results
        this.showResults(true);
    }

    getStats() {
        const stored = localStorage.getItem('reunion_stats');
        return stored ? JSON.parse(stored) : { solved: 0, totalMoves: 0, streak: 0 };
    }

    showResults(isWin) {
        const resultsSection = document.getElementById('results-section');
        resultsSection.classList.remove('hidden');
        const stats = this.getStats();

        const starsEl = document.getElementById('result-stars');
        const movesEl = document.getElementById('result-moves');

        // Update stars
        // If viewing stats (not win), show 0 or average? Or just hide?
        // Screenshot implies this is a "Results" card, so it usually shows the LAST game's results.
        // But if we just clicked "Results", we might not have a last game.
        // For now, if !isWin, we can show empty stars or just keep previous state?

        const stars = isWin ? this.calculateStars() : 0;
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
