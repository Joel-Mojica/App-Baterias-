import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ReporteComponent } from './reporte/reporte.component';

const routes: Routes = [
  {path: '', component: HomeComponent},
  {path: 'reporte', component: ReporteComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes,{useHash:true})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
