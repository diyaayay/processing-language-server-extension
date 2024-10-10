import * as parser from './parser'
import * as pStandards from './grammar/terms/processingStandards'
import * as codeRefactoring from  './codeRefactoring'
import { MethodDeclarationContext } from 'java-ast/dist/parser/JavaParser';
import { connection } from './server';

let behaviourType : Behaviour

export interface Behaviour{
	defaultEnabled : boolean,
	methodEnabled: boolean
}

/**
 * Transforms user code to java compliant code.
 *
 * Method behaviour has functions in the global scope.
 * Setup behaviour has all functions inside classes.
 *  
 * @param unProcessedCode code to be processed
 * @returns processed code
 */
export  function performPreProcessing(unProcessedCode: string): string{
	
	let processedCode = codeRefactoring.pipeLine(unProcessedCode)
	let higherOrderMethodCount = allMethodsCount(processedCode) - classMethodsCount(processedCode)

	if(higherOrderMethodCount == 0) {
		setBehaviours(true,false)
		connection.console.log(`Setup Behaviour`);
		connection.console.log("PreProcessing complete!");
		return pStandards.setupBehaviour(processedCode)
	}
	
	setBehaviours(false,true)
	connection.console.log(`Method Behaviour`);
	connection.console.log("PreProcessing complete!");
	return pStandards.methodBehaviour(processedCode)	
	
}

/**
 * Provides the current behaviour type of a sketch
 * @returns Behavoir type
 */
export function getBehavoirType() : Behaviour {
	return behaviourType
}

/**
 * Change the current behaviour type of a sketch
 * @param _b1 default behaviour
 * @param _b2 method behavior
 */
function setBehaviours(_b1:boolean,_b2: boolean){
	behaviourType = {
		defaultEnabled : _b1,
		methodEnabled : _b2
	}
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
 * Counts all methods in the code
 * @param code Code to count the amount of methods form
 * @returns Amount of methods
 */
function allMethodsCount(code : string) : number{
	let allMethodNames: string[] = []
	let unProcessedLineSplit = code.split(`\n`)

	unProcessedLineSplit.forEach(function(line){
		let methodName: RegExpExecArray | null
		if(methodName = pStandards.methodPattern.exec(line)){
			allMethodNames.push(methodName[1])
		}
	})

	return allMethodNames.length
}