import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { FormsModule } from '@angular/forms';
import { FolderFileComponent } from './folder-file/folder-file.component';
import { ParentChildComponent } from './parent-child/parent-child.component';

import { FileSystemService } from 'src/services/FileSystemService';
import { ParentChildServices } from 'src/services/ParentChildServices';
import { ServicesViewComponent } from './services-view/services-view.component';

import { ModalComponent } from './modal/modal.component';
// import { NgIconsModule } from '@ng-icons/core';
// import matfFolderAnimationColored from '@ng-icons/material-file-icons';

@NgModule({
  declarations: [
    AppComponent,
    FolderFileComponent,
    ParentChildComponent,
    ModalComponent,
    ServicesViewComponent,
  ],
  //q: what is declarations used for?
  //a: declarations is used to make directives (including components and pipes) from the current module available to other directives in the current module. Selectors of directives, components or pipes are only matched against the HTML if they are declared or imported.
  imports: [BrowserModule, AppRoutingModule, FormsModule],
  providers: [FileSystemService, ParentChildServices],
  bootstrap: [AppComponent],
})
export class AppModule {}
