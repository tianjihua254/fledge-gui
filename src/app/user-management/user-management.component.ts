import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertService, AuthService, UserService } from '../services/index';
import { SharedService } from '../services/shared.service';
import { NgProgress } from 'ngx-progressbar';
import { ModalComponent } from '../modal/modal.component';
import { CreateUserComponent } from "./create-user/create-user.component";
import { UpdateUserComponent } from './update-user/update-user.component';


@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {

  @ViewChild(ModalComponent) child: ModalComponent;
  @ViewChild(CreateUserComponent) createUserModal: CreateUserComponent;
  @ViewChild(UpdateUserComponent) updateUserModal: UpdateUserComponent;

  // Object to hold user record
  public childData = {};
  public userRecord;
  public uid: string;
  public roles = []
  seletedTab: Number = 1;  // 1: user-management , 2 : roles

  constructor(private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private alertService: AlertService,
    private sharedService: SharedService,
    private userService: UserService,
    public ngProgress: NgProgress) { }

  ngOnInit() {
    this.uid = sessionStorage.getItem('uid');
    this.getUsers();
  }

  getUsers() {
    this.ngProgress.start();
    this.userService.getAllUsers()
      .subscribe(
        userData => {
          this.getRole(userData.users);
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          };
        });
  }

  getRole(users) {
    this.ngProgress.start();
    this.userService.getRole()
      .subscribe(
        roleRecord => {
          this.roles = roleRecord.roles;
          this.ngProgress.done();
          roleRecord.roles.filter(role => {
            users.forEach(user => {
              if (role.id == user.roleId) {
                user['roleName'] = role.name
              }
            })
          })
          this.userRecord = users;
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          };
        });
  }

  /**
  * Open delete record modal dialog
  * @param id   user id to delete
  * @param name user name
  */
  openModal(id, name, key, message) {
    this.childData = {
      id: id,
      name: name,
      key: key,
      message: message,
    };

    // call child component method to toggle modal
    this.child.toggleModal(true);
  }

  /**
  * To reload list of all users after deletion of a user
  * @param notify
  */
  onNotify() {
    this.getUsers();
  }

  /**
  * Open create user modal dialog
  */
  openCreateUserModal() {
    // call child component method to toggle modal
    this.createUserModal.toggleModal(true);
  }

  openUpdateUserModal(user) {
    this.updateUserModal.setUser(user);
    // call child component method to toggle modal
    this.updateUserModal.toggleModal(true);
  }

  deleteUser(userId) {
    console.log('Deleting User:', userId);
    /** request started */
    this.ngProgress.start();
    this.userService.deleteUser(userId).
      subscribe(
        data => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success(data.message);
          this.getUsers();
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          };
        });
  }

  /**
     *  Sign Out 
     */
  clearAllSessions(id) {
    this.ngProgress.start();
    this.authService.clearAllSessions(id).
      subscribe(
        data => {
          this.ngProgress.done();
          this.alertService.success('All active sessions cleared');
        },
        error => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down', error);
          } else {
            this.alertService.error('No active session found');
          }
        });
  }

  showDiv(id) {
    this.seletedTab = 1;
    if (id == 2) {
      this.seletedTab = id;
    }
  }
}