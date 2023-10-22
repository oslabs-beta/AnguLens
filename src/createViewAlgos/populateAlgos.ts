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

    let pathArray = item.path.split("/");
    let name = pathArray.pop();

    if (rootPath.length === 0) {
      rootPath = name; //resetting our default, from rootpath = '', so that our else conditional on line 25 will hit
      output[name] = {
        type: "folder",
        path: item.path,
      };
      omitIndeces = pathArray.length;
    } else {
      pathArray.splice(0, omitIndeces);
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
        let tempArray = filePath.split("/");
        tempArray.pop();
        const folderPath = tempArray.join("/");
        const sourceFile = generateAST(filePath);

        // Query for PropertyAssignment nodes with an Identifier name of 'selector'
        const selectorProperties = tsquery(
          sourceFile,
          "PropertyAssignment > Identifier[name=selector]"
        );

        const exportClassName = tsquery(
          sourceFile,
          "ClassDeclaration[ExportKeyword] > Identifier"
        )

          //why do we have an if statement? --> selectorProperties should never be empty. it's just querying our
          //AST to pull out data
        // Check if selectorProperties is not empty and log the selector name
        if (selectorProperties.length > 0) {

          const name = 
          const selectorName = selectorProperties[0].parent.initializer.text;
        
          const obj = {
            selectorName,
            folderPath,
            name,
            inputs: [],
            outputs: []
          };

          populateInputs(sourceFile, obj, folderPath);
          
          populateOutputs(sourceFile, obj, folderPath);

          inLineCheck(sourceFile, obj);
          // if(obj.template) console.log('THIS IS IN LINE TEMP: ', template)

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

export function generateAST(filePath: string) {
  // Read the TypeScript file content
  const fileContent = fs.readFileSync(filePath, "utf-8");

  // Parse the TypeScript code to get the AST
  const sourceFile = ts.createSourceFile(
    filePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true
  );
  // Return the AST of the source file
  return sourceFile;
}

function populateInputs(sourceFile, obj, folderPath) {
  const inputProperties = tsquery (
    sourceFile,
    "PropertyDeclaration:has(Identifier[name=Input])"
  ) as ts.PropertyDeclaration[];

  inputProperties.forEach(variable => {
    const variableName = (variable.name as ts.Identifier).text;
    const input = {
      name: variableName,
      pathTo: folderPath,
    }
    obj.inputs.push(input);
  });
}

function populateOutputs(sourceFile, obj, folderPath) {
  const outputProperties = tsquery(
    sourceFile,
    'PropertyDeclaration:has(Decorator > CallExpression > Identifier[name=Output])'
  ) as ts.PropertyDeclaration[];
  
  outputProperties.forEach(variable => {
    const variableName = (variable.name as ts.Identifier).text;
    const output = {
      name: variableName,
      pathFrom: folderPath,
    };
    obj.outputs.push(output);
  });
}

export function inLineCheck(sourceFile: ts.SourceFile, obj: object) {
  const templateProperties = tsquery(
    sourceFile,
    "NoSubstitutionTemplateLiteral"
  );
  console.log(sourceFile);
  // Component is using an inline template
  if (templateProperties.length > 0) {
    const temp = templateProperties[0] as ts.NoSubstitutionTemplateLiteral; //ts.StringLiteral;
    obj.template = temp.text.trim();
  } 
}

// populates Parent Child object to send to Angular App
export function populatePCView(selectorNames: object[]): object {
  // step 1: build initial object with information about app component
  let appPath: string;
  for (const selectorName of selectorNames) {
    if (selectorName.selectorName === "app-root") {
      appPath = selectorName.folderPath;
    }
  }
  const pcObject = {
    name: "app-root",
    path: appPath,
    children: [],
    router: {}
  };

  populateChildren(pcObject, selectorNames);

  handleModules(appPath,);

  console.log(pcObject);
  return pcObject;
}



function populateChildren(pcObject: object, selectorNames: object[]): object {
  let templateContent: string;

  for(const selectorName of selectorNames) {
    if(selectorName.folderPath === pcObject.path) {
      if(!selectorName.template) {
        const filePath = convertToHtml(pcObject.path);
        templateContent = fs.readFileSync(filePath, "utf-8");
      } else {
        templateContent = selectorName.template;
      }
    }
  }
  
  for (const selectorName of selectorNames) {
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
        if (inputCheck(templateContent, input.name)){
          input.pathFrom = pcObject.path;
          obj.inputs.push(input);
        }
      });
      selectorName.outputs.forEach(output =>{
        if (outputCheck(templateContent, output.name)){
          output.pathTo = pcObject.path;
          obj.outputs.push(output);
        }
      });
      pcObject.children.push(obj);
    }
  }

  //Recursively call this function on each obj of children array
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


