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
// import { FsItem } from '../../models/FileSystem';
import { ExtensionMessage } from '../../models/message';
import { URIObj } from 'src/models/uri';

import { vscode } from '../utilities/vscode';
import { FsItem, PcItem, Node, Edge } from '../../models/FileSystem';
// import { ParentChildServices } from 'src/services/ParentChildServices';
// import { FileSystemService } from 'src/services/FileSystemService';

@Component({
  selector: 'parent-child',
  templateUrl: './parent-child.component.html',
  styleUrls: ['./parent-child.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentChildComponent implements OnInit, OnDestroy {
  @ViewChild('networkContainer') networkContainer!: ElementRef;

  constructor() {}

  nodes: Node[] = [];
  edges: Edge[] = [];
  uris: string[] = [];
  pcItems: PcItem[] = [];
  // fsItems: FsItem[] = [];
  private network: Network | undefined;
  private handleMessageEvent = (event: MessageEvent) => {
    const message: ExtensionMessage = event.data;
    console.log('caught message?', message);

    switch (message.command) {
      case 'stop': {
        const state = vscode.getState() as {
          fsItems: FsItem[];
          pcItems: PcItem[];
          uris: any;
          pcData: any;
          fsData: any;
        };
        if (state) {
          this.pcItems = state.pcItems;
          // this.fsItems = state.fsItems;
          this.uris = state.uris;

          const container = this.networkContainer.nativeElement;
          this.network = new Network(container, state.pcData, this.options);
          vscode.setState({
            // fsItems: this.fsItems,
            pcItems: this.pcItems,
            uris: this.uris,
            pcData: state.pcData,
            fsData: state.fsData,
          });
        }
        break;
      }

      case 'updatePC': {
        this.pcItems = this.populate(message.data);
        const state = vscode.getState() as {
          // fsItems: FsItem[];
          // pcItems: PcItem[];
          uris: string[];
          pcData: any;
          fsData: any;
          fsNodes: Node[];
          fsEdges: Edge[];
        };
        this.uris = state.uris;
        const { nodes, edges } = this.createNodesAndEdges(
          this.pcItems,
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
        //update state

        vscode.setState({
          // fsItems: state.fsItems,
          // pcItems: state.pcItems,
          uris: this.uris,
          pcData: data,
          fsData: state.fsData,
          fsNodes: state.fsNodes,
          fsEdges: state.fsEdges,
        });
        this.network = new Network(container, data, this.options);
        break;
      }

      case 'reloadPC': {
        const state = vscode.getState() as {
          // fsItems: FsItem[];
          // pcItems: PcItem[];
          uris: string[];
          pcData: any;
          fsData: any;
          fsNodes: Node[];
          fsEdges: Edge[];
        };
        const container = this.networkContainer.nativeElement;
        this.network = new Network(container, state.pcData, this.options);
        break;
      }

      default:
        console.log('PC DEFAULT CASE unknown command ->', message.command);
        break;
    }
  };

  options = {
    layout: {
      //enable nav buttons
      interaction: {
        navigationButtons: true,
        keyboard: true, //enable navigation with keyboard
      },
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
  setupMessageListener(): void {
    window.addEventListener('message', this.handleMessageEvent);
  }
  ngOnInit(): void {
    this.setupMessageListener();
  }

  ngOnDestroy(): void {
    console.log('DESTROYED');
    window.removeEventListener('message', this.handleMessageEvent);
  }

  createNodesAndEdges(
    pcItems: PcItem[],
    uris: string[]
  ): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
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
          // image: {
          //   unselected: '',
          //   selected: '',
          // },
        });

        // If the item has children (files or subfolders), add edges to them
        if (item.children && item.children.length > 0) {
          for (const childId of item.children) {
            const edge: Edge = {
              id: `${item.id}-${childId}`,
              from: item.id,
              to: childId,
            };
            edges.push(edge);
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

    return { nodes, edges };
  }

  populate(obj: any, items: PcItem[] = []): PcItem[] {
    // let firstKey = Object.keys(obj)[0];

    function populateGraph(obj: any, parentComponent?: string): PcItem | void {
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
