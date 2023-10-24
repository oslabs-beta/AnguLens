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
    this.isSidebarVisible = !this.isSidebarVisible;
  }

  openModal() {
    this.isSidebarVisible = true;
  }
}
