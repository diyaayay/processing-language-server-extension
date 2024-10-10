"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialize = initialize;
exports.build = build;
exports.updateContent = updateContent;
exports.addTab = addTab;
exports.removeTab = removeTab;
exports.getInfo = getInfo;
exports.getContent = getContent;
exports.getFileNames = getFileNames;
exports.getTabContent = getTabContent;
exports.getLineOffset = getLineOffset;
exports.getCharacterOffset = getCharacterOffset;
exports.getTokenArray = getTokenArray;
exports.getCompileErrors = getCompileErrors;
exports.getTransformationMap = getTransformationMap;
exports.lineMap = lineMap;
const parser = require("./parser");
const pStandards = require("./grammar/terms/processingStandards");
const preprocessor = require("./preprocessing");
const server_1 = require("./server");
const fs = require("fs");
const pathM = require("path");
const child_process = require("child_process");
let sketchInfo;
let contents = new Map();
let initialized = false;
let unProcessedCode = '';
let processedCode = '';
let compileErrors;
let tokenArray;
let jrePath = '';
let transformMap = new Map();
/**
 * Initializes a sketch.
 *
 * @param textDocument  .pde file(tab)
 * @returns
 */
function initialize(textDocument) {
    let uri = pathM.dirname(textDocument.uri) + '/';
    let path = getPathFromUri(uri);
    let name = pathM.basename(path);
    sketchInfo = {
        uri: uri,
        path: path,
        name: name
    };
    jrePath = `${__dirname.substring(0, __dirname.length - 11)}/jre/bin`;
    server_1.connection.console.log(jrePath);
    try {
        let mainFileName = sketchInfo.name + ".pde";
        let mainFileContents = fs.readFileSync(sketchInfo.path + mainFileName, "utf-8");
        contents.set(mainFileName, mainFileContents);
    }
    catch (e) {
        server_1.connection.console.log("Something went wrong while loading the main file");
        return false;
    }
    try {
        let fileNames = fs.readdirSync(sketchInfo.path);
        fileNames.forEach((fileName) => {
            if (fileName.endsWith(".pde")) {
                let tabContents = fs.readFileSync(sketchInfo.path + fileName, "utf-8");
                contents.set(fileName, tabContents);
            }
        });
    }
    catch (e) {
        server_1.connection.console.log("Some thing went wrong while loading the other files");
        return false;
    }
    initialized = true;
    return true;
}
/**
 * Builds the java sketch
 * @param textDocument
 */
function build(textDocument) {
    if (!initialized) {
        initialize(textDocument);
    }
    updateContent(textDocument);
    unProcessedCode = getContent();
    processedCode = preprocessor.performPreProcessing(unProcessedCode);
    tokenArray = parser.parseAST(processedCode);
    compile(processedCode);
    let pwd;
    if (process.platform === 'win32') {
        let cwd = __dirname.replace(/(\\)/g, "/");
        pwd = `${cwd}/compile/${pStandards.defaultClassName}.java`;
    }
    else {
        pwd = `${__dirname}/compile/${pStandards.defaultClassName}.java`;
    }
    getCompilationErrors(pwd);
}
/**
 * Updates the sketch based on the changed document.
 * The tranform dict is automatically updated to the new changes
 *
 * @param changedDocument Document of which the content should be updated
 * @returns Update succes state
 */
function updateContent(changedDocument) {
    if (!initialized) {
        return false;
    }
    //Update content
    let tabName = pathM.basename(changedDocument.uri);
    if (tabName.endsWith('.pde')) {
        contents.set(tabName, changedDocument.getText());
    }
    //Update transformation dict
    let bigCount = 1;
    for (let [fileName, fileContents] of contents) {
        fileContents += '\n';
        bigCount = getTransformDict(fileName, fileContents, bigCount);
    }
    return true;
}
/**
 * Appends the name and content of a .pde file (tab)
 * to the content map of the sketch
 *
 * @param uri Location to the file that needs adding
 */
