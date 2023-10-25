import { Component, OnInit } from '@angular/core';
import { PcItem } from 'src/models/FileSystem';
import { ParentChildServices } from 'src/services/ParentChildServices';

@Component({
  selector: 'modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css'],
})
export class ModalComponent implements OnInit {
  modalItem: PcItem | null = null;

  constructor(private pcService: ParentChildServices) {}

  ngOnInit(): void {
    this.pcService.openModal$.subscribe((pcItem) => {
      // Receive pcItem along with the event
      this.modalItem = pcItem;
      this.openModal();
    });
  }

  isSidebarVisible = false;

  toggleSidebar() {
    console.log('CLICKED TOGGLE');
    this.isSidebarVisible = !this.isSidebarVisible;
  }

  openModal() {
    this.isSidebarVisible = true;
  }
}

/*
  REGULAR COMPONENT
  Inputs (Receiving Data From Parent: ) 
    Name of Input Variable

  Outputs (Sending data to Parent:)
    Name of Output Variable
  
  Any Injectables in this component
*/

/*
  ROUTER COMPONENT 
  Children - 

*/
