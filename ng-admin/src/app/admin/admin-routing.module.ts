import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// layout
import { LayoutDefaultComponent } from '../layout/default/default.component';
import { UsersComponent } from './users/users.component';
import { RolesComponent } from './roles/roles.component';
import { AppRouteGuard } from '@shared/auth/auth-route-guard';
import { DriverComponent } from './basic-info/driver/driver.component';

const routes: Routes = [
  {
      path: '',
      component: LayoutDefaultComponent,
      children: [
          { path: '', redirectTo: 'users', pathMatch: 'full' },
          { path: 'users', component: UsersComponent, data: { translate: 'users', permission: 'Pages.Users' }, canActivate: [AppRouteGuard] },
          { path: 'roles', component: RolesComponent, data: { translate: 'roles', permission: 'Pages.Roles' }, canActivate: [AppRouteGuard] },
          { path: 'driver', component: DriverComponent, data: { translate: 'driver', permission: 'Pages.DistDriver' }, canActivate: [AppRouteGuard] }
      ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }