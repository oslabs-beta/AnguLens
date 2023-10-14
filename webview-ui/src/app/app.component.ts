import { Component, OnInit } from '@angular/core';
import { vscode } from './utilities/vscode';
import { ExtensionMessage } from '../models/message';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  currentView: string = '';

  ngOnInit() {
    //start view as the folder-file hierarchy graph
    this.currentView = 'folder-file';
  }

  loadFolderFile() {
    if (this.currentView === 'parent-child') {

      this.currentView = 'folder-file';
      
      vscode.postMessage({
        command: 'reloadFolderFile',
        data: {},
      });
    
    }
  }

  loadParentChild() {
    if (this.currentView === 'folder-file') {

      this.currentView = 'parent-child';

      vscode.postMessage({
        command: 'loadParentChild',
        data: {},
      });
    
    }
  }

  // nodes, edges, uris
  // src object
}
