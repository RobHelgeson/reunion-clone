/**
 * SoundManager - Handles all audio for the Reunion game
 * Uses Web Audio API to generate sounds without external files
 */
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = this.loadPreference();
        // Don't create AudioContext here - browsers suspend it when created without user interaction
        // Instead, create it lazily via warmUp() called from drag/touch handlers
    }

    /**
     * Check if AudioContext is ready to play sounds
     * Returns true only if the context exists and is in 'running' state.
     *
     * Note: warmUp() should have been called on dragstart/touchstart to prepare
     * the context. If the context isn't running yet, we skip the sound rather
     * than trying to create/resume here (which may not work outside user gesture).
     */
    ensureAudioContext() {
        if (!this.audioContext) {
            // Context should have been created by warmUp() on drag/touch start
            // If not, we can't reliably create it here (may be outside user gesture)
            return false;
        }

        // If still suspended, try to resume (might not work outside user gesture)
        // but don't block on it - just return whether we're ready now
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        // Only return true if actually running - this prevents silent failures
        return this.audioContext.state === 'running';
    }

    /**
     * Warm up the audio context on user interaction (before sounds are needed)
     * Call this on dragstart/touchstart to ensure audio is ready by the time
     * we need to play sounds (on drop/touchend)
     *
     * IMPORTANT: This always prepares the AudioContext regardless of the enabled state.
     * The enabled flag only controls whether sounds actually play, not whether
     * the context exists. This ensures the context is ready when users enable sounds.
     */
    warmUp() {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('Web Audio API not supported', e);
                return;
            }
        }

        // Resume the context - by the time we need to play sounds, it should be ready
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                // Play a silent pulse to fully activate the audio pipeline
                this.playSilentPulse();
            });
        } else if (this.audioContext.state === 'running') {
            // Context is running but may need a pulse to stay active
            this.playSilentPulse();
        }
    }

    /**
     * Play a silent sound to fully activate the audio context
     * This ensures the audio pipeline is primed and ready for real sounds
     */
    playSilentPulse() {
        if (!this.audioContext || this.audioContext.state !== 'running') return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            gainNode.gain.value = 0; // Silent
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.001);
        } catch (e) {
            // Ignore errors - this is just a warm-up pulse
        }
    }

    loadPreference() {
        const saved = localStorage.getItem('soundEnabled');
        return saved === null ? true : saved === 'true';
    }

    savePreference() {
        localStorage.setItem('soundEnabled', this.enabled.toString());
    }

    toggle() {
        this.enabled = !this.enabled;
        this.savePreference();
        return this.enabled;
    }

    isEnabled() {
        return this.enabled;
    }

    /**
     * Play a tone with specified parameters
     */
    playTone(frequency, duration, volume = 0.3, type = 'sine') {
        if (!this.enabled) return;
        if (!this.ensureAudioContext()) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = type;
            oscillator.frequency.value = frequency;

            // Envelope for smoother sound
            const now = this.audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

            oscillator.start(now);
            oscillator.stop(now + duration);
        } catch (e) {
            console.warn('Error playing sound', e);
        }
    }

    /**
     * Play multiple tones in sequence
     */
    playSequence(notes, baseVolume = 0.3) {
        if (!this.enabled) return;
        if (!this.ensureAudioContext()) return;

        let time = this.audioContext.currentTime;

        notes.forEach(note => {
            const { frequency, duration, delay = 0, volume = baseVolume, type = 'sine' } = note;

            try {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                oscillator.type = type;
                oscillator.frequency.value = frequency;

                const startTime = time + delay;
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

                oscillator.start(startTime);
                oscillator.stop(startTime + duration);

                time = startTime + duration;
            } catch (e) {
                console.warn('Error in sequence', e);
            }
        });
    }

    /**
     * Subtle tile placement sound - single tone mimicking a tile being placed
     */
    playTileMove() {
        this.playTone(180, 0.06, 0.08, 'triangle');
    }

    /**
     * Pleasant ding when a letter turns green
     */
    playCorrect() {
        this.playSequence([
            { frequency: 523.25, duration: 0.1, volume: 0.25 }, // C5
            { frequency: 659.25, duration: 0.15, delay: 0.05, volume: 0.2 }  // E5
        ]);
    }

    /**
     * Subtle chime when all letters in a word are correct
     */
    playWordComplete() {
        this.playSequence([
            { frequency: 523.25, duration: 0.1, volume: 0.2 },  // C5
            { frequency: 659.25, duration: 0.1, delay: 0.08, volume: 0.2 },  // E5
            { frequency: 783.99, duration: 0.2, delay: 0.08, volume: 0.25 }  // G5
        ]);
    }

    /**
     * Celebratory sound when puzzle is solved
     */
    playWin() {
        this.playSequence([
            { frequency: 523.25, duration: 0.15, volume: 0.25 },  // C5
            { frequency: 659.25, duration: 0.15, delay: 0.1, volume: 0.25 },  // E5
            { frequency: 783.99, duration: 0.15, delay: 0.1, volume: 0.25 },  // G5
            { frequency: 1046.50, duration: 0.3, delay: 0.1, volume: 0.3 }   // C6
        ]);
    }

    /**
     * Subtle error tone for invalid moves - very brief and gentle
     */
    playError() {
        this.playTone(220, 0.05, 0.06, 'sine');
    }
}
