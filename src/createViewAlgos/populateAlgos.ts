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

        // looking for selectorName (the name used to call component, from an angular tempalte)
        const selectorProperties = tsquery(
          sourceFile,
          "PropertyAssignment > Identifier[name=selector]"
        );

        // looking for name (the object class name that's exported from component.ts, and imported elsewhere)
        const exportClassName = tsquery(
          sourceFile,
          'ClassDeclaration:has(Decorator[expression.expression.name="Component"]) > Identifier'
        )
        let name;
        if (exportClassName.length > 0){
          //we don't really need this if... any component.ts file we check will have a name (query results array will have length)
          name = exportClassName[0].getText();
        };


          //why do we have the if statement below? --> selectorProperties should never be empty. 
          //it's just querying our AST to pull out data
        if (selectorProperties.length > 0) {
        // selectorProperties(result of our query) is an array. If it has length, access [0] element
          const selectorName = selectorProperties[0].parent.initializer.text;
          // results of our query (selectorPropertiez) is an array of NODE(s) from the AST
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
  // Component is using an inline template
  if (templateProperties.length > 0) {
    const temp = templateProperties[0] as ts.NoSubstitutionTemplateLiteral; //ts.StringLiteral;
    obj.template = temp.text.trim();
  } 
  //else --> we already 
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

  handleModules(appPath, selectorNames, pcObject);

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



function handleModules(appPath, selectorNames, pcObject) {
  
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

    //ANOTHER --> helper function???? (probably)
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


  for (let i = 0; i<componentNames.length; i++){
    let component = {};
    obj.name = componentNames[i];
    obj.path = '';
    obj.urlPath = componentPaths[i];
    obj.children = [];
    obj.inputs = [];
    obj.outputs = [];

    selectorNames.forEach(selector => {
      if (selector.name === component.name){
        component.path = selector.folderPath;
        //find the matching selector, in selectorNames, and grab it's folderpath, so generate children can access it when we pass in each component object
    });

    routerObject.children.push(obj);
  }
  
  routerObject.children.forEach(component => populateChildren(component, selectorNames));
  

  //DONE:
  //generate new object (instead of pcObject) to represent components brought in from router outlet... 
    // then run populate children on that routerObject, to find any children components instantiated on those components

    //AT THIS PART NOW:
    // --> return an object from populateChildren, add that onto a "moduleRoutes" property on the top level of our 
    // pcObject (to represent  app module), then return pcObject as normal 

    //BUT we've edited the routerObject in place (taken each object in children array, and added to it)
    //...sooo I don't think we need to return anythibg, we just need to push routerObject onto pcObject
  pcObject.router = routerObject;
}