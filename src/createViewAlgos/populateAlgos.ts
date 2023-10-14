import * as ts from "typescript";
import * as fs from "fs";
import { tsquery } from "@phenomnomnominal/tsquery";
import cheerio = require("cheerio");


export function populateStructure(array: any, selectorNames: object[]): object {
  console.log("POPULATED STRUCTURE TRIGGERED");
  // console.log("POPULATE PASSED IN ARRAY====", array);
  const output = {};
  let rootPath: string = "";
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
    } else {
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
      } else {
        type = "folder";
      }

      if (type === "ts") {
        const filePath = item.path;
        const sourceFile = generateAST(filePath);

        // Query for PropertyAssignment nodes with an Identifier name of 'selector'
        const selectorProperties = tsquery(
          sourceFile,
          "PropertyAssignment > Identifier[name=selector]"
        );
        console.log("component name: ", name);
        const testArray = filePath.split("/");
        testArray.pop();
        const test = testArray.join("/");

        // Check if selectorProperties is not empty and log the selector name
        if (selectorProperties.length > 0) {
          const selectorName = selectorProperties[0].parent.initializer.text;
          
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
  return output;
}

function generateAST(filePath: string) {
  // Read the TypeScript file content
  const fileContent = fs.readFileSync(filePath, "utf-8");

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

export function populatePCView(selectorNames: object[]): object {
  // step 1: build initial object with information about app component
  let appPath: string;
  for (const selectorName of selectorNames) {
    if (selectorName.selectorName === "app-root") {
      // folderPath = '/Users/danielkim/personal-projects/task-tracker/src/app'
      appPath = selectorName.folderPath;
    }
  }
  const output = {
    name: "app-root",
    path: appPath,
    children: [],
  };

  populateChildren(output, selectorNames);
  return output;
}

function populateChildren(pcObject: object, selectorNames: object[]): object {
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
  pcObject.children.forEach((child) =>
    populateChildren(child, selectorNames)
  );
  return pcObject;
}

function convertToHtml(folderPath: string): string {
  let path = folderPath.split("/");
  const component = path.pop();
  const htmlFile = component + ".component.html";
  return folderPath + "/" + htmlFile;
}

function selectorCheck(filePath: string, selectorName: string): boolean {
  const parsed = fs.readFileSync(filePath, "utf-8");
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

  // console.log("JSON STRINGIFIED OUTPUT", JSON.stringify(output));

