import { Component, ChangeDetectionStrategy, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { DataSet, DataView } from 'vis-data';
import { Network } from 'vis-network';
import { ExtensionMessage } from '../../models/message';
import { vscode } from '../utilities/vscode';
import {
  FsItem,
  PcItem,
  Node,
  Edge,
  Input,
  Output,
  RouterChildren,
} from '../../models/FileSystem';
import { Router } from '@angular/router';

@Component({
  selector: 'services-view',
  templateUrl: './services-view.component.html',
  styleUrls: ['./services-view.component.css']
})
export class ServicesViewComponent implements OnInit, OnDestroy{
  @ViewChild('networkContainer') networkContainer!: ElementRef;
  constructor() {}
  persisting: boolean = false;

  private handleMessageEvent = (event: MessageEvent) => {
    const message: ExtensionMessage = event.data;
    console.log('caught message?', message);

    switch (message.command) {  
      
      case 'updateServices': {
        this.persisting = true;
        break;
      }

      default:
        console.log('Services DEFAULT CASE unknown command ->', message.command);
        break;
    }
  };

  setupMessageListener(): void {
    window.addEventListener('message', this.handleMessageEvent);
  }
  
  ngOnInit(): void {
    this.setupMessageListener();
  }

  ngOnDestroy(): void {
    console.log('VIEW DESTROYED');
    window.removeEventListener('message', this.handleMessageEvent);
  }


}