function addTab(uri) {
    if (initialized) {
        let fileName = pathM.basename(uri);
        if (fileName.endsWith('.pde')) {
            let tabContents = fs.readdirSync(sketchInfo.path + fileName, 'utf-8');
            contents.set(fileName, tabContents);
        }
    }
}
/**
 * Deletes the name and content of a .pde file (tab)
 * from the sketch content map
 *
 * @param uri Location to the file that needs removing
 */
function removeTab(uri) {
    if (initialized) {
        let fileName = pathM.basename(uri);
        if (fileName.endsWith('.pde') && contents.has(fileName)) {
            contents.delete(fileName);
        }
    }
}
/**
 * Provides the basic sketch info
 * @returns Sketch ifo
 */
function getInfo() {
    return sketchInfo;
}
/**
 * Provides the current content of a sketch.
 *
 * @returns sketch content
 */
function getContent() {
    if (!initialized) {
        return '';
    }
    let content = '';
    for (let [fileName, fileContents] of contents) {
        fileContents += '\n';
        content += fileContents;
    }
    return content;
}
/**
 * Provides all the names of the files used by the sketch
 *
 * @returns sketch file names
 */
function getFileNames() {
    if (!initialized) {
        return;
    }
    let fileNames = new Array;
    for (let [fileName, fileContents] of contents) {
        fileNames.push(fileName);
    }
    return fileNames;
}
/**
 * Provides the content of a single (.pde) file/tab
 *
 * @param uri Uri to the file
 * @returns tab content or undefined if no file is found
 */
function getTabContent(uri) {
    if (!initialized) {
        return;
    }
    let tabName = pathM.basename(uri);
    for (let [fileName, fileContents] of contents) {
        if (fileName == tabName) {
            return fileContents;
        }
    }
    return;
}
/**
 * The number of lines added during preprocessing
 * @returns number of lines added during preprocessing
 */
function getLineOffset() {
    let adjustOffset = 0;
    let behaviourType = preprocessor.getBehavoirType();
    if (behaviourType.defaultEnabled) {
        adjustOffset = pStandards.reduceLineDefaultBehaviour;
    }
    else if (behaviourType.methodEnabled) {
        adjustOffset = pStandards.reduceLineMethodBehaviour;
    }
    return adjustOffset;
}
/**
 * Calculates the difference between two line lengths in the processedText and unprocessedText.
 * Preprocessing could add acces modifiers to the code. Which changes the position of some symbols.
 * This creates a problem when needing the correct character position of a symbol for features where
 * the position is relevant like rename.
 *
 * @param unProcessedLineNumber The unprocessed text line number to use.
 * @param processedLineNumber The processed text line number to use.
 * @returns The amount of characters to offset
 */
function getCharacterOffset(unProcessedLineNumber, processedLineNumber) {
    let offset = 0;
    let processedTextSplit = processedCode.split(/\r\n|\n/);
    let unProcessedTextSplit = unProcessedCode.split(/\r\n|\n/);
    //Arrays start at 0, lineNumbers at 1. So offset
    unProcessedLineNumber -= 1;
    processedLineNumber -= 1;
    let processedLine = processedTextSplit[processedLineNumber];
    let unProcessedLine = unProcessedTextSplit[unProcessedLineNumber];
    offset = processedLine.length - unProcessedLine.length;
    if (offset < 0) {
        offset = 0;
    }
    return offset;
}
/**
 * Provides the token parsetree provided by the parser
 *
 * @returns The token parse tree of the sketch
 */
function getTokenArray() {
    return tokenArray;
}
/**
 * Provides a array of all compile errors
 * @returns Array of all compile errors
 */
function getCompileErrors() {
    return compileErrors;
}
/**
 * Provides the tranformation map which maps the compiled java-code
 * and its linenumbers to the original tab (.pde file) code
 * @returns transformation map
 */
function getTransformationMap() {
    return transformMap;
}
/**
 * Parses a line to extract each word and
 * its start- and endPos within the parsed line
 *
 * @param line Line to be mapped
 * @returns [word, startPos, endPos][]
 */
function lineMap(line) {
    return parser.lineMap(line);
}
/**
 * Runs the compiler to check the java-code on error's
 *
 * @param processedCode Code to compile
 */
