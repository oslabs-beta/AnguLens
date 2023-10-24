import { Injectable } from '@angular/core';
import { PcItem, Node } from '../models/FileSystem';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ParentChildServices {
  nodes: any[] = [];
  edges: any[] = [];
  uris: any[] = [];
  pcItems: PcItem[] = [];
  filePath: object = {};

  // subject to open modal
  private openModalSource = new Subject<PcItem>();
  openModal$ = this.openModalSource.asObservable();

  // Add any other state variables as needed

  setItems(pcItems: PcItem[]) {
    this.pcItems = pcItems;
  }

  getItems() {
    return this.pcItems;
  }

  openModal(pcItem: PcItem) {
    this.openModalSource.next(pcItem);
  }
}
