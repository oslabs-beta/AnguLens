"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.populatePCView = exports.inLineCheck = exports.generateAST = exports.populateStructure = void 0;
const ts = require("typescript");
const fs = require("fs");
const tsquery_1 = require("@phenomnomnominal/tsquery");
const cheerio = require("cheerio");
function populateStructure(array, selectorNames) {
    console.log("POPULATED STRUCTURE TRIGGERED");
    // console.log("POPULATE PASSED IN ARRAY====", array);
    const output = {};
    let rootPath = "";
    let omitIndeces;
    for (const item of array) {
        let pathArray = item.path.split("/");
        let name = pathArray.pop();
        if (rootPath.length === 0) {
            rootPath = name; //resetting our default, from rootpath = '', so that our else conditional on line 25 will hit
            output[name] = {
                type: "folder",
                path: item.path,
            };
            omitIndeces = pathArray.length;
        }
        else {
            pathArray.splice(0, omitIndeces);
            let objTracker = output;
            for (const key of pathArray) {
                objTracker = objTracker[key];
            }
            // assigning type logic
            let type;
            if (name.split(".").length > 1) {
                type = name.split(".").pop();
            }
            else {
                type = "folder";
            }
            if (type === "ts") {
                const filePath = item.path;
                let tempArray = filePath.split("/");
                tempArray.pop();
                const folderPath = tempArray.join("/");
                const sourceFile = generateAST(filePath);
                // Query for PropertyAssignment nodes with an Identifier name of 'selector'
                const selectorProperties = (0, tsquery_1.tsquery)(sourceFile, "PropertyAssignment > Identifier[name=selector]");
                // Check if selectorProperties is not empty and log the selector name
                if (selectorProperties.length > 0) {
                    const selectorName = selectorProperties[0].parent.initializer.text;
                    const obj = {
                        selectorName,
                        folderPath,
                        inputs: [],
                        outputs: []
                    };
                    populateInputs(sourceFile, obj, folderPath);
                    populateOutputs(sourceFile, obj, folderPath);
                    inLineCheck(sourceFile, obj);
                    // if(obj.template) console.log('THIS IS IN LINE TEMP: ', template);
                    selectorNames.push(obj);
                }
            }
            objTracker[name] = {
                type,
                path: item.path,
            };
        }
    }
    return output;
}
exports.populateStructure = populateStructure;
function generateAST(filePath) {
    // Read the TypeScript file content
    const fileContent = fs.readFileSync(filePath, "utf-8");
    // Parse the TypeScript code to get the AST
    const sourceFile = ts.createSourceFile(filePath, fileContent, ts.ScriptTarget.Latest, true);
    // Return the AST of the source file
    return sourceFile;
}
exports.generateAST = generateAST;
function populateInputs(sourceFile, obj, folderPath) {
    const inputProperties = (0, tsquery_1.tsquery)(sourceFile, "PropertyDeclaration:has(Identifier[name=Input])");
    inputProperties.forEach(variable => {
        const variableName = variable.name.text;
        const input = {
            name: variableName,
            pathTo: folderPath,
        };
        obj.inputs.push(input);
    });
}
function populateOutputs(sourceFile, obj, folderPath) {
    const outputProperties = (0, tsquery_1.tsquery)(sourceFile, 'PropertyDeclaration:has(Decorator > CallExpression > Identifier[name=Output])');
    outputProperties.forEach(variable => {
        const variableName = variable.name.text;
        const output = {
            name: variableName,
            pathFrom: folderPath,
        };
        obj.outputs.push(output);
    });
}
function inLineCheck(sourceFile, obj) {
    const templateProperties = (0, tsquery_1.tsquery)(sourceFile, "NoSubstitutionTemplateLiteral");
    console.log(sourceFile);
    console.log("TEMPLATE PROPERTIES FROM AST: ", templateProperties);
    // Component is using an inline template
    if (templateProperties.length > 0) {
        const temp = templateProperties[0]; //ts.StringLiteral;
        obj.template = temp.text.trim();
        console.log('OBJ HERE: ', obj);
        console.log("Obj.template HERE: ", obj.template);
        console.log("and the temp.text being assigned to Obj.template: ", temp.text);
    }
}
exports.inLineCheck = inLineCheck;
// populates Parent Child object to send to Angular App
function populatePCView(selectorNames) {
    // step 1: build initial object with information about app component
    let appPath;
    for (const selectorName of selectorNames) {
        if (selectorName.selectorName === "app-root") {
            // folderPath = '/Users/danielkim/personal-projects/task-tracker/src/app'
            appPath = selectorName.folderPath;
        }
    }
    const pcObject = {
        name: "app-root",
        path: appPath,
        children: [],
    };
    populateChildren(pcObject, selectorNames);
    return pcObject;
}
exports.populatePCView = populatePCView;
function populateChildren(pcObject, selectorNames) {
    let templateContent;
    for (const selectorName of selectorNames) {
        if (selectorName.folderPath === pcObject.path) {
            if (!selectorName.template) {
                const filePath = convertToHtml(pcObject.path);
                templateContent = fs.readFileSync(filePath, "utf-8");
            }
            else {
                templateContent = selectorName.template;
                //console.log('children TEMPLATE: ', selectorName.template);
            }
        }
    }
    //const filePath = convertToHtml(pcObject.path)
    for (const selectorName of selectorNames) {
        // if(selectorName.folderPath === pcObject.path) {
        //   if(selectorName.template){
        //     templateContent = selectorName.template;
        //   }
        //    else templateContent = fs.readFileSync(filePath, "utf-8");
        // }
        const obj = {
            name: '',
            path: '',
            inputs: [],
            children: [],
            outputs: []
        };
        if (selectorCheck(templateContent, selectorName.selectorName)) {
            obj.name = selectorName.selectorName;
            obj.path = selectorName.folderPath;
            selectorName.inputs.forEach(input => {
                if (inputCheck(templateContent, input.name)) {
                    input.pathFrom = pcObject.path;
                    obj.inputs.push(input);
                }
            });
            selectorName.outputs.forEach(output => {
                if (outputCheck(templateContent, output.name)) {
                    output.pathTo = pcObject.path;
                    obj.outputs.push(output);
                }
            });
            pcObject.children.push(obj);
        }
    }
    //Recursively call this function on each obj of children array
    pcObject.children.forEach((child) => populateChildren(child, selectorNames));
    return pcObject;
}
function convertToHtml(folderPath) {
    let path = folderPath.split("/");
    const component = path.pop();
    const htmlFile = component + ".component.html";
    return folderPath + "/" + htmlFile;
}
function selectorCheck(parsed, selectorName) {
    // creates AST of angular template (--> check up on what fs.readFileSync is doing: may be turning file into a STRING)
    const $ = cheerio.load(parsed);
    // $ is variable name (?) --> using cheerio to ".load" parsed... is THIS creating the AST actually?
    // To find an element by its tag name (selectorName)
    const foundElement = $(selectorName);
    //if it found a match (variable foundElement has length) return true
    if (foundElement.length) {
        return true;
    }
    return false;
}
function inputCheck(templateContent, inputName) {
    const regex = new RegExp(`\\[${inputName}\\]`, 'g');
    const matches = templateContent.match(regex);
    if (matches) {
        return true;
    }
    else {
        return false;
    }
}
function outputCheck(templateContent, outputName) {
    const regex = new RegExp(`\\(${outputName}\\)`, 'g');
    const matches = templateContent.match(regex);
    if (matches) {
        return true;
    }
    else {
        return false;
    }
}
//# sourceMappingURL=populateAlgos.js.map