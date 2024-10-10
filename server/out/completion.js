"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reader = void 0;
exports.asCompletionItem = asCompletionItem;
exports.findCompletionItemKind = findCompletionItemKind;
exports.getCompletionMethods = getCompletionMethods;
//for code completion
const vscode_languageserver_1 = require("vscode-languageserver");
const server_1 = require("./server");
const model_1 = require("./grammar/terms/model");
const sketch_1 = require("./sketch");
const asutils_1 = require("./asutils");
const JavaParser_1 = require("java-ast/dist/parser/JavaParser");
const fs = require("fs");
const { JavaClassFileReader } = require('java-class-tools');
const path = require('path');
exports.reader = new JavaClassFileReader();
const extractionModules = [
    path.join(__dirname, 'processing', 'container', 'core.txt'),
    path.join(__dirname, 'processing', 'container', 'awt.txt'),
    path.join(__dirname, 'processing', 'container', 'data.txt'),
    path.join(__dirname, 'processing', 'container', 'event.txt'),
    path.join(__dirname, 'processing', 'container', 'javafx.txt'),
    path.join(__dirname, 'processing', 'container', 'opengl.txt')
];
const extractionModuleType = [
    "core", "awt", "data", "event", "javafx", "opengl"
];
let currentCompletionClass = `PApplet`;
let completionConstantClass = `PConstants`;
let classMap = new Map();
let completionClassMap = new Map();
for (let _counter = 0; _counter < 6; _counter++) {
    try {
        let data = fs.readFileSync(extractionModules[_counter], 'utf-8');
        let tempSplit = data.split('\n');
        let tempCheck = [];
        let _innerCounter = 0;
        tempSplit.forEach(function (className) {
            if (!className.includes('$') && className.includes('.class')) {
                tempCheck[_innerCounter] = className;
                _innerCounter += 1;
            }
        });
        classMap.set(extractionModuleType[_counter], tempCheck);
    }
    catch (e) { }
}
initAllCompletionClasses();
function initAllCompletionClasses() {
    extractionModuleType.forEach(value => {
        const classes = classMap.get(value); //all classes in module
        if (classes) {
            classes.forEach((element) => {
                const filePath = path.join(__dirname, "processing", "extractor", value, element).replace(/\r?\n|\r/g, '');
                console.log(`class read success :) ${filePath}`);
                if (fs.existsSync(filePath)) {
                    completionClassMap.set(element, PCompletionMethods(exports.reader.read(filePath)));
                }
            });
        }
        else {
            console.warn(`No classes found for Module Type: ${value}`);
        }
    });
}
let completeCustomMap = new Map();
try {
    let data = fs.readFileSync(`${__dirname}/processing/customcontainer/custom.txt`, 'utf-8');
    let customSplitMap = data.split(`\n`);
    customSplitMap.forEach(function (value) {
        if (value.includes(`.class`)) {
            completeCustomMap.set(value, PCompletionMethods(exports.reader.read(`${__dirname}/processing/custom/${value}`)));
        }
    });
}
catch (e) { }
function asCompletionItem(completionEntry, completionType) {
    const item = {
        label: completionEntry,
        kind: completionType,
        filterText: completionEntry
    };
    return item;
}
function PCompletionMethods(classType) {
    let completionItemList = [];
    let _addIncValue = 0;
    let methodSet = new Set();
    let fieldSet = new Set();
    classType.methods.forEach((method) => {
        const nameInConstantPool = classType.constant_pool[method.name.index];
        const name = String.fromCharCode.apply(null, nameInConstantPool.bytes);
        methodSet.add(name);
    });
    classType.fields.forEach((field) => {
        const nameInConstantPool = classType.constant_pool[field.name_index];
        const name = String.fromCharCode.apply(null, nameInConstantPool.bytes);
        fieldSet.add(name);
    });
    methodSet.forEach(function (method) {
        completionItemList[_addIncValue] = asCompletionItem(`${method}()`, findCompletionItemKind(2));
        _addIncValue += 1;
    });
    return completionItemList;
}
function findCompletionItemKind(value) {
    let completionKind = vscode_languageserver_1.CompletionItemKind.Text;
    switch (value) {
        case 1:
            completionKind = vscode_languageserver_1.CompletionItemKind.Text;
            break;
        case 2:
            completionKind = vscode_languageserver_1.CompletionItemKind.Method;
            break;
        case 3:
            completionKind = vscode_languageserver_1.CompletionItemKind.Function;
            break;
        case 4:
            completionKind = vscode_languageserver_1.CompletionItemKind.Constructor;
            break;
        case 5:
            completionKind = vscode_languageserver_1.CompletionItemKind.Field;
            break;
        case 6:
            completionKind = vscode_languageserver_1.CompletionItemKind.Variable;
            break;
        case 7:
            completionKind = vscode_languageserver_1.CompletionItemKind.Class;
            break;
        case 8:
            completionKind = vscode_languageserver_1.CompletionItemKind.Interface;
            break;
        case 9:
            completionKind = vscode_languageserver_1.CompletionItemKind.Module;
            break;
        case 10:
            completionKind = vscode_languageserver_1.CompletionItemKind.Property;
            break;
        case 11:
            completionKind = vscode_languageserver_1.CompletionItemKind.Unit;
            break;
        case 12:
            completionKind = vscode_languageserver_1.CompletionItemKind.Value;
            break;
        case 13:
            completionKind = vscode_languageserver_1.CompletionItemKind.Enum;
            break;
        case 14:
            completionKind = vscode_languageserver_1.CompletionItemKind.Keyword;
            break;
        case 15:
            completionKind = vscode_languageserver_1.CompletionItemKind.Snippet;
            break;
        case 16:
            completionKind = vscode_languageserver_1.CompletionItemKind.Color;
            break;
        case 17:
            completionKind = vscode_languageserver_1.CompletionItemKind.File;
            break;
        case 18:
            completionKind = vscode_languageserver_1.CompletionItemKind.Reference;
            break;
        case 19:
            completionKind = vscode_languageserver_1.CompletionItemKind.Folder;
            break;
        case 20:
            completionKind = vscode_languageserver_1.CompletionItemKind.EnumMember;
            break;
        case 21:
            completionKind = vscode_languageserver_1.CompletionItemKind.Constant;
            break;
        case 22:
            completionKind = vscode_languageserver_1.CompletionItemKind.Struct;
            break;
        case 23:
            completionKind = vscode_languageserver_1.CompletionItemKind.Event;
            break;
        case 24:
            completionKind = vscode_languageserver_1.CompletionItemKind.Operator;
            break;
        case 25:
            completionKind = vscode_languageserver_1.CompletionItemKind.TypeParameter;
            break;
        default:
            break;
    }
    return completionKind;
}
function getCompletionMethods(_textDocumentParams, latestChanges) {
    let resultantCompletionItem = [];
    let lineStartMethodBody = [];
    let lineEndMethodBody = [];
    let avoidLineAuto = [];
    let _methodCounter = 0;
    let _avoidCounter = 0;
    let _classNameCounter = 0;
    let tokenArray = (0, sketch_1.getTokenArray)();
    let currentLineInWorkspace = _textDocumentParams.position.line;
    tokenArray.forEach(function (node, index) {
        if (node[1] instanceof JavaParser_1.TypeTypeOrVoidContext || node[1] instanceof JavaParser_1.PrimitiveTypeContext) {
            avoidLineAuto[_avoidCounter] = node[1]._start.line;
            _avoidCounter += 1;
        }
    });
    tokenArray.forEach(function (node, index) {
        if (node[1] instanceof JavaParser_1.ClassOrInterfaceTypeContext && tokenArray[index + 1][1] instanceof JavaParser_1.VariableDeclaratorIdContext) {
            model_1.variableDeclarationcontext[_classNameCounter] = [node[0], tokenArray[index + 1][1]];
            _classNameCounter += 1;
        }
    });
    lineStartMethodBody.forEach(function (value, index) {
        lineStartMethodBody[index] = value - (0, sketch_1.getLineOffset)();
    });
    lineEndMethodBody.forEach(function (value, index) {
        lineEndMethodBody[index] = value - (0, sketch_1.getLineOffset)();
    });
    avoidLineAuto.forEach(function (value, index) {
        avoidLineAuto[index] = value - (0, sketch_1.getLineOffset)();
    });
    lineStartMethodBody.forEach(function (value, index) {
        if (value <= currentLineInWorkspace && lineEndMethodBody[index] >= currentLineInWorkspace) {
            // Default completion class members -> PApplet and PConstants
            resultantCompletionItem = completionClassMap.get(`${currentCompletionClass}.class`).concat(completionClassMap.get(`${completionConstantClass}.class`));
        }
    });
    avoidLineAuto.forEach(function (value, index) {
        if (value == currentLineInWorkspace + 2) {
            resultantCompletionItem = [];
        }
    });
    let currentLineSplit = latestChanges.getText().split("\n");
    if (_textDocumentParams.context.triggerCharacter == `.`) {
        let tempLine = currentLineSplit[currentLineInWorkspace].split(`.`)[0].split(` `);
        let objectName = tempLine[tempLine.length - 1];
        resultantCompletionItem = completionClassMap.get(`${objectName}.class`);
    }
    if (model_1.variableDeclarationcontext.length > 0) {
        model_1.variableDeclarationcontext.forEach(function (value, index) {
            if (_textDocumentParams.context.triggerCharacter == `.`) {
                let tempLine = currentLineSplit[currentLineInWorkspace].split(`.`)[0].split(` `);
                let objectName = tempLine[tempLine.length - 1];
                if (value[1].text == objectName) {
                    resultantCompletionItem = completionClassMap.get(`${value[0].text}.class`);
                    if (resultantCompletionItem == undefined) {
                        resultantCompletionItem = completeCustomMap.get(`${value[0].text}.class`);
                        if (resultantCompletionItem == undefined) {
                            // Handle for locally declared classes
                            (0, asutils_1.constructClassParams)(tokenArray);
                            let tempCompletionList = [];
                            let _tempCounter = 0;
                            asutils_1.fieldAndClass.forEach(function (fieldName, index) {
                                if (fieldName[0] == value[0].text) {
                                    tempCompletionList[_tempCounter] = asCompletionItem(fieldName[1], findCompletionItemKind(5));
                                    _tempCounter += 1;
                                }
                            });
                            asutils_1.memberAndClass.forEach(function (methodName, index) {
                                if (methodName[0] == value[0].text) {
                                    tempCompletionList[_tempCounter] = asCompletionItem(`${methodName[1]}()`, findCompletionItemKind(2));
                                    _tempCounter += 1;
                                }
                            });
                            resultantCompletionItem = tempCompletionList;
                            (0, asutils_1.flushRecords)();
                        }
                    }
                }
            }
        });
    }
    // Local class declaratio and their dependent fields/methods for auto comppletion
    (0, model_1.clearVariableDeclarationContext)();
    (0, model_1.clearLocalClassDeclarators)();
    server_1.connection.console.log("AutoCompletion Invoked");
    return resultantCompletionItem;
}
//# sourceMappingURL=completion.js.map