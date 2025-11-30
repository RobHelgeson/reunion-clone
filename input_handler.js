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

            // Warm up audio context on first interaction so sounds are ready on drop
            this.game.soundManager.warmUp();

            // Prevent dragging correct tiles
            if (tileEl.classList.contains('correct')) {
                e.preventDefault();
                return;
            }

            this.game.draggedTile = this.game.tiles.find(t => t.id === tileEl.dataset.id);
            if (!this.game.draggedTile) return;

            // Create a custom drag image with rotation
            const dragImage = tileEl.cloneNode(true);
            dragImage.style.position = 'absolute';
            dragImage.style.top = '-1000px';
            dragImage.style.transform = 'rotate(-7deg) scale(.95)';
            dragImage.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)';
            document.body.appendChild(dragImage);

            // Set the custom drag image
            e.dataTransfer.setDragImage(dragImage, tileEl.offsetWidth / 2, tileEl.offsetHeight / 2);

            // Clean up the drag image after a brief delay
            setTimeout(() => {
                document.body.removeChild(dragImage);
            }, 0);

            // Fade out the original tile
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

            // Warm up audio context on first interaction so sounds are ready on touchend
            this.game.soundManager.warmUp();

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
            // Try to find slot as ancestor or inside a cell-wrapper
            let slot = e.target.closest('.tile-slot');
            if (!slot) {
                // If we hit a cell-wrapper (padding area), look for slot inside
                const wrapper = e.target.closest('.cell-wrapper');
                if (wrapper) {
                    slot = wrapper.querySelector('.tile-slot');
                }
            }
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
            // Try to find slot as ancestor or inside a cell-wrapper
            let slot = el.closest('.tile-slot');
            if (!slot) {
                // If we hit a cell-wrapper (padding area), look for slot inside
                const wrapper = el.closest('.cell-wrapper');
                if (wrapper) {
                    slot = wrapper.querySelector('.tile-slot');
                }
            }
            if (slot && !slot.classList.contains('hole')) {
                targetR = parseInt(slot.dataset.r);
                targetC = parseInt(slot.dataset.c);
            }
        }
        return { r: targetR, c: targetC };
    }
}
