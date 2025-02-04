import { Routes } from '@angular/router';
import { RegistComponent } from './components/regist/regist.component';
import { LoginComponent } from './components/login/login.component';
import { TarhelyComponent } from './components/tarhely/tarhely.component';

export const routes: Routes = [
    {
        path:'', component: RegistComponent
    },
    {
        path: 'login', component: LoginComponent
    },
    {
        path: 'tarhely', component: TarhelyComponent
    },
];
