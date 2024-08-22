import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';
import { SketchRunner } from "./sketchRunner"; // TBD

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
	const serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);

	let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	};

	const clientOptions: LanguageClientOptions = {
		documentSelector: [{ scheme: 'file', language: 'plaintext' }],
		synchronize: {
			fileEvents: workspace.createFileSystemWatcher('**/*')
		}
	};

	client = new LanguageClient(
		'processingLanguageServer',
		'Processing Language Server',
		serverOptions,
		clientOptions
	);

	//processign specific paths
let clientPath = context.asAbsolutePath(path.join('client'));
let serverPath = context.asAbsolutePath(path.join('server'));
let jrePath = context.asAbsolutePath(path.join('jre', 'bin'));


let serverCompilePath = path.join(serverPath, 'out', 'compile')
let clientSketchPath = path.join(clientPath, 'out', 'class')

//Setup instance from sketchRunner(TODO)

	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
