export const classChecker = `class`;
export const newChecker = `new`;
export let defaultClassName = "ProcessingDefault";
const defaultLib = `PApplet`;

//Dynamic Imports should be of the format - `import __.__.__;`

const staticImports = `import processing.core.*\;
import processing.awt.*\;
import processing.data.*\;
import processing.event.*\;
import processing.opengl.*\;
import java.util.*\;
import java.io.*\;
import java.lang.*\;
`;

export const reduceLineDefaultBehaviour = 13;
export const reduceLineMethodBehaviour = 12;

//remove duplicate code from stack
export let removeGeneratedToken = [
	`ProcessingDefault`,
	`main`,
	`args`
];

export const sizePattern = /(size)\([ ]*[0-9]+[ ]*\,[ ]*[0-9]+[ ]*\,*[ ]*[A-Z 0-9]{0,}[ ]*\)\;/ 
export const fullScreenPattern = /(fullScreen)\([ ]*[A-Z 0-9]{0,}[ ]*\,*[ ]*[0-9]*[ ]*\)\;/
export const smoothPattern = /(smooth)\([ ]*[0-9]+[ ]*\)\;/
export const noSmoothPatterns = /(noSmooth)\(\)\;/
export const ifelsePattern = /[ ]*(else)[ ]*(if)[ ]*\(/g
export const singleLineComment = /\/\/(.)*/g
export const multiLineCommentComponents = [/\/\*/g, /\*\//g]
export const methodPattern = /[\w\<\>\[\]]+\s+(\w+) *\([^\)]*\) *(\{)/g

export const castingConversionTuples : [RegExp,string][] = [
	[/(float\()/g,"PApplet.parseFloat("],
	[/(boolean\()/g,"PApplet.parseBoolean("],
	[/(byte\()/g,"PApplet.parseByte("],
	[/(char\()/g,"PApplet.parseChar("],
	[/(int\()/g,"PApplet.parseInt("],
	[/(color[ ]+)/g,"int "],
	[/(color\[)/g,"int["]
];

export function setDefaultClassName(className: string) {
	defaultClassName = className as string;
}

// Similar to : https://github.com/processing/processing/blob/37108add372272d7b1fc23d2500dce911c4d1098/java/src/processing/mode/java/preproc/PdePreprocessor.java#L1149
export function setupBehaviour(refactoredCode: string): string {
	return `${staticImports} \n` +
	`public class ${defaultClassName} extends ${defaultLib}{\n`+
			`	public void setup(){`+
				`${refactoredCode}`+
				`}`+
				`${preprocessingFooter()}\n`+
			`}`						
}

//Mode.ACTIVE
export function methodBehaviour(refactoredCode: string): string {
	return	`${staticImports} \n`+
			`public class ${defaultClassName} extends ${defaultLib}{\n`+
				`${refactoredCode}\n` +
				`${preprocessingFooter()}\n`+
			`}`
}

export function preprocessingSettings(settingsContext : string): string{
	return `\n` +
		   `	public void settings(){\n`+
		   `	${settingsContext}`+
		   `	}`
}

//footer
function preprocessingFooter(): string{
	return 	`\n`+
			`	public static void main(String[] args) {\n`+
			`		PApplet.main("${defaultClassName}");\n`+
			`	}`
}