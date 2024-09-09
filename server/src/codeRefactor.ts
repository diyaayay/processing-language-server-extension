import * as pStandards from "./grammar/terms/processingStandards";

/**
 * code to Refactor
 * 
 * @param refactorCode
 * @returns Refactored code
 */
// from extension host

let startEncountered:boolean;
let settingsSet = new Set<string>();

export function pipeLine(refactorCode: string): string {
	startEncountered = false;
	let refactoredCode =``;
	let unprocessedLines = refactorCode.split(`\n`);

	//iterate through each line
	unprocessedLines.forEach(function(line) {
		line = addExplicitAccessModifier(line);
		line = removeComments(line);
		line = extractEnvironmentCalls(line)
		line = addFloatingIndicator(line)
		line = increaseIndent(line)
		refactoredCode += `\n${line}`;
});
return refactoredCode;
}


//utils

// function processLine(line: string, settingSet: Set<string>, startEncountered:boolean) : string {
// 	line = addExplicitAccessModifier(line);
// 	line = removeComments(line, startEncountered);
// 	line = extractEnvironmentCalls(line, settingsSet);
// 	line = addFloatingIndicator(line);
// 	line = increaseIndent(line);
// 	return line;
// }


/**
 * public modifier if none specified
 * 
 * @param line checks access modifier
 * @returns sets explicit public access modifier
 */
function addExplicitAccessModifier(line : string) : string {
	if(pStandards.methodPattern.exec(line) &&
	   !(
		line.includes(`public`) ||
		line.includes(`private`) ||
		line.includes(`protected`) ||
		pStandards.ifelsePattern.exec(line)
	   )
	){
		let whiteSpaces = line.search(/[^\\t\s]/);
		return line.substring(0, whiteSpaces) + "public " + line.substring(whiteSpaces);
	   }
	   return line;
}
 

/**
 * Adds one tab to the beginning of a line
 * 
 * @param line code string
 * @returns Line with increased indent
 */
function increaseIndent(line : string) : string{
	return `	${line}`
}


/**
 * Removes comment
 * 
 * @param line //single line comment
 * @returns line wihtout comment
 */
function removeSingleComment(line : string) : string {
	return line.replace(pStandards.singleLineComment,``);
}

/**
 * Erases block line comment
 * 
 * @param line block comments
 * @returns line wihtout comments
 */
function removeBlockComment(line : string) : string {
	if(pStandards.multiLineCommentComponents[0].exec(line)) {
		startEncountered = true;
	}
	if(startEncountered && pStandards.multiLineCommentComponents[1].exec(line)) {
		startEncountered = false;
		line = ``;
	}
	return line;
	
}


/**
 * uses float instead of double using f indicator
 * 
 * @param line
 * @returns line with floating point indicator
 */
function addFloatingIndicator(line : string) : string {
	return line.replace(/([0-9]+\.[0-9]+)/g, "$1f");
}

/**
 * @param line line to check for environment calls
 * @returns line without environment call
 */
function extractEnvironmentCalls(line: string) : string {
	if(pStandards.sizePattern.exec(line) ||
	pStandards.fullScreenPattern.exec(line) ||
	pStandards.smoothPattern.exec(line) ||
	pStandards.noSmoothPatterns.exec(line)){
		settingsSet.add(line);
		line = ``;
}
return line;
}

/**
 * Creates a settings() function which includes the environment calls extracted
 * by @see extractEnvironmentCallsInSetup
 * 
 * @returns code with environment calls in a settings() function
 */
function addSettingsFunction() : string{
	let settingsContext = ``;
	let index = 0;
	settingsSet.forEach(function(setting : any){
		settingsContext += `${setting}`;
		index ++;
		if(index < settingsSet.size) {
			settingsContext += `\n`;
		}
	})
	let settingsFunction = '';
	if (settingsContext != ``) {
		settingsFunction = pStandards.preprocessingSettings(settingsContext);
	}
	return settingsFunction;
}

/**
 * Changes typecasting to processing specific calls
 * @returns processing specific calls
 */
function convertCastingCalls(processText : string) : string {
	pStandards.castingConversionTuples.forEach(function(tuple){
		processText = processText.replace(tuple[0], tuple[1]);
	});
	return processText;
}
/**
 * Erases single and block comments
 * 
 * @param line line to check for comments
 * @returns line without comments
 */
function removeComments(line : string) : string {
	line = removeSingleComment(line)
	line = removeBlockComment(line)

	return line
}