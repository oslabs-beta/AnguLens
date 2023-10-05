import { Component, OnInit } from '@angular/core';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { Subject } from 'rxjs';
// import { Node, Link, Cluster } from '.../webview-ui/src/models/Node.ts';
import {
  Node,
  Link,
  Cluster,
} from '/Users/natepaza/Documents/GitHub/AnguLens/webview-ui/src/models/Node'; // Update the relative path accordingly

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  links: any[] = [];
  nodes: any[] = [];
  clusters: Cluster[] = [];
  title: string = 'webview-ui';

  constructor() {}

  ngOnInit(): void {
    const { nodes, clusters } = this.convertToNodesAndClusters(this.source);

    this.nodes = [...this.nodes, ...nodes];
    this.clusters = [...this.clusters, ...clusters];
  }

  // links = [
  //   {
  //     id: 'a',
  //     source: 'first',
  //     target: 'second',
  //     label: 'is parent of',
  //   },
  //   {
  //     id: 'b',
  //     source: 'first',
  //     target: 'c1',
  //     label: 'custom label',
  //   },
  //   {
  //     id: 'd',
  //     source: 'first',
  //     target: 'c2',
  //     label: 'custom label',
  //   },
  //   {
  //     id: 'e',
  //     source: 'c1',
  //     target: 'd',
  //     label: 'first link',
  //   },
  //   {
  //     id: 'f',
  //     source: 'c1',
  //     target: 'd',
  //     label: 'second link',
  //   },
  // ];

  // nodes = [
  //   {
  //     id: 'first',
  //     label: 'A',
  //   },
  //   {
  //     id: 'second',
  //     label: 'B',
  //   },
  //   {
  //     id: 'c1',
  //     label: 'C1',
  //   },
  //   {
  //     id: 'c2',
  //     label: 'C2',
  //   },
  //   {
  //     id: 'd',
  //     label: 'D',
  //   },
  // ];

  addNode() {
    const newNode = {
      id: 'newNodeId', // You should generate a unique ID for each node
      label: 'New Node',
      meta: {
        forceDimensions: false,
      },
      dimension: {
        width: 50, // Set the desired width
        height: 30, // Set the desired height
      },
      position: {
        x: 0, // Set the desired x-coordinate
        y: 0, // Set the desired y-coordinate
      },
    };

    // Create a link from the new node to an existing node (e.g., 'first')
    const newLink = {
      id: 'linkId', // You should generate a unique ID for each link
      source: 'first',
      target: 'newNodeId',
      label: 'is connected to', // Set your desired label
    };

    // Push the new node to the array
    this.nodes = [...this.nodes, newNode];
    this.links = [...this.links, newLink];

    console.log('Added new node', newNode);
    console.log(this.nodes, 'NODES ARRAY');
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

  populateGraph() {
    // source -> src ->
    function iterateObject(obj: any) {
      // iterate through keys
      for (const key of obj) {
        if (key.type === 'folder') {
          iterateObject(key);
          // make a cluster
        } else {
        }
      }
      // if key is an object (folder or file) -> check type
      // if type is folder -> create a cluster
      //iterate through keys -> every object with type that is not a folder -> create a node & link

      if (obj.type === 'folder') {
        // iterate through keys of current object
        for (const key of obj) {
          // if the key
          if (key.type === 'folder') iterateObject(obj);
        }
      }
    }

    return iterateObject(this.source);
  }

  // Recursive function to convert the object into nodes and clusters
  convertToNodesAndClusters(
    obj: any,
    parentId?: string
  ): { nodes: Node[]; clusters: Cluster[] } {
    console.log("STEP 1: START", obj);
    let nodes: Node[] = [];
    let clusters: Cluster[] = [];

    for (const key of Object.keys(obj)) {
      const item = obj[key];

      if (item.type === 'folder') {
        // Create a cluster for the folder
        const clusterId = `cluster-${key}`;
        clusters.push(new Cluster(clusterId, key, []));
        console.log("STEP 2: CLUSTERS PUSH", clusters);

        // Recursively process the contents of the folder
        const { nodes: childNodes, clusters: childClusters } =
          this.convertToNodesAndClusters(item, clusterId);
          
        // Update childNodeIds for the cluster
        const clusterIndex = clusters.findIndex((c) => c.id === clusterId);
        clusters[clusterIndex].childNodeIds = childNodes.map((node) => node.id);

        // Concatenate child nodes and clusters
        nodes = nodes.concat(childNodes);
        clusters = clusters.concat(childClusters);
      } else {
        // Create a node for non-folder items
        const nodeId = `node-${key}`;
        nodes.push(
          new Node(
            nodeId,
            key,
            { forceDimensions: false },
            { width: 50, height: 30 },
            { x: 0, y: 0 }
          )
        );

        // Add the node ID to the parent cluster if applicable
        if (parentId) {
          const clusterIndex = clusters.findIndex((c) => c.id === parentId);
          clusters[clusterIndex].childNodeIds.push(nodeId);
        }
      }
    }
    console.log(nodes, 'NODES');
    console.log(clusters, 'CLUSTERS');
    return { nodes, clusters };
  }
}
