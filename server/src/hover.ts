import { connection } from './server';
import { getTabContent, lineMap } from './sketch';

const path = require("path");
const fs = require("fs");
import { Hover, MarkedString, TextDocumentPositionParams } from "vscode-languageserver";


//Insights for keywords
export let insightMap: [string, string][] = new Array();
let _insightCounter = 0;

//RegExp to remove html tags from description
const startardTagRegex = /<[/]*\w+>/g;
const shortHandedRegex = /<\w+[ ]*[/]+>/g;

try {
	const insightsPath = path.join(__dirname, "processing", "insightscontainer", "insightlist.txt");
	let data = fs.readFileSync(insightsPath, "utf-8");
	let insightSplitMap = data.split("\n").map((line : any) => line.trim());

	insightSplitMap.forEach(function(value: any) {
		if (value.includes(`.xml`)) {
			const tempfilePath = path.join(__dirname, "processing", "lspinsights", value);
			let tempfileData = fs.readFileSync(tempfilePath, "utf-8") as string;
			let mainDescription : string;

			try {
				mainDescription = (tempfileData.split("<description><![CDATA[")[1]).split("]]></description>")[0];
				mainDescription = mainDescription.replace(startardTagRegex, ``);
				mainDescription = mainDescription.replace(shortHandedRegex, ``);
			} catch (e) {
				mainDescription = "Unable to find hover descriptions";
			}
			if (value.includes(`_`)) {
				let tempKey = value.substring(0, value.length - 4).split(`_`);
				insightMap[_insightCounter] = [tempKey[1], `${tempKey[0]} - ${mainDescription}` as string];
			} else {
				insightMap[_insightCounter] = [value.substring(0, value.length - 4), `${mainDescription}`]
			}
			_insightCounter += 1;
		}
	});
} catch (e) {
	connection.console.log("Error during fetching hover descriptions");
}

export function onHoverinFile(params: TextDocumentPositionParams, errorLine: number = -10): Hover | null {
if (errorLine -1 != params.position.line ) {
	let currentContent = getTabContent(params.textDocument.uri);
	if (!currentContent){
		return null;
	}

	let splitHover = currentContent.split(`\n`);
	let currentLine = splitHover[params.position.line];
	let hover: Hover | null = null;
	let hoverMap = lineMap(currentLine);

	hoverMap.forEach(function(word) {
		if ((word[1] <= params.position.character) && (params.position.character <= word[2])) {
			insightMap.forEach(function(value) {
				if (value[0] == word[0]) {
					hover = {
						contents: MarkedString.fromPlainText(value[1]),
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
					}
				}
			});
		}
	});
	return hover;
} else {
	return null;
}
}