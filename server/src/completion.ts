//for code completion
import { CompletionItem, CompletionItemKind, CompletionParams } from 'vscode-languageserver';
import * as JavaParser from "java-ast/dist/parser/JavaParser";
import { TextDocument } from 'vscode-languageserver-textdocument';
import { connection } from './server';
import { clearLocalClassDeclarators, clearVariableDeclarationContext, variableDeclarationcontext } from './grammar/terms/model';
import { getLineOffset, getTokenArray } from './sketch';
import { constructClassParams, fieldAndClass, flushRecords, memberAndClass } from './asutils';
import { ClassOrInterfaceTypeContext, PrimitiveTypeContext, TypeTypeOrVoidContext, VariableDeclaratorIdContext } from 'java-ast/dist/parser/JavaParser';
const fs = require("fs");
const { JavaClassFileReader } = require('java-class-tools');
const path = require('path');
export const reader = new JavaClassFileReader();
const extractionModules = [
	path.join(__dirname, 'processing', 'container', 'core.txt'),
	path.join(__dirname, 'processing', 'container', 'awt.txt'),
	path.join(__dirname, 'processing', 'container', 'data.txt'),
	path.join(__dirname, 'processing', 'container', 'event.txt'),
	path.join(__dirname, 'processing', 'container', 'javafx.txt'),
	path.join(__dirname, 'processing', 'container', 'opengl.txt')
];
const extractionModuleType = [
	"core", "awt" , "data", "event", "javafx", "opengl"
];

let currentCompletionClass = `PApplet`;
let completionConstantClass = `PConstants`;

let classMap = new Map();
let completionClassMap = new Map();

for(let _counter: number =0; _counter<6; _counter++) {
	try {  
		let data = fs.readFileSync(extractionModules[_counter], 'utf-8')
		let tempSplit = data.split('\n')
		let tempCheck: string[] = []
		let _innerCounter = 0
		tempSplit.forEach(function(className: any){
			if(!className.includes('$') && className.includes('.class')){
				tempCheck[_innerCounter] = className
				_innerCounter += 1
			}
		})
		classMap.set(extractionModuleType[_counter], tempCheck)
	} catch(e) {}

}

initAllCompletionClasses();

function initAllCompletionClasses() {
	extractionModuleType.forEach(value => {
		const classes = classMap.get(value); //all classes in module
		if (classes) {
			classes.forEach((element:any) => {
				const filePath = path.join(__dirname, "processing", "extractor", value, element).replace(/\r?\n|\r/g, '');
				console.log(`class read success :) ${filePath}`);
				if(fs.existsSync(filePath)) {
					completionClassMap.set(element, PCompletionMethods(reader.read(filePath)));
				}
			});
		} else {
			console.warn(`No classes found for Module Type: ${value}`);
		}
	});
}

let completeCustomMap = new Map();

try {
	let data = fs.readFileSync(`${__dirname}/processing/customcontainer/custom.txt`, 'utf-8');
	let customSplitMap = data.split(`\n`);
	customSplitMap.forEach(function(value:string) {
		if(value.includes(`.class`)) {
			completeCustomMap.set(value, PCompletionMethods(reader.read(`${__dirname}/processing/custom/${value}`)));
		}
	});
} catch (e) {}

export function asCompletionItem(
	completionEntry: string, completionType: CompletionItemKind
) : CompletionItem {
	const item: CompletionItem = {
		label: completionEntry,
		kind: completionType,
		filterText: completionEntry
	}
	return item;
}

function PCompletionMethods(classType : any) : CompletionItem[] {
	let completionItemList: CompletionItem[] = [];
	let _addIncValue: number = 0;
	let methodSet = new Set();
	let fieldSet = new Set();

	classType.methods.forEach((method:any)=> {
		const nameInConstantPool = classType.constant_pool[method.name.index];
		const name = String.fromCharCode.apply(null, nameInConstantPool.bytes);
		methodSet.add(name);
	});

	classType.fields.forEach((field:any)=> {
		const nameInConstantPool = classType.constant_pool[field.name_index];
		const name = String.fromCharCode.apply(null, nameInConstantPool.bytes);
		fieldSet.add(name);
	});

	methodSet.forEach(function(method) {
		completionItemList[_addIncValue] = asCompletionItem(`${method}()`,
			findCompletionItemKind(2));
			_addIncValue+=1;
	});

	return completionItemList;
}

