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
import { FsItem, PcItem } from 'src/models/FileSystem';
import { ParentChildServices } from 'src/services/ParentChildServices';
import { FileSystemService } from 'src/services/FileSystemService';

@Component({
  selector: 'parent-child',
  templateUrl: './parent-child.component.html',
  styleUrls: ['./parent-child.component.css'],
})
export class ParentChildComponent implements OnInit {
  @ViewChild('networkContainer') networkContainer!: ElementRef;

  constructor(
    private parentChildServices: ParentChildServices,
    private fileSystemService: FileSystemService
  ) {}

  nodes: any[] = [];
  edges: any[] = [];
  uris: any[] = [];
  pcItems: PcItem[] = [];
  fsItems: FsItem[] = [];
  private network: any;
  options = {
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
      shape: 'circle',
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

  ngOnInit(): void {
    window.addEventListener('message', (event) => {
      const message: ExtensionMessage = event.data;
      console.log('caught message?', message);

      //handle different commands from extension
      switch (message.command) {
        case 'loadState': {
          const state = vscode.getState() as {
            fsItems: FsItem[];
            pcItems: PcItem[];
            uris: any;
            pcData: any;
            fsData: any;
          };
          if (state) {
            this.pcItems = state.pcItems;
            this.fsItems = state.fsItems;
            this.uris = state.uris;
            
            // const { nodes, edges } = this.createNodesAndEdges(
            //   this.pcItems,
            //   this.uris
            // );
            // this.nodes = nodes;
            // this.edges = edges;

            // const newNodes = new DataSet(nodes);
            // const newEdges = new DataSet(edges);

            // // const data = { newNodes, newEdges };
            // const data: {
            //   nodes: DataSet<any, 'id'>;
            //   edges: DataSet<any, 'id'>;
            // } = {
            //   nodes: newNodes,
            //   edges: newEdges,
            // };

            const container = this.networkContainer.nativeElement;
            this.network = new Network(container, state.pcData, this.options);
            vscode.setState({
              fsItems: this.fsItems,
              pcItems: this.pcItems,
              uris: this.uris,
              pcData: state.pcData,
              fsData: state.fsData,
            });
          }
          break;
        }
        //load icon URI's

        case 'updatePC': {
          this.pcItems = this.populate(message.data);
          const { fsItems, uris, fsData } = vscode.getState() as {
            fsItems: FsItem[];
            uris: any;
            fsData: any;
          };
          this.fsItems = fsItems;
          this.uris = uris;
          console.log('pcItems', this.pcItems);
          this.parentChildServices.updateState(
            this.pcItems,
            this.uris,
            message.data
          );

          const { nodes, edges } = this.createNodesAndEdges(
            this.pcItems,
            this.uris
          );
          this.nodes = nodes;
          this.edges = edges;
          // console.log('BEFORE SETTING DATASET');
          const newNodes = new DataSet(nodes);
          const newEdges = new DataSet(edges);
          // console.log('newNodes', newNodes);
          // console.log('newEdges', newEdges);

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
          //update state
          vscode.setState({
            fsItems: this.fsItems,
            pcItems: this.pcItems,
            uris: this.uris,
            pcData: data,
            fsData: fsData,
          });
          console.log('==== IN PC COMPONENT, UPDATEPC data ====', data);
          this.network = new Network(container, data, this.options);
          break;
        }

        case 'reloadPC': {
          // this.pcItems = this.populate(message.data);
          // const { fsItems, uris, pcItems, pcData } = vscode.getState() as {
          //   fsItems: FsItem[];
          //   uris: any;
          //   pcItems: PcItem[];
          //   pcData: any;
          // };

          const state = vscode.getState() as {
            fsItems: FsItem[];
            pcItems: PcItem[];
            uris: any;
            pcData: any;
          };
          console.log('STATE IN RELOADPC -> ', state);
          console.log('RELOADPC PCDATA', state.pcData);
          const container = this.networkContainer.nativeElement;
          this.network = new Network(container, state.pcData, this.options);
          break;
        }

        default:
          console.log('PC DEFAULT CASE unknown command ->', message.command);
          break;
      }
    });
  }

  createNodesAndEdges(
    pcItems: PcItem[],
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
        nodes.push({
          id: item.id,
          label: item.label,
        });

        // If the item has children (files or subfolders), add edges to them
        if (item.children && item.children.length > 0) {
          for (const childId of item.children) {
            edges.push({ from: item.id, to: childId });
            const child = pcItems.find((pcItem) => pcItem.id === childId);
            if (child) {
              // Recursively add nodes and edges for children
              addNodesAndEdges(child, item.id);
            }
          }
        }
      }
    }

    // Iterate through the root items and start the process
    for (const rootItem of pcItems) {
      addNodesAndEdges(rootItem);
    }

    // console.log('NODES', nodes);
    // console.log('EDGES', edges);
    return { nodes, edges };
  }

  populate(obj: any, items: PcItem[] = []): PcItem[] {
    // let firstKey = Object.keys(obj)[0];

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

        // check if object has children
        if (obj.children) {
          for (const child of obj.children) {
            // if it does, run populate graph on each child, declare parentComponent
            const childNode = populateGraph(child, currentNode.id);
            if (childNode) {
              // add child to parent node's children array
              currentNode.children.push(childNode.id);
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

// App = {
//   name: 'App',
//   path: '/App',
//   router: true,
//   children: [
//     {
//       name: 'header',
//       path: '/app/components/header',
//       children: [
//         {
//           name: 'button',
//           path: 'app/components/button',
//           children: [],
//           inputs: [
//             {
//               name: 'text',
//               pathFrom: '/app/components/header',
//               pathTo: 'app/components/button',
//             },
//             {
//               name: 'color',
//               pathFrom: '/app/components/header', //what are we adding for input's path?
//               pathTo: 'app/components/button',
//             },
//           ],
//           outputs: [
//             {
//               name: 'buttonClick',
//               pathFrom: 'app/components/button', //what are we adding for output's path?
//               pathTo: '/app/components/header',
//             },
//           ],
//         },
//       ],
//     },
//     {
//       name: 'footer',
//       path: 'app/component/footer',
//       children: [],
//     },
//   ],
//   routerOutlet: [
//     {
//       name: 'tasks',
//       path: 'app/component/tasks',
//       children: [
//         {
//           name: 'add-task',
//           path: 'app/component/add-task',
//           children: [], // added this
//           outputs: [
//             {
//               name: 'onAddTask',
//               pathFrom: 'app/component/add-task',
//               pathTo: 'app/component/tasks',
//             },
//           ],
//         },
//         {
//           name: 'task-item',
//           path: 'app/component/task-item',
//           children: [], // added this
//           inputs: [
//             {
//               name: 'task',
//               pathFrom: 'app/component/tasks',
//               pathTo: 'app/component/task-item',
//             },
//           ],
//           outputs: [
//             {
//               name: 'onDeleteTask',
//               pathFrom: 'app/component/task-item',
//               pathTo: 'app/component/tasks',
//             },
//             {
//               name: 'onToggleReminder',
//               pathFrom: 'app/component/task-item',
//               pathTo: 'app/component/tasks',
//             },
//           ],
//         },
//       ],
//     },
//     {
//       name: 'app-about',
//       path: 'app/component/about',
//     },
//   ],
// };
