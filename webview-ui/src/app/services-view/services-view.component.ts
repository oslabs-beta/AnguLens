import { Component, ChangeDetectionStrategy, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
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
} from '../../models/FileSystem';
import { Router } from '@angular/router';

@Component({
  selector: 'services-view',
  templateUrl: './services-view.component.html',
  styleUrls: ['./services-view.component.css']
})
export class ServicesViewComponent implements OnInit, OnDestroy{
  @ViewChild('networkContainer') networkContainer!: ElementRef;
  constructor() {}
  persisting: boolean = false;
  services: ServiceItem[] = [];
  network: Network | undefined;
  nodes: Node[] = [];
  edges: Edge[] = [];
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
  private handleMessageEvent = (event: MessageEvent) => {
    const message: ExtensionMessage = event.data;
    console.log('caught message?', message);

    switch (message.command) {  
      
      case 'updateServices': {
        this.persisting = true;
        const serviceObj = message.data;
        const state = vscode.getState() as {
          pcData: any;
          fsData: any;
          fsNodes: Node[];
          fsEdges: Edge[];
          pcNodes: Node[];
          pcEdges: Edge[];
        };

        console.log('services in service component ', serviceObj);
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
          servicesData: data
        });
        break;
      }

      default:
        console.log('Services DEFAULT CASE unknown command ->', message.command);
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

  createNodesEdges(serviceItems: ServiceItem[]) : { nodes: Node[], edges: Edge[]} {
    console.log('running createNodesEdges');
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    serviceItems.forEach((item: ServiceItem) => {
      const newServiceNode: Node = {
        id: item.path,
        label: item.className,
      };
      nodes.push(newServiceNode);
      if (item.injectionPoints.length > 0) {
        item.injectionPoints.forEach((injectItem: InjectionPoint) => {
          const existingNode = nodes.find((node) => node.id === injectItem.folderPath);
          if(!existingNode){
            const newInjectNode: Node = {
              id: injectItem.folderPath,
              label: injectItem.selectorName
            };
            nodes.push(newInjectNode);
          }
          const newEdge: Edge = {
            id: `${item.path}-${injectItem.folderPath}`,
            from: item.path,
            to: injectItem.folderPath,
          };
          edges.push(newEdge);
        });
      }
    });

    return {nodes, edges};
  }

  populate(servicesItems: ServiceItem[] = []) : ServiceItem[] {
    console.log('running populate');
    const serviceArray: ServiceItem[] = [];
    servicesItems.forEach((item: ServiceItem) => {
      const newServiceItem: ServiceItem = {
        className: item.className,
        fileName: item.fileName,
        injectionPoints: item.injectionPoints,
        path: item.path,
        providedIn: item.providedIn
      };
      console.log('item in populate ', item);
      serviceArray.push(newServiceItem);
    });
    return serviceArray;
  }
}
