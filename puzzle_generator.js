class PuzzleGenerator {
    constructor() {
        this.wordMap = new Map();
    }

    async init() {
        await this.loadDictionary();
    }

    async loadDictionary() {
        try {
            const response = await fetch('https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english.txt');            const text = await response.text();
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

    async generateAdvancedPuzzle() {
        // Initialize empty grid
        const grid = Array(7).fill(null).map(() => Array(5).fill(null));

        // 1. Pick Animal Positions
        // Many valid configurations where animals are adjacent (including diagonal)
        // Holes are at: (1,1), (1,3), (3,1), (3,3), (5,1), (5,3)
        const animalConfigs = [
            // Corner configurations - vertical (original 4)
            [{r:0, c:0}, {r:1, c:0}],  // top-left, vertical
            [{r:5, c:0}, {r:6, c:0}],  // bottom-left, vertical
            [{r:0, c:4}, {r:1, c:4}],  // top-right, vertical
            [{r:5, c:4}, {r:6, c:4}],  // bottom-right, vertical

            // Middle column vertical (column 2)
            [{r:0, c:2}, {r:1, c:2}],  // top-middle, vertical
            [{r:5, c:2}, {r:6, c:2}],  // bottom-middle, vertical

            // Horizontal pairs on row 0 (top edge)
            [{r:0, c:0}, {r:0, c:1}],  // top-left horizontal
            [{r:0, c:3}, {r:0, c:4}],  // top-right horizontal

            // Horizontal pairs on row 6 (bottom edge)
            [{r:6, c:0}, {r:6, c:1}],  // bottom-left horizontal
            [{r:6, c:3}, {r:6, c:4}],  // bottom-right horizontal

            // Diagonal pairs at corners
            [{r:0, c:0}, {r:1, c:1}],  // top-left diagonal (note: 1,1 is hole but animal can go there)
            [{r:0, c:4}, {r:1, c:3}],  // top-right diagonal (note: 1,3 is hole but animal can go there)
            [{r:6, c:0}, {r:5, c:1}],  // bottom-left diagonal (note: 5,1 is hole but animal can go there)
            [{r:6, c:4}, {r:5, c:3}],  // bottom-right diagonal (note: 5,3 is hole but animal can go there)

            // Mid-edge configurations
            [{r:0, c:1}, {r:0, c:2}],  // top edge middle-left
            [{r:0, c:2}, {r:0, c:3}],  // top edge middle-right
            [{r:6, c:1}, {r:6, c:2}],  // bottom edge middle-left
            [{r:6, c:2}, {r:6, c:3}],  // bottom edge middle-right

            // Side edge vertical pairs
            [{r:2, c:0}, {r:3, c:0}],  // left edge middle-top
            [{r:3, c:0}, {r:4, c:0}],  // left edge middle-bottom
            [{r:2, c:4}, {r:3, c:4}],  // right edge middle-top
            [{r:3, c:4}, {r:4, c:4}],  // right edge middle-bottom

            // Additional corner diagonals (into word rows)
            [{r:1, c:0}, {r:2, c:0}],  // left edge top
            [{r:4, c:0}, {r:5, c:0}],  // left edge bottom
            [{r:1, c:4}, {r:2, c:4}],  // right edge top
            [{r:4, c:4}, {r:5, c:4}],  // right edge bottom
        ];
        const config = animalConfigs[Math.floor(Math.random() * animalConfigs.length)];

        grid[config[0].r][config[0].c] = '🦊';
        grid[config[1].r][config[1].c] = '🦔';

        // 2. Identify Slots
        const slots = this.identifySlots(grid);

        // 3. Solve
        // Sort slots by length (longer first)
        slots.sort((a, b) => b.len - a.len);

        const success = this.solveGrid(grid, slots, 0);
        return success ? grid : null;
    }

    identifySlots(grid) {
        const slots = [];
        const isHole = (r, c) => {
            const holes = [
                { r: 1, c: 1 }, { r: 1, c: 3 },
                { r: 3, c: 1 }, { r: 3, c: 3 },
                { r: 5, c: 1 }, { r: 5, c: 3 }
            ];
            return holes.some(h => h.r === r && h.c === c);
        };
        const isAnimal = (char) => char === '🦊' || char === '🦔';

        // Horizontal
        for (let r = 0; r < 7; r++) {
            let start = -1;
            for (let c = 0; c < 5; c++) {
                if (!isHole(r, c) && !isAnimal(grid[r][c])) {
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
                if (!isHole(r, c) && !isAnimal(grid[r][c])) {
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

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}
