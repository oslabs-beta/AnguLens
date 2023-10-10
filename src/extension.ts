 // The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as ts from "typescript";
import { Uri, Webview } from "vscode";
import * as klaw from 'klaw';
import * as path from "path";
import * as fs from "fs";
import * as ng from '@angular/compiler-cli';
import { parseTemplate } from '@angular/compiler';
import { tsquery } from '@phenomnomnominal/tsquery';
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
          "runtime.5555b0e246616bd9.js"
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
          "main.97b649a78c55b36d.js"
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

    /*

    const filePath = "/Users/danielkim/personal-projects/task-tracker/src/app/components/header/header.component.html";
    // const sourceFile = generateAST(filePath);
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    const ast = parseTemplate(fileContent, filePath, {
      preserveWhitespaces: false, // Set this based on your preference
    });
    
    const inputBindings: any[] = [];
    
    function extractInputsFromAst(node: any) {
      if (node.inputs) {
        Object.keys(node.inputs).forEach(input => {
          inputBindings.push({ input, value: node.inputs[input] });
        });
      }
    
      if (node.children) {
        node.children.forEach(child => extractInputsFromAst(child));
      }
    }
    
    extractInputsFromAst(ast);
    console.log('Input Bindings:', inputBindings);

    */




    
    // const inputVariables = tsquery(
    //   sourceFile,
    //   'PropertyDeclaration:has(Identifier[name=Input])'
    // ) as ts.PropertyDeclaration[];
    
    // inputVariables.forEach(variable => {
    //   const variableName = (variable.name as ts.Identifier).text;
    //   console.log('Input variable:', variableName);
    // });



    // function visitNode(node: ts.Node) {
    //   console.log(`Node Kind: ${ts.SyntaxKind[node.kind]}, Text: "${node.getText(sourceFile)}"`)
    //   ts.forEachChild(node,visitNode)
    // }

    //visitNode(sourceFile);
    //console.log(tsquery(sourceFile, "PropertyDeclaration"));


    

    const items = [];
    const rootpath = '/Users/scottstaskus/desktop/AnguLens/webview-ui/src';

    klaw(rootpath)
      .on('data', item => items.push(item))
      .on('end', () => {
       // console.dir(items);
        populateStructure(items);
      });
    
    panel.webview.html = getWebViewContent(
      stylesUri,
      runtimeUri,
      polyfillsUri,
      scriptUri
    );
  });

  context.subscriptions.push(disposable, runWebView);
}

/*

[
  '/Users/danielkim/CodeSmith/osp/AnguLens/src',
  '/Users/danielkim/CodeSmith/osp/AnguLens/src/extension.ts',
  '/Users/danielkim/CodeSmith/osp/AnguLens/src/test',
  '/Users/danielkim/CodeSmith/osp/AnguLens/src/test/runTest.ts',
  '/Users/danielkim/CodeSmith/osp/AnguLens/src/test/suite',
  '/Users/danielkim/CodeSmith/osp/AnguLens/src/test/suite/extension.test.ts',
  '/Users/danielkim/CodeSmith/osp/AnguLens/src/test/suite/index.ts'
]

*/

function populateStructure(array: any) {
  const output = {};
  let rootPath: string = '';
  let omitIndeces;
  for(const item of array) {
    // if its the first iteration of the for loop
    if(rootPath.length === 0) {
      // console.log('item.path: 'item.path);
      let pathArray = item.path.split('/');
      // console.log('pathArray: ', pathArray);
      let rootFolder = pathArray.pop();
      // console.log('pathArray: ', pathArray);
      rootPath = rootFolder;
      output[rootFolder] = {
        type: "folder",
        path: item.path
      }
      omitIndeces = pathArray.length;
      // console.log('omitIndeces: ', omitIndeces);
    }
    else {
      //checking elements after the 1st one / root directory 
      let pathArray = item.path.split('/');
      pathArray.splice(0, omitIndeces);
      let name = pathArray.pop();

      // locating through nested output object logic
      let objTracker = output;
      for(const key of pathArray) {
        objTracker = objTracker[key];
      }

      // assigning type logic
      let type;
      if(name.split(".").length > 1) {
        type = name.split(".").pop();
      }
      else {
        type = "folder";
      }

      objTracker[name] = {
        type,
        path: item.path
      };

    }
  }
  //console.log(JSON.stringify(output));
}


// example --> const filePath = "/Users/scottstaskus/Desktop/AnguLens/webview-ui/src/app/app.component.ts"


function generateAST(filePath: string): ts.Node | undefined {
  // Read the TypeScript file content
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  // Parse the TypeScript code to get the AST
  const sourceFile = ts.createSourceFile(
    filePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true
  );
  // Return the AST (abstract syntax tree) of the source file
  return sourceFile;
}




// // Example usage
// const filePath = 'path/to/your/typescript/file.ts';
// const ast = generateAST(filePath);
// // Now 'ast' contains the abstract syntax tree of the TypeScript file
// // You can traverse and manipulate the AST as needed




// function populateStructure(array: string[]) {
//   const output = {};
//   const rootPath = array[0];
//   const rootFolder = rootPath.split('/').pop() || "";

//   output[rootFolder] = {
//       type: "folder",
//       path: rootPath
//   };

//   for (const item of array.slice(1)) {
//       let relativePathArray = item.replace(rootPath + '/', '').split('/');
//       let current = output[rootFolder];
//       while (relativePathArray.length > 1) {
//           const folder = relativePathArray.shift()!;
//           current[folder] = current[folder] || { type: "folder" };
//           current = current[folder];
//       }

//       const name = relativePathArray[0];
//       const type = name.includes('.') ? name.split('.').pop()! : "folder";
//       current[name] = {
//           type,
//           path: item
//       };
//   }

//   console.dir(output);
//   return output;
// }




function getWebViewContent(
  stylesUri: any,
  runtimeUri: any,
  polyfillsUri: any,
  scriptUri: any
) {
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
export function deactivate() {}
