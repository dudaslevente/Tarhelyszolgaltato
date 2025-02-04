import { Routes } from '@angular/router';
import { RegistComponent } from './components/regist/regist.component';
import { LoginComponent } from './components/login/login.component';

export const routes: Routes = [
    {
        path:'', component: RegistComponent
    },
    {
        path: 'login', component: LoginComponent
    }
];
