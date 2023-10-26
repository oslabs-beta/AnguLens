import { Injectable } from '@angular/core';
import { FsItem } from '../models/FileSystem';

@Injectable({
  providedIn: 'root',
})
export class FileSystemService {
  nodes: any[] = [];
  edges: any[] = [];
  uris: any[] = [];
  fsItems: FsItem[] = [];
  filePath: object = {};
  generatedPc: boolean = false;
  generatedServices: boolean = false;
  // Add any other state variables as needed

  updateState(fsItems: FsItem[], uris: any[], filePath: object) {
    this.fsItems = fsItems;
    this.uris = uris;
    this.filePath = filePath;
  }

  setGeneratedServices(generatedServices: boolean) {
    this.generatedServices = generatedServices;
  }

  getGeneratedServices() {
    return this.generatedServices;
  }

  
  setGeneratedPC(generatedPc: boolean) {
    this.generatedPc = generatedPc;
  }

  getGeneratedPC() {
    return this.generatedPc;
  }
}
