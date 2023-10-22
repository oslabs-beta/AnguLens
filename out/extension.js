"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const klaw = require("klaw");
const populateAlgos_1 = require("./createViewAlgos/populateAlgos");
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
        const runtimeUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(__dirname, "../webview-ui/dist/webview-ui", "runtime.01fe1d460628a1d3.js")));
        const polyfillsUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(__dirname, "../webview-ui/dist/webview-ui", "polyfills.ef3261c6791c905c.js")));
        const scriptUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(__dirname, "../webview-ui/dist/webview-ui", "main.5eea4a327dd078ca.js")));
        const stylesUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(__dirname, "../webview-ui/dist/webview-ui", "styles.ef46db3751d8e999.css")));
        // START URIS
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
        //END URIS
        let items = [];
        let selectorNames = [];
        let currentFilePath = "";
        let pcObject = {};
        let fsObject = {};
        // FS OBject
        panel.webview.onDidReceiveMessage((message) => {
            switch (message.command) {
                case "loadNetwork": {
                    items = [];
                    selectorNames = [];
                    const srcRootPath = message.data.filePath;
                    currentFilePath = message.data.filePath;
                    let rootPath = "";
                    if (Array.isArray(srcRootPath)) {
                        rootPath = srcRootPath[0].uri.fsPath;
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
                        fsObject = (0, populateAlgos_1.populateStructure)(items, selectorNames);
                        const sendNewPathObj = {
                            command: "generateFolderFile",
                            data: fsObject,
                        };
                        panel.webview.postMessage(sendNewPathObj);
                    });
                    break;
                }
                case "loadParentChild": {
                    // klaw(currentFilePath)
                    //   .on("data", (item) => items.push(item))
                    //   .on("end", () => {
                    pcObject = (0, populateAlgos_1.populatePCView)(selectorNames);
                    console.log("SELECTOR NAMES", selectorNames);
                    console.log("THIS PC OBJECT: ", pcObject);
                    const pcMessage = {
                        command: "updatePC",
                        data: pcObject,
                    };
                    panel.webview.postMessage(pcMessage);
                    // });
                    break;
                }
                case "reloadPC": {
                    const pcMessage = {
                        command: "reloadPC",
                        data: {},
                    };
                    panel.webview.postMessage(pcMessage);
                    break;
                }
                case "reloadFolderFile": {
                    panel.webview.postMessage({
                        command: "reloadFolderFile",
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
        /*
          Leaving
        */
        panel.onDidChangeViewState((e) => {
            if (e.webviewPanel.visible) {
                panel.webview.postMessage({
                    command: "loadState",
                    data: {},
                });
            }
        });
    });
    context.subscriptions.push(disposable, runWebView);
}
exports.activate = activate;
function getAssetUris(folderUri, webview) {
    const imageFiles = fs.readdirSync(folderUri.fsPath);
    return imageFiles.map((file) => webview.asWebviewUri(vscode.Uri.file(path.join(folderUri.fsPath, file))));
}
// console.log("JSON STRINGIFIED OUTPUT", JSON.stringify(output))
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