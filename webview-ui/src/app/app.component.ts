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
  clusters: any[] = [];
  title: string = 'webview-ui';

  constructor() {}

  ngOnInit(): void {
    const { nodes, clusters } = this.populateGraph(this.source.src);
    console.log(nodes, clusters, 'NODES AND CLUSTERS');
    this.nodes = [...this.nodes, ...nodes];
    this.clusters = [...this.clusters, ...clusters];

    console.log(this.clusters, 'CLUSTERS AS A WHOLE');
  }

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
    console.log(this.clusters, 'CLUSTERS ARRAY');
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

  populateGraph(obj: any) {
    // source -> src ->
    const nodes: Node[] = [];
    const clusters: Cluster[] = [];
    console.log(obj, 'OBJ');

    function populate(obj: any) {
      if (obj.type === 'folder') {
        const clusterId = obj.path;
        const clusterLabel = obj.path.split('/').pop();
        const cluster = new Cluster(
          clusterId,
          clusterLabel,
          [],
          { forceDimensions: false },
          { width: 30, height: 30 },
          { x: 0, y: 0 }
        );
        console.log('CLUSTER CREATED', cluster);

        for (const key in obj) {
          // Skip 'type' and 'path' properties
          if (key !== 'type' && key !== 'path' && obj[key].type !== 'folder') {
            // Recursively create the folder structure for the nested object
            const childNodeId = populate(obj[key]);

            // Add the child node to the current cluster
            cluster.childNodeIds.push(childNodeId);
          } else if (
            key !== 'type' &&
            key !== 'path' &&
            obj[key].type === 'folder'
          ) {
            populate(obj[key]);
          }
        }
        clusters.push(cluster);
      } else {
        const nodeId = obj.path;
        const nodeLabel = obj.path.split('/').pop();
        const node = new Node(
          nodeId,
          nodeLabel,
          { forceDimensions: false },
          { width: 50, height: 30 },
          { x: 0, y: 0 }
        );
        console.log(node, 'NODE');
        nodes.push(node);
        return nodeId;
      }
      console.log(clusters, 'CLUSTERS');
    }
    populate(obj);
    return { nodes, clusters };
  }
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

// clusters = [
//   {
//     id: 'third',
//     label: 'Cluster node',
//     childNodeIds: ['c1', 'c2'],
//   },
// ];
/*

      
      const test = {
        nodes: [],
        clusters: [
          {
            clusterId: '/Users/danielkim/CodeSmith/osp/AnguLens/src',
            clusterLabel: 'src',
      childNodeIds: [
        '/Users/danielkim/CodeSmith/osp/AnguLens/src/extension.ts',
        {
          nodes: [],
          clusters: [
            {
              clusterId: '/Users/danielkim/CodeSmith/osp/AnguLens/src/test',
              clusterLabel: 'test',
              childNodeIds: [
                '/Users/danielkim/CodeSmith/osp/AnguLens/src/test/runTest.ts',
                {
                  nodes: [],
                  clusters: [
                    {
                      clusterId:
                        '/Users/danielkim/CodeSmith/osp/AnguLens/src/test/suite',
                      clusterLabel: 'suite',
                      childNodeIds: [
                        '/Users/danielkim/CodeSmith/osp/AnguLens/src/test/suite/extension.test.ts',
                        '/Users/danielkim/CodeSmith/osp/AnguLens/src/test/suite/index.ts',
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};


*/
