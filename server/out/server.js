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
exports.latestChangesInTextDoc = exports.hasDiagnosticRelatedInformationCapability = exports.connection = void 0;
exports.getDocumentSettings = getDocumentSettings;
const diagnostics_1 = require("./diagnostics");
const completion_1 = require("./completion");
const hover_1 = require("./hover");
const definition_1 = require("./definition");
const references_1 = require("./references");
const sketch_1 = require("./sketch");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const node_1 = require("vscode-languageserver/node");
exports.connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
exports.hasDiagnosticRelatedInformationCapability = false;
exports.connection.onInitialize((params) => {
    let capabilities = params.capabilities;
    hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
    hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);
    exports.hasDiagnosticRelatedInformationCapability = !!(capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation);
    const result = {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: ['.']
            },
            diagnosticProvider: {
                interFileDependencies: false,
                workspaceDiagnostics: false
            },
            hoverProvider: true,
            definitionProvider: true,
            referencesProvider: true,
            renameProvider: true
        }
    };
    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true
            }
        };
    }
    return result;
});
exports.connection.onInitialized(() => {
    exports.connection.console.log(`Server initialized`);
    if (hasConfigurationCapability) {
        exports.connection.client.register(node_1.DidChangeConfigurationNotification.type, undefined);
    }
    if (hasWorkspaceFolderCapability) {
        exports.connection.workspace.onDidChangeWorkspaceFolders(_event => {
            exports.connection.console.log('Workspace folder change event received.');
        });
    }
});
const defaultSettings = { maxNumberOfProblems: 1000 };
let globalSettings = defaultSettings;
let documentSettings = new Map();
exports.connection.onDidChangeConfiguration(change => {
    exports.connection.console.log(`Config change event occured`);
    if (hasConfigurationCapability) {
        documentSettings.clear();
    }
    else {
        globalSettings = ((change.settings.languageServerExample || defaultSettings));
    }
    documents.all().forEach(diagnostics_1.checkForRealtimeDiagnostics);
});
function getDocumentSettings(resource) {
    if (!hasConfigurationCapability) {
        return Promise.resolve(globalSettings);
    }
    let result = documentSettings.get(resource);
    if (!result) {
        result = exports.connection.workspace.getConfiguration({
            scopeUri: resource,
            section: 'languageServerExample'
        });
        documentSettings.set(resource, result);
    }
    return result;
}
documents.onDidOpen(event => {
    exports.connection.console.log(`File Open / Tab switching occured`);
    exports.latestChangesInTextDoc = event.document;
    (0, sketch_1.build)(event.document);
    (0, diagnostics_1.checkForRealtimeDiagnostics)(event.document);
});
documents.onDidClose(e => {
    exports.connection.console.log(`File Closed`);
    documentSettings.delete(e.document.uri);
});
let bufferInProgress = false;
documents.onDidChangeContent(change => {
    exports.connection.console.log(`Content changed`);
    exports.latestChangesInTextDoc = change.document;
    if (!bufferInProgress)
        initPreProcessDiagnostics();
});
function initPreProcessDiagnostics() {
    return __awaiter(this, void 0, void 0, function* () {
        bufferInProgress = true;
        yield sleep(300);
        (0, sketch_1.build)(exports.latestChangesInTextDoc);
        (0, diagnostics_1.checkForRealtimeDiagnostics)(exports.latestChangesInTextDoc);
        bufferInProgress = false;
    });
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.connection.onDidChangeWatchedFiles(_change => {
    exports.connection.console.log('Files in workspace have changed');
    for (let i = 0; i < _change.changes.length; i++) {
        const change = _change.changes[i];
        switch (change.type) {
            case node_1.FileChangeType.Created:
                (0, sketch_1.addTab)(change.uri);
                break;
            case node_1.FileChangeType.Deleted:
                (0, sketch_1.removeTab)(change.uri);
                break;
            default:
                break;
        }
    }
});
exports.connection.onDefinition((_textDocumentParams) => {
    return (0, definition_1.scheduleLookUpDefinition)(_textDocumentParams.textDocument.uri, _textDocumentParams.position.line, _textDocumentParams.position.character);
});
exports.connection.onCodeLens((_codeParams) => {
    return null;
});
exports.connection.onRenameRequest((_renameParams) => {
    return null;
});
exports.connection.onReferences((_referenceParams) => {
    return (0, references_1.scheduleLookUpReference)(_referenceParams);
});
exports.connection.onCompletion((_textDocumentParams) => {
    return (0, completion_1.getCompletionMethods)(_textDocumentParams, exports.latestChangesInTextDoc);
});
exports.connection.onCompletionResolve((item) => {
    item.detail = 'Field Details';
    item.documentation = 'Hover to know Field Details';
    return item;
});
exports.connection.onHover((params) => {
    let hoverResult = null;
    hoverResult = (0, hover_1.onHoverinFile)(params);
    if (sketch_1.getCompileErrors.length == 0) {
        hoverResult = (0, hover_1.onHoverinFile)(params);
    }
    else {
        (0, sketch_1.getCompileErrors)().forEach(function (compileError) {
            let errorLine = compileError.lineNumber;
            hoverResult = (0, hover_1.onHoverinFile)(params, errorLine);
        });
    }
    return hoverResult;
});
documents.listen(exports.connection);
exports.connection.listen();
//# sourceMappingURL=server.js.map