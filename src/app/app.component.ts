import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PlotlyModule } from 'angular-plotly.js';
import { CsvloaderComponent } from './components/csvloader/csvloader.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CsvloaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'bbleap-datashow-app';

 

}
