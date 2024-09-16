import { ClassDeclarationContext, 
	     VariableDeclaratorIdContext,
		 MethodDeclarationContext } from "java-ast/dist/parser/JavaParser"
import { getCharacterOffset,
	     getInfo,
		 getLineOffset, 
		 getTabContent,
		 getTokenArray,
		 getTransformationMap,
		 lineMap } from './sketch';
import { TOP_LEVEL_KEYWORDS } from './grammar/terms/javaSpecific';
import { Definition } from "vscode-languageserver";
import { connect } from 'http2';
import { connection } from './server';

let foundDeclaration: [string,string,number,number][] = new Array();
let _foundDeclarationCount = 0;

export function scheduleLookUpDefinition(receivedUri: string, lineNumber: number, charNumber: number): Definition | null  {
	let currentContent = getTabContent(receivedUri);
	if (!currentContent) {
		return null;
	}
	let splitDefine = currentContent.split("\n");
	let currentLine = splitDefine[lineNumber];
	let currentDefineMap = lineMap(currentLine);
	let adjustOffset = getLineOffset();
	let tokenArray = getTokenArray();

	tokenArray.forEach(function(token){
		if(token[1] instanceof ClassDeclarationContext){
			if(!(TOP_LEVEL_KEYWORDS.indexOf(token[0].text) > -1)){
				foundDeclaration[_foundDeclarationCount] = [`class`, token[0].text, token[0].payload._line, token[0].payload._charPositionInLine];
				_foundDeclarationCount +=1;
			}
		} else if(token[1] instanceof VariableDeclaratorIdContext){
			foundDeclaration[_foundDeclarationCount] = [`var`, token[0].text, token[0].payload._line, token[0].payload._charPositionInLine];
			_foundDeclarationCount +=1;
		} else if(token[1] instanceof MethodDeclarationContext){
			foundDeclaration[_foundDeclarationCount] = [`method`, token[0].text, token[0].payload._line, token[0].payload._charPositionInLine];
			_foundDeclarationCount +=1;
		}
	})

	let finalDefinition: Definition | null = null;
	currentDefineMap.forEach(function(word){
		if((word[1] <= charNumber) && (charNumber <= word[2])){
			foundDeclaration.forEach(function(declarationName){
				if(word[0] == declarationName[1]){

					let lineNumberJavaFile = declarationName[2]-adjustOffset;
					let diffLine : number = 0;
					let docUri : string = '';
					let transformMap = getTransformationMap();
					if (transformMap.get(lineNumberJavaFile)) {
						diffLine = transformMap.get(lineNumberJavaFile)!.lineNumber;
						let docName =  transformMap.get(lineNumberJavaFile)!.fileName;
						docUri = getInfo().uri + docName;
					}

					let charOffset = getCharacterOffset(lineNumberJavaFile, declarationName[2]);

					finalDefinition = {
						uri: docUri,
						range:{
							start: {
								line: diffLine,
								character: declarationName[3] - charOffset -1
							},
							end: {
								line: diffLine,
								character: declarationName[3] + word[0].length - charOffset -1
							}
						}
					}
				}
			})
		}
	})
	clearTempAST();
	return finalDefinition;
}

function clearTempAST(){
	foundDeclaration = [];
	_foundDeclarationCount = 0;
}