export function findCompletionItemKind(value: number): CompletionItemKind {
	let completionKind: CompletionItemKind = CompletionItemKind.Text;
	switch(value) {
		case 1:
			completionKind = CompletionItemKind.Text
			break;
		case 2:
			completionKind = CompletionItemKind.Method
			break;
		case 3:
			completionKind = CompletionItemKind.Function
			break;
		case 4:
			completionKind = CompletionItemKind.Constructor
			break;
		case 5:
			completionKind = CompletionItemKind.Field
			break;
		case 6:
			completionKind = CompletionItemKind.Variable
			break;
		case 7:
			completionKind = CompletionItemKind.Class
			break;
		case 8:
			completionKind = CompletionItemKind.Interface
			break;
		case 9:
			completionKind = CompletionItemKind.Module
			break;
		case 10:
			completionKind = CompletionItemKind.Property
			break;
		case 11:
			completionKind = CompletionItemKind.Unit
			break;
		case 12:
			completionKind = CompletionItemKind.Value
			break;
		case 13:
			completionKind = CompletionItemKind.Enum
			break;
		case 14:
			completionKind = CompletionItemKind.Keyword
			break;
		case 15:
			completionKind = CompletionItemKind.Snippet
			break;
		case 16:
			completionKind = CompletionItemKind.Color
			break;
		case 17:
			completionKind = CompletionItemKind.File
			break;
		case 18:
			completionKind = CompletionItemKind.Reference
			break;
		case 19:
			completionKind = CompletionItemKind.Folder
			break;
		case 20:
			completionKind = CompletionItemKind.EnumMember
			break;
		case 21:
			completionKind = CompletionItemKind.Constant
			break;
		case 22:
			completionKind = CompletionItemKind.Struct
			break;
		case 23:
			completionKind = CompletionItemKind.Event
			break;
		case 24:
			completionKind = CompletionItemKind.Operator
			break;
		case 25:
			completionKind = CompletionItemKind.TypeParameter
			break;
		default:
			break;
	}

	return completionKind;
}

export function getCompletionMethods(_textDocumentParams: CompletionParams, latestChanges: TextDocument): CompletionItem[] {
	let resultantCompletionItem: CompletionItem[] = []
	let lineStartMethodBody: number[] = []
	let lineEndMethodBody: number[] = []
	let avoidLineAuto: number[] = []
	let _methodCounter: number = 0
	let _avoidCounter: number = 0
	let _classNameCounter: number = 0

	let tokenArray = getTokenArray();

	let currentLineInWorkspace = _textDocumentParams.position.line;

	tokenArray.forEach(function(node, index) {

		
		if(node[1] instanceof TypeTypeOrVoidContext || node[1] instanceof PrimitiveTypeContext) {
			avoidLineAuto[_avoidCounter] = node[1]._start.line;
			_avoidCounter += 1;
		}
	});

	tokenArray.forEach(function(node, index){
		if(node[1] instanceof ClassOrInterfaceTypeContext && tokenArray[index+1][1] instanceof VariableDeclaratorIdContext) {
			variableDeclarationcontext[_classNameCounter] = [node[0], tokenArray[index+1][1]];
			_classNameCounter += 1;
		}
	});

	lineStartMethodBody.forEach(function(value, index) {
		lineStartMethodBody[index] = value -  getLineOffset();
	});
	lineEndMethodBody.forEach(function(value, index) {
		lineEndMethodBody[index] = value - getLineOffset();
	});
	avoidLineAuto.forEach(function(value, index){
		avoidLineAuto[index] = value - getLineOffset();
	});
	lineStartMethodBody.forEach(function(value, index){
		if(value <= currentLineInWorkspace && lineEndMethodBody[index] >= currentLineInWorkspace){
			// Default completion class members -> PApplet and PConstants
			resultantCompletionItem = completionClassMap.get(`${currentCompletionClass}.class`).concat(completionClassMap.get(`${completionConstantClass}.class`))
		}
	});

	avoidLineAuto.forEach(function(value, index) {
		if(value == currentLineInWorkspace +2 ) {
			resultantCompletionItem = [];
		}
	});

	let currentLineSplit = latestChanges.getText().split("\n");

	if(_textDocumentParams.context!.triggerCharacter == `.`) {
		let tempLine = currentLineSplit[currentLineInWorkspace].split(`.`)[0].split(` `);
		let objectName = tempLine[tempLine.length-1];
		resultantCompletionItem = completionClassMap.get(`${objectName}.class`);
	}

	if(variableDeclarationcontext.length > 0) {
		variableDeclarationcontext.forEach(function(value, index) {
			if(_textDocumentParams.context!.triggerCharacter == `.`) {
				let tempLine = currentLineSplit[currentLineInWorkspace].split(`.`)[0].split(` `);
				let objectName = tempLine[tempLine.length - 1];
				if (value[1].text == objectName) {
					resultantCompletionItem = completionClassMap.get(`${value[0].text}.class`);
					if(resultantCompletionItem == undefined) {
						resultantCompletionItem = completeCustomMap.get(`${value[0].text}.class`);
						if(resultantCompletionItem == undefined){
							// Handle for locally declared classes
							constructClassParams(tokenArray)
							let tempCompletionList: CompletionItem[] = []
							let _tempCounter = 0
							fieldAndClass.forEach(function(fieldName,index){
								if(fieldName[0] == value[0].text){
									tempCompletionList[_tempCounter] = asCompletionItem(fieldName[1], findCompletionItemKind(5))
									_tempCounter += 1
								}
							})
							memberAndClass.forEach(function(methodName,index){
								if(methodName[0] == value[0].text){
									tempCompletionList[_tempCounter] = asCompletionItem(`${methodName[1]}()`, findCompletionItemKind(2))
									_tempCounter += 1
								}
							})
							resultantCompletionItem = tempCompletionList
							flushRecords();
						}
					}
				}
			}
		});
	}

	// Local class declaratio and their dependent fields/methods for auto comppletion

	clearVariableDeclarationContext();
	clearLocalClassDeclarators();

	connection.console.log("AutoCompletion Invoked");

	return resultantCompletionItem;

}