import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  OnInit,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { DataSet } from 'vis-data';
import { Network } from 'vis-network/standalone';
import { FsItem, PcItem, Node, Edge } from '../../models/FileSystem';
import { ExtensionMessage } from '../../models/message';
import { URIObj } from 'src/models/uri';
import { vscode } from '../utilities/vscode';

import { FileSystemService } from 'src/services/FileSystemService';
import { first } from 'rxjs';

type AppState = {
  networkData: any; // Use the appropriate data type for 'networkData'
  options: any; // Use the appropriate data type for 'options'
};
interface Folder {
  type: 'folder';
  path: string;
  [key: string]: Folder | string;
}

interface File {
  type: string;
  path: string;
}

@Component({
  selector: 'folder-file',
  templateUrl: './folder-file.component.html',
  styleUrls: ['./folder-file.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FolderFileComponent implements OnInit, OnDestroy {
  @ViewChild('networkContainer') networkContainer!: ElementRef;

  constructor(private fileSystemService: FileSystemService) {}

  network: any;
  nodes: Node[] = [];
  renderedNodes: Node[] = [];
  edges: Edge[] = [];
  fsItems: FsItem[] = [];
  pcItems: PcItem[] = [];
  uris: string[] = [];
  filePath: string = '';
  reloadRequired: boolean = false;
  options = {
    interaction: {
      navigationButtons: true,
      keyboard: true,
    },
    layout: {
      hierarchical: {
        direction: 'UD', // Up-Down direction
        nodeSpacing: 1000,
        levelSeparation: 300,
        parentCentralization: true,
        edgeMinimization: true,
        shakeTowards: 'roots', // Tweak the layout algorithm to get better results
        sortMethod: 'directed', // Sort based on the hierarchical structure
      },
    },

    nodes: {
      shape: 'image',
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
  private handleMessageEvent = (event: MessageEvent) => {
    const message: ExtensionMessage = event.data;
    console.log('caught message?', message);
    switch (message.command) {
      case 'loadState': {
        const state = vscode.getState() as {
          uris: string[];
          pcData: any;
          fsData: any;
          fsNodes: Node[];
          fsEdges: Edge[];
          pcNodes: Node[];
          pcEdges: Edge[];
        };
        this.nodes = state.fsNodes;
        this.edges = state.fsEdges;
        this.renderedNodes = this.nodes.filter((node: Node) => !node.hidden);

        const data: {
          nodes: DataSet<any>;
          edges: DataSet<any>;
        } = {
          nodes: new DataSet(this.renderedNodes),
          edges: new DataSet(this.edges),
        };
        const container = this.networkContainer.nativeElement;
        this.network = new Network(container, data, this.options);
        //event listener for double click to open file
        this.network.on('doubleClick', (params: any) => {
          if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            if (nodeId) {
              // Send a message to your VS Code extension to open the file
              vscode.postMessage({
                command: 'openFile',
                data: { filePath: nodeId },
              });
            }
          }
        });
        this.network.on('click', (event: { nodes: string[] }) => {
          const { nodes: nodeIds } = event;
          if (nodeIds.length > 0) {
            this.hide(nodeIds);
            this.reRenderComponents();
          }
        });
        vscode.setState({
          uris: state.uris,
          fsData: data,
          fsNodes: state.fsNodes,
          fsEdges: state.fsEdges,
          pcData: state.pcData,
          pcNodes: state.pcNodes,
          pcEdges: state.pcEdges,
        });

        break;
      }
      //load icon URI's
      case 'updateUris': {
        console.log('RUNNING UPDATEURIS');
        this.uris = message.data;

        vscode.setState({
          uris: this.uris,
        });
        break;
      }
      //updatePath
      case 'generateFolderFile': {
        this.fsItems = this.populate(message.data.src);
        const state = vscode.getState() as {
          uris: string[];
          pcData?: any;
          fsNodes?: Node[];
          fsEdges?: Edge[];
          pcNodes?: Node[];
          pcEdges?: Edge[];
        };

        this.uris = state.uris;

        const { nodes, edges } = this.createNodesAndEdges(
          this.fsItems,
          this.uris
        );

        const edgesWithIds: Edge[] = edges.map((edge) => ({
          ...edge,
          from: edge.from,
          to: edge.to,
        }));
        this.edges = edgesWithIds;
        this.nodes = nodes;

        const newNodes = new DataSet(nodes);
        const newEdges = new DataSet(edgesWithIds);
        console.log('edges in generate ->', edgesWithIds);
        // create a network
        const container = this.networkContainer.nativeElement;
        // const data = { newNodes, newEdges };
        const data: {
          nodes: DataSet<any>;
          edges: DataSet<any>;
        } = {
          nodes: newNodes,
          edges: newEdges,
        };

        this.network = new Network(container, data, this.options);
        //event listener for double click to open file
        this.network.on('doubleClick', (params: any) => {
          if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            if (nodeId) {
              // Send a message to your VS Code extension to open the file
              vscode.postMessage({
                command: 'openFile',
                data: { filePath: nodeId },
              });
            }
          }
        });
        
        this.network.on('click', (event: { nodes: string[] }) => {
          const { nodes: nodeIds } = event;
          if (nodeIds.length > 0) {
            this.hide(nodeIds);
            this.reRenderComponents();
          }
        });

        vscode.setState({
          uris: this.uris,
          fsData: data,
          fsNodes: this.nodes,
          fsEdges: this.edges,
          pcData: state.pcData,
          pcNodes: state.pcNodes,
          pcEdges: state.pcEdges,
        });
        break;
      }

      // reupdate screen
      case 'reloadFolderFile': {
        const state = vscode.getState() as {
          uris: string[];
          pcData: any;
          fsData: any;
          fsNodes: Node[];
          fsEdges: Edge[];
        };
        this.nodes = state.fsNodes;
        this.edges = state.fsEdges;
        this.renderedNodes = this.nodes.filter((node: Node) => !node.hidden);

        const data: {
          nodes: DataSet<any>;
          edges: DataSet<any>;
        } = {
          nodes: new DataSet(this.renderedNodes),
          edges: new DataSet(this.edges),
        };
        const container = this.networkContainer.nativeElement;
        this.network = new Network(container, data, this.options);
         //event listener for double click to open file
         this.network.on('doubleClick', (params:any) => {
          if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            if (nodeId) {
              // Send a message to your VS Code extension to open the file
              vscode.postMessage({
                command: 'openFile',
                data: { filePath: nodeId },
              });
            }
          }
        });
        
        this.network.on('click', (event: { nodes: string[] }) => {
          const { nodes: nodeIds } = event;
          if (nodeIds.length > 0) {
            this.hide(nodeIds);
            this.reRenderComponents();
          }
        });
        break;
      }

      //default
      default:
        console.log('unknown comand ->', message.command);
        break;
    }
  };

  setupMessageListener(): void {
    window.addEventListener('message', this.handleMessageEvent);
  }

  ngOnInit(): void {
    this.setupMessageListener();
    const state = vscode.getState() as {
      uris: string[] | undefined;
    };
    if (state === undefined) {
      vscode.postMessage({
        command: 'sendURIs',
        data: {},
      });
    }
  }

  ngOnDestroy(): void {
    console.log('DESTROYED');
    window.removeEventListener('message', this.handleMessageEvent);
  }

  /*
    After the User inputs a src path
  */
  loadNetwork() {
    console.log('File path:', this.filePath);

    vscode.postMessage({
      command: 'loadNetwork',
      data: {
        filePath: this.filePath,
      },
    });
    this.fileSystemService.setGeneratedPC(false);
    console.log(this.fileSystemService.getGeneratedPC()); // should log false
  }

  reRenderComponents() {
    if (this.reloadRequired) {
      this.renderedNodes = this.nodes.filter((node: Node) => !node.hidden);
      this.network.setData({
        nodes: this.renderedNodes,
        edges: this.edges
      });
      const state = vscode.getState();
      vscode.setState({
        ...state as object,
        fsNodes: this.nodes,
      });
      this.reloadRequired = true;
    }
  }

  hide(nodes: String[], firstRun: Boolean = true) {
    const clickedNodes = nodes.map(nodeId => this.nodes.find(node => node.id === nodeId));
    clickedNodes.forEach(clickedNode => {
      if (clickedNode && clickedNode.open !== undefined && (clickedNode.open || firstRun === true)) {
        if (firstRun) {
          this.reloadRequired = true;
          clickedNode.open = !clickedNode.open;
        }
        const childrenArr: String[] = this.edges.filter(edge => edge.from === clickedNode.id).map(edge => edge.to);
        this.hide(childrenArr, false);
        childrenArr.forEach((item) => {
          const currentNode: Node | undefined = this.nodes.find((node) => node.id === item);
          if (currentNode) {
            currentNode.hidden = !currentNode.hidden;
          }
        });
      }

    });
  }

  createNodesAndEdges(
    fsItems: FsItem[],
    uris: string[]
  ): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    // Helper function to recursively add nodes and edges
    function addNodesAndEdges(item: FsItem, parentFolder?: string) {
      // Check if the node already exists to avoid duplicates
      const existingNode = nodes.find((node) => node.id === item.id);
      if (!existingNode) {
        // Add the current item as a node
        let fileImg: string = '';
        let selectedImg: string = '';
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
        
        const newNode: Node = {
          id: item.id,
          label: item.label,
          image: {
            unselected: fileImg,
            selected: selectedImg === '' ? fileImg : selectedImg,
          },
          hidden: false
        };

        if (item.type === 'folder') {
          newNode.open = true;
          newNode.onFolderClick = function() {
            this.open = !this.open;
            console.log('folder clicked');
          };
        }



        nodes.push(newNode);

        // If the item has children (files or subfolders), add edges to them
        if (item.children && item.children.length > 0) {
          for (const childId of item.children) {
            const edge: Edge = {
              id: `${item.id}-${childId}`,
              from: item.id,
              to: childId,
            };
            edges.push(edge);
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

    // console.log('NODES', nodes);
    // console.log('EDGES', edges);
    return { nodes, edges };
  }

  populate(obj: Folder | File, items: FsItem[] = []): FsItem[] {
    // Helper function to recursively populate the file system hierarchy

    function isFolder(obj: Folder | File | unknown): obj is Folder {
      return (obj as Folder).type === 'folder';
    }
    function populateGraph(
      obj: Folder | File,
      parentFolder?: string
    ): FsItem | undefined {
      if (isFolder(obj)) {
        const folder: FsItem = {
          id: obj.path,
          label: obj.path.split('/').pop() || '',
          type: obj.type,
          children: [],
          folderParent: parentFolder,
        };

        // Extract known properties of Folder
        const { type, path, ...folderProps } = obj;

        for (const key in folderProps) {
          const currentKey = folderProps[key] as unknown;
          if (!isFolder(currentKey)) {
            const fileChild = populateGraph(currentKey as File, folder.id);
            if (fileChild) {
              folder.children.push(fileChild.id);
              fileChild.folderParent = folder.id;
            }
          } else {
            folder.children.push((currentKey as Folder).path);
            populateGraph(currentKey as Folder);
          }
        }

        items.push(folder);
        return folder;
      } else {
        const fsItem: FsItem = {
          id: obj.path,
          label: obj.path.split('/').pop() || '',
          type: obj.type,
          children: [],
        };

        items.push(fsItem);
        return fsItem;
      }
    }

    populateGraph(obj);

    return items;
  }
}

// source = {
//   src: {
//     type: 'folder',
//     path: '/Users/danielkim/CodeSmith/osp/AnguLens/webview-ui/src',
//     app: {
//       type: 'folder',
//       path: '/Users/danielkim/CodeSmith/osp/AnguLens/webview-ui/src/app',
//       'app-routing.module.ts': {
//         type: 'ts',
//         path: '/Users/danielkim/CodeSmith/osp/AnguLens/webview-ui/src/app/app-routing.module.ts',
//       },
//       'app.component.css': {
//         type: 'css',
//         path: '/Users/danielkim/CodeSmith/osp/AnguLens/webview-ui/src/app/app.component.css',
//       },
//       'app.component.html': {
//         type: 'html',
//         path: '/Users/danielkim/CodeSmith/osp/AnguLens/webview-ui/src/app/app.component.html',
//       },
//       'app.component.spec.ts': {
//         type: 'ts',
//         path: '/Users/danielkim/CodeSmith/osp/AnguLens/webview-ui/src/app/app.component.spec.ts',
//       },
//       'app.component.ts': {
//         type: 'ts',
//         path: '/Users/danielkim/CodeSmith/osp/AnguLens/webview-ui/src/app/app.component.ts',
//       },
//       'app.module.ts': {
//         type: 'ts',
//         path: '/Users/danielkim/CodeSmith/osp/AnguLens/webview-ui/src/app/app.module.ts',
//       },
//     },
//     assets: {
//       type: 'folder',
//       path: '/Users/danielkim/CodeSmith/osp/AnguLens/webview-ui/src/assets',
//       '.gitkeep': {
//         type: 'gitkeep',
//         path: '/Users/danielkim/CodeSmith/osp/AnguLens/webview-ui/src/assets/.gitkeep',
//       },
//     },
//     'favicon.ico': {
//       type: 'ico',
//       path: '/Users/danielkim/CodeSmith/osp/AnguLens/webview-ui/src/favicon.ico',
//     },
//     'index.html': {
//       type: 'html',
//       path: '/Users/danielkim/CodeSmith/osp/AnguLens/webview-ui/src/index.html',
//     },
//     'main.ts': {
//       type: 'ts',
//       path: '/Users/danielkim/CodeSmith/osp/AnguLens/webview-ui/src/main.ts',
//     },
//     'styles.css': {
//       type: 'css',
//       path: '/Users/daielkim/CodeSmith/osp/AnguLens/webview-ui/src/styles.css',
//     },
//   },
// };
