// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { Uri, Webview } from "vscode";
import * as path from "path";
import * as fs from "fs";
import { getVSCodeDownloadUrl } from "@vscode/test-electron/out/util";
import * as klaw from "klaw";
import { send } from "process";
import {
  populateStructure,
  populatePCView,
  // inLineCheck,
  // generateAST
} from "./createViewAlgos/populateAlgos";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "angulens" is now active!');
  // const extensionPath =
  //   vscode.extensions.getExtension("<YourExtensionID>")?.extensionPath;
  // console.log("EXTENSION PATH", extensionPath);

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

  // Register the command for opening files in a new tab
  const openFileDisposable = vscode.commands.registerCommand(
    "angulens.openFile",
    (data) => {
      // Handle opening the file in a new tab
      vscode.workspace
        .openTextDocument(vscode.Uri.file(data.filePath))
        .then((document) => {
          vscode.window.showTextDocument(document);
        });
    }
  );

  context.subscriptions.push(openFileDisposable);

  // create a webview panel and sets the html to the getWebViewContent function
  const runWebView = vscode.commands.registerCommand("angulens.start", () => {
    const panel = vscode.window.createWebviewPanel(
      "AnguLensPanel", // viewType, unique identifier
      "AnguLens", // name of tab in vsCode
      vscode.ViewColumn.One, // showOptions
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(
            path.join(__dirname, "../webview-ui/dist/webview-ui")
          ),
          vscode.Uri.file(path.join(__dirname, "../src/images")),
        ],
      } // options
    );

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
          "main.784c6045e9095078.js"
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

    // START URIS
    // added this
    // Create a webview-compatible URI for the "assets" folder
    const assetsFolder = vscode.Uri.file(
      path.join(__dirname, "../webview-ui/dist/webview-ui/assets")
    );

    // const imagesFolder = vscode.Uri.file(path.join(__dirname, "./images"));
    const imagesFolder = vscode.Uri.file(path.join(__dirname, "../src/images"));

    // Create URIs for all image assets in the "assets" folder
    // const imageUris = getAssetUris(assetsFolder, panel.webview);
    const imageUris = getAssetUris(imagesFolder, panel.webview);
    console.log("IMAGE URIS", imageUris);

    const stringUris = imageUris.map((uri) => uri.toString());
    // console.log("STRING URIS", stringUris);

    interface Message {
      command: string;
      data: any;
    }

    let items: any = [];
    let selectorNames: object[] = [];
    let currentFilePath: string = "";
    let pcObject: object = {};
    let fsObject: object = {};

    // FS OBject
    panel.webview.onDidReceiveMessage(
      (message: Message) => {
        switch (message.command) {
          case "loadNetwork": {
            items = [];
            selectorNames = [];
            const srcRootPath = message.data.filePath;
            currentFilePath = message.data.filePath;
            let rootPath: string = "";
            if (Array.isArray(srcRootPath)) {
              rootPath = srcRootPath[0].uri.fsPath;
            } else if (typeof srcRootPath === "string") {
              rootPath = srcRootPath;
            } else {
              console.error("Invalid rootpath provided");
              return;
            }
            klaw(rootPath)
              .on("data", (item) => items.push(item))
              .on("end", () => {
                fsObject = populateStructure(items, selectorNames);

                const sendNewPathObj: Message = {
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
            pcObject = populatePCView(selectorNames);
            console.log("SELECTOR NAMES", selectorNames);
            console.log("THIS PC OBJECT: ", pcObject);
            const pcMessage: Message = {
              command: "updatePC",
              data: pcObject,
            };
            panel.webview.postMessage(pcMessage);
            // });
            break;
          }

          case "reloadPC": {
            const pcMessage: Message = {
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

          case "sendURIs": {
            const uriMessage: Message = {
              command: "updateUris",
              data: stringUris,
            };
            panel.webview.postMessage(uriMessage);
            break;
          }

          case "openFile": {
            vscode.commands.executeCommand("angulens.openFile", message.data);
            break;
          }

          default:
            console.error("Unknown command", message.command);
            break;
        }
      },
      undefined,
      context.subscriptions
    );

    panel.webview.html = getWebViewContent(
      stylesUri,
      runtimeUri,
      polyfillsUri,
      scriptUri,
      imageUris
    );
    /*
      Leaving 
    */
    panel.onDidChangeViewState((e) => {
      if (e.webviewPanel.visible && e.webviewPanel.active) {
        console.log("visible");
        panel.webview.postMessage({
          command: "loadState",
          data: {},
        });
      }
    });
  });

  context.subscriptions.push(disposable, runWebView);
}

// function getAssetUris(folderUri: vscode.Uri, webview: Webview): vscode.Uri[] {
//   const imageFiles = fs.readdirSync(folderUri.fsPath);
//   return imageFiles.map((file) =>
//     webview.asWebviewUri(vscode.Uri.file(path.join(folderUri.fsPath, file)))
//   );
// }

function getAssetUris(folderUri: vscode.Uri, webview: Webview): vscode.Uri[] {
  try {
    const imageFiles = fs.readdirSync(folderUri.fsPath);
    return imageFiles.map((file) =>
      webview.asWebviewUri(vscode.Uri.file(path.join(folderUri.fsPath, file)))
    );
  } catch (error) {
    console.error("Error getting image URIs:", error);
    return [];
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// console.log("JSON STRINGIFIED OUTPUT", JSON.stringify(output))

function getWebViewContent(
  stylesUri: any,
  runtimeUri: any,
  polyfillsUri: any,
  scriptUri: any,
  imageUris: any
) {
  const imageTags = imageUris
    .map((uri: any) => `<img src="${uri}" alt="Image" />`)
    .join("\n");

  // Include imageTags in the script content
  const scriptContent = `
    const imageContainer = document.createElement('div');
    imageContainer.innerHTML = \`${imageTags}\`;
  `;
  const nonce = getNonce();

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <script type="module" nonce="${nonce}">
      ${scriptContent}
    </script>
      <link rel="stylesheet" type="text/css" href="${stylesUri}">
      <title>Hello World</title>
    </head>
    <body>
     <app-root></app-root>
      <script type="module" src="${runtimeUri}"></script>
      <script type="module" src="${polyfillsUri}"></script>
      <script type="module" src="${scriptUri}"></script>    </body>
  </html>`;
}

// This method is called when your extension is deactivated
export function deactivate() {}
