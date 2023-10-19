"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.populatePCView = exports.populateStructure = void 0;
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
                const sourceFile = generateAST(filePath);
                // Query for PropertyAssignment nodes with an Identifier name of 'selector'
                const selectorProperties = (0, tsquery_1.tsquery)(sourceFile, "PropertyAssignment > Identifier[name=selector]");
                let tempArray = filePath.split("/");
                tempArray.pop();
                const folderPath = tempArray.join("/");
                // Check if selectorProperties is not empty and log the selector name
                if (selectorProperties.length > 0) {
                    const selectorName = selectorProperties[0].parent.initializer.text;
                    const obj = {
                        selectorName,
                        folderPath,
                        inputs: [],
                        outputs: []
                    };
                    const inputProperties = (0, tsquery_1.tsquery)(sourceFile, "PropertyDeclaration:has(Identifier[name=Input])");
                    inputProperties.forEach(variable => {
                        const variableName = variable.name.text;
                        const input = {
                            name: variableName,
                            pathTo: folderPath,
                        };
                        obj.inputs.push(input);
                    });
                    const outputProperties = (0, tsquery_1.tsquery)(sourceFile, 'PropertyDeclaration:has(Decorator > CallExpression > Identifier[name=Output])');
                    outputProperties.forEach(variable => {
                        const variableName = variable.name.text;
                        const output = {
                            name: variableName,
                            pathFrom: folderPath,
                        };
                        obj.outputs.push(output);
                    });
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
//CHANGED to "pcObject" from "output" ij the 3 instances above... make sure it didn't break anything!
function populateChildren(pcObject, selectorNames) {
    // Step 1: populating current object's children array
    const filePath = convertToHtml(pcObject.path);
    for (const selectorName of selectorNames) {
        const obj = {
            name: '',
            path: '',
            inputs: [],
            children: [],
            outputs: []
        };
        if (selectorCheck(filePath, selectorName.selectorName)) {
            obj.name = selectorName.selectorName;
            obj.path = selectorName.folderPath;
            selectorName.inputs.forEach(input => {
                if (inputCheck(filePath, input.name)) {
                    input.pathFrom = pcObject.path;
                    obj.inputs.push(input);
                }
            });
            selectorName.outputs.forEach(output => {
                if (outputCheck(filePath, output.name)) {
                    output.pathTo = pcObject.path;
                    obj.outputs.push(output);
                }
            });
            pcObject.children.push(obj);
        }
    }
    //Recursively call this function on each obj of children array
    pcObject.children.forEach((child) => populateChildren(child, selectorNames));
    console.log('NEWUPDATED pcobject: ', pcObject);
    return pcObject;
}
function convertToHtml(folderPath) {
    let path = folderPath.split("/");
    const component = path.pop();
    const htmlFile = component + ".component.html";
    return folderPath + "/" + htmlFile;
}
function selectorCheck(filePath, selectorName) {
    const parsed = fs.readFileSync(filePath, "utf-8");
    // creates AST of angular template (--> check up on what fs.readFileSync is doing: may be turning file into a STRING)
    const $ = cheerio.load(parsed);
    // $ is variable name (?) --> using cheerio to ".load" parsed... is THIS creating the AST actually?
    // To find an element by its tag name (selectorName)
    const foundElement = $(selectorName);
    //if it found a match (variable foundElement has length) return true
    if (foundElement.length) {
        console.log('SELECTORCHECKfilePath: ', filePath);
        console.log('selectorName: ', selectorName);
        return true;
    }
    return false;
}
function inputCheck(templatePath, inputName) {
    const templateContent = fs.readFileSync(templatePath, "utf-8");
    const regex = new RegExp(`\\[${inputName}\\]`, 'g');
    const matches = templateContent.match(regex);
    if (matches) {
        return true;
    }
    else {
        return false;
    }
}
function outputCheck(templatePath, outputName) {
    const templateContent = fs.readFileSync(templatePath, "utf-8");
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