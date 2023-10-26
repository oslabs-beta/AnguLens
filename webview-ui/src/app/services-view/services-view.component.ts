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
import { vscode } from '../utilities/vscode';
import {
  FsItem,
  PcItem,
  Node,
  Edge,
  Input,
  Output,
  RouterChildren,
  ServiceItem,
  InjectionPoint,
  DataStore,
} from '../../models/FileSystem';
import { Router } from '@angular/router';

@Component({
  selector: 'services-view',
  templateUrl: './services-view.component.html',
  styleUrls: ['./services-view.component.css'],
})
export class ServicesViewComponent implements OnInit, OnDestroy {
  @ViewChild('networkContainer') networkContainer!: ElementRef;
  constructor() {}
  services: ServiceItem[] = [];
  network: Network | undefined;
  nodes: Node[] = [];
  edges: Edge[] = [];
  options = {
    layout: {
      hierarchical: {
        direction: 'UD', // Up-Down direction
        sortMethod: 'directed',
        // nodeSpacing: 1000,
        // levelSeparation: 300,
        parentCentralization: false,
        edgeMinimization: true,
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
  private handleMessageEvent = (event: MessageEvent) => {
    const message: ExtensionMessage = event.data;

    switch (message.command) {
      case 'updateServices': {
        const serviceObj = message.data;
        const state = vscode.getState() as {
          pcData: any;
          fsData: any;
          fsNodes: Node[];
          fsEdges: Edge[];
          pcNodes: Node[];
          pcEdges: Edge[];
          pcItems: PcItem[];
          servicesData: ServiceItem[];
        };

        //run message.data through helper functions
        this.services = this.populate(serviceObj);

        //turn into nodes and edges
        const { nodes, edges } = this.createNodesEdges(this.services);

        const newNodes = new DataSet(nodes);
        const newEdges = new DataSet(edges);
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

        vscode.setState({
          pcData: state.pcData,
          fsData: state.fsData,
          fsNodes: state.fsNodes,
          fsEdges: state.fsEdges,
          pcNodes: state.pcNodes,
          pcEdges: state.pcEdges,
          servicesNodes: nodes,
          servicesEdges: edges,
          pcItems: state.pcItems,
          servicesData: state.servicesData,
        });
        break;
      }

      case 'reloadServices': {
        const state = vscode.getState() as {
          pcData: DataStore | undefined;
          fsData: DataStore | undefined;
          fsNodes: Node[];
          fsEdges: Edge[];
          pcNodes: Node[];
          pcEdges: Edge[];
          servicesNodes: Node[];
          servicesEdges: Edge[];
        };
        this.nodes = state.servicesNodes;
        this.edges = state.servicesEdges;
        const newNodes = new DataSet(state.servicesNodes);
        const newEdges = new DataSet(state.servicesEdges);
        const data: {
          nodes: DataSet<any, 'id'>;
          edges: DataSet<any, 'id'>;
        } = {
          nodes: newNodes,
          edges: newEdges,
        };
        const container = this.networkContainer.nativeElement;
        this.network = new Network(container, data, this.options);
        break;
      }

      default:
        console.log(
          'Services DEFAULT CASE unknown command ->',
          message.command
        );
        break;
    }
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

  createNodesEdges(serviceItems: ServiceItem[]): {
    nodes: Node[];
    edges: Edge[];
  } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let idCounter = 0;
    serviceItems.forEach((item: ServiceItem) => {
      const newServiceNode: Node = {
        id: item.path,
        label: item.className,
      };
      nodes.push(newServiceNode);
      if (item.injectionPoints.length > 0) {
        item.injectionPoints.forEach((injectItem: InjectionPoint) => {
          const newInjectNode: Node = {
            id: `${injectItem.folderPath}-${idCounter}`,
            label: injectItem.selectorName,
          };
          nodes.push(newInjectNode);
          const newEdge: Edge = {
            id: `${item.path}-${injectItem.folderPath}-${idCounter}`,
            from: item.path,
            to: newInjectNode.id,
          };
          edges.push(newEdge);
        });
      }
      idCounter++;
    });

    return { nodes, edges };
  }

  populate(servicesItems: ServiceItem[] = []): ServiceItem[] {
    const serviceArray: ServiceItem[] = [];
    servicesItems.forEach((item: ServiceItem) => {
      const newServiceItem: ServiceItem = {
        className: item.className,
        fileName: item.fileName,
        injectionPoints: item.injectionPoints,
        path: item.path,
        providedIn: item.providedIn,
      };
      serviceArray.push(newServiceItem);
    });
    return serviceArray;
  }
}
