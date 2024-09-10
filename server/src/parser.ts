import { ParseTree } from "antlr4ts/tree/ParseTree";
import { spawn } from "child_process";
import { readFileSync } from "fs";
import * as antlr4ts from "antlr4ts";
import * as JavaLexer from "java-ast/dist/parser/JavaLexer";
import * as JavaParser from "java-ast/dist/parser/JavaParser";

/**
 * Create AST
 * 
 * @param processedText
 * @returns Parse Tree
 */
export function parseAST(processedText: string) : [ParseTree, ParseTree][] {
	let ast=parse(processedText);
	let tokenArray:[ParseTree, ParseTree][] =new Array();
	let _tokenCounter = -1;

	if(ast)
	for(let i=0; i<ast.childCount; i++) {
		extractTokens(ast.children![i]);
	}

	function extractTokens(token: ParseTree){
		for(let j = 0; j < token.childCount; j++){
			if(token.getChild(j).childCount == 0){
				_tokenCounter +=1
				tokenArray[_tokenCounter] = [token.getChild(j), token]
			}
			extractTokens(token.getChild(j));
		}
	}
	//parseTreeConstructed
	return tokenArray;
}



function parse(source : string) {
	let originalCode = console;
	try {
		console = redirectConsole(console);
		const chars = antlr4ts.CharStreams.fromString(source);
		const lexer = new JavaLexer.JavaLexer(chars);
		//extends BufferedTokenStream with functionality to filter token streams to tokens on a particular channel
		const tokens = new antlr4ts.CommonTokenStream(lexer);
		const parser = new JavaParser.JavaParser(tokens);
		const compilationUnit = parser.compilationUnit();
		console = originalCode;
		return compilationUnit
	}catch(e) {
		console=originalCode;
		//parsing failed
	}
}

function redirectConsole(obj: any){
	return new Proxy(obj, {
		get(target, methodName, receiver) {
			//not sure of the type, will fix later
			const originMethod = target[methodName];

			return function(...args : any) {};
		}
	})

}