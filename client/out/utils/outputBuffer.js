"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BufferedOutputChannel = void 0;
const perf_hooks_1 = require("perf_hooks");
class BufferedOutputChannel {
    constructor(outputCallback, flushIntervalMs) {
        this.outputCallback = outputCallback;
        this.flushIntervalMs = flushIntervalMs;
        this._buffer = [];
        this._timer = setInterval(() => this.tryFlush(), this.flushIntervalMs);
        this._lastFlushTime = Number.NEGATIVE_INFINITY;
    }
    append(value) {
        this.add(value);
    }
    appendLine(value) {
        this.add(value + "\n");
    }
    dispose() {
        this.tryFlush();
        clearInterval(this._timer);
    }
    add(value) {
        this._buffer.push(value);
        this.tryFlush();
    }
    tryFlush() {
        const currentTime = perf_hooks_1.performance.now();
        if (this._buffer.length > 0 && currentTime - this._lastFlushTime > this.flushIntervalMs) {
            this.outputCallback(this._buffer.join(""));
            this._lastFlushTime = currentTime;
            this._buffer = [];
        }
    }
}
exports.BufferedOutputChannel = BufferedOutputChannel;
//# sourceMappingURL=outputBuffer.js.map