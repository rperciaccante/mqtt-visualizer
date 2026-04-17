class RateTracker {
  constructor(windowMs = 10000) {
    this.windowMs = windowMs;
    this.timestamps = [];
  }

  record() {
    this.timestamps.push(Date.now());
    this._prune();
  }

  getRate() {
    this._prune();
    return this.timestamps.length / (this.windowMs / 1000);
  }

  _prune() {
    const cutoff = Date.now() - this.windowMs;
    // shift() is O(n); acceptable for expected MQTT message rates
    while (this.timestamps.length && this.timestamps[0] < cutoff) {
      this.timestamps.shift();
    }
  }
}

module.exports = { RateTracker };
