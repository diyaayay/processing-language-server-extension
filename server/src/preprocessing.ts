import * as parser from "./parser";
import * as pStandards from "./grammar/terms/processingStandards";
import * as codeRefactoring from  "./codeRefactoring";
import { MethodDeclarationContext } from "java-ast/dist/parser/JavaParser";

let behaviourType : Behaviour;


export interface Behaviour{
	defaultEnabled : boolean,
	methodEnabled: boolean
};

/**
 * @param processCode
 * @returns processed code
 */

export function performPreProcessing(processCode : string) : string {
	let processedCode = codeRefactoring.pipeLine(processCode);
	let higherOrderMethodCount = countMethods(processCode) - classMethodsCount(processedCode);

	if(higherOrderMethodCount === 0) {
		setBehaviours(true, false);
		return pStandards.setupBehaviour(processedCode);
	}

	setBehaviours(false, true);
	return pStandards.methodBehaviour(processedCode);
}

/**
 * Counts all methods inside all classes
 * @param code Code to count the amount of methods form
 * @returns Amount of methods inside classes
 */
function classMethodsCount(code : string) : number {
	let classMethodNames : string[] = []
	let tokenArray = parser.parseAST(code)

	tokenArray.forEach(function(token,index){
		if(token[1] instanceof MethodDeclarationContext){
			classMethodNames.push(token[0].text)
		}
	})

	return classMethodNames.length

}

/**
 * change the current behaviour type of a  sketch
 * @param _b1 default behaviour
 * @param _b2 method behaviour
 * 
 */
function setBehaviours(_b1:boolean, _b2:boolean){
	behaviourType = {
		defaultEnabled : _b1,
		methodEnabled : _b2
	}
}

/**
 * Counts all methods in the code
 * @param code code to count the amount of method form
 * @returns Amount of methods
 */
function countMethods(code: string) : number {
	let allMethods: string[] = [];
	let allLines = code.split(`\n`);

	allLines.forEach(function(line) {
		let methodName: RegExpExecArray | null;
		if(methodName = pStandards.methodPattern.exec(line)){
			allMethods.push(methodName[1]);
		}
	});
	return allMethods.length;
}