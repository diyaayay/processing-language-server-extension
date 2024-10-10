"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCCount = exports.memberAndClass = exports.FCCount = exports.fieldAndClass = exports.numberOfClasses = exports.classNames = exports.numberOfFields = exports.fieldNames = exports.numberOfMembers = exports.memberNames = void 0;
exports.constructClassParams = constructClassParams;
exports.clearClassName = clearClassName;
exports.clearMemberName = clearMemberName;
exports.clearFieldName = clearFieldName;
exports.clearFieldAndClass = clearFieldAndClass;
exports.clearMemberAndClass = clearMemberAndClass;
exports.flushRecords = flushRecords;
const JavaParser_1 = require("java-ast/dist/parser/JavaParser");
const server_1 = require("./server");
exports.memberNames = [];
exports.numberOfMembers = 0;
exports.fieldNames = [];
exports.numberOfFields = 0;
exports.classNames = [];
exports.numberOfClasses = 0;
exports.fieldAndClass = [];
exports.FCCount = 0;
exports.memberAndClass = [];
exports.MCCount = 0;
function constructClassParams(tokenArr) {
    tokenArr.forEach(function (node, index) {
        //local class declarations
        if (node[1] instanceof JavaParser_1.ClassDeclarationContext && node[0].text == `class`) {
            exports.classNames[exports.numberOfClasses] = tokenArr[index + 1][0].text;
            exports.numberOfClasses += 1;
        }
        if (node[1] instanceof JavaParser_1.MethodDeclarationContext) {
            // MethodDeclarationContext -> MemberDeclarationContext -> ClassBodyDeclarationContext -> ClassBodyContext -> ClassDeclarationContext -> 
            // 2nd Child [Terminal Node: Class name]
            exports.memberAndClass[exports.MCCount] = [node[1]._parent._parent._parent._parent.getChild(1).text, node[0].text];
            exports.MCCount += 1;
            exports.memberNames[exports.numberOfMembers] = node[0].text;
            exports.numberOfMembers += 1;
        }
        if (node[1] instanceof JavaParser_1.VariableDeclaratorContext) {
            exports.fieldAndClass[exports.FCCount] = [node[1]._parent._parent._parent._parent._parent._parent._parent.getChild(1).text, node[0].text];
            exports.FCCount += 1;
            exports.fieldNames[exports.numberOfFields] = node[0].text;
            exports.numberOfFields += 1;
        }
    });
    server_1.connection.console.log("Local Class Completion Invoked");
}
function clearClassName() {
    exports.classNames = [];
    exports.numberOfClasses = 0;
}
function clearMemberName() {
    exports.memberNames = [];
    exports.numberOfMembers = 0;
}
function clearFieldName() {
    exports.fieldNames = [];
    exports.numberOfFields = 0;
}
function clearFieldAndClass() {
    exports.fieldAndClass = [];
    exports.FCCount = 0;
}
function clearMemberAndClass() {
    exports.memberAndClass = [];
    exports.MCCount = 0;
}
function flushRecords() {
    clearClassName();
    clearFieldName();
    clearMemberName();
    clearFieldAndClass();
    clearMemberAndClass();
}
//# sourceMappingURL=asutils.js.map