function selectorCheck(parsed: string, selectorName: string): boolean {
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

function inputCheck(templateContent: string, inputName: string) {
  const regex = new RegExp(`\\[${inputName}\\]`, 'g');
  const matches = templateContent.match(regex);
  if (matches) {
    return true;
  } else {
    return false;
  }
}

function outputCheck(templateContent: string, outputName: string) {
  const regex = new RegExp(`\\(${outputName}\\)`, 'g');
  const matches = templateContent.match(regex);
  if (matches) {
    return true;
  } else {
    return false;
  }
}



function handleModules(appPath, selectorNames) {
  
  const routerObject = {
    name: 'router-outlet',
    path: 'router-outlet',
    children: [{},{}]
  };
  //checking if app.component.ts is using an inline template, or a template URL
  const appComponent = appPath + "/app.component.ts";
  let appTemplate = {};
  inLineCheck(appComponent, appTemplate);
  if(!appTemplate.template){
    //not using inline template in app component
    appTemplate = fs.readFileSync(convertToHtml(appPath), "utf-8");
    const $ = cheerio.load(appTemplate);
    const foundRouter = $("router-outlet");
    //if(foundRouter.length)
  } else{
    const $ = cheerio.load(appTemplate.template);
    const foundRouter = $("router-outlet");
    //if(foundRouter.length)
  };


     // we know there is <router-outlet> in app template --> now we need to go check app.module.ts and parse
    //it's AST to find out which components are called in there. Run populate children on all those components


  //ALL OF THE BELOW --> needs to go inside the if statements on 181 / 185 --> find a way to make it DRY
  const modulePath = appPath+"/app.module.ts";
  const moduleSource = generateAST(modulePath);
  console.log("MODULE AST: ", moduleSource);


  //checking the AST to find the component names in the "routes" of app.module
  const routerComponents = tsquery(
    moduleSource, 
    'PropertyAssignment Identifier[name="component"] ~ Identifier'
  );
  const componentNames = routerComponents.map(node => node.text);


  //checking the URL path routing for the components in "routes" of app.module
  const routerPaths = tsquery(
    moduleSource, 
    'PropertyAssignment Identifier[name="path"] ~ StringLiteral'
  );
  const componentPaths = routerPaths.map(node => node.text);



 

  const relativePaths = tsquery 



  for (let i = 0; i<componentNames.length; i++){
    let obj = {};
    obj.name = componentNames[i];
    obj.path = '';
    obj.urlPath = componentPaths[i];
    obj.children = [];
    obj.inputs = [];
    obj.outputs = [];

    selectorNames.forEach(selector => {
      if (selector.selectorName === obj.name){
        const filePath = selector.path;
        //
      }; 
    });

    routerObject.children.push(obj);
  }
  
  

  //either add the export name of each component onto selectorNames so we can compare that to our componentName here
  // in order to grab the full filepath from selectorNames
  
  //OR --> look at the import statement (filepath) from the AST of the module + add it to the current 
  // directory of module filepath

  
  //BUT we need the full filepath (line 204) because populate children needs to reference that to work
  routerObject.children.forEach(component => populateChildren(component, selectorNames));
  

  //generate new object (instead of pcObject) to represent components brought in from router outlet... 
  // --> routerObject?
    // then run populate children on that routerObject, to find any children components instantiated on those components
    // --> return an object from populateChildren, add that onto a "moduleRoutes" property on the top level of our 
    // pcObject (to represent  app module), then return pcObject as normal 
}