import { getCharacterOffset,
	     getInfo,
		 getLineOffset,
		 getTabContent,
		 getTokenArray,
		 getTransformationMap,
		 lineMap } from "./sketch";

import { Location, ReferenceParams } from "vscode-languageserver";


export function scheduleLookUpReference(_referenceParams: ReferenceParams): Location[] | null{
	let resultant: Location[] | null;
	let currentContent = getTabContent(_referenceParams.textDocument.uri);
	if(!currentContent){
		return null;
	}
	let splitDefine = currentContent.split(`\n`);
	let currentLine = splitDefine[_referenceParams.position.line];
	let currentReferenceMap = lineMap(currentLine);
	let tokenArray = getTokenArray();
	let adjustOffset = getLineOffset();

	let multipleTokenOccuranceLocations: Location[] = new Array();
	let _multipleTokenCount = 0;

	currentReferenceMap.forEach(function(word) {
		if((word[1] <= _referenceParams.position.character) && (_referenceParams.position.character <=word[2])) {
			tokenArray.forEach(function(token) {
				if(token[0].text == word[0]){
					let lineNumberJavaFile = token[0].payload._line - adjustOffset;
					let refLine : number = 0;
					let docUri : string = '';
					let transformMap = getTransformationMap();
					if (transformMap.get(lineNumberJavaFile)) {
						refLine = transformMap.get(lineNumberJavaFile)!.lineNumber;
						let docName = transformMap.get(lineNumberJavaFile)?.fileName;
						docUri = getInfo().uri + docName;
					}

					let charOffset = getCharacterOffset(lineNumberJavaFile, token[0].payload._line);

					multipleTokenOccuranceLocations[_multipleTokenCount] = {
						uri: docUri,
						range: {
							start : {
								line: refLine,
								character: token[0].payload._charPositionInLine - charOffset - 1
							},
							end : {
								line: refLine,
								character: token[0].payload._charPositionInLine + word[0].length - charOffset - 1
							}
						}
					}
					_multipleTokenCount += 1;
				}
			});
		} 
	});

	if (multipleTokenOccuranceLocations.length > 0) {
		resultant = multipleTokenOccuranceLocations
	}else {
		resultant =null;
	}
	return resultant;
}