function compile(processedCode) {
    // mkdir /out/compile
    // make sure to set .classpath for Processing core as environment variable
    // This suites for raw java case - should handle for default and setupDraw case
    try {
        fs.writeFileSync(__dirname + "/compile/" + pStandards.defaultClassName + ".java", processedCode);
    }
    catch (e) {
        server_1.connection.console.log("Java File Creation failed");
        ;
    }
    try {
        child_process.execSync(`${jrePath}/java --module compilerModule/com.compiler ${__dirname}/compile/${pStandards.defaultClassName}.java > ${__dirname}/compile/child_process.txt`, { stdio: ['inherit', 'pipe', 'pipe'], windowsHide: true });
        server_1.connection.console.log("Java File compiled");
    }
    catch (e) {
        server_1.connection.console.log("Java file compilation failed");
    }
}
/**
 * Creates compile error array from the compiler output
 *
 * @param pwd Path to the error.txt file generated by the compiler
 */
function getCompilationErrors(pwd) {
    // If one error is fixed it's not popped from stack - check
    try {
        compileErrors = new Array();
        let data = fs.readFileSync(`${__dirname}/compile/error.txt`, 'utf-8');
        if (data == '') {
            // No Error on Compilation
            server_1.connection.console.log("No error on compilation");
        }
        else if (data.split(`:`)[0] == `Note`) {
            // Compilation warning
            server_1.connection.console.log("Compilation warning encountered");
        }
        else {
            let tempSplit = data.split("\n");
            tempSplit.forEach(function (line, index) {
                if (line.includes(`${pwd}`)) {
                    let innerSplit = line.split(":");
                    let splitIndex;
                    if (process.platform === 'win32') {
                        splitIndex = 3;
                    }
                    else {
                        splitIndex = 2;
                    }
                    // Handling line number based on current Behaviour 
                    let errorLineNumber = +innerSplit[splitIndex].replace("L", "") - getLineOffset();
                    let localIndex = index + 1;
                    let errorMessage = "";
                    while (true) {
                        if (localIndex >= tempSplit.length) {
                            break;
                        }
                        else if (tempSplit[localIndex].includes(`${pwd}`) ||
                            tempSplit[localIndex].includes(`error`) ||
                            tempSplit[localIndex].includes(`errors`)) {
                            break;
                        }
                        else {
                            errorMessage += `\n ${tempSplit[localIndex]}`;
                            localIndex += 1;
                        }
                    }
                    compileErrors.push({ lineNumber: errorLineNumber, message: errorMessage });
                }
            });
            // Place a break point
            server_1.connection.console.log("Compilation errors encountered");
        }
    }
    catch (e) {
        server_1.connection.console.log("Problem with generating diagnostics");
    }
}
/**
 * Updates the sketch transformation map
 *
 *
 * @param fileName Name of the .pde file (tab)
 * @param fileContents Contents of the .pde file (tab)
 * @param bigCount Line number in the created java file
 * @returns
 */
function getTransformDict(fileName, fileContents, bigCount) {
    // Revert big count due to new line at end of a tab
    if (bigCount > 1) {
        bigCount -= 1;
    }
    try {
        // Create transformation Dictonary
        let lineCount = 1;
        fileContents.split(/\r?\n/).forEach((line) => {
            transformMap.set(bigCount, { lineNumber: lineCount, fileName: fileName });
            bigCount++;
            lineCount++;
        });
        server_1.connection.console.log(`Transform dictonary created for : ${fileName}`);
    }
    catch (e) {
        server_1.connection.console.log(`Tranfsomation dictonary creation failed`);
    }
    return bigCount;
}
/**
 * Transforms a file uri to a path
 *
 * @param uri File based Uniform resource identifier
 * @returns Path in OS style
 */
function getPathFromUri(uri) {
    let path = uri.replace('file:///', '');
    path = path.replace('%3A', ':');
    return path;
}
/**
 * Transforms a path to a file uri
 *
 * @param path Path of a file
 * @returns Uniform resource identifier (URI) to the file path
 */
function getUriFromPath(path) {
    let tempUri = path.replace(':', '%3A');
    tempUri = 'file:///' + +tempUri;
    return tempUri;
}
//# sourceMappingURL=sketch.js.map