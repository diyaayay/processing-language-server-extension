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
exports.activate = activate;
exports.deactivate = deactivate;
const path = require("path");
const vscode = require("vscode");
const sketchRunner_1 = require("./sketchRunner");
const node_1 = require("vscode-languageclient/node");
let client;
function activate(context) {
    let serverModule = context.asAbsolutePath(path.join('server', 'out', 'server.js'));
    let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };
    let serverOptions = {
        run: { module: serverModule, transport: node_1.TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: node_1.TransportKind.ipc,
            options: debugOptions
        }
    };
    let clientOptions = {
        documentSelector: [{ scheme: 'file', language: 'Processing' }],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/*')
        }
    };
    client = new node_1.LanguageClient('processingLanguageServer', 'Processing Language Server', serverOptions, clientOptions);
    let clientPath = context.asAbsolutePath(path.join('client'));
    let serverPath = context.asAbsolutePath(path.join('server'));
    let jrePath = context.asAbsolutePath(path.join('jre', 'bin'));
    let serverCompilePath = path.join(serverPath, 'out', 'compile');
    let clientSketchPath = path.join(clientPath, 'out', 'class');
    const sketchRunner = sketchRunner_1.SketchRunner.getInstance();
    sketchRunner.initilize(jrePath, clientSketchPath, serverCompilePath);
    let sketchRunnerDisp = vscode.commands.registerCommand("extension.processing.runSketch", () => sketchRunner.runSketch());
    let sketchStopperDisp = vscode.commands.registerCommand("extension.processing.stopSketch", () => sketchRunner.stopSketch());
    let referenceDisposable = vscode.commands.registerCommand('processing.command.findReferences', (...args) => {
        vscode.commands.executeCommand('editor.action.findReferences', vscode.Uri.file(args[0].uri.substring(7, args[0].uri.length)), new vscode.Position(args[0].lineNumber, args[0].column));
    });
    context.subscriptions.push(referenceDisposable);
    context.subscriptions.push(sketchRunnerDisp);
    context.subscriptions.push(sketchStopperDisp);
    client.start();
}
function deactivate() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!client) {
            return undefined;
        }
        const sketchRunner = sketchRunner_1.SketchRunner.getInstance();
        yield sketchRunner.stopSketch();
        return client.stop();
    });
}
//# sourceMappingURL=extension.js.map