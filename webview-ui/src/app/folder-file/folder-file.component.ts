import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  OnInit,
  ViewChild,
  OnDestroy,
  ChangeDetectorRef,
  NgZone,
  AfterViewInit,
} from '@angular/core';
import { DataSet } from 'vis-data';
import { Network } from 'vis-network/standalone';
import { FsItem, PcItem, Node, Edge, DataStore } from '../../models/FileSystem';
import { ExtensionMessage } from '../../models/message';
import { vscode } from '../utilities/vscode';

import { FileSystemService } from 'src/services/FileSystemService';
import { first } from 'rxjs';
// import matfFolderAnimationColored from '@ng-icons/material-file-icons';

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

  constructor(
    private fileSystemService: FileSystemService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  network: any;
  nodes: Node[] = [];
  renderedNodes: Node[] = [];
  edges: Edge[] = [];
  fsItems: FsItem[] = [];
  pcItems: PcItem[] = [];
  filePath: string = '';
  reloadRequired: boolean = false;
  uriObj: object = {
    gitkeep: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M13 21V23.5L10 21.5L7 23.5V21H6.5C4.567 21 3 19.433 3 17.5V5C3 3.34315 4.34315 2 6 2H20C20.5523 2 21 2.44772 21 3V20C21 20.5523 20.5523 21 20 21H13ZM13 19H19V16H6.5C5.67157 16 5 16.6716 5 17.5C5 18.3284 5.67157 19 6.5 19H7V17H13V19ZM19 14V4H6V14.0354C6.1633 14.0121 6.33024 14 6.5 14H19ZM7 5H9V7H7V5ZM7 8H9V10H7V8ZM7 11H9V13H7V11Z"></path></svg>`,
    ts: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M17.5235 16.6507L18.0126 16.3795L19.1315 6.66941L12.0002 4.12362L4.86892 6.66941L5.98781 16.3795L6.46166 16.6422L12.0002 4.21L17.5235 16.6507ZM16.4246 17.26H15.6263L14.4576 14.34H9.52286L8.35412 17.26H7.57582L12.0002 19.7131L16.4246 17.26ZM12.0002 2L21.3002 5.32L19.8817 17.63L12.0002 22L4.11867 17.63L2.7002 5.32L12.0002 2ZM13.6984 12.54L12.0002 8.45L10.302 12.54H13.6984Z">
    </path></svg>`,
    css: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M2.8 14H4.83961L4.2947 16.7245L10.0393 18.8787L17.2665 16.4697L18.3604 11H3.4L3.8 9H18.7604L19.5604 5H4.6L5 3H22L19 18L10 21L2 18L2.8 14Z">
    </path></svg>`,
    folder: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12.4142 5H21C21.5523 5 22 5.44772 22 6V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H10.4142L12.4142 5ZM20 11H4V19H20V11ZM20 9V7H11.5858L9.58579 5H4V9H20Z"></path></svg>`,
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 18.1778L7.38083 16.9222L7.0517 13.3778H9.32156L9.48045 15.2222L12 15.8889L14.5195 15.2222L14.7806 12.3556H6.96091L6.32535 5.67778H17.6747L17.4477 7.88889H8.82219L9.02648 10.1444H17.2434L16.6192 16.9222L12 18.1778ZM3 2H21L19.377 20L12 22L4.62295 20L3 2ZM5.18844 4L6.48986 18.4339L12 19.9278L17.5101 18.4339L18.8116 4H5.18844Z"></path></svg>`,
    file: `<svg xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24">
    <path d="M15 4H5V20H19V8H15V4ZM3 2.9918C3 2.44405 3.44749 2 3.9985 2H16L20.9997 7L21 20.9925C21 21.5489 20.5551 22 20.0066 
    22H3.9934C3.44476 22 3 21.5447 3 21.0082V2.9918ZM11"></path></svg>`,
  };
  options = {
    interaction: {
      navigationButtons: true,
      keyboard: true,
    },
    layout: {
      improvedLayout: true,
      hierarchical: {
        direction: 'UD', // Up-Down direction
        nodeSpacing: 200,
        levelSeparation: 300,
        parentCentralization: true,
        edgeMinimization: true,
        shakeTowards: 'roots', // Tweak the layout algorithm to get better results
        sortMethod: 'directed', // Sort based on the hierarchical structure
      },
    },

    nodes: {
      shape: 'image',
      shapeProperties: {
        interpolation: false,
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
      enabled: false,
    },
  };
  canLoadBar: boolean = false;
  loadingBarDisplay: string = 'block';
  loadingBarOpacity: number = 1;
  loadingBarWidth: any = '20px';
  loadingBarText: any = '0%';

  private handleLoadingBar(network?: any) {
    network.on('stabilizationProgress', (params: any) => {
      this.canLoadBar = true;
      const maxWidth = 496;
      const minWidth = 20;
      const widthFactor = params.iterations / params.total;
      const width = Math.max(minWidth, maxWidth * widthFactor);
      this.loadingBarWidth = `${width}px`;
      this.loadingBarText = `${Math.round(widthFactor * 100)}%`;
      this.cdr.detectChanges();
    });
    network.once('stabilizationIterationsDone', () => {
      this.loadingBarText = '100%';
      this.loadingBarWidth = '496px';
      this.loadingBarOpacity = 0;
      this.canLoadBar = false;
      this.loadingBarDisplay = 'none';
      this.cdr.detectChanges();
    });
  }

  private handleMessageEvent = (event: MessageEvent) => {
    const message: ExtensionMessage = event.data;
    switch (message.command) {
      case 'loadState': {
        this.canLoadBar = false;

        const state = vscode.getState() as {
          pcData: DataStore | undefined;
          fsData: DataStore | undefined;
          fsNodes: Node[];
          fsEdges: Edge[];
          pcNodes: Node[];
          pcEdges: Edge[];
          pcItems: PcItem[];
          servicesNodes: Node[];
          servicesEdges: Edge[];
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
        this.handleLoadingBar(this.network);
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
          fsData: data,
          fsNodes: state.fsNodes,
          fsEdges: state.fsEdges,
          pcData: state.pcData,
          pcNodes: state.pcNodes,
          pcEdges: state.pcEdges,
          pcItems: state.pcItems,
          servicesNodes: state.servicesNodes,
          servicesEdges: state.servicesEdges,
        });
        break;
      }

      //updatePath
      case 'generateFolderFile': {
        this.fsItems = this.populate(message.data.src);
        const state = vscode.getState() as {
          pcData?: DataStore;
          fsNodes?: Node[];
          fsEdges?: Edge[];
          pcNodes?: Node[];
          pcEdges?: Edge[];
          pcItems?: PcItem[];
          servicesNodes?: Node[];
          servicesEdges?: Edge[];
        };

        const { nodes, edges } = this.createNodesAndEdges(this.fsItems);

        const edgesWithIds: Edge[] = edges.map((edge) => ({
          ...edge,
          from: edge.from,
          to: edge.to,
        }));
        this.edges = edgesWithIds;
        this.nodes = nodes;

        const newNodes = new DataSet(nodes);
        const newEdges = new DataSet(edgesWithIds);
        // create a network
        const data: {
          nodes: DataSet<any>;
          edges: DataSet<any>;
        } = {
          nodes: newNodes,
          edges: newEdges,
        };
        const container = this.networkContainer.nativeElement;
        this.network = new Network(container, data, this.options);
        this.handleLoadingBar(this.network);
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
          fsData: data,
          fsNodes: this.nodes,
          fsEdges: this.edges,
          pcData: state.pcData,
          pcNodes: state.pcNodes,
          pcEdges: state.pcEdges,
          pcItems: state.pcItems,
          servicesNodes: state.servicesNodes,
          servicesEdges: state.servicesEdges,
        });
        break;
      }

      // reupdate screen
      case 'reloadFolderFile': {
        this.canLoadBar = false;
        const state = vscode.getState() as {
          pcData: DataStore;
          fsData: DataStore;
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
        break;
      }
      default:
        console.log('unknown comand ->', message.command);
        break;
    }
  };

  setupMessageListener(): void {
    window.addEventListener('message', this.handleMessageEvent);
  }

  ngOnInit(): void {
    this.canLoadBar = false;
    if (!vscode.getState()) vscode.setState({});
    this.setupMessageListener();
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.handleMessageEvent);
  }

  /*
    After the User inputs a src path
  */
  loadNetwork() {
    vscode.postMessage({
      command: 'loadNetwork',
      data: {
        filePath: this.filePath,
      },
    });
    this.fileSystemService.setGeneratedPC(false);
    this.fileSystemService.setGeneratedServices(false);
  }

  reRenderComponents() {
    if (this.reloadRequired) {
      this.renderedNodes = this.nodes.filter((node: Node) => !node.hidden);
      this.network.setData({
        nodes: this.renderedNodes,
        edges: this.edges,
      });
      const state = vscode.getState();
      vscode.setState({
        ...(state as object),
        fsNodes: this.nodes,
      });
      this.reloadRequired = false;
    }
  }

  hide(nodes: String[], firstRun: Boolean = true) {
    const clickedNodes = nodes.map((nodeId) =>
      this.nodes.find((node) => node.id === nodeId)
    );
    clickedNodes.forEach((clickedNode) => {
      if (
        clickedNode &&
        clickedNode.open !== undefined &&
        (clickedNode.open || firstRun === true)
      ) {
        if (firstRun) {
          this.reloadRequired = true;
          clickedNode.open = !clickedNode.open;
        }
        const childrenArr: String[] = this.edges
          .filter((edge) => edge.from === clickedNode.id)
          .map((edge) => edge.to);
        this.hide(childrenArr, false);
        childrenArr.forEach((item) => {
          const currentNode: Node | undefined = this.nodes.find(
            (node) => node.id === item
          );
          if (currentNode) {
            currentNode.hidden = !currentNode.hidden;
          }
        });
      }
    });
  }

  createNodesAndEdges(fsItems: FsItem[]): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const uris: Record<string, string> = this.uriObj as {
      git: '...';
      ts: '...';
      css: '...';
      folder: '...';
      html: '...';
      file: '...';
    };
    function getSVGUri(uri: string): string {
      return 'data:image/svg+xml,' + encodeURIComponent(uri);
    }
    // Helper function to recursively add nodes and edges
    function addNodesAndEdges(item: FsItem, parentFolder?: string) {
      // Check if the node already exists to avoid duplicates
      const existingNode = nodes.find((node) => node.id === item.id);
      if (!existingNode) {
        // Add the current item as a node
        let fileImg: string = '';
        if (uris[item.type]) fileImg = getSVGUri(uris[item.type]);
        else fileImg = getSVGUri(uris['file']);

        const newNode: Node = {
          id: item.id,
          label: item.label,
          image: {
            unselected: fileImg,
            selected: fileImg,
          },
          hidden: false,
        };

        if (item.type === 'folder') {
          newNode.open = true;
          newNode.onFolderClick = function () {
            this.open = !this.open;
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
