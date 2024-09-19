import { checkForRealtimeDiagnostics } from './diagnostics';
import { getCompletionMethods } from './completion';
import { onHoverinFile } from './hover';
import { scheduleLookUpDefinition } from './definition';
import { scheduleLookUpReference } from './references';
import { addTab, build, getCompileErrors, removeTab } from './sketch';

import { TextDocument } from 'vscode-languageserver-textdocument';
import {
	createConnection,
	TextDocuments,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionParams,
	TextDocumentPositionParams,
	Definition,
	Location,
	WorkspaceEdit,
	FileChangeType,
	TextDocumentSyncKind,
	RenameParams,
	InitializeResult,
	Hover,
	ReferenceParams
} from 'vscode-languageserver/node';

export let connection = createConnection(ProposedFeatures.all);


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

	documents.all().forEach(checkForRealtimeDiagnostics);
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

export let latestChangesInTextDoc: TextDocument;

documents.onDidOpen(event => {
	connection.console.log(`File Open / Tab switching occured`);
	latestChangesInTextDoc = event.document;
	build(event.document);
	checkForRealtimeDiagnostics(event.document);
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
	bufferInProgress = true;
	await sleep(300);
	build(latestChangesInTextDoc);
	checkForRealtimeDiagnostics(latestChangesInTextDoc);
	bufferInProgress = false;
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
			addTab(change.uri)
			break;
		  case FileChangeType.Deleted:
			removeTab(change.uri)
			break;
		  default:
			break;
		}
	}
});

connection.onDefinition(
	(_textDocumentParams: TextDocumentPositionParams): Definition | null => {
		return scheduleLookUpDefinition(_textDocumentParams.textDocument.uri,_textDocumentParams.position.line,_textDocumentParams.position.character)
	}
)

connection.onReferences(
	(_referenceParams: ReferenceParams): Location[] | null => {
		return scheduleLookUpReference(_referenceParams)
	}
)

connection.onCompletion(
	(_textDocumentParams: CompletionParams): CompletionItem[] => {
		return getCompletionMethods(_textDocumentParams, latestChangesInTextDoc)
	}
);

connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		item.detail = 'Field Details';
		item.documentation = 'Hover to know Field Details';
		return item;
	}
);

connection.onHover(
	(params: TextDocumentPositionParams): Hover | null => {
		let hoverResult: Hover | null = null;
		hoverResult = onHoverinFile(params);
		if(getCompileErrors.length == 0){
			hoverResult = onHoverinFile(params);
		} else {
			getCompileErrors().forEach(function(compileError){
				let errorLine = compileError.lineNumber;
				hoverResult = onHoverinFile(params, errorLine);
			})
		}
		return hoverResult;
	}
)

documents.listen(connection);
connection.listen();
