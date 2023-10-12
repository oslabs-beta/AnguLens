import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { DataSet } from 'vis-data';
import { Network } from 'vis-network';
// import { FsItem } from '../../models/FileSystem';
import { ExtensionMessage } from '../../models/message';
import { URIObj } from 'src/models/uri';

import { vscode } from '../utilities/vscode';
import { PcItem } from 'src/models/FileSystem';
import { ParentChildServices } from 'src/services/ParentChildServices';

@Component({
  selector: 'parent-child',
  templateUrl: './parent-child.component.html',
  styleUrls: ['./parent-child.component.css'],
})
export class ParentChildComponent implements OnInit {
  @ViewChild('networkContainer') networkContainer!: ElementRef;

  nodes: any[] = [];
  edges: any[] = [];
  uris: any[] = [];
  pcItems: PcItem[] = [];
  private network: any;

  ngOnInit(): void {
    this.pcItems = this.populate(this.App);
    console.log('PC ITEMS', this.pcItems);
    console.log(App, 'APP OBJ');

    window.addEventListener('message', (event) => {
      const message: ExtensionMessage = event.data;
      console.log('caught message?', message);

      //handle different commands from extension
      switch (message.command) {
        //load icon URI's
        case 'updateUris': {
          this.uris = message.data;
          console.log('URISSSSSSSSS', this.uris);

          this.fsItems = this.populate(this.source.src);
          console.log('fsItems', this.fsItems);

          this.ParentChildServices.updateState(
            this.fsItems,
            this.uris,
            this.source.src
          );

          const { nodes, edges } = this.createNodesAndEdges(
            this.fsItems,
            this.uris
          );
          this.nodes = nodes;
          this.edges = edges;
          console.log('BEFORE SETTING DATASET');
          const newNodes = new DataSet(nodes);
          const newEdges = new DataSet(edges);
          console.log('newNodes', newNodes);
          console.log('newEdges', newEdges);

          // create a network
          const container = this.networkContainer.nativeElement;
          // const data = { newNodes, newEdges };
          const data: {
            nodes: DataSet<any, 'id'>;
            edges: DataSet<any, 'id'>;
          } = {
            nodes: newNodes,
            edges: newEdges,
          };
          const options = {
            layout: {
              hierarchical: {
                direction: 'UD', // Up-Down direction
                nodeSpacing: 1000,
                // levelSeparation: 300,
                parentCentralization: true,
                edgeMinimization: true,
                shakeTowards: 'roots', // Tweak the layout algorithm to get better results
                sortMethod: 'directed', // Sort based on the hierarchical structure
              },
            },

            nodes: {
              shape: 'image',
              image: {
                selected: '../assets/scottytoohotty.png',
                unselected: '../assets/folder-svgrepo-com.svg',
              },
              shadow: {
                enabled: true,
                color: 'rgba(0,0,0,0.5)',
                size: 10,
                x: 5,
                y: 5,
              },
            },

            edges: {
              smooth: {
                enabled: true,
                type: 'cubicBezier',
                forceDirection: 'vertical',
                roundness: 0.4,
              },
            },

            physics: {
              hierarchicalRepulsion: {
                avoidOverlap: 1,
                nodeDistance: 145,
              },
            },
          };
          console.log('Data:', data);
          console.log('Options:', options);
          this.network = new Network(container, data, options);
          break;
        }
        default:
          console.log('unknown comand ->', message.command);
          break;
      }
    });
  }

  createNodesAndEdges(
    fsItems: PcItem[],
    uris: string[]
  ): { nodes: any[]; edges: any[] } {
    const nodes: any[] = [];
    const edges: any[] = [];
    // Helper function to recursively add nodes and edges
    function addNodesAndEdges(item: PcItem, parentFolder?: string) {
      // Check if the node already exists to avoid duplicates
      const existingNode = nodes.find((node) => node.id === item.id);
      if (!existingNode) {
        // Add the current item as a node
        let fileImg: string = '';
        let selectedImg: string = '';
        //console.log('id:', id);
        console.log('type type type', item.type);
        switch (item.type) {
          case 'gitkeep':
            fileImg = uris[6];
            break;
          case 'ts':
            fileImg = uris[1];
            break;
          case 'css':
            fileImg = uris[3];
            break;
          case 'folder':
            fileImg = uris[5];
            selectedImg = uris[7];
            break;
          case 'html':
            fileImg = uris[2];
            break;
          default:
            fileImg = uris[4];
            break;
        }
        nodes.push({
          id: item.id,
          label: item.label,
          image: {
            unselected: fileImg,
            selected: selectedImg === '' ? fileImg : selectedImg,
          },
        });

        // If the item has children (files or subfolders), add edges to them
        if (item.children && item.children.length > 0) {
          for (const childId of item.children) {
            edges.push({ from: item.id, to: childId });
            const child = fsItems.find((fsItem) => fsItem.id === childId);
            if (child) {
              // Recursively add nodes and edges for children
              addNodesAndEdges(child, item.id);
            }
          }
        }
      }
    }

    // Iterate through the root items and start the process
    for (const rootItem of fsItems) {
      addNodesAndEdges(rootItem);
    }

    console.log('NODES', nodes);
    console.log('EDGES', edges);
    return { nodes, edges };
  }

