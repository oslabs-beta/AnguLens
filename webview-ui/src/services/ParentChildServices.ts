import { Injectable } from '@angular/core';
import { PcItem } from '../models/FileSystem';

@Injectable({
  providedIn: 'root',
})
export class ParentChildServices {
  nodes: any[] = [];
  edges: any[] = [];
  uris: any[] = [];
  pcItems: PcItem[] = [];
  filePath: object = {};
  // Add any other state variables as needed

  updateState(pcItems: PcItem[], uris: any[], filePath: object) {
    this.pcItems = pcItems;
    this.uris = uris;
    this.filePath = filePath;
  }
}
