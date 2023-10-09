// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { Uri, Webview } from "vscode";
import * as path from "path";
import * as fs from "fs";
import { getVSCodeDownloadUrl } from "@vscode/test-electron/out/util";
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "angulens" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "angulens.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World from AnguLens!");
    }
  );

  // create a webview panel and sets the html to the getWebViewContent function
  const runWebView = vscode.commands.registerCommand("angulens.start", () => {
    const panel = vscode.window.createWebviewPanel(
      "AnguLensPanel", // viewType, unique identifier
      "AnguLens", // name of tab in vsCode
      vscode.ViewColumn.One, // showOptions
      { enableScripts: true } // options
    );

    // Read the contents of your Angular app's index.html file
    // const indexPath = path.join(
    //   __dirname,
    //   "../webview-ui/dist/webview-ui",
    //   "index.html"
    // );
    // const htmlContent = fs.readFileSync(indexPath, "utf-8");
    // console.log(htmlContent);
    // panel.webview.html = htmlContent;

    const runtimeUri = panel.webview.asWebviewUri(
      vscode.Uri.file(
        path.join(
          __dirname,
          "../webview-ui/dist/webview-ui",
          "runtime.01fe1d460628a1d3.js"
        )
      )
    );
    const polyfillsUri = panel.webview.asWebviewUri(
      vscode.Uri.file(
        path.join(
          __dirname,
          "../webview-ui/dist/webview-ui",
          "polyfills.ef3261c6791c905c.js"
        )
      )
    );
    const scriptUri = panel.webview.asWebviewUri(
      vscode.Uri.file(
        path.join(
          __dirname,
          "../webview-ui/dist/webview-ui",
          "main.363c944a1854266c.js"
        )
      )
    );
    const stylesUri = panel.webview.asWebviewUri(
      vscode.Uri.file(
        path.join(
          __dirname,
          "../webview-ui/dist/webview-ui",
          "styles.ef46db3751d8e999.css"
        )
      )
    );

    // added this
    // Create a webview-compatible URI for the "assets" folder
    const assetsFolder = vscode.Uri.file(
      path.join(__dirname, "../webview-ui/dist/webview-ui/assets")
    );

    // Create URIs for all image assets in the "assets" folder
    const imageUris = getAssetUris(assetsFolder, panel.webview);

    panel.webview.html = getWebViewContent(
      stylesUri,
      runtimeUri,
      polyfillsUri,
      scriptUri,
      imageUris
    );
  });

  context.subscriptions.push(disposable, runWebView);
}

function getAssetUris(folderUri: vscode.Uri, webview: Webview): vscode.Uri[] {
  const imageFiles = fs.readdirSync(folderUri.fsPath);
  return imageFiles.map((file) =>
    webview.asWebviewUri(vscode.Uri.file(path.join(folderUri.fsPath, file)))
  );
}

function getWebViewContent(
  stylesUri: any,
  runtimeUri: any,
  polyfillsUri: any,
  scriptUri: any,
  imageUris: any[] // added this
) {
  // added this
  const imageTags = imageUris
    .map((uri: any) => `<img src="${uri}" alt="Image" />`)
    .join("\n");

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
      ${imageTags}
      <app-root></app-root>
      <script type="module" src="${runtimeUri}"></script>
      <script type="module" src="${polyfillsUri}"></script>
      <script type="module" src="${scriptUri}"></script>
    </body>
  </html>`;
}

// This method is called when your extension is deactivated
export function deactivate() {}
