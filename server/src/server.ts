import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionParams,
	TextDocumentPositionParams,
	Definition,
	Location,
	CodeLens,
	CodeLensParams,
	WorkspaceEdit,
	FileChangeType,
	TextDocumentSyncKind,
	RenameParams,
	InitializeResult,
	Hover,
	ReferenceParams
} from 'vscode-languageserver/node';
import * as sketch from './sketch';
import {
	TextDocument
} from 'vscode-languageserver-textdocument';
import * as diagnostics from './diagnostics';
import * as completion from './completion';
import * as hover from "./hover";
import * as definition from "./definition";
import * as reference from"./references";


export let connection = createConnection(ProposedFeatures.all);



// let documents: TextDocuments = new TextDocuments();
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
export let hasDiagnosticRelatedInformationCapability: boolean = false;

connection.onInitialize((params: InitializeParams) => {
	let capabilities = params.capabilities;

	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

		const result: InitializeResult = {
				capabilities: {
					textDocumentSync: TextDocumentSyncKind.Incremental,
					completionProvider: {
						resolveProvider: true,
						triggerCharacters: [ '.' ]
					},
					diagnosticProvider: {
						interFileDependencies: false,
						workspaceDiagnostics: false
					},
					hoverProvider: true,
					definitionProvider : true,
					// codeLensProvider : {
					// 	resolveProvider: true
					// },
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

connection.onInitialized(() => {
	connection.console.log(`Server initialized`);
	if (hasConfigurationCapability) {
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});

interface ExampleSettings {
	maxNumberOfProblems: number;
}

const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ExampleSettings = defaultSettings;

let documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
	connection.console.log(`Config change event occured`);
	if (hasConfigurationCapability) {
		documentSettings.clear();
	} else {
		globalSettings = <ExampleSettings>(
			(change.settings.languageServerExample || defaultSettings)
		);
	}

	documents.all().forEach(diagnostics.checkForRealtimeDiagnostics);
});

export function getDocumentSettings(resource: string): Thenable<ExampleSettings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'languageServerExample'
		});
		documentSettings.set(resource, result);
	}
	return result;
}

export let latestChangesInTextDoc: TextDocument

documents.onDidOpen(event => {
	connection.console.log(`File Open / Tab switching occured`);
	latestChangesInTextDoc = event.document
	sketch.build(event.document)
	diagnostics.checkForRealtimeDiagnostics(event.document)
});

documents.onDidClose(e => {
	connection.console.log(`File Closed`);
	documentSettings.delete(e.document.uri);
});

let bufferInProgress = false

documents.onDidChangeContent(change => {
	connection.console.log(`Content changed`);
	latestChangesInTextDoc = change.document
	if(!bufferInProgress)
		initPreProcessDiagnostics()
});


async function initPreProcessDiagnostics() {
	bufferInProgress = true
	await sleep(300);
	sketch.build(latestChangesInTextDoc)
	diagnostics.checkForRealtimeDiagnostics(latestChangesInTextDoc)
	bufferInProgress = false
}

function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

connection.onDidChangeWatchedFiles(_change => {
	connection.console.log('Files in workspace have changed');

	for (let i = 0; i < _change.changes.length; i++) {
		const change = _change.changes[i];
		
		switch (change.type) {
		  case FileChangeType.Created:
			sketch.addTab(change.uri)
			break;
		  case FileChangeType.Deleted:
			sketch.removeTab(change.uri)
			break;
		  default:
			// do nothing
			break;
		}
	}
});

//Implementation for `goto definition` goes here
connection.onDefinition(
	(_textDocumentParams: TextDocumentPositionParams): Definition | null => {
		return definition.scheduleLookUpDefinition(_textDocumentParams.textDocument.uri,_textDocumentParams.position.line,_textDocumentParams.position.character)
	}
)

//Implementation for finding references
connection.onReferences(
	(_referenceParams: ReferenceParams): Location[] | null => {
		// _referenceParams.position.line, _referenceParams.position.character -> lineNumber, column from the arguments sent along with the command in the code lens
		return reference.scheduleLookUpReference(_referenceParams)
	}
)

// Refresh codeLens for every change in the input stream
// // Implementation of `code-lens` goes here
// connection.onCodeLens(
// 	(_codeLensParams: CodeLensParams): CodeLens[] | null => {
// 		// return lens.scheduleLookUpLens(_codeLensParams)
// 		return null
// 	}
// )

// Implementation for Renaming References - WIP
// connection.onRenameRequest(
// 	(_renameParams: RenameParams): WorkspaceEdit | null => {
// 		return null
// 	}
// )

//Perform auto-completion -> Deligated tp `completion.ts`
connection.onCompletion(
	(_textDocumentParams: CompletionParams): CompletionItem[] => {
		return completion.getCompletionMethods(_textDocumentParams, latestChangesInTextDoc)
	}
);

// Completion Resolved suspended for now -> TODO: Refactoring required with real data points
// connection.onCompletionResolve(
// 	(item: CompletionItem): CompletionItem => {
// 		// use `item.label`
// 		item.detail = 'Field Details';
// 		item.documentation = 'Hover to know Field Details';
// 		return item;
// 	}
// );

connection.onHover(
	(params: TextDocumentPositionParams): Hover | null => {
		let hoverResult: Hover | null = null;
		hoverResult = hover.onHoverinFile(params);
		if(sketch.getCompileErrors.length == 0){
			hoverResult = hover.onHoverinFile(params);
		} else {
			sketch.getCompileErrors().forEach(function(compileError){
				let errorLine = compileError.lineNumber
				hoverResult = hover.onHoverinFile(params, errorLine);
			})
		}
		// log.write(`Hover Invoked`);
		return hoverResult
	}
)

documents.listen(connection);
connection.listen();
