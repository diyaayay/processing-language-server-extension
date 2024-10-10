"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insightMap = void 0;
exports.onHoverinFile = onHoverinFile;
const server_1 = require("./server");
const sketch_1 = require("./sketch");
const path = require("path");
const fs = require("fs");
const vscode_languageserver_1 = require("vscode-languageserver");
//Insights for keywords
exports.insightMap = new Array();
let _insightCounter = 0;
//RegExp to remove html tags from description
const startardTagRegex = /<[/]*\w+>/g;
const shortHandedRegex = /<\w+[ ]*[/]+>/g;
try {
    const insightsPath = path.join(__dirname, "processing", "insightscontainer", "insightlist.txt");
    let data = fs.readFileSync(insightsPath, "utf-8");
    let insightSplitMap = data.split("\n").map((line) => line.trim());
    insightSplitMap.forEach(function (value) {
        if (value.includes(`.xml`)) {
            const tempfilePath = path.join(__dirname, "processing", "lspinsights", value);
            let tempfileData = fs.readFileSync(tempfilePath, "utf-8");
            let mainDescription;
            try {
                mainDescription = (tempfileData.split("<description><![CDATA[")[1]).split("]]></description>")[0];
                mainDescription = mainDescription.replace(startardTagRegex, ``);
                mainDescription = mainDescription.replace(shortHandedRegex, ``);
            }
            catch (e) {
                mainDescription = "Unable to find hover descriptions";
            }
            if (value.includes(`_`)) {
                let tempKey = value.substring(0, value.length - 4).split(`_`);
                exports.insightMap[_insightCounter] = [tempKey[1], `${tempKey[0]} - ${mainDescription}`];
            }
            else {
                exports.insightMap[_insightCounter] = [value.substring(0, value.length - 4), `${mainDescription}`];
            }
            _insightCounter += 1;
        }
    });
}
catch (e) {
    server_1.connection.console.log("Error during fetching hover descriptions");
}
function onHoverinFile(params, errorLine = -10) {
    if (errorLine - 1 != params.position.line) {
        let currentContent = (0, sketch_1.getTabContent)(params.textDocument.uri);
        if (!currentContent) {
            return null;
        }
        let splitHover = currentContent.split(`\n`);
        let currentLine = splitHover[params.position.line];
        let hover = null;
        let hoverMap = (0, sketch_1.lineMap)(currentLine);
        hoverMap.forEach(function (word) {
            if ((word[1] <= params.position.character) && (params.position.character <= word[2])) {
                exports.insightMap.forEach(function (value) {
                    if (value[0] == word[0]) {
                        hover = {
                            contents: vscode_languageserver_1.MarkedString.fromPlainText(value[1]),
                            range: {
                                start: {
                                    line: params.position.line,
                                    character: word[1]
                                },
                                end: {
                                    line: params.position.line,
                                    character: word[2]
                                }
                            }
                        };
                    }
                });
            }
        });
        return hover;
    }
    else {
        return null;
    }
}
//# sourceMappingURL=hover.js.map