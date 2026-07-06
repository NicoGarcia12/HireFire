import { Routes } from '@angular/router';
import { Home } from './presentation/features/home/home';
import { Applications } from './presentation/features/applications/applications';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'postulaciones', component: Applications },
];
