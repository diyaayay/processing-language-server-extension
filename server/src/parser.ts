

const childProcess = require('child_process');
const fs = require('fs')
const antlr4ts_1 = require("antlr4ts");
const JavaLexer_1 = require("java-ast/dist/parser/JavaLexer");
const JavaParser_1 = require("java-ast/dist/parser/JavaParser");
import { ParseTree } from 'antlr4ts/tree/ParseTree'

/**
 * Parses code to create a AST
 * 
 * @param processedText code to generate a parsetree from
 * @returns Parse tree
 */
export function parseAST(processedText: string) : [ParseTree, ParseTree][] {
	let ast = parse(processedText)
	let tokenArray: [ParseTree, ParseTree][] = new Array();
	let _tokenCounter = -1
	
	for(let i = 0; i < ast.childCount; i++){
		extractTokens(ast.children![i])
	}


	return tokenArray

	function extractTokens(gotOne: ParseTree){
		for(let j = 0; j < gotOne.childCount; j++){
			if(gotOne.getChild(j).childCount == 0){
				_tokenCounter +=1
				tokenArray[_tokenCounter] = [gotOne.getChild(j),gotOne]
			}
			extractTokens(gotOne.getChild(j))
		}
	}
}

/**
 * Parses a line to extract each word and 
 * its start- and endPos within the parsed line
 * 
 * @param line Line to be mapped
 * @returns [word, startPos, endPos][]
 */
export function lineMap(line: string) : [string, number, number][]{
	let currentTempAST: [ParseTree][] = new Array()
	let tempCounter = -1

	//Extract tokens
	let currentTokens = parse(line)
	for (let i = 0; i < currentTokens.childCount; i++) {
		currentLineASTExtract(currentTokens.children![i])
	}

	let map : [string, number, number][] = new Array()
	let mapCount = 0
	//Cook map
	currentTempAST.forEach(function(word) {
		map[mapCount] = [word[0].text, line.indexOf(word[0].text), line.indexOf(word[0].text) + word[0].text.length]
		mapCount += 1
	})

	return map

	function currentLineASTExtract(gotOne: ParseTree){
		tempCounter += 1
		currentTempAST[tempCounter] = [gotOne]
		for(let j=0;j<gotOne.childCount;j++){
			currentLineASTExtract(gotOne.getChild(j))
		}
	}
}

/**
 * "Overide" function for java-ast parser. Mutes the false errors during parsing.
 * 
 * @param source string to be parsed
 * @returns Compilation unit
 */
function parse(source : string) {
	let consoleOriginal = console
	try {
	console = redirectConsole(console)
    const chars = new antlr4ts_1.ANTLRInputStream(source);
    const lexer = new JavaLexer_1.JavaLexer(chars);
    const tokens = new antlr4ts_1.CommonTokenStream(lexer);
    const parser = new JavaParser_1.JavaParser(tokens);
	const compilationUnit = parser.compilationUnit();
	console = consoleOriginal
    return compilationUnit

	}
	catch(e){
		console = consoleOriginal

	}
}

/**
 * Redirects console output. Is needed to have no output during parsing @see parse 
 * Not the niced thing but the only way i could think of. 
 * An issue (#44) is opend to clean this up
 * 
 * @param obj console instance
 * @returns mutated console
 */
function redirectConsole(obj : any)
{
    return new Proxy(obj, {
        get(target, methodName, receiver) {
            // get origin method
            const originMethod = target[methodName];

            return function(...args : any) {
			};
        }
    });
}