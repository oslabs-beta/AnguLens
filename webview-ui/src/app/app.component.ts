import { Component } from '@angular/core';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { Subject } from 'rxjs';
// import { Node, Link } from 'webview-ui/src/models/Node.ts';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'webview-ui';

  links = [
    {
      id: 'a',
      source: 'first',
      target: 'second',
      label: 'is parent of',
    },
    {
      id: 'b',
      source: 'first',
      target: 'c1',
      label: 'custom label',
    },
    {
      id: 'd',
      source: 'first',
      target: 'c2',
      label: 'custom label',
    },
    {
      id: 'e',
      source: 'c1',
      target: 'd',
      label: 'first link',
    },
    {
      id: 'f',
      source: 'c1',
      target: 'd',
      label: 'second link',
    },
  ];

  nodes = [
    {
      id: 'first',
      label: 'A',
    },
    {
      id: 'second',
      label: 'B',
    },
    {
      id: 'c1',
      label: 'C1',
    },
    {
      id: 'c2',
      label: 'C2',
    },
    {
      id: 'd',
      label: 'D',
    },
  ];

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
}

// const newNode = {
//   id: 'newNodeId', // You should generate a unique ID for each node
//   label: 'New Node',
//   meta: {
//     forceDimensions: false,
//   },
//   dimension: {
//     width: 50, // Set the desired width
//     height: 30, // Set the desired height
//   },
//   position: {
//     x: 0, // Set the desired x-coordinate
//     y: 0, // Set the desired y-coordinate
//   },
// };

// // Push the new node to the array
// this.nodes.push(newNode);
// console.log('Added new node', newNode);
// console.log(this.nodes, 'NODES ARRAY');
