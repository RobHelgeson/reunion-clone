class InputHandler {
    constructor(game) {
        this.game = game;
        this.dragOffset = { x: 0, y: 0 };
    }

    setupDragAndDrop(board) {
        // Mouse Events
        board.addEventListener('dragstart', (e) => {
            const tileEl = e.target.closest('.tile');
            if (!tileEl) return;

            // Prevent dragging correct tiles
            if (tileEl.classList.contains('correct')) {
                e.preventDefault();
                return;
            }

            this.game.draggedTile = this.game.tiles.find(t => t.id === tileEl.dataset.id);
            if (!this.game.draggedTile) return;

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
            this.game.draggedTile = null;
        });

        board.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        board.addEventListener('drop', (e) => {
            e.preventDefault();
            if (!this.game.draggedTile) return;

            const { r, c } = this.getTargetFromEvent(e);
            this.game.attemptMove(this.game.draggedTile, r, c);
            this.game.draggedTile = null;
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

            const tile = this.game.tiles.find(t => t.id === tileEl.dataset.id);
            if (!tile) return;

            this.game.draggedTile = tile;
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
            if (!this.game.draggedTile) return;
            e.preventDefault(); // Prevent scrolling

            const touch = e.touches[0];
            const boardRect = board.getBoundingClientRect();
            const tileEl = document.querySelector(`.tile[data-id="${this.game.draggedTile.id}"]`);

            if (tileEl) {
                const x = touch.clientX - boardRect.left - this.dragOffset.x;
                const y = touch.clientY - boardRect.top - this.dragOffset.y;
                tileEl.style.left = `${x}px`;
                tileEl.style.top = `${y}px`;
            }
        }, { passive: false });

        board.addEventListener('touchend', (e) => {
            if (!this.game.draggedTile) return;
            e.preventDefault();

            const tileEl = document.querySelector(`.tile[data-id="${this.game.draggedTile.id}"]`);

            // Temporarily hide tile to find what's underneath
            tileEl.style.display = 'none';
            const touch = e.changedTouches[0];
            const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
            tileEl.style.display = ''; // Restore

            const { r, c } = this.getTargetFromElement(targetEl);
            this.game.attemptMove(this.game.draggedTile, r, c);

            this.game.draggedTile = null;
            // Re-render will restore transitions and snap to grid
            this.game.render();
        });
    }

    getTargetFromEvent(e) {
        let targetR, targetC;
        // Check if dropped on a tile
        const targetTileEl = e.target.closest('.tile');
        if (targetTileEl) {
            const targetTile = this.game.tiles.find(t => t.id === targetTileEl.dataset.id);
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
            const targetTile = this.game.tiles.find(t => t.id === targetTileEl.dataset.id);
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
}
