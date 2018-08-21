import { Component, OnInit, ViewChild } from '@angular/core';
import { NorthService, AlertService } from '../../../services/index';
import { Router } from '@angular/router';
import { NorthTaskModalComponent } from './north-task-modal/north-task-modal.component';
import { sortBy } from 'lodash';

@Component({
  selector: 'app-north',
  templateUrl: './north.component.html',
  styleUrls: ['./north.component.css']
})
export class NorthComponent implements OnInit {
  public task: string;
  public tasks: any;

  constructor(private northService: NorthService, private alertService: AlertService, private router: Router) {}

  @ViewChild(NorthTaskModalComponent)
  northTaskModal: NorthTaskModalComponent;

  ngOnInit() {
    this.getNorthTasks();
  }

  addNorthInstance() {
    this.router.navigate(['/north/add']);
  }

  public getNorthTasks(): void {
    this.northService.getNorthTasks().
      subscribe(
        (data) => {
          this.tasks = data;
          this.tasks = sortBy(this.tasks, ['name']);
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  openNorthTaskModal(task) {
    this.task = task;
    // call child component method to toggle modal
    this.northTaskModal.toggleModal(true);
  }
}
