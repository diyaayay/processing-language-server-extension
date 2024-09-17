import { connection, getDocumentSettings, hasDiagnosticRelatedInformationCapability } from './server';
import { getCompileErrors, getFileNames, getInfo, getTransformationMap } from './sketch';

import { Diagnostic, DiagnosticSeverity,} from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';



export async function checkForRealtimeDiagnostics(processedTextDocument: TextDocument): Promise<void> {
	let settings = await getDocumentSettings(processedTextDocument.uri);
	connection.console.log(JSON.stringify(settings));
	let problems = 0;
	let errorLine : number = 0;
	let errorDocName : string = '';
	let errorDocUri : string = '';

	let fileDiagnostics = new Map<string,  Diagnostic[]>()
	let fileNames = getFileNames();
	connection.console.log("diagnostics");
	connection.console.log(JSON.stringify(fileNames));

	if(fileNames) {
		fileNames.forEach(function(key : string){
			let emptyDiag : Diagnostic[] = [];

			fileDiagnostics.set(key, emptyDiag);
		})
	}
	
	getCompileErrors().forEach(function(compileError){
		let errorLineNumber = compileError.lineNumber;
		let errorMessage = compileError.message;

		let transformMap = getTransformationMap();
		if (transformMap.get(errorLineNumber)) {
			errorLine = transformMap.get(errorLineNumber)!.lineNumber;
			errorDocName =  transformMap.get(errorLineNumber)!.fileName;
			errorDocUri = getInfo().uri+errorDocName;
		}

		let diagnostics = fileDiagnostics.get(errorDocName);

		if(problems < settings.maxNumberOfProblems && diagnostics){
			problems++;
			let diagnostic: Diagnostic = {
				severity: DiagnosticSeverity.Error,
				range: {
					start: {
						line: errorLine-1,
						character: 0
					},
					end: {
						line: errorLine-1,
						character: 200
					}
				},
				message: `Error found`,
				source: `in Source File`
			}
			if (hasDiagnosticRelatedInformationCapability) {
				diagnostic.relatedInformation = [
					{
						location: {
							uri: errorDocUri,
							range: Object.assign({}, diagnostic.range)
						},
						message: `${errorMessage}`
					}
				];
			}
			diagnostics.push(diagnostic);
			fileDiagnostics.set(errorDocName, diagnostics);
		}
	})

	for (let [file, diagnostics] of fileDiagnostics)  {
		let fileUri = getInfo().uri+file
		connection.sendDiagnostics({uri: fileUri, diagnostics})
	}
	
}