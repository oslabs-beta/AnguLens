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
import { ExtensionMessage } from '../../models/message';
import { ParentChildServices } from 'src/services/ParentChildServices';

import { vscode } from '../utilities/vscode';
import {
  FsItem,
  PcItem,
  Node,
  Edge,
  Input,
  Output,
  RouterChildren,
} from '../../models/FileSystem';
import { Router } from '@angular/router';
@Component({
  selector: 'parent-child',
  templateUrl: './parent-child.component.html',
  styleUrls: ['./parent-child.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentChildComponent implements OnInit, OnDestroy {
  @ViewChild('networkContainer') networkContainer!: ElementRef;

  constructor(private pcService: ParentChildServices) {}

  nodes: Node[] = [];
  edges: Edge[] = [];
  pcItems: PcItem[] = [];
  private network: Network | undefined;

  handleClickModal(network: Network) {
    network.on('doubleClick', (params: any) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        if (nodeId) {
          // Open Modal for specific node component
          console.log(this.pcItems, 'PC ITEMS');
          let deliverPc: PcItem | null = null;
          for (const item of this.pcItems) {
            if (item.id === nodeId) {
              deliverPc = item;
              break;
            }
          }

          const edgeRelations = this.getEdgesOfNode(nodeId);

          if (deliverPc && edgeRelations) {
            this.pcService.openModal({
              pcItem: deliverPc as PcItem,
              edges: edgeRelations as Object,
            });
          }
        }
      }
    });
  }

  getEdgesOfNode(nodeId: string) {
    // Item.relation === output, Sending Data from node to parent
    const outputEdges = this.edges.filter(
      (edge) => edge.from === nodeId && edge.relation === 'output'
    );
    // Item.relation === input,  Receiving Data from parent to node
    const inputEdges = this.edges.filter(
      (edge) => edge.to === nodeId && edge.relation === 'input'
    );
    return { inputs: inputEdges, outputs: outputEdges };
  }

  private handleMessageEvent = (event: MessageEvent) => {
    const message: ExtensionMessage = event.data;
    console.log('caught message?', message);

    switch (message.command) {
      case 'loadState': {
        const state = vscode.getState() as {
          pcItems: PcItem[];
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
        this.pcItems = state.pcItems;
        vscode.setState({
          pcItems: this.pcItems,
          pcData: data,
          fsData: state.fsData,
          fsNodes: state.fsNodes,
          fsEdges: state.fsEdges,
          pcNodes: state.pcNodes,
          pcEdges: state.pcEdges,
        });
        this.handleClickModal(this.network);
        break;
      }

      case 'updatePC': {
        this.pcItems = this.populate(message.data);
        console.log('PC MESSAGE DATA', message.data);
        this.pcService.setItems(this.pcItems);
        const state = vscode.getState() as {
          pcItems: PcItem[];
          pcData: object;
          fsData: any;
          fsNodes: Node[];
          fsEdges: Edge[];
          pcNodes: Node[];
          pcEdges: Edge[];
        };

        const { nodes, edges } = this.createNodesAndEdges(this.pcItems);
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
          pcItems: this.pcItems,
          pcData: data,
          fsData: state.fsData,
          fsNodes: state.fsNodes,
          fsEdges: state.fsEdges,
          pcNodes: this.nodes,
          pcEdges: this.edges,
        });
        this.network = new Network(container, data, this.options);
        this.handleClickModal(this.network);
        break;
      }

      case 'reloadPC': {
        const state = vscode.getState() as {
          pcData: any;
          fsData: any;
          fsNodes: Node[];
          fsEdges: Edge[];
          pcNodes: Node[];
          pcEdges: Edge[];
          pcItems: PcItem[];
        };
        this.nodes = state.pcNodes;
        this.edges = state.pcEdges;
        this.pcItems = state.pcItems;

        const container = this.networkContainer.nativeElement;
        this.network = new Network(container, state.pcData, this.options);
        this.handleClickModal(this.network);
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
      color: 'blue',
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
      this.handleClickModal(this.network);
    }
  }

  createNodesAndEdges(pcItems: PcItem[]): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    let hasAddedRootNode = false;
    // Helper function to recursively add nodes and edges
    function addNodesAndEdges(item: PcItem, parentFolder?: string) {
      // Check if the node already exists to avoid duplicates
      const existingNode = nodes.find((node) => node.id === item.id);
      if (!existingNode) {
        // Add the current item as a node
        let fileImg: string = '';
        let selectedImg: string = '';

        if (!hasAddedRootNode) {
          nodes.push({
            id: item.id,
            label: item.label,
            color: '#ff6961',
          });
          hasAddedRootNode = true;
        } else {
          nodes.push({
            id: item.id,
            label: item.label,
          });
        }
        if (item.inputs.length > 0) {
          // iterate through inputs array
          for (let inputItem in item.inputs) {
            const edge: Edge = {
              id: `${item.id}-${item.inputs[inputItem].pathFrom}`,
              from: item.inputs[inputItem].pathFrom,
              to: item.id,
              relation: 'input',
              color: { color: 'green' },
              smooth: { type: 'curvedCCW', roundness: 0.3 },
              arrows: {
                to: {
                  enabled: true,
                  type: 'arrow',
                },
                middle: {
                  type: 'arrow',
                },
              },
              label: 'Input',
              font: { align: 'middle' },
            };
            edges.push(edge);
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
              label: 'Output',
              font: { align: 'middle' },
            };
            edges.push(edge);
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

      //add router and roputer children nodes and edges
      if (item.router !== undefined && item.router.children) {
        // Create the "router-outlet" node
        const routerOutletNode: Node = {
          id: 'router-outlet',
          label: 'router-outlet',
          color: '#CBC3E3',
        };
        nodes.push(routerOutletNode);
        const edge: Edge = {
          id: `${item.id}-router-outlet`,
          from: routerOutletNode.id,
          to: item.id, // Connect to the "router-outlet" node
          relation: 'router-outlet',
          smooth: true,
          color: { color: 'purple' },
        };
        edges.push(edge);
        //recursively add children
        for (const routerChild of item.router.children) {
          // Add the router component as a node
          nodes.push({
            id: routerChild.path,
            label: routerChild.name,
            color: '#CBC3E3',
          });

          // Create an edge from the router component to the "router-outlet"
          const edge: Edge = {
            id: `${routerChild.name}-router-outlet`,
            from: routerChild.path,
            to: 'router-outlet', // Connect to the "router-outlet" node
            relation: 'router',
            smooth: true,
            color: { color: 'purple' },
          };
          edges.push(edge);

          // Recursively add nodes and edges for children of router children
          if (routerChild.children && routerChild.children.length > 0) {
            for (const innerRouterChild of routerChild.children) {
              routerChildrenHelper(innerRouterChild, routerChild.path);
            }
          }
        }
      }
      // Helper function for adding nodes and edges for children of router children
      function routerChildrenHelper(
        innerRouterChild: RouterChildren,
        parentId: string
      ) {
        // Check if the node already exists to avoid duplicates
        const existingNode = nodes.find(
          (node) => node.id === innerRouterChild.path
        );
        if (!existingNode) {
          // Add the router child as a node
          nodes.push({
            id: innerRouterChild.path,
            label: innerRouterChild.name,
            color: '#CBC3E3',
          });

          // Create an edge from the router child to its parent router
          const edge: Edge = {
            id: `${innerRouterChild.path}-${parentId}`,
            from: innerRouterChild.path,
            to: parentId,
            relation: 'router-outlet',
            smooth: true,
            color: { color: 'purple' },
          };
          edges.push(edge);

          // Recursively add nodes and edges for children of router children
          if (
            innerRouterChild.children &&
            innerRouterChild.children.length > 0
          ) {
            for (const childOfInnerChild of innerRouterChild.children) {
              routerChildrenHelper(childOfInnerChild, innerRouterChild.path);
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
          router: obj.router,
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
