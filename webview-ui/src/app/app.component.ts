import { Component, Inject, OnInit } from '@angular/core';
import { vscode } from './utilities/vscode';
import { ExtensionMessage } from '../models/message';
import { FileSystemService } from '.././services/FileSystemService';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  currentView: string = '';
  generatedPc: boolean = false;
  generatedServices: boolean = false;
  imageUrls: string[] = [];

  constructor(private fileSystemService: FileSystemService) {}
  ngOnInit() {
    //start view as the folder-file hierarchy graph
    this.currentView = 'folder-file';
  }

  loadServices() {
    this.generatedServices = this.fileSystemService.getGeneratedServices();
    if (
      this.currentView === 'parent-child' ||
      this.currentView === 'folder-file'
    ) {
      this.currentView = 'services';
      if (this.generatedServices) {
        vscode.postMessage({
          command: 'reloadServices',
          data: {},
        });
        console.log(this.generatedServices, 'RELOAD SERVICES');
      } else {
        vscode.postMessage({
          command: 'loadServices',
          data: {},
        });
        this.generatedServices = true;
        console.log('LOAD SERVICES');
        this.fileSystemService.setGeneratedServices(this.generatedServices);
      }
    }
  }

  loadFolderFile() {
    if (
      this.currentView === 'parent-child' ||
      this.currentView === 'services'
    ) {
      this.currentView = 'folder-file';
      vscode.postMessage({
        command: 'reloadFolderFile',
        data: {},
      });
    }
  }

  loadParentChild() {
    this.generatedPc = this.fileSystemService.getGeneratedPC();
    if (this.currentView === 'folder-file' || this.currentView === 'services') {
      this.currentView = 'parent-child';
      if (!this.fileSystemService.generatedServices) {
        vscode.postMessage({
          command: 'loadServices',
          data: {}
        });
      }

      if (this.generatedPc === true) {
        vscode.postMessage({
          command: 'reloadPC',
          data: {},
        });
      } else {
        vscode.postMessage({
          command: 'loadParentChild',
          data: {},
        });

        this.generatedPc = true;
        this.fileSystemService.setGeneratedPC(this.generatedPc); // resetting file system service to true
      }
    }
  }
}
