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
  inputs: any[] = []; // Array for selected node's inputs (Node receiving data from its parent)
  outputs: any[] = []; // Array for outputs (Node sending data to its child)
  services: string[] = []; // Array for injectables
  section: string = '';
  showInputs = true;
  showOutputs = true;
  showServices = true;

  constructor(private pcService: ParentChildServices) {}

  ngOnInit(): void {
    this.pcService.openModal$.subscribe((deliverable) => {
      // Receive pcItem along with the event
      this.modalItem = deliverable.pcItem;
      this.inputs = deliverable.pcItem.inputs;
      console.log(this.inputs, 'INPUTS');
      this.outputs = deliverable.pcItem.outputs;
      this.connectEdges(this.inputs, this.outputs);
      this.services = [...deliverable.services];
      this.showInputs = true;
      this.showOutputs = true;
      this.openModal();
    });
  }

  isSidebarVisible = false;

  connectEdges(inputs: any[], outputs: any[]) {
    inputs.forEach((input) => {
      this.pcService.getItems().forEach((item) => {
        if (item.id === input.pathFrom) {
          input.pathFrom = item.label;
        }
      });
    });
    outputs.forEach((output) => {
      this.pcService.getItems().forEach((item) => {
        if (item.id === output.pathTo) {
          output.pathTo = item.label;
        }
      });
    });
  }

  toggleSidebar() {
    console.log('CLICKED TOGGLE');
    this.isSidebarVisible = !this.isSidebarVisible;
  }

  openModal() {
    this.isSidebarVisible = true;
  }

  showSection(section: string) {
    switch (section) {
      case 'inputs':
        this.showInputs = !this.showInputs;
        this.inputs = this.modalItem?.inputs || [];
        break;
      case 'outputs':
        this.showOutputs = !this.showOutputs;
        this.outputs = this.modalItem?.outputs || [];
        break;
      case 'services':
        this.showServices = !this.showServices;
        break;
      default:
        // Handle unknown section
        break;
    }
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
