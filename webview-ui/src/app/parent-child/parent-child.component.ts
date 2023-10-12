import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { DataSet } from 'vis-data';
import { Network } from 'vis-network';
import { FsItem } from '../../models/FileSystem';
import { ExtensionMessage } from '../../models/message';
import { URIObj } from 'src/models/uri';

import { vscode } from '../utilities/vscode';

@Component({
  selector: 'parent-child',
  templateUrl: './parent-child.component.html',
  styleUrls: ['./parent-child.component.css'],
})
export class ParentChildComponent {}
