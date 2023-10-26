import * as ts from "typescript";
import * as fs from "fs";
import { tsquery } from "@phenomnomnominal/tsquery";
import cheerio = require("cheerio");


export function populateStructure(array: any, selectorNames: object[], servicesList: object[], modulesList: object[]): object {
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

      // type logic
      let type;
      let nameList = name.split(".")
      if (nameList.length > 1) {
        type = nameList.pop();
      } else {
        type = "folder";
      }

      if (type === "ts") {
        const filePath = item.path;
        let tempArray = filePath.split("/");
        tempArray.pop();
        const folderPath = tempArray.join("/");
        const sourceFile = generateAST(filePath);

        // looking for "selectorName" (the variable name used to call components, in angular templates)
        const selectorProperties = tsquery(
          sourceFile,
          "PropertyAssignment > Identifier[name=selector]"
        );

        // looking for name (the object class name that's exported from component.ts, and imported elsewhere)
        const exportClassName = tsquery(
          sourceFile,
          'ClassDeclaration:has(Decorator[expression.expression.name="Component"]) > Identifier'
        )
        let className;
        if (exportClassName.length > 0){
          //we don't really need this if... any component.ts file we check will have a name (query results array will have length)
          className = exportClassName[0].getText();
        };

        //REFACTOR? why do we have the if statement below? --> selectorProperties should never be empty. It's just querying our AST to pull out data
        if (selectorProperties.length > 0) {
          // selectorProperties(result of our query) is an array. If it has length, access [0] element
          const selectorName = selectorProperties[0].parent.initializer.text;
          // results of our query (selectorPropertiez) is an array of NODE(s) from the AST
          const obj = {
            selectorName,
            folderPath,
            filePath,
            className,
            inputs: [],
            outputs: [],
          };

          populateInputs(sourceFile, obj, folderPath);
          populateOutputs(sourceFile, obj, folderPath);
          inLineCheck(sourceFile, obj);
          selectorNames.push(obj);
        }
      }

      //checking for type ts, and file names that include "service" - this will work whether the string is event.service or eventService
              //REFACTOR all of this into a helper function? (services funcion)
      if (type === "ts" && name.toLowerCase().includes("service")){
        //REFACTOR: instead of running generateAST twice on filepath, we can call it above and use a variable
        let servicePath = generateAST(item.path);

        //querying the value of the "providedIn" property, within the @injectable directive of our service file - the value of this property is the module where this service is scoped to
        const serviceProvidedIn = tsquery(
          servicePath,
          'PropertyAssignment > Identifier[name=providedIn]'
          ); 

        //The following if statement will only run if there was @injectable in the service file --> sometimes we might land on a service.spec.ts file without @injectable
        if (serviceProvidedIn.length){
          let serviceObj = {
            path: item.path, 
            fileName: nameList.join("."),//will result in "event.service" if naming conventions were followed (the .ts already removed on line 37's "nameList.pop()" call) --> we could set name differently here....
            className: '', //need the exported className, to check against selectorNames imports (to see where the service is imported)
            injectionPoints: [],
            providedIn: serviceProvidedIn[0].parent.initializer.text
          };

          //querying the className from our service file - what's exported / what's imported when you want to use the service in a component
          let serviceClassName = tsquery(
            servicePath,
            'ClassDeclaration:has(Decorator[expression.expression.name="Injectable"]) > Identifier'
          );

          serviceObj.className = serviceClassName[0].getText();

          servicesList.push(serviceObj); //serviceList instantiated in extension.ts, passed in to populateStucture as argument
        }
      }


      if (type === "ts" && name.toLowerCase().includes("module")){
        const moduleAST = generateAST(item.path);

        let modCheck = tsquery(
          moduleAST,
          'CallExpression > Identifier[name="NgModule"]'
        );
        //check @ngModule imports first - if there are results (aka there was an ngModule decorator) --> then know for sure this is a module
        if (modCheck.length){

          //First, we will grab all the imports from our module file's AST
          let moduleImports = tsquery(
            moduleAST,
            'PropertyAssignment[name=imports] > ArrayLiteralExpression > *', //the ALL means we're grabbing all children (?) (becausea the arrayLiteral is just an array of items / children)
          );
          //imports is an array, so we want to grab all elements (with * above) and now we can .forEach it
          moduleImports.forEach(node => {
            //CHECK --> if the item is an identifier, we can just add it to the modulesList.imports array
            if (ts.isIdentifier(node)) {
              //console.log("Module Imported:", node.escapedText);
              modulesList.imports.push(node.escapedText);
                //HERE we should also check if what's being imported is brought in from @angular native, or is a custom module ()
            } 
            //CHECK if the item is a call expression --> ie. it's a moduleName.forRoot(routes) or moduleName.forChild(routes)
            else if (ts.isCallExpression(node)) {
              //console.log("Module Imported:", node.expression.expression.escapedText);//this is "routerModule" or whatever else is being imported / having a method called on it
              //console.log("Method Used:", node.expression.name.escapedText);//this is "forChild" or "forRoot" --> or I assume other 
              if (node.arguments.length) {
                //console.log("Argument:", node.arguments[0].escapedText);//this is "route"
              }
            }
          });

          let moduleExports = tsquery(
            moduleAST,
            'PropertyAssignment[name=exports] > ArrayLiteralExpression > *', //the ALL means we're grabbing all children (?) (becausea the arrayLiteral is just an array of items / children)
          );
          moduleExports.forEach(node => {

          });

          //check "routes" --> first query for 'PropertyAssigment > Identifier[name="component"]'
          let moduleComponentRoutes = tsquery(
            modulePath,
            'PropertyAssigment > Identifier[name="component"]'
          );

          // --> ALSO need to check routes for lazy loading

          //let moduleOutputs = tsquery(
          //   modulePath,
          //   ''
          // )

        }//End of giant if satement - REFACTOR? - set up helper functions for these checks
      };
    
      objTracker[name] = {
        type,
        path: item.path,
      };
    }
  }
  return output;
}

