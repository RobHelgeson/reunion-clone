class GameRules {
    static checkWin(tiles, solutionGrid) {
        const allGreen = tiles.every(t => {
            if (t.isAnimal) return true;
            const target = solutionGrid[t.r][t.c];
            return target === t.char;
        });

        if (allGreen) {
            // Check animals connected
            const fox = tiles.find(t => t.id === 'fox');
            const hedgehog = tiles.find(t => t.id === 'hedgehog');

            const dr = Math.abs(fox.r - hedgehog.r);
            const dc = Math.abs(fox.c - hedgehog.c);
            const isConnected = (dr <= 1 && dc <= 1 && (dr + dc > 0)); // Adjacent including diagonals

            return isConnected;
        }
        return false;
    }

    static calculateStars(moves) {
        if (moves < 20) return 3;
        if (moves < 30) return 2;
        return 1;
    }

    static getStats() {
        const stored = localStorage.getItem('reunion_stats');
        return stored ? JSON.parse(stored) : { solved: 0, totalMoves: 0, streak: 0 };
    }

    static saveStats(moves, isWin) {
        if (!isWin) return;
        const stats = this.getStats();
        stats.solved++;
        stats.totalMoves += moves;
        stats.streak = (stats.streak || 0) + 1;
        localStorage.setItem('reunion_stats', JSON.stringify(stats));
    }

    static calculateColors(tiles, solutionGrid, gridSize) {
        const greens = new Set();
        const yellows = new Set();

        // Map tile positions for quick lookup
        const tileMap = new Map();
        tiles.forEach(tile => {
            if (!tile.isAnimal) {
                tileMap.set(`${tile.r},${tile.c}`, tile);
            }
        });

        // Track yellow status per tile (from row and column evaluations)
        const yellowFromRow = new Set();
        const yellowFromCol = new Set();

        // Helper: Evaluate a single word (row or column)
        const evaluateWord = (positions, yellowSet) => {
            // Build solution word and current word
            const solutionWord = [];
            const currentTiles = [];

            positions.forEach(([r, c]) => {
                const solutionChar = solutionGrid[r][c];
                solutionWord.push(solutionChar);

                const tile = tileMap.get(`${r},${c}`);
                if (tile) {
                    currentTiles.push({ tile, solutionChar, r, c });
                }
            });

            // Count letter budget from solution
            const budget = {};
            solutionWord.forEach(char => {
                budget[char] = (budget[char] || 0) + 1;
            });

            // First pass: Mark greens and consume budget
            currentTiles.forEach(({ tile, solutionChar }) => {
                if (tile.char === solutionChar) {
                    greens.add(tile.id);
                    if (budget[tile.char] > 0) {
                        budget[tile.char]--;
                    }
                }
            });

            // Second pass: Mark yellows from remaining budget
            currentTiles.forEach(({ tile, solutionChar }) => {
                if (!greens.has(tile.id)) {
                    // Letter is present in word but not in correct position
                    if (budget[tile.char] > 0) {
                        yellowSet.add(tile.id);
                        budget[tile.char]--;
                    }
                }
            });
        };

        // Process the 4 horizontal words (rows 0, 2, 4, 6)
        const wordRows = [0, 2, 4, 6];
        wordRows.forEach(r => {
            const positions = [];
            for (let c = 0; c < gridSize.cols; c++) {
                positions.push([r, c]);
            }
            evaluateWord(positions, yellowFromRow);
        });

        // Process the 3 vertical words (columns 0, 2, 4)
        const wordCols = [0, 2, 4];
        wordCols.forEach(c => {
            const positions = [];
            for (let r = 0; r < gridSize.rows; r++) {
                positions.push([r, c]);
            }
            evaluateWord(positions, yellowFromCol);
        });

        // Combine yellow results with OR logic
        // A tile is yellow if it's yellow in EITHER its row OR its column
        yellowFromRow.forEach(id => yellows.add(id));
        yellowFromCol.forEach(id => yellows.add(id));

        return { greens, yellows };
    }
}
