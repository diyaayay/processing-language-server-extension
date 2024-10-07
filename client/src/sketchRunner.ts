import * as os from "os";
import { ChildProcess, spawn } from 'child_process';
import { BufferedOutputChannel } from "./utils/outputBuffer";
import * as vscode from "vscode";
import * as fs from 'fs';
import * as path from 'path';

export class SketchRunner implements vscode.Disposable {

    public static NAME: string = "Processing Sketch";

    public static getInstance(): SketchRunner {
        if (SketchRunner._sketchrunner === null) {
            SketchRunner._sketchrunner = new SketchRunner();
        }
        return SketchRunner._sketchrunner;
    }

    private static _sketchrunner: SketchRunner = null;
    private _child: ChildProcess;
    private _jrePath: string;
    private _workDir: string;
    private _compilePath: string;
    private _outputChannel: vscode.OutputChannel;
    private _bufferedOutputChannel: BufferedOutputChannel;

    public initilize(jrePath: string, clientSketchPath: string, compilePath: string){
        this._workDir = clientSketchPath;
        this._compilePath = compilePath;
        this._outputChannel = vscode.window.createOutputChannel(SketchRunner.NAME);
        this._bufferedOutputChannel = new BufferedOutputChannel(this._outputChannel.append, 300);
        this._jrePath = path.resolve(__dirname, "..", "..", "jre", "deps");
    }

    public get initialized(): boolean {
        return !!this._outputChannel;
    }

    public dispose() {
        if (this.isRunning) {
            return this.stop();
        }
        this._outputChannel.dispose();
        this._bufferedOutputChannel.dispose();
    }

    private get isRunning(): boolean {
        return this._child ? true : false;
    }

    public async runSketch(): Promise<boolean> {
        if (this.isRunning) {
            this.stop();
            vscode.window.showWarningMessage(`Sketch is already running, stopping sketch.`);
            return false;
        }

        try {
            const result = await this.start();            
            return result;
        } catch (error) {
            this.logError('Error occurred while running sketch', error);
            return false;
        }
    }

    public async stopSketch(): Promise<boolean> {
        if (this.isRunning) {
            const result = await this.stop();
            return result;
        } else {
            return false;
        }
    }

    private async start(): Promise<boolean> {
        try {
            this.copyCompiledSketch(this._compilePath, this._workDir);
    
            this._bufferedOutputChannel.appendLine(`[Starting] Running processing sketch`);
            this._outputChannel.show(false);
            vscode.commands.executeCommand('setContext', 'processing.runningSketch', true);
    
            if (this.isRunning) {
                this.stop();
            }
    
            return new Promise((resolve, reject) => {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    // this.logError('No active editor found. Please open a sketch file.');
                    return false; 
                }
                const currentFilePath = editor.document.uri.fsPath; 
                const sketchDirectory = path.dirname(currentFilePath);

                const sketchPath =  path.resolve(sketchDirectory);
                

                
                    
                const processingJavaPath = path.join(this._jrePath, "processing-sketch.exe");
                this._child = spawn(processingJavaPath, ["--sketch=" + sketchPath, "--run"], { cwd: this._workDir });
    
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
        } catch (err) {
            this.logError('Error occurred in start method', err);
            return false;
        }
    }

    private async stop(): Promise<boolean> {
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
            } catch (error) {
                this.logError('Error occurred while stopping sketch', error);
                reject(error);
            }
        });
    }
    
    private copyCompiledSketch(src: string, dest: string) {
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

            } else if (path.extname(src) === '.class') {
                fs.copyFileSync(src, dest);
            }
        } catch (error) {
            this.logError('Error occurred while copying compiled sketch', error);
        }
    }

    private logError(message: string, error: any) {
        const errorMessage = `${message}: ${error.message || error.toString()}`;
        console.error(errorMessage);
        this._bufferedOutputChannel.appendLine(errorMessage);
        vscode.window.showErrorMessage(errorMessage);
    }
}