  App = {
    name: 'App',
    path: '/App',
    router: true,
    children: [
      {
        name: 'header',
        path: '/app/components/header',
        children: [
          {
            name: 'button',
            path: 'app/components/button',
            children: [],
            inputs: [
              {
                name: 'text',
                pathFrom: '/app/components/header',
                pathTo: 'app/components/button',
              },
              {
                name: 'color',
                pathFrom: '/app/components/header', //what are we adding for input's path?
                pathTo: 'app/components/button',
              },
            ],
            outputs: [
              {
                name: 'buttonClick',
                pathFrom: 'app/components/button', //what are we adding for output's path?
                pathTo: '/app/components/header',
              },
            ],
          },
        ],
      },
      {
        name: 'footer',
        path: 'app/component/footer',
        children: [],
      },
    ],
    routerOutlet: [
      {
        name: 'tasks',
        path: 'app/component/tasks',
        children: [
          {
            name: 'add-task',
            path: 'app/component/add-task',
            children: [], // added this
            outputs: [
              {
                name: 'onAddTask',
                pathFrom: 'app/component/add-task',
                pathTo: 'app/component/tasks',
              },
            ],
          },
          {
            name: 'task-item',
            path: 'app/component/task-item',
            children: [], // added this
            inputs: [
              {
                name: 'task',
                pathFrom: 'app/component/tasks',
                pathTo: 'app/component/task-item',
              },
            ],
            outputs: [
              {
                name: 'onDeleteTask',
                pathFrom: 'app/component/task-item',
                pathTo: 'app/component/tasks',
              },
              {
                name: 'onToggleReminder',
                pathFrom: 'app/component/task-item',
                pathTo: 'app/component/tasks',
              },
            ],
          },
        ],
      },
      {
        name: 'app-about',
        path: 'app/component/about',
      },
    ],
  };

  // children present

  // network layout needs ->

  populate(obj: any, items: PcItem[] = []): PcItem[] {
    // let firstKey = Object.keys(obj)[0];
    console.log('in populate');

    function populateGraph(obj: any, parentComponent?: string): PcItem | void {
      console.log('in populate graph');
      // if current object has a name -> create a node for it
      if (obj.hasOwnProperty('name')) {
        const currentNode: PcItem = {
          id: obj.path,
          label: obj.name,
          type: 'component',
          inputs: [],
          outputs: [],
          children: [],
        };
        items.push(currentNode);
        console.log('CURRENT NODE', currentNode);

        // check if object has children
        if (obj.children) {
          for (const child of obj.children) {
            // if it does, run populate graph on each child, declare parentComponent
            const childNode = populateGraph(child, currentNode.id);
            if (childNode) {
              // add child to parent node's children array
              currentNode.children.push(childNode.id);
              console.log('PARENT NODE', currentNode);
            }
          }
          if (parentComponent) {
            return currentNode;
          }
        }
        return currentNode;
      }
    }
    populateGraph(obj);
    return items;
  }
}

/*

      // iterate through each key in object
      for (const key in obj) {
        const currentObject = obj[key];
        if (currentObject.hasOwnProperty('children')) {
          // if current object has children property, create a node for it
          const parentNode: PcItem = {
            id: currentObject.path,
            label: currentObject.name,
            type: 'component',
            inputs: [],
            outputs: [],
            children: [],
          };

          // iterate through each child, create a node for it, and add its id to the parent node's children array
          for (const child of currentObject.children) {
            const childNode = populateGraph(child, parentNode.id);
            if (childNode) {
              parentNode.children.push(childNode.id);
              console.log('PARENT NODE', parentNode);
            }
          }
          items?.push(parentNode);
          return parentNode;
        }
      }

*/

//firstKey = Object.keys(obj)[0];
//obj[firstKey]

//iterate through each key on every object
//create a node based on its name property
//if objects children has objects, run function recursively on those objects

// App components ===  App, header, button, footer
// routercomponents === tasks, Add-task, task-item, about
let App = {
  name: 'App',
  path: '/App',
  router: true,
  children: [
    {
      name: 'header',
      path: '/app/components/header',
      children: [
        {
          name: 'button',
          path: 'app/components/button',
          children: [],
          inputs: [
            {
              name: 'text',
              pathFrom: '/app/components/header',
              pathTo: 'app/components/button',
            },
            {
              name: 'color',
              pathFrom: '/app/components/header', //what are we adding for input's path?
              pathTo: 'app/components/button',
            },
          ],
          outputs: [
            {
              name: 'buttonClick',
              pathFrom: 'app/components/button', //what are we adding for output's path?
              pathTo: '/app/components/header',
            },
          ],
        },
      ],
    },
    {
      name: 'footer',
      path: 'app/component/footer',
      children: [],
    },
  ],
  routerOutlet: [
    {
      name: 'tasks',
      path: 'app/component/tasks',
      children: [
        {
          name: 'add-task',
          path: 'app/component/add-task',
          children: [], // added this
          outputs: [
            {
              name: 'onAddTask',
              pathFrom: 'app/component/add-task',
              pathTo: 'app/component/tasks',
            },
          ],
        },
        {
          name: 'task-item',
          path: 'app/component/task-item',
          children: [], // added this
          inputs: [
            {
              name: 'task',
              pathFrom: 'app/component/tasks',
              pathTo: 'app/component/task-item',
            },
          ],
          outputs: [
            {
              name: 'onDeleteTask',
              pathFrom: 'app/component/task-item',
              pathTo: 'app/component/tasks',
            },
            {
              name: 'onToggleReminder',
              pathFrom: 'app/component/task-item',
              pathTo: 'app/component/tasks',
            },
          ],
        },
      ],
    },
    {
      name: 'app-about',
      path: 'app/component/about',
    },
  ],
};
