"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleLookUpDefinition = scheduleLookUpDefinition;
const sketch_1 = require("./sketch");
const javaSpecific_1 = require("./grammar/terms/javaSpecific");
const JavaParser_1 = require("java-ast/dist/parser/JavaParser");
let foundDeclaration = new Array();
let _foundDeclarationCount = 0;
function scheduleLookUpDefinition(receivedUri, lineNumber, charNumber) {
    let currentContent = (0, sketch_1.getTabContent)(receivedUri);
    if (!currentContent) {
        return null;
    }
    let splitDefine = currentContent.split("\n");
    let currentLine = splitDefine[lineNumber];
    let currentDefineMap = (0, sketch_1.lineMap)(currentLine);
    let adjustOffset = (0, sketch_1.getLineOffset)();
    let tokenArray = (0, sketch_1.getTokenArray)();
    tokenArray.forEach(function (token) {
        if (token[1] instanceof JavaParser_1.ClassDeclarationContext) {
            if (!(javaSpecific_1.TOP_LEVEL_KEYWORDS.indexOf(token[0].text) > -1)) {
                foundDeclaration[_foundDeclarationCount] = [`class`, token[0].text, token[0].payload._line, token[0].payload._charPositionInLine];
                _foundDeclarationCount += 1;
            }
        }
        else if (token[1] instanceof JavaParser_1.VariableDeclaratorIdContext) {
            foundDeclaration[_foundDeclarationCount] = [`var`, token[0].text, token[0].payload._line, token[0].payload._charPositionInLine];
            _foundDeclarationCount += 1;
        }
        else if (token[1] instanceof JavaParser_1.MethodDeclarationContext) {
            foundDeclaration[_foundDeclarationCount] = [`method`, token[0].text, token[0].payload._line, token[0].payload._charPositionInLine];
            _foundDeclarationCount += 1;
        }
    });
    let finalDefinition = null;
    currentDefineMap.forEach(function (word) {
        if ((word[1] <= charNumber) && (charNumber <= word[2])) {
            foundDeclaration.forEach(function (declarationName) {
                if (word[0] == declarationName[1]) {
                    let lineNumberJavaFile = declarationName[2] - adjustOffset;
                    let diffLine = 0;
                    let docUri = '';
                    let transformMap = (0, sketch_1.getTransformationMap)();
                    if (transformMap.get(lineNumberJavaFile)) {
                        diffLine = transformMap.get(lineNumberJavaFile).lineNumber;
                        let docName = transformMap.get(lineNumberJavaFile).fileName;
                        docUri = (0, sketch_1.getInfo)().uri + docName;
                    }
                    let charOffset = (0, sketch_1.getCharacterOffset)(lineNumberJavaFile, declarationName[2]);
                    finalDefinition = {
                        uri: docUri,
                        range: {
                            start: {
                                line: diffLine,
                                character: declarationName[3] - charOffset - 1
                            },
                            end: {
                                line: diffLine,
                                character: declarationName[3] + word[0].length - charOffset - 1
                            }
                        }
                    };
                }
            });
        }
    });
    clearTempAST();
    return finalDefinition;
}
function clearTempAST() {
    foundDeclaration = [];
    _foundDeclarationCount = 0;
}
//# sourceMappingURL=definition.js.map