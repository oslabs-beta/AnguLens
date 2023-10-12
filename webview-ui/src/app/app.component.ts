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

    //add listener to catch and store image URI's to pass down to view components to load icons
    // window.addEventListener('message', (event) => {
    //   const message: ExtensionMessage = event.data;

    //   switch(message.command) {
    //     case 'updateUris': {
    //       this.uris = message.data;
    //       break;
    //     }

    //     default:
    //       console.log('Unknown in app event listener -> ', message.command);
    //       break;
    //   }
    // });
  }

  //toggle visible divs on button click, see app.html
  toggleView() {
    this.currentView =
      this.currentView === 'folder-file' ? 'parent-child' : 'folder-file';
    if (this.currentView === 'folder-file') {
      vscode.postMessage({
        command: 'reloadFolderFile',
        data: {},
      });
    }
  }

  // nodes, edges, uris
  // src object
}
