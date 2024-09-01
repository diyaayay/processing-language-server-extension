//create a parse tree using ANTLR

import { ParseTree } from "antlr4ts/tree/ParseTree";

export let variableDeclarationcontext: [ParseTree, ParseTree][] =  new Array();

export function clearVariableDeclarationContext() {
	variableDeclarationcontext = [];
}

export let localClassDeclaratorContext: [ParseTree, ParseTree[], ParseTree[]][] = new Array();

export function clearLocalClassDeclarators(){
	localClassDeclaratorContext = []
}
