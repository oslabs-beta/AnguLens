import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  OnInit,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { DataSet, DataView } from 'vis-data';
import { Network } from 'vis-network';
// import { Legend } from 'vis-network/standalone';
// import { FsItem } from '../../models/FileSystem';
import { ExtensionMessage } from '../../models/message';

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
  pcItems: PcItem[] = [];
  private network: Network | undefined;
  private handleMessageEvent = (event: MessageEvent) => {
    const message: ExtensionMessage = event.data;
    console.log('caught message?', message);

    switch (message.command) {
      case 'loadState': {
        const state = vscode.getState() as {
          pcData: any;
          fsData: any;
          fsNodes: Node[];
          fsEdges: Edge[];
          pcNodes: Node[];
          pcEdges: Edge[];
        };
        this.nodes = state.pcNodes;
        this.edges = state.pcEdges;
        const newNodes = new DataSet(state.pcNodes);
        const newEdges = new DataSet(state.pcEdges);
        const data: {
          nodes: DataSet<any, 'id'>;
          edges: DataSet<any, 'id'>;
        } = {
          nodes: newNodes,
          edges: newEdges,
        };
        const container = this.networkContainer.nativeElement;
        this.network = new Network(container, data, this.options);
        vscode.setState({
          pcData: data,
          fsData: state.fsData,
          fsNodes: state.fsNodes,
          fsEdges: state.fsEdges,
          pcNodes: state.pcNodes,
          pcEdges: state.pcEdges,
        });
        break;
      }

      case 'updatePC': {
        // console.log('REAL OBJECT', message.data);
        this.pcItems = this.populate(message.data);
        // console.log('PC ITEMS', this.pcItems);
        const state = vscode.getState() as {
          pcData: object;
          fsData: any;
          fsNodes: Node[];
          fsEdges: Edge[];
          pcNodes: Node[];
          pcEdges: Edge[];
        };

        // console.log('ABOUT TO CREATE NODES AND EDGES');
        // console.log('SHOULD BE EMPTY EDGES', this.edges); // this should be set to empty state.pcEdges
        const { nodes, edges } = this.createNodesAndEdges(
          this.pcItems
        );
        this.nodes = nodes;
        this.edges = edges;
        // console.log('EDGES CREATED', this.edges);
        const newNodes = new DataSet(nodes);
        const newEdges = new DataSet(edges);

        // console.log('EDGES', this.edges);

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
          pcData: data,
          fsData: state.fsData,
          fsNodes: state.fsNodes,
          fsEdges: state.fsEdges,
          pcNodes: this.nodes,
          pcEdges: this.edges,
        });
        this.network = new Network(container, data, this.options);
        break;
      }

      case 'reloadPC': {
        const state = vscode.getState() as {
          // fsItems: FsItem[];
          // pcItems: PcItem[];
          pcData: any;
          fsData: any;
          fsNodes: Node[];
          fsEdges: Edge[];
          pcNodes: Node[];
          pcEdges: Edge[];
        };
        this.nodes = state.pcNodes;
        this.edges = state.pcEdges;
        // console.log('PC NODES', state.pcNodes);
        // console.log('PC EDGES', state.pcEdges);

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
      hierarchical: {
        direction: 'UD', // Up-Down direction
        // nodeSpacing: 1000,
        // levelSeparation: 300,
        parentCentralization: true,
        edgeMinimization: true,
        shakeTowards: 'roots', // Tweak the layout algorithm to get better results
        // sortMethod: 'directed', // Sort based on the hierarchical structure
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
    console.log('VIEW DESTROYED');
    window.removeEventListener('message', this.handleMessageEvent);
  }

  selectedFilter: string = 'all';
  edgesDataSet: DataSet<Edge> = new DataSet(this.edges); // Initialize as empty DataSet object
  edgesView = new DataView(this.edgesDataSet);

  edgesFilter(edgesData: DataSet<Edge>) {
    switch (this.selectedFilter) {
      case 'input':
        const inputEdges = edgesData.get({
          filter: (edge) => edge.relation !== 'output',
        });
        const inputDataSet = new DataSet(inputEdges);
        return inputDataSet;
      // return item.relation === this.selectedFilter;
      case 'output':
        const outputEdges = edgesData.get({
          filter: (edge) => edge.relation !== 'input',
        });
        const outputDataSet = new DataSet(outputEdges);
        return outputDataSet;
      case 'all':
        return edgesData;
      default:
        return edgesData;
    }
  }

  updateFilters(filterType: string) {
    this.selectedFilter = filterType;
    this.edgesDataSet.clear();
    this.edgesDataSet.add(this.edges);
    const result = this.edgesFilter(this.edgesDataSet);
    this.edgesView = new DataView(result);

    if (this.network) {
      const data: {
        nodes: DataSet<any, 'id'>;
        edges: DataView<any, 'id'>;
      } = {
        nodes: new DataSet<Node>(this.nodes),
        edges: this.edgesView,
      };
      const container = this.networkContainer.nativeElement;
      this.network = new Network(container, data, this.options);
    }
  }

  createNodesAndEdges(
    pcItems: PcItem[]
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
        });

        if (item.inputs.length > 0) {
          // iterate through inputs array
          for (let inputItem in item.inputs) {
            const edge: Edge = {
              id: `${item.id}-${item.inputs[inputItem].pathFrom}`,
              from: item.inputs[inputItem].pathFrom,
              to: item.id,
              relation: 'input',
              color: { color: 'green' },
              smooth: { type: 'curvedCCW', roundness: 0.25 },
              arrows: {
                to: {
                  enabled: true,
                  type: 'arrow',
                },
                middle: {
                  type: 'arrow',
                },
              },
            };
            edges.push(edge);
            // console.log('INPUT EDGE', edge);
          }
        }

        if (item.outputs.length > 0) {
          for (let outputItem in item.outputs) {
            const edge: Edge = {
              id: `${item.id}-${item.outputs[outputItem].pathTo}`,
              from: item.id,
              to: item.outputs[outputItem].pathTo,
              color: { color: 'red' },
              relation: 'output',
              arrows: {
                to: {
                  enabled: true,
                  type: 'arrow',
                },
                middle: {
                  type: 'arrow',
                },
              },
              smooth: { type: 'curvedCCW', roundness: 0.2 },
            };
            edges.push(edge);
            // console.log('OUTPUT EDGE', edge);
          }
        }

        // If the item has children (files or subfolders), add edges to them
        if (item.children && item.children.length > 0) {
          for (const childId of item.children) {
            const edge: Edge = {
              id: `${item.id}-${childId}`,
              from: item.id,
              to: childId,
              relation: 'all',
              smooth: false,
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

        if (obj.inputs) currentNode.inputs = obj.inputs;
        if (obj.outputs) currentNode.outputs = obj.outputs;

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
