import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';


import { AuthCheckGuard } from '../../../guards';
import { PipesModule } from '../../../pipes/pipes.module';
import { BackupRestoreComponent } from './backup-restore.component';
import { AlertDialogModule } from '../../common/alert-dialog/alert-dialog.module';
import { DateFormatterPipe } from '../../../pipes';
import { FileUploadModalComponent } from '../../common/file-upload-modal/file-upload-modal.component';

const routes: Routes = [
  {
    path: '',
    component: BackupRestoreComponent,
    canActivate: [AuthCheckGuard]
  }
];

@NgModule({
  declarations: [
    BackupRestoreComponent,
    FileUploadModalComponent
  ],
  imports: [
    FormsModule,
    CommonModule,
    RouterModule.forChild(routes),
    PipesModule,
    AlertDialogModule
  ],
  providers: [DateFormatterPipe],
  exports: []
})
export class BackupRestoreModule { }
