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

        // 1. Identify Green (Correct) tiles
        tiles.forEach(tile => {
            if (tile.isAnimal) return;

            const targetChar = solutionGrid[tile.r][tile.c];
            if (targetChar === tile.char) {
                greens.add(tile.id);
            }
        });

        // Helper to process segments
        const processSegment = (start, end, type) => {
            // Count targets in solution
            const targetCounts = {};
            const segmentTiles = [];

            if (type === 'row') {
                for (let c = start.c; c <= end.c; c++) {
                    const char = solutionGrid[start.r][c];
                    targetCounts[char] = (targetCounts[char] || 0) + 1;

                    // Find tile at this position
                    const tile = tiles.find(t => t.r === start.r && t.c === c);
                    if (tile) segmentTiles.push(tile);
                }
            } else {
                for (let r = start.r; r <= end.r; r++) {
                    const char = solutionGrid[r][start.c];
                    targetCounts[char] = (targetCounts[char] || 0) + 1;

                    const tile = tiles.find(t => t.r === r && t.c === start.c);
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
        };

        const isHole = (r, c) => {
             const holes = [
                { r: 1, c: 1 }, { r: 1, c: 3 },
                { r: 3, c: 1 }, { r: 3, c: 3 },
                { r: 5, c: 1 }, { r: 5, c: 3 }
            ];
            return holes.some(h => h.r === r && h.c === c);
        };
        const isAnimalChar = (char) => ['🦊', '🦔'].includes(char);

        // 2. Identify Yellows (Present) - Row by Row
        for (let r = 0; r < gridSize.rows; r++) {
            for (let c = 0; c < gridSize.cols; c++) {
                // Skip if not start of a valid segment
                if (isHole(r, c) || isAnimalChar(solutionGrid[r][c])) continue;

                // Find end of segment
                let endC = c;
                while (endC < gridSize.cols && !isHole(r, endC) && !isAnimalChar(solutionGrid[r][endC])) {
                    endC++;
                }
                // Segment is from c to endC - 1
                processSegment({r, c}, {r, c: endC - 1}, 'row');

                // Advance c
                c = endC;
            }
        }

        // 3. Identify Yellows (Present) - Col by Col
        for (let c = 0; c < gridSize.cols; c++) {
            for (let r = 0; r < gridSize.rows; r++) {
                if (isHole(r, c) || isAnimalChar(solutionGrid[r][c])) continue;

                let endR = r;
                while (endR < gridSize.rows && !isHole(endR, c) && !isAnimalChar(solutionGrid[endR][c])) {
                    endR++;
                }

                processSegment({r, c}, {r: endR - 1, c}, 'col');

                r = endR;
            }
        }

        return { greens, yellows };
    }
}
