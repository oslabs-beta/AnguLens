import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { DataSet } from 'vis-data';
import { Network } from 'vis-network';
import { FsItem } from '../models/FileSystem';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements AfterViewInit {
  @ViewChild('networkContainer') networkContainer!: ElementRef;

  private network: any;
  nodes: any[] = [];
  edges: any[] = [];
  fsItems: FsItem[] = [];

  currentDirection: 'DU' | 'UD' = 'UD';

  ngAfterViewInit() {
    this.fsItems = this.populate(this.source.src);
    console.log('fsItems', this.fsItems);
    const { nodes, edges } = this.createNodesAndEdges(this.fsItems);
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
          levelSeparation: 300, //increase vertical spacing
          nodeSpacing: 1000, //increase horizontal spacing
          parentCentralization: true,
          edgeMinimization: true,
          shakeTowards: 'roots', // Tweak the layout algorithm to get better results
          sortMethod: 'hubsize', // Sort based on the hierarchical structure
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
          forceDirection:
            this.currentDirection == 'UD' || this.currentDirection == 'DU'
              ? 'vertical'
              : 'horizontal',
          roundness: 0.2,
        },
      },

      physics: {
        hierarchicalRepulsion: {
          avoidOverlap: 1,
          nodeDistance: 145,
        },
      },
    };
    this.network = new Network(container, data, options);
  }

  createNodesAndEdges(fsItems: FsItem[]): { nodes: any[]; edges: any[] } {
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
        //console.log('id:', id);
        console.log('type type type', item.type);
        switch (item.type) {
          case 'gitkeep':
            fileImg = '../assets/icons8-git-50.png';
            break;
          case 'ts':
            fileImg = '../assets/icons8-angular-50.png';
            break;

          case 'css':
            fileImg = '../assets/icons8-css-50.png';
            break;
          case 'folder':
            fileImg = '../assets/icons8-folder-50.png';
            selectedImg = '../assets/icons8-opened-folder-50.png';
            break;
          case 'html':
            fileImg = '../assets/icons8-code-50.png';
            break;
          default:
            fileImg = '../assets/icons8-file-50.png';
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
        path: '/Users/danielkim/CodeSmith/osp/AnguLens/webview-ui/src/styles.css',
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
        console.log('FOLDER HAS BEEN CREATED', folder);

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

    console.log('ITEMS HERE', items);

    // Return the final result array
    return items;
  }

  changeLayout() {
    if (this.network) {
      this.currentDirection = this.currentDirection === 'UD' ? 'DU' : 'UD';
      this.network.setOptions({
        layout: {
          hierarchical: {
            direction: this.currentDirection, // Up-Down direction
            nodeSpacing: 1000,
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
            forceDirection:
              this.currentDirection == 'UD' || this.currentDirection == 'DU'
                ? 'vertical'
                : 'horizontal',
            roundness: 0.4,
          },
        },

        physics: {
          hierarchicalRepulsion: {
            avoidOverlap: 1,
            nodeDistance: 145,
          },
        },
      });
    }
  }
}

// push to nodes array

// create an array with nodes
// const nodes = new DataSet([
//   { id: 1, label: 'Node 1' },
//   { id: 2, label: 'Node 2' },
//   { id: 3, label: 'Node 3' },
//   { id: 4, label: 'Node 4' },
//   { id: 5, label: 'Node 5' },
// ]);

// console.log('nodes', nodes);

// // create an array with edges
// const edges = new DataSet<{ id?: number; from: number; to: number }>([
//   { from: 1, to: 3 },
//   { from: 1, to: 2 },
//   { from: 2, to: 4 },
//   { from: 2, to: 5 },
//   { from: 3, to: 3 },
// ]);

// console.log('edges', edges);

// // create a network
// const container = this.networkContainer.nativeElement;
// const data = { nodes, edges };
// const options = {};
// this.network = new Network(container, data, options);
