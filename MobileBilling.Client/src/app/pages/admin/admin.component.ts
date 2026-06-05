import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { User, ShopConfig, AuditLog } from '../../shared/models/models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Admin Panel</h1>
      <p>User management, shop configuration & audit logs</p>
    </div>

    <div class="tabs">
      <button class="tab-btn" [class.active]="tab==='users'" (click)="tab='users'">👥 Users</button>
      <button class="tab-btn" [class.active]="tab==='config'" (click)="tab='config'">🏪 Configuration</button>
      <button class="tab-btn" [class.active]="tab==='audit'" (click)="tab='audit'; loadAudit()">📋 Audit Logs</button>
    </div>

    <!-- USERS TAB -->
    <div *ngIf="tab==='users'">
      <div class="flex-between mb-16">
        <h2 style="font-size:18px;">User Management</h2>
        <button class="btn btn-primary" (click)="showUserModal=true; resetUserForm()">+ Add User</button>
      </div>
      <div class="card">
        <div class="table-container">
          <table>
            <thead><tr>
              <th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              <tr *ngFor="let u of users">
                <td><strong>{{ u.username }}</strong></td>
                <td>{{ u.email }}</td>
                <td><span class="badge" [class.badge-admin]="u.role==='Admin'" [class.badge-user]="u.role==='User'">{{ u.role }}</span></td>
                <td><span class="badge" [class.badge-active]="u.isActive" [class.badge-void]="!u.isActive">{{ u.isActive ? 'Active' : 'Inactive' }}</span></td>
                <td>
                  <div style="display:flex;gap:8px;">
                    <button class="btn btn-sm btn-outline" (click)="editUser(u)">Edit</button>
                    <button class="btn btn-sm btn-outline" (click)="openResetPwd(u)">Reset Pwd</button>
                    <button class="btn btn-sm btn-danger" (click)="deleteUser(u)" *ngIf="u.username!=='admin'">Delete</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
           <!-- User Modal -->
      <div class="modal-overlay" *ngIf="showUserModal" #userOverlay
           (mousedown)="$event.target === userOverlay ? userOverlay.setAttribute('data-close', 'true') : userOverlay.removeAttribute('data-close')"
           (mouseup)="$event.target === userOverlay && userOverlay.getAttribute('data-close') === 'true' ? showUserModal=false : null">
        <div class="modal">
          <h3>{{ editingUser ? 'Edit User' : 'Create User' }}</h3>
          <div class="form-group" *ngIf="!editingUser">
            <label>Username</label>
            <input class="form-control" [(ngModel)]="userForm.username" placeholder="Username">
          </div>
          <div class="form-group" *ngIf="!editingUser">
            <label>Password</label>
            <input class="form-control" type="password" [(ngModel)]="userForm.password" placeholder="Password">
          </div>
          <div class="form-group">
            <label>Email</label>
            <input class="form-control" type="email" [(ngModel)]="userForm.email" placeholder="Email">
          </div>
          <div class="form-group">
            <label>Role</label>
            <select class="form-control" [(ngModel)]="userForm.role">
              <option value="Admin">Admin</option>
              <option value="User">User</option>
            </select>
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" (click)="showUserModal=false">Cancel</button>
            <button class="btn btn-primary" (click)="saveUser()">{{ editingUser ? 'Update' : 'Create' }}</button>
          </div>
        </div>
      </div>
 
      <!-- Reset Password Modal -->
      <div class="modal-overlay" *ngIf="showResetModal" #resetOverlay
           (mousedown)="$event.target === resetOverlay ? resetOverlay.setAttribute('data-close', 'true') : resetOverlay.removeAttribute('data-close')"
           (mouseup)="$event.target === resetOverlay && resetOverlay.getAttribute('data-close') === 'true' ? showResetModal=false : null">
        <div class="modal">
          <h3>Reset Password for {{ resetPwdUser?.username }}</h3>
          <div class="form-group">
            <label>New Password</label>
            <input class="form-control" type="password" [(ngModel)]="newPassword" placeholder="New password">
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" (click)="showResetModal=false">Cancel</button>
            <button class="btn btn-primary" (click)="resetPassword()">Reset</button>
          </div>
        </div>
      </div>   </div>
    </div>

    <!-- CONFIG TAB -->
    <div *ngIf="tab==='config'">
      <div class="card" style="max-width:700px;">
        <h2 style="font-size:18px;margin-bottom:20px;">Shop Configuration</h2>
        <div class="grid-2">
          <div class="form-group">
            <label>Shop Name</label>
            <input class="form-control" [(ngModel)]="config.shopName" placeholder="Shop Name">
          </div>
          <div class="form-group">
            <label>GST Number</label>
            <input class="form-control" [(ngModel)]="config.gstNumber" placeholder="GST Number">
          </div>
        </div>
        <div class="form-group">
          <label>Address</label>
          <textarea class="form-control" [(ngModel)]="config.address" rows="2" placeholder="Address"></textarea>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label>Mobile Number</label>
            <input class="form-control" [(ngModel)]="config.mobileNumber" placeholder="Mobile Number">
          </div>
          <div class="form-group">
            <label>Email</label>
            <input class="form-control" type="email" [(ngModel)]="config.email" placeholder="Email">
          </div>
        </div>
        <div class="form-group">
          <label>Invoice Remarks</label>
          <textarea class="form-control" [(ngModel)]="config.invoiceRemarks" rows="3" placeholder="Remarks to appear on invoice footer"></textarea>
        </div>
        <button class="btn btn-primary mt-16" (click)="saveConfig()">💾 Save Configuration</button>
      </div>
    </div>

    <!-- AUDIT TAB -->
    <div *ngIf="tab==='audit'">
      <div class="card">
        <div class="flex-between mb-16">
          <h2 style="font-size:18px;">Audit Logs</h2>
          <div style="display:flex;gap:8px;">
            <select class="form-control" style="width:auto;" [(ngModel)]="auditFilter.entityName" (change)="loadAudit()">
              <option value="">All Entities</option>
              <option>User</option><option>Product</option><option>ProductStock</option>
              <option>Invoice</option><option>ShopConfig</option>
            </select>
            <select class="form-control" style="width:auto;" [(ngModel)]="auditFilter.action" (change)="loadAudit()">
              <option value="">All Actions</option>
              <option>Create</option><option>Update</option><option>Delete</option><option>Void</option>
            </select>
          </div>
        </div>
        <div class="table-container">
          <table>
            <thead><tr>
              <th>Entity</th><th>ID</th><th>Action</th><th>User</th><th>Date</th><th>Details</th>
            </tr></thead>
            <tbody>
              <tr *ngFor="let log of auditLogs">
                <td><span class="badge badge-user">{{ log.entityName }}</span></td>
                <td>{{ log.entityId }}</td>
                <td><strong>{{ log.action }}</strong></td>
                <td>{{ log.performedBy }}</td>
                <td>{{ log.performedAt | date:'dd/MM/yyyy HH:mm' }}</td>
                <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ log.details }}</td>
              </tr>
              <tr *ngIf="auditLogs.length===0"><td colspan="6" style="text-align:center;color:var(--text-muted);">No audit logs found</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div class="toast toast-success" *ngIf="toast">{{ toast }}</div>
    <div class="toast toast-error" *ngIf="errorToast">{{ errorToast }}</div>
  `
})
export class AdminComponent implements OnInit {
  tab = 'users';
  users: User[] = [];
  config: any = {};
  auditLogs: AuditLog[] = [];
  auditFilter = { entityName: '', action: '' };

  showUserModal = false;
  showResetModal = false;
  editingUser: User | null = null;
  userForm = { username: '', password: '', email: '', role: 'User' };
  resetPwdUser: User | null = null;
  newPassword = '';
  toast = '';
  errorToast = '';

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadUsers();
    this.loadConfig();
  }

  loadUsers() { this.api.getUsers().subscribe(u => { this.users = u; this.cdr.markForCheck(); }); }
  loadConfig() { this.api.getConfig().subscribe(c => { this.config = { ...c }; this.cdr.markForCheck(); }); }
  loadAudit() { this.api.getAuditLogs(this.auditFilter).subscribe(l => { this.auditLogs = l; this.cdr.markForCheck(); }); }

  resetUserForm() {
    this.editingUser = null;
    this.userForm = { username: '', password: '', email: '', role: 'User' };
  }

  editUser(u: User) {
    this.editingUser = u;
    this.userForm = { username: u.username, password: '', email: u.email, role: u.role };
    this.showUserModal = true;
  }

  saveUser() {
    if (this.editingUser) {
      this.api.updateUser(this.editingUser.id, { email: this.userForm.email, role: this.userForm.role })
        .subscribe({ next: () => { this.loadUsers(); this.showUserModal = false; this.showToast('User updated'); },
          error: (e) => { this.showUserModal = false; this.showError(e.error?.message || 'Error updating user'); } });
    } else {
      this.api.createUser(this.userForm)
        .subscribe({ next: () => { this.loadUsers(); this.showUserModal = false; this.showToast('User created'); },
          error: (e) => { this.showUserModal = false; this.showError(e.error?.message || 'Error creating user'); } });
    }
  }

  deleteUser(u: User) {
    if (confirm(`Deactivate user "${u.username}"?`)) {
      this.api.deleteUser(u.id).subscribe(() => { this.loadUsers(); this.showToast('User deactivated'); });
    }
  }

  openResetPwd(u: User) { this.resetPwdUser = u; this.newPassword = ''; this.showResetModal = true; }

  resetPassword() {
    if (this.resetPwdUser && this.newPassword) {
      this.api.resetPassword(this.resetPwdUser.id, this.newPassword)
        .subscribe({ next: () => { this.showResetModal = false; this.showToast('Password reset successfully'); },
          error: (e) => { this.showResetModal = false; this.showError(e.error?.message || 'Error resetting password'); } });
    }
  }

  saveConfig() {
    this.api.updateConfig(this.config).subscribe({
      next: () => this.showToast('Configuration saved'),
      error: (e) => this.showError(e.error?.message || 'Error saving configuration')
    });
  }

  showToast(msg: string) {
    this.toast = msg;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.toast = '';
      this.cdr.markForCheck();
    }, 3000);
  }

  showError(msg: string) {
    this.errorToast = msg;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.errorToast = '';
      this.cdr.markForCheck();
    }, 4000);
  }
}
