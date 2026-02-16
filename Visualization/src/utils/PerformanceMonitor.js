// Adaptive performance monitor
// Tracks FPS and adjusts quality settings

export class PerformanceMonitor {
    constructor() {
        this.fps = 60;
        this.frameTimes = [];
        this.maxSamples = 60;
        this.lowFpsStreak = 0;
        this.highFpsStreak = 0;
        this.qualityLevel = 2; // 0=low, 1=medium, 2=high, 3=ultra
        this.lastTime = performance.now();

        // Callbacks
        this.onQualityChange = null;
    }

    update() {
        const now = performance.now();
        const dt = now - this.lastTime;
        this.lastTime = now;

        if (dt > 0) {
            this.frameTimes.push(dt);
            if (this.frameTimes.length > this.maxSamples) {
                this.frameTimes.shift();
            }
        }

        // Compute average FPS
        if (this.frameTimes.length > 10) {
            const avgDt = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
            this.fps = Math.round(1000 / avgDt);

            // Check for sustained low FPS
            if (this.fps < 30) {
                this.lowFpsStreak++;
                this.highFpsStreak = 0;
                if (this.lowFpsStreak > 180 && this.qualityLevel > 0) { // ~3 seconds
                    this.qualityLevel--;
                    this.lowFpsStreak = 0;
                    if (this.onQualityChange) this.onQualityChange(this.qualityLevel);
                }
            } else if (this.fps > 55) {
                this.highFpsStreak++;
                this.lowFpsStreak = 0;
                if (this.highFpsStreak > 300 && this.qualityLevel < 3) { // ~5 seconds
                    this.qualityLevel++;
                    this.highFpsStreak = 0;
                    if (this.onQualityChange) this.onQualityChange(this.qualityLevel);
                }
            } else {
                this.lowFpsStreak = 0;
                this.highFpsStreak = 0;
            }
        }

        return this.fps;
    }

    getFPS() {
        return this.fps;
    }

    getQualityLevel() {
        return this.qualityLevel;
    }

    setQualityLevel(level) {
        this.qualityLevel = Math.max(0, Math.min(3, level));
        if (this.onQualityChange) this.onQualityChange(this.qualityLevel);
    }
}
