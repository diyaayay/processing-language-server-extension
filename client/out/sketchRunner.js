"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SketchRunner = void 0;
const os = require("os");
const child_process_1 = require("child_process");
const outputBuffer_1 = require("./utils/outputBuffer");
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
class SketchRunner {
    static getInstance() {
        if (SketchRunner._sketchrunner === null) {
            SketchRunner._sketchrunner = new SketchRunner();
        }
        return SketchRunner._sketchrunner;
    }
    initilize(jrePath, clientSketchPath, compilePath) {
        this._workDir = clientSketchPath;
        this._compilePath = compilePath;
        this._outputChannel = vscode.window.createOutputChannel(SketchRunner.NAME);
        this._bufferedOutputChannel = new outputBuffer_1.BufferedOutputChannel(this._outputChannel.append, 300);
        this._jrePath = path.resolve(__dirname, "..", "..", "jre", "deps");
    }
    get initialized() {
        return !!this._outputChannel;
    }
    dispose() {
        if (this.isRunning) {
            return this.stop();
        }
        this._outputChannel.dispose();
        this._bufferedOutputChannel.dispose();
    }
    get isRunning() {
        return this._child ? true : false;
    }
    runSketch() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isRunning) {
                this.stop();
                vscode.window.showWarningMessage(`Sketch is already running, stopping sketch.`);
                return false;
            }
            try {
                const result = yield this.start();
                return result;
            }
            catch (error) {
                this.logError('Error occurred while running sketch', error);
                return false;
            }
        });
    }
    stopSketch() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isRunning) {
                const result = yield this.stop();
                return result;
            }
            else {
                return false;
            }
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.copyCompiledSketch(this._compilePath, this._workDir);
                this._bufferedOutputChannel.appendLine(`[Starting] Running processing sketch`);
                this._outputChannel.show(false);
                vscode.commands.executeCommand('setContext', 'processing.runningSketch', true);
                if (this.isRunning) {
                    this.stop();
                }
                return new Promise((resolve, reject) => {
                    const sketchPath = path.resolve(__dirname, "..", "..", "SKECHERS");
                    // const editor = vscode.window.activeTextEditor;
                    // if (!editor) {
                    //     // this.logError('No active editor found. Please open a sketch file.');
                    //     return false; 
                    // }
                    // const currentFilePath = editor.document.uri.fsPath; 
                    // const sketchDirectory = path.dirname(currentFilePath);
                    // const sketchPath =  path.resolve(sketchDirectory);
                    const processingJavaPath = path.join(this._jrePath, "processing-sketch.exe");
                    this._child = (0, child_process_1.spawn)(processingJavaPath, ["--sketch=" + sketchPath, "--run"], { cwd: this._workDir });
                    this._child.on('close', (close) => {
                        this.stop();
                    });
                    this._child.stdout.on("data", (data) => {
                        if (this.isRunning) {
                            this._bufferedOutputChannel.append(data.toString());
                        }
                    });
                    this._child.stderr.on("data", (data) => {
                        this.logError('Child process stderr', data.toString());
                    });
                    resolve(true);
                });
            }
            catch (err) {
                this.logError('Error occurred in start method', err);
                return false;
            }
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            vscode.commands.executeCommand('setContext', 'processing.runningSketch', false);
            return new Promise((resolve, reject) => {
                if (!this.isRunning) {
                    resolve(false);
                    return;
                }
                try {
                    if (this._bufferedOutputChannel) {
                        this._bufferedOutputChannel.appendLine(`[Done] Stopped the sketch ${os.EOL}`);
                    }
                    this._child.kill('SIGTERM'); // or 'SIGTERM' if 'SIGINT' does not work
                    this._child = null;
                    resolve(true);
                }
                catch (error) {
                    this.logError('Error occurred while stopping sketch', error);
                    reject(error);
                }
            });
        });
    }
    copyCompiledSketch(src, dest) {
        try {
            const exists = fs.existsSync(src);
            const stats = exists && fs.statSync(src);
            const isDirectory = exists && stats.isDirectory();
            if (isDirectory) {
                if (!fs.existsSync(dest)) {
                    fs.mkdirSync(dest);
                }
                fs.readdirSync(src).forEach((contents) => {
                    this.copyCompiledSketch(path.join(src, contents), path.join(dest, contents));
                });
            }
            else if (path.extname(src) === '.class') {
                fs.copyFileSync(src, dest);
            }
        }
        catch (error) {
            this.logError('Error occurred while copying compiled sketch', error);
        }
    }
    logError(message, error) {
        const errorMessage = `${message}: ${error.message || error.toString()}`;
        console.error(errorMessage);
        this._bufferedOutputChannel.appendLine(errorMessage);
        vscode.window.showErrorMessage(errorMessage);
    }
}
exports.SketchRunner = SketchRunner;
SketchRunner.NAME = "Processing Sketch";
SketchRunner._sketchrunner = null;
//# sourceMappingURL=sketchRunner.js.map