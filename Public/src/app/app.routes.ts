import { Routes } from '@angular/router';
import { RegistComponent } from './components/regist/regist.component';
import { LoginComponent } from './components/login/login.component';
import { SubscriptionsComponent } from './components/subscriptions/subscriptions.component';
import { PackageComponent } from './components/package/package.component';
import { LogoutComponent } from './components/logout/logout.component';
import { UserAuthGuard } from './guards/user-auth.guard';

export const routes: Routes = [
    {
        path:'', component: RegistComponent
    },
    {
        path: 'login', component: LoginComponent
    },
    {
        path: 'package', component: PackageComponent
    },
    {
        path: 'package/:id', component: SubscriptionsComponent
    },
    {
        path: 'logout', component: LogoutComponent, canActivate: [UserAuthGuard]
    },
];
