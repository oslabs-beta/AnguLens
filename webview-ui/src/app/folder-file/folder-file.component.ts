import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { DataSet } from 'vis-data';
import { Network } from 'vis-network';
import { FsItem } from '../../models/FileSystem';
import { PcItem } from '../../models/FileSystem';
import { ExtensionMessage } from '../../models/message';
import { URIObj } from 'src/models/uri';
import { vscode } from '../utilities/vscode';

import { FileSystemService } from 'src/services/FileSystemService';

type AppState = {
  networkData: any; // Use the appropriate data type for 'networkData'
  options: any; // Use the appropriate data type for 'options'
};

@Component({
  selector: 'folder-file',
  templateUrl: './folder-file.component.html',
  styleUrls: ['./folder-file.component.css'],
})
export class FolderFileComponent implements OnInit {
  @ViewChild('networkContainer') networkContainer!: ElementRef;

  constructor(private fileSystemService: FileSystemService) {}

  private network: any;
  nodes: any[] = [];
  edges: any[] = [];
  fsItems: FsItem[] = [];
  pcItems: PcItem[] = [];
  uris: any;
  filePath: string = '';
  options = {
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

  ngOnInit() {
    window.addEventListener('message', (event) => {
      const message: ExtensionMessage = event.data;

      switch (message.command) {
        case 'loadState': {
          const state = vscode.getState() as {
            fsItems: FsItem[];
            pcItems: PcItem[];
            uris: any;
          } | null;
          if (state) {
            console.log('STATE NETWORK', state);

            this.pcItems = state.pcItems;
            this.fsItems = state.fsItems;
            this.uris = state.uris;
            this.fileSystemService.fsItems = state.fsItems;
            this.fileSystemService.uris = state.uris;

            const { nodes, edges } = this.createNodesAndEdges(
              this.fsItems,
              this.uris
            );

            this.nodes = nodes;
            this.edges = edges;

            const newNodes = new DataSet(nodes);
            const newEdges = new DataSet(edges);

            // const data = { newNodes, newEdges };
            const data: {
              nodes: DataSet<any, 'id'>;
              edges: DataSet<any, 'id'>;
            } = {
              nodes: newNodes,
              edges: newEdges,
            };

            const container = this.networkContainer.nativeElement;
            this.network = new Network(container, data, this.options);
          }
          break;
        }
        //load icon URI's
        case 'updateUris': {
          this.uris = message.data;
          this.fsItems = this.populate(this.source.src);

          this.fileSystemService.updateState(
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

          const newNodes = new DataSet(nodes);
          const newEdges = new DataSet(edges);

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

          this.network = new Network(container, data, this.options);
          vscode.setState({
            fsItems: this.fsItems,
            uris: this.uris,
            pcItems: this.pcItems,
          });
          break;
        }
        //updatePath
        case 'generateFolderFile': {
          this.fsItems = this.populate(message.data.src);

          this.fileSystemService.updateState(
            this.fsItems,
            this.uris,
            message.data.src
          );

          const { nodes, edges } = this.createNodesAndEdges(
            this.fsItems,
            this.uris
          );

          this.nodes = nodes;
          this.edges = edges;

          const newNodes = new DataSet(nodes);
          const newEdges = new DataSet(edges);

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

          this.network = new Network(container, data, this.options);
          vscode.setState({
            fsItems: this.fsItems,
            uris: this.uris,
            pcItems: this.pcItems,
            fsData: data,
            pcData: {},
          });
          console.log('SETTING STATE OF UPDATEPATH: fsITEMS ===', this.fsItems);
          console.log('SETTING STATE OF UPDATE PATH ');
          break;
        }

        // reupdate screen
        case 'reloadFolderFile': {
          // console.log('SERVICES :D FS ITEMS', this.fileSystemService.fsItems);
          //this.fsItems = this.fileSystemService.fsItems;
          // this.fsItems = this.populate(message.data.src);

          const state = vscode.getState() as {
            fsItems: FsItem[];
            pcItems: PcItem[];
            uris: any;
            pcData: any;
            fsData: any;
          };
          console.log('RELOAD FS STATE', state);
          this.fsItems = state.fsItems;
          // console.log('FSITEMS in Reload Folder File', this.fsItems);
          // set fsItems nodes and edges from services
          this.uris = state.uris;
          // const { nodes, edges } = this.createNodesAndEdges(
          //   this.fsItems,
          //   this.uris
          // );

          // this.nodes = nodes;
          // this.edges = edges;
          // const newNodes = new DataSet(nodes);
          // const newEdges = new DataSet(edges);
          // // console.log('newNodes', newNodes);
          // // console.log('newEdges', newEdges);

          // // create a network
          // // const data = { newNodes, newEdges };
          // const data: {
          //   nodes: DataSet<any, 'id'>;
          //   edges: DataSet<any, 'id'>;
          // } = {
          //   nodes: newNodes,
          //   edges: newEdges,
          // };
          const container = this.networkContainer.nativeElement;
          this.network = new Network(container, state.fsData, this.options);
          // console.log('PC ITEMS', this.pcItems);
          // vscode.setState({
          //   fsItems: this.fsItems,
          //   uris: this.uris,
          //   pcItems: this.pcItems,
          //   pcData: state.pcData,
          // });
          break;
        }

        //default
        default:
          console.log('unknown comand ->', message.command);
          break;
      }
    });
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
  }

  createNodesAndEdges(
    fsItems: FsItem[],
    uris: string[]
  ): { nodes: any[]; edges: any[] } {
    const nodes: any[] = [];
    const edges: any[] = [];
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

    // console.log('NODES', nodes);
    // console.log('EDGES', edges);
    return { nodes, edges };
  }

  source = {
    src: {
      type: 'folder',
      path: '/Users/danielkim/CodeSmith/osp/AnguLens/webview-ui/src',
      app: {
        type: 'folder',
        path: '/Users/danielkim/CodeSmith/osp/AnguLens/webview-ui/src/app',
        'app-routing.module.ts': {
          type: 'ts',
          path: '/Users/danielkim/CodeSmith/osp/AnguLens/webview-ui/src/app/app-routing.module.ts',
        },
        'app.component.css': {
          type: 'css',
          path: '/Users/danielkim/CodeSmith/osp/AnguLens/webview-ui/src/app/app.component.css',
        },
        'app.component.html': {
          type: 'html',
          path: '/Users/danielkim/CodeSmith/osp/AnguLens/webview-ui/src/app/app.component.html',
        },
        'app.component.spec.ts': {
          type: 'ts',
          path: '/Users/danielkim/CodeSmith/osp/AnguLens/webview-ui/src/app/app.component.spec.ts',
        },
        'app.component.ts': {
          type: 'ts',
          path: '/Users/danielkim/CodeSmith/osp/AnguLens/webview-ui/src/app/app.component.ts',
        },
        'app.module.ts': {
          type: 'ts',
          path: '/Users/danielkim/CodeSmith/osp/AnguLens/webview-ui/src/app/app.module.ts',
        },
      },
      assets: {
        type: 'folder',
        path: '/Users/danielkim/CodeSmith/osp/AnguLens/webview-ui/src/assets',
        '.gitkeep': {
          type: 'gitkeep',
          path: '/Users/danielkim/CodeSmith/osp/AnguLens/webview-ui/src/assets/.gitkeep',
        },
      },
      'favicon.ico': {
        type: 'ico',
        path: '/Users/danielkim/CodeSmith/osp/AnguLens/webview-ui/src/favicon.ico',
      },
      'index.html': {
        type: 'html',
        path: '/Users/danielkim/CodeSmith/osp/AnguLens/webview-ui/src/index.html',
      },
      'main.ts': {
        type: 'ts',
        path: '/Users/danielkim/CodeSmith/osp/AnguLens/webview-ui/src/main.ts',
      },
      'styles.css': {
        type: 'css',
        path: '/Users/daielkim/CodeSmith/osp/AnguLens/webview-ui/src/styles.css',
      },
    },
  };

  populate(obj: any, items: FsItem[] = []): FsItem[] {
    // Helper function to recursively populate the file system hierarchy
    function populateGraph(
      obj: any,
      parentFolder?: string
    ): FsItem | undefined {
      // If the current object is a folder
      if (obj.type === 'folder') {
        // Create a folder item
        const folder: FsItem = {
          id: obj.path,
          label: obj.path.split('/').pop(),
          type: obj.type,
          children: [],
          folderParent: parentFolder,
        };
        // console.log('FOLDER HAS BEEN CREATED', folder);

        // Iterate over the properties of the folder
        for (const key in obj) {
          // If the property is not 'type' or 'path' and represents a file
          if (key !== 'type' && key !== 'path' && obj[key].type !== 'folder') {
            // Recursively populate for files
            const fileChild = populateGraph(obj[key], folder.id);
            // Add file IDs to the folder's children and to the result array
            if (fileChild) {
              folder.children.push(fileChild.id);
              fileChild.folderParent = folder.id;
            }
            // console.log('FILE CHILDREN FOR THIS FOLDER', folder);
          }
          // If the property is not 'type' or 'path' and represents a subfolder
          else if (
            key !== 'type' &&
            key !== 'path' &&
            obj[key].type === 'folder'
          ) {
            folder.children.push(obj[key].path);
            // Recursively populate for subfolders
            populateGraph(obj[key]);
          }
        }
        // Add the folder item to the result array
        items.push(folder);
        // If the current object is a file
        return folder;
      } else {
        // Create a file item
        const fsItem: FsItem = {
          id: obj.path,
          label: obj.path.split('/').pop(),
          type: obj.type,
          children: [],
        };

        // Add the file item to the result array
        items.push(fsItem);

        // console.log('FILE HAS BEEN CREATED', fsItem);
        return fsItem;
      }
    }

    // Call the populateGraph function to start the population process
    populateGraph(obj);

    // Return the final result array
    return items;
  }
}
