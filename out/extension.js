"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const klaw = require("klaw");
const ts = require("typescript");
const tsquery_1 = require("@phenomnomnominal/tsquery");
const cheerio = require("cheerio");
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "angulens" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand("angulens.helloWorld", () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        vscode.window.showInformationMessage("Hello World from AnguLens!");
    });
    // create a webview panel and sets the html to the getWebViewContent function
    const runWebView = vscode.commands.registerCommand("angulens.start", () => {
        const panel = vscode.window.createWebviewPanel("AnguLensPanel", // viewType, unique identifier
        "AnguLens", // name of tab in vsCode
        vscode.ViewColumn.One, // showOptions
        { enableScripts: true } // options
        );
        console.log("workspaceFolders -> ", vscode.workspace.workspaceFolders);
        // Read the contents of your Angular app's index.html file
        // const indexPath = path.join(
        //   __dirname,
        //   "../webview-ui/dist/webview-ui",
        //   "index.html"
        // );
        // const htmlContent = fs.readFileSync(indexPath, "utf-8");
        // console.log(htmlContent);
        // panel.webview.html = htmlContent;
        const runtimeUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(__dirname, "../webview-ui/dist/webview-ui", "runtime.01fe1d460628a1d3.js")));
        const polyfillsUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(__dirname, "../webview-ui/dist/webview-ui", "polyfills.ef3261c6791c905c.js")));
        const scriptUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(__dirname, "../webview-ui/dist/webview-ui", "main.d23da195d3dc543a.js")));
        const stylesUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(__dirname, "../webview-ui/dist/webview-ui", "styles.ef46db3751d8e999.css")));
        // added this
        // Create a webview-compatible URI for the "assets" folder
        const assetsFolder = vscode.Uri.file(path.join(__dirname, "../webview-ui/dist/webview-ui/assets"));
        // Create URIs for all image assets in the "assets" folder
        const imageUris = getAssetUris(assetsFolder, panel.webview);
        const stringUris = imageUris.map((uri) => uri.toString());
        // Send the message to the WebView
        const message = {
            command: "updateUris",
            data: stringUris,
        };
        panel.webview.postMessage(message);
        const items = [];
        const selectorNames = [];
        let currentFilePath = "";
        panel.webview.onDidReceiveMessage((message) => {
            console.log("message received but no clue what it is");
            switch (message.command) {
                case "loadNetwork": {
                    const srcRootPath = message.data.filePath;
                    currentFilePath = message.data.filePath;
                    // const rootpath = "/Users/scottstaskus/desktop/AnguLens/webview-ui/src";
                    // const rootpath = vscode.workspace.workspaceFolders;
                    console.log("rootpath here ==========>", srcRootPath);
                    let rootPath = "";
                    if (Array.isArray(srcRootPath)) {
                        rootPath = srcRootPath[0].uri.fsPath;
                        console.log("ROOTPATH IF ARRAY ======>", rootPath);
                    }
                    else if (typeof srcRootPath === "string") {
                        rootPath = srcRootPath;
                    }
                    else {
                        console.error("Invalid rootpath provided");
                        return;
                    }
                    klaw(rootPath)
                        .on("data", (item) => items.push(item))
                        .on("end", () => {
                        // const sliceItems = items.slice(0, 30);
                        // console.log("SLICE ITEMS HERE ======>", sliceItems);
                        console.log("items before populate HERE ========>", items);
                        // console.dir(items);
                        // console.log("ITEM TYPE 8======-->", items[0].type);
                        const sendNewPathObj = {
                            command: "updatePath",
                            data: populateStructure(items, selectorNames),
                        };
                        console.log("POPULATED STRUCTURE DATA", sendNewPathObj.data);
                        const pcObject = populatePCView(selectorNames);
                        console.log("PC OBJECT!!!! : ", pcObject);
                        const pcMessage = {
                            command: "updatePC",
                            data: pcObject,
                        };
                        panel.webview.postMessage(pcMessage);
                        panel.webview.postMessage(sendNewPathObj);
                        console.log("PANEL WEBVIEW POST MESSAGE SENT");
                    });
                    // console.log("PANEL ONDIDRECEIVEMESSAGE RUNKLAW FINISHED");
                    break;
                }
                case "loadParentChild": {
                    klaw(currentFilePath)
                        .on("data", (item) => items.push(item))
                        .on("end", () => {
                        const pcObject = populatePCView(selectorNames);
                        console.log("PC OBJECT!!!! : ", pcObject);
                        const pcMessage = {
                            command: "updatePC",
                            data: pcObject,
                        };
                        panel.webview.postMessage(pcMessage);
                    });
                    break;
                }
                case "reloadFolderFile": {
                    panel.webview.postMessage({
                        command: "reUpdatePath",
                        data: {},
                    });
                    break;
                }
                default:
                    console.error("Unknown command", message.command);
                    break;
            }
        }, undefined, context.subscriptions);
        panel.webview.html = getWebViewContent(stylesUri, runtimeUri, polyfillsUri, scriptUri, imageUris);
    });
    context.subscriptions.push(disposable, runWebView);
}
exports.activate = activate;
function getAssetUris(folderUri, webview) {
    const imageFiles = fs.readdirSync(folderUri.fsPath);
    return imageFiles.map((file) => webview.asWebviewUri(vscode.Uri.file(path.join(folderUri.fsPath, file))));
}
function generateAST(filePath) {
    // Read the TypeScript file content
    const fileContent = fs.readFileSync(filePath, "utf-8");
    // Parse the TypeScript code to get the AST
    const sourceFile = ts.createSourceFile(filePath, fileContent, ts.ScriptTarget.Latest, true);
    // Return the AST (abstract syntax tree) of the source file
    return sourceFile;
}
function populatePCView(selectorNames) {
    // step 1: build initial object with information about app component
    let appPath;
    for (const selectorName of selectorNames) {
        if (selectorName.selectorName === "app-root") {
            // folderPath = '/Users/danielkim/personal-projects/task-tracker/src/app'
            appPath = selectorName.folderPath;
        }
    }
    const output = {
        name: "app",
        path: appPath,
        children: [],
    };
    populateChildren(output, selectorNames);
    return output;
}
function populateChildren(pcObject, selectorNames) {
    // Step 1: populating current object's children array
    const filePath = convertToHtml(pcObject.path);
    for (const selectorName of selectorNames) {
        if (selectorCheck(filePath, selectorName.selectorName)) {
            const obj = {
                name: selectorName.selectorName,
                path: selectorName.folderPath,
                children: [],
            };
            pcObject.children.push(obj);
        }
    }
    // Step 2: Recursively call this function on each obj of children array
    pcObject.children.forEach((child) => populateChildren(child, selectorNames));
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
    // $ is variable name (?) --> then we check
    // To find an element by its tag name (selectorName)
    const foundElement = $(selectorName);
    //if it found a match (has length) return true
    if (foundElement.length) {
        return true;
    }
    return false;
}
function populateStructure(array, selectorNames) {
    console.log("POPULATED STRUCTURE TRIGGERED");
    // console.log("POPULATE PASSED IN ARRAY====", array);
    const output = {};
    let rootPath = "";
    let omitIndeces;
    for (const item of array) {
        // if its the first iteration of the for loop
        if (rootPath.length === 0) {
            // console.log('item.path: 'item.path);
            let pathArray = item.path.split("/");
            // console.log('pathArray: ', pathArray);
            let rootFolder = pathArray.pop();
            // console.log('pathArray: ', pathArray);
            rootPath = rootFolder;
            // console.log('root path is : ', rootPath);
            output[rootFolder] = {
                type: "folder",
                path: item.path,
            };
            omitIndeces = pathArray.length;
            // console.log('omitIndeces: ', omitIndeces);
        }
        else {
            //checking elements after the 1st one / root directory
            let pathArray = item.path.split("/");
            pathArray.splice(0, omitIndeces);
            let name = pathArray.pop();
            // locating through nested output object logic
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
                console.log("component name: ", name);
                const testArray = filePath.split("/");
                testArray.pop();
                const test = testArray.join("/");
                // Check if selectorProperties is not empty and log the selector name
                if (selectorProperties.length > 0) {
                    const selectorName = selectorProperties[0].parent.initializer.text;
                    console.log("Component Selector Name:", selectorName);
                    const obj = {
                        selectorName,
                        folderPath: test,
                    };
                    selectorNames.push(obj);
                }
            }
            objTracker[name] = {
                type,
                path: item.path,
            };
        }
    }
    console.log(selectorNames);
    console.log("OUTPUT HERE =====>", output);
    return output;
    // console.log("JSON STRINGIFIED OUTPUT", JSON.stringify(output));
}
function getWebViewContent(stylesUri, runtimeUri, polyfillsUri, scriptUri, imageUris) {
    const imageTags = imageUris
        .map((uri) => `<img src="${uri}" alt="Image" />`)
        .join("\n");
    // Include imageTags in the script content
    const scriptContent = `
    const imageContainer = document.createElement('div');
    imageContainer.innerHTML = \`${imageTags}\`;
  `;
    return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="stylesheet" type="text/css" href="${stylesUri}">
      <title>Hello World</title>
    </head>
    <body>
      <div>AnguLens</div>
     <app-root></app-root>
      <script type="module" src="${runtimeUri}"></script>
      <script type="module" src="${polyfillsUri}"></script>
      <script type="module">
        ${scriptContent}
      </script>
      <script type="module" src="${scriptUri}"></script>    </body>
  </html>`;
}
// This method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map