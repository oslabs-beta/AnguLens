export class Node {
  constructor(
    public id: string,
    public label: string,
    public meta: object,
    public dimension: object,
    public position: object
  ) {}
}

export class Link {
  constructor(
    public id: string,
    public source: string,
    public target: string,
    public label: string
  ) {}
}

export class Cluster {
  constructor(
    public id: string,
    public label: string,
    public childNodeIds: string[],
  ) {}
}

const source = {
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
