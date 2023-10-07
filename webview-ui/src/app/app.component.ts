import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { DataSet } from 'vis-data';
import { Network } from 'vis-network';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements AfterViewInit {
  @ViewChild('networkContainer') networkContainer!: ElementRef;

  private network: any;

  ngAfterViewInit() {
    // refer to docs on how to setup nodes and edges

    // create an array with nodes
    const nodes = new DataSet([
      { id: 1, label: 'Node 1' },
      { id: 2, label: 'Node 2' },
      { id: 3, label: 'Node 3' },
      { id: 4, label: 'Node 4' },
      { id: 5, label: 'Node 5' },
    ]);

    console.log('nodes', nodes);

    // create an array with edges
    const edges = new DataSet<{ id?: number; from: number; to: number }>([
      { from: 1, to: 3 },
      { from: 1, to: 2 },
      { from: 2, to: 4 },
      { from: 2, to: 5 },
      { from: 3, to: 3 },
    ]);

    console.log('edges', edges);

    // create a network
    const container = this.networkContainer.nativeElement;
    const data = { nodes, edges };
    const options = {};
    this.network = new Network(container, data, options);
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
}

/*

  





*/
