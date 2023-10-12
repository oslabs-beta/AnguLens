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
  // Add any other state variables as needed

  updateState(fsItems: FsItem[], uris: any[], filePath: object) {
    this.fsItems = fsItems;
    this.uris = uris;
    this.filePath = filePath;
  }
}
