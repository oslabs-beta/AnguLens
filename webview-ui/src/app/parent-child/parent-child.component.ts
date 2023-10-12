import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { DataSet } from 'vis-data';
import { Network } from 'vis-network';
// import { FsItem } from '../../models/FileSystem';
import { ExtensionMessage } from '../../models/message';
import { URIObj } from 'src/models/uri';

import { vscode } from '../utilities/vscode';

@Component({
  selector: 'parent-child',
  templateUrl: './parent-child.component.html',
  styleUrls: ['./parent-child.component.css'],
})
export class ParentChildComponent implements AfterViewInit {
  @ViewChild('networkContainer') networkContainer!: ElementRef;

  nodes: any[] = [];
  edges: any[] = [];
  uris: any[] = [];
  private network: any;

  ngAfterViewInit(): void {}

  // children present

  // network layout needs ->
}

//firstKey = Object.keys(obj)[0];
//obj[firstKey]

//iterate through each key on every object
//create a node based on its name property
//if objects children has objects, run function recursively on those objects

let obj = {
  App: {
    name: 'App',
    path: '/App',
    router: true,
    children: [
      {
        name: 'header',
        path: '/app/components/header',
        children: [
          {
            name: 'button',
            path: 'app/components/button',
            children: [],
            inputs: [
              {
                name: 'text',
                pathFrom: '/app/components/header',
                pathTo: 'app/components/button',
              },
              {
                name: 'color',
                pathFrom: '/app/components/header', //what are we adding for input's path?
                pathTo: 'app/components/button',
              },
            ],
            outputs: [
              {
                name: 'buttonClick',
                pathFrom: 'app/components/button', //what are we adding for output's path?
                pathTo: '/app/components/header',
              },
            ],
          },
        ],
      },
      {
        name: 'footer',
        path: 'app/component/footer',
        children: [],
      },
    ],
    routerOutlet: [
      {
        name: 'tasks',
        path: 'app/component/tasks',
        children: [
          {
            name: 'add-task',
            path: 'app/component/add-task',
            outputs: [
              {
                name: 'onAddTask',
                pathFrom: 'app/component/add-task',
                pathTo: 'app/component/tasks',
              },
            ],
          },
          {
            name: 'task-item',
            path: 'app/component/task-item',
            inputs: [
              {
                name: 'task',
                pathFrom: 'app/component/tasks',
                pathTo: 'app/component/task-item',
              },
            ],
            outputs: [
              {
                name: 'onDeleteTask',
                pathFrom: 'app/component/task-item',
                pathTo: 'app/component/tasks',
              },
              {
                name: 'onToggleReminder',
                pathFrom: 'app/component/task-item',
                pathTo: 'app/component/tasks',
              },
            ],
          },
        ],
      },
      {
        name: 'app-about',
        path: 'app/component/about',
      },
    ],
  },
};
