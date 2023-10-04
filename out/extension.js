"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
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
        // Read the contents of your Angular app's index.html file
        const indexPath = path.join(__dirname, "../webview-ui/dist/webview-ui", "index.html");
        const htmlContent = fs.readFileSync(indexPath, "utf-8");
        console.log(htmlContent);
        // panel.webview.html = htmlContent;
        const runtimeUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(__dirname, "../webview-ui/dist/webview-ui", "runtime.5555b0e246616bd9.js")));
        const polyfillsUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(__dirname, "../webview-ui/dist/webview-ui", "polyfills.ef3261c6791c905c.js")));
        const scriptUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(__dirname, "../webview-ui/dist/webview-ui", "main.97b649a78c55b36d.js")));
        const stylesUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(__dirname, "../webview-ui/dist/webview-ui", "styles.ef46db3751d8e999.css")));
        panel.webview.html = getWebViewContent(stylesUri, runtimeUri, polyfillsUri, scriptUri);
    });
    context.subscriptions.push(disposable, runWebView);
}
exports.activate = activate;
function getWebViewContent(stylesUri, runtimeUri, polyfillsUri, scriptUri) {
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
      <script type="module" src="${scriptUri}"></script>
    </body>
  </html>`;
}
// This method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map