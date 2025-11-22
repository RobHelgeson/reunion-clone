/**
 * SoundManager - Handles all audio for the Reunion game
 * Uses Web Audio API to generate sounds without external files
 */
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = this.loadPreference();
        this.initAudioContext();
    }

    initAudioContext() {
        try {
            // Create audio context on user interaction (browser autoplay policy)
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported', e);
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
        if (!this.enabled || !this.audioContext) return;

        try {
            // Resume audio context if suspended (browser autoplay policy)
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

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
        if (!this.enabled || !this.audioContext) return;

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