export function generateAST(filePath: string) {
  const fileContent = fs.readFileSync(filePath, "utf-8"); //get the string content / code of our file

  const sourceFile = ts.createSourceFile(
    //create the AST from our fileContent, store as sourceFile
    filePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true
  );
  return sourceFile;
}

function populateInputs(sourceFile, obj, folderPath) {
  const inputProperties = tsquery(
    sourceFile,
    "PropertyDeclaration:has(Identifier[name=Input])"
  ) as ts.PropertyDeclaration[];

  inputProperties.forEach((variable) => {
    const variableName = (variable.name as ts.Identifier).text;
    const input = {
      name: variableName,
      pathTo: folderPath,
    };
    obj.inputs.push(input);
  });
}

function populateOutputs(sourceFile, obj, folderPath) {
  const outputProperties = tsquery(
    sourceFile,
    "PropertyDeclaration:has(Decorator > CallExpression > Identifier[name=Output])"
  ) as ts.PropertyDeclaration[];

  outputProperties.forEach((variable) => {
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
  // if Component is using an inline template
  if (templateProperties.length > 0) {
    const temp = templateProperties[0] as ts.NoSubstitutionTemplateLiteral; //ts.StringLiteral;
    obj.template = temp.text.trim();
  }
  //else --> the component is not using an inline template = we don't need to create an obj.template property, because there will be a template file we can just use our convertToHtml helper function on
}


// populates Parent Child object (pcObject) with all relevant data, to send to Angular App front end (in webviewUI folder)
//also enriches our services list with all the components where that service is imported and used
export function populatePCView(selectorNames: object[], servicesList: object[]): object {
  let appPath: string;

  //REFACTOR? --> we  sort the array alphabetically so app comes first? we don't *need* to iterate here....
  for (const selectorName of selectorNames) {
    if (selectorName.selectorName === "app-root") {
      appPath = selectorName.folderPath;
    }

    let ast = generateAST(selectorName.filePath);
    //Enriching our services list, by checking which components (each called a "selectorName" here) imports a given service
    populateServicesList(servicesList, selectorName, ast);
  }

  const pcObject = {
    name: "app-root",
    path: appPath,
    children: [],
    router: {},
  };

  populateChildren(pcObject, selectorNames);
  handleRouter(appPath, selectorNames, pcObject);
  //could check for app-router.module? --> or do we want to do that in handleRouter?
  // check for any lazy loaded routes? --> if they have components that aren't otherwise tracked in pcObject
  return pcObject;
}



function populateServicesList(servicesList, selectorName, ast) {
  servicesList.forEach(service => {
    //Query the imports from each component (items in selectorNames)
    const componentImports = tsquery(
      ast,
      `ImportSpecifier > Identifier[name="${service.className}"]`
    );
    if (componentImports.length){
      service.injectionPoints.push(selectorName);
    }
  });
}



function populateChildren(pcObject: object, selectorNames: object[]): object {
  let templateContent: string;

  for (const selectorName of selectorNames) {
    if (selectorName.folderPath === pcObject.path) {
      if (!selectorName.template) {
        const filePath = convertToHtml(pcObject.path);
        templateContent = fs.readFileSync(filePath, "utf-8");
      } else {
        templateContent = selectorName.template;
      }
    }
  }

  for (const selectorName of selectorNames) {
    const obj = {
      name: "",
      path: "",
      inputs: [],
      children: [],
      outputs: [],
    };

    if (selectorCheck(templateContent, selectorName.selectorName)) {
      obj.name = selectorName.selectorName;
      obj.path = selectorName.folderPath;
      selectorName.inputs.forEach((input) => {
        if (inputCheck(templateContent, input.name)) {
          input.pathFrom = pcObject.path;
          obj.inputs.push(input);
        }
      });
      selectorName.outputs.forEach((output) => {
        if (outputCheck(templateContent, output.name)) {
          output.pathTo = pcObject.path;
          obj.outputs.push(output);
        }
      });
      pcObject.children.push(obj);
    }
  }
  //Recursively call this function on each obj of children array
  pcObject.children.forEach((child) => populateChildren(child, selectorNames));
  return pcObject;
}

//takes in a folder path for an angular component, and returns the component.html filepath for its template
function convertToHtml(folderPath: string): string {
  let path = folderPath.split("/");
  const component = path.pop();
  const htmlFile = component + ".component.html";
  return folderPath + "/" + htmlFile;
}

// checks if angular template (parsed = template content in string form) contains a given component (selectorName)
function selectorCheck(parsed: string, selectorName: string): boolean {
  const $ = cheerio.load(parsed);
  // $ is variable name (?) --> using cheerio to ".load" our template content (parsed) in string format
  const foundElement = $(selectorName);
  //checking $ to see if it has the given selectorName (component being called, like an element, within our angular template's HTML)

  if (foundElement.length) {
    //if it found a match (variable foundElement has length) return true
    return true;
  }
  return false;
}

// checks an agular template (in string formate) to see if it contians an inputName
function inputCheck(templateContent: string, inputName: string) {
  const regex = new RegExp(`\\[${inputName}\\]`, "g");
  const matches = templateContent.match(regex);
  if (matches) {
    return true;
  } else {
    return false;
  }
}

// checks an agular template (in string formate) to see if it contians an outputName
function outputCheck(templateContent: string, outputName: string) {
  const regex = new RegExp(`\\(${outputName}\\)`, "g");
  const matches = templateContent.match(regex);
  if (matches) {
    return true;
  } else {
    return false;
  }
}

function handleRouter(appPath, selectorNames, pcObject) {
  const routerObject = {  //generate new object (instead of pcObject) to represent components brought in from router outlet... 
    name: 'router-outlet',
    path: 'router-outlet',
    children: []
  };
  const appComponent = appPath + "/app.component.ts";
  //checking if app.component.ts is using an inline template, or a template URL
  inLineCheck(appComponent, routerObject);

  //if app component is not using inline template
  if (!routerObject.template) {
    let appTemplate: string = fs.readFileSync(convertToHtml(appPath), "utf-8");
    const $ = cheerio.load(appTemplate);
    const foundRouter = $("router-outlet");
    if (foundRouter.length) {
      populateRouterOutletComponents(
        appPath,
        selectorNames,
        routerObject,
        pcObject
      );
    }
  }
  //if app component is using an inline template
  else {
    const $ = cheerio.load(routerObject.template);
    const foundRouter = $("router-outlet");
    if (foundRouter.length) {
      populateRouterOutletComponents(
        appPath,
        selectorNames,
        routerObject,
        pcObject
      );
    }
  }
}

function populateRouterOutletComponents(
  appPath,
  selectorNames,
  routerObject,
  pcObject
) {
  const modulePath = appPath + "/app.module.ts";
  const moduleSource = generateAST(modulePath);

  const routerComponents = tsquery(
    moduleSource,
    'PropertyAssignment Identifier[name="component"] ~ Identifier' //checking the AST to find the component names in the "routes" of app.module
  );
  const componentNames = routerComponents.map((node) => node.text);

  const routerPaths = tsquery(
    moduleSource,
    'PropertyAssignment Identifier[name="path"] ~ StringLiteral' //checking the URL path routing for the components in "routes" of app.module
  );
  const componentPaths = routerPaths.map((node) => node.text);

  for (let i = 0; i < componentNames.length; i++) {
    let component = {};
    component.name = componentNames[i];
    component.path = "placeholder";
    component.urlPath = componentPaths[i];
    component.children = [];
    component.inputs = [];
    component.outputs = [];
    selectorNames.forEach(selector => {//SUPER inefficient, find a better way to grab the components....  an object with properties? Could you iterate over that / do everything we currently do with selectornames with that?
      if (selector.className === component.name){
        component.path = selector.folderPath;//find the matching selector, in selectorNames, and grab it's folderpath, so generate children can access it when we pass in each component object
      }
    });
    routerObject.children.push(component);
  }
  //run populate children on each component of that routerObject, to find any children components instantiated by those components
  routerObject.children.forEach((component) => {
    populateChildren(component, selectorNames);
  });
  //add in our router-outlet components (aka routerObject) onto the router property of our larger pcObject
  pcObject.router = routerObject;
}
