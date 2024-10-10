"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleLookUpReference = scheduleLookUpReference;
const sketch_1 = require("./sketch");
function scheduleLookUpReference(_referenceParams) {
    let resultant;
    let currentContent = (0, sketch_1.getTabContent)(_referenceParams.textDocument.uri);
    if (!currentContent) {
        return null;
    }
    let splitDefine = currentContent.split(`\n`);
    let currentLine = splitDefine[_referenceParams.position.line];
    let currentReferenceMap = (0, sketch_1.lineMap)(currentLine);
    let tokenArray = (0, sketch_1.getTokenArray)();
    let adjustOffset = (0, sketch_1.getLineOffset)();
    let multipleTokenOccuranceLocations = new Array();
    let _multipleTokenCount = 0;
    currentReferenceMap.forEach(function (word) {
        if ((word[1] <= _referenceParams.position.character) && (_referenceParams.position.character <= word[2])) {
            tokenArray.forEach(function (token) {
                var _a;
                if (token[0].text == word[0]) {
                    let lineNumberJavaFile = token[0].payload._line - adjustOffset;
                    let refLine = 0;
                    let docUri = '';
                    let transformMap = (0, sketch_1.getTransformationMap)();
                    if (transformMap.get(lineNumberJavaFile)) {
                        refLine = transformMap.get(lineNumberJavaFile).lineNumber;
                        let docName = (_a = transformMap.get(lineNumberJavaFile)) === null || _a === void 0 ? void 0 : _a.fileName;
                        docUri = (0, sketch_1.getInfo)().uri + docName;
                    }
                    let charOffset = (0, sketch_1.getCharacterOffset)(lineNumberJavaFile, token[0].payload._line);
                    multipleTokenOccuranceLocations[_multipleTokenCount] = {
                        uri: docUri,
                        range: {
                            start: {
                                line: refLine,
                                character: token[0].payload._charPositionInLine - charOffset - 1
                            },
                            end: {
                                line: refLine,
                                character: token[0].payload._charPositionInLine + word[0].length - charOffset - 1
                            }
                        }
                    };
                    _multipleTokenCount += 1;
                }
            });
        }
    });
    if (multipleTokenOccuranceLocations.length > 0) {
        resultant = multipleTokenOccuranceLocations;
    }
    else {
        resultant = null;
    }
    return resultant;
}
//# sourceMappingURL=references.js.map