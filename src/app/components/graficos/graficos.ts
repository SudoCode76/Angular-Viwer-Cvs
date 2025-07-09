import { Component, OnInit } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { NgIf } from '@angular/common';
import { CvsServices } from '../../services/cvs-services';
import { CsvSharedService } from '../../services/csv-shared-service';
import { Navbar } from '../navbar/navbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-graficos',
  standalone: true,
  imports: [ChartModule, NgIf, Navbar, ProgressSpinnerModule],
  templateUrl: './graficos.html',
  styleUrl: './graficos.css'
})
export class Graficos implements OnInit {
  csvHeaders: string[] = [];
  csvData: any[] = [];

  barData: any;
  barOptions: any;
  pieData: any;
  pieOptions: any;
  lineData: any;
  lineOptions: any;

  loading = true;
  errorMsg: string | null = null;

  constructor(
    private csvShared: CsvSharedService,
    private csvService: CvsServices
  ) {}

  ngOnInit() {
    this.loading = true;
    this.errorMsg = null;

    // Esto "garantiza" que Angular pinte el loader antes de procesar nada (lo verás aunque sea un instante)
    Promise.resolve().then(() => {
      this.csvHeaders = this.csvShared.headers;
      this.csvData = this.csvShared.data;

      if (!this.csvHeaders.length || !this.csvData.length) {
        this.errorMsg = 'No hay datos para mostrar. Por favor, cargue un archivo CSV en la página de Inicio.';
      } else {
        this.setupBarChart();
        this.setupPieChart();
        this.setupLineChartWithTrend();
      }
      this.loading = false;
    });
  }

  setupBarChart() {
    const chart = this.csvService.generarGrafico(this.csvHeaders, this.csvData);
    this.barData = chart;
    this.barOptions = {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: '#fff',
            font: { size: 16 }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#fff',
            maxRotation: 30,
            minRotation: 30,
            font: { size: 12 }
          }
        },
        y: {
          ticks: {
            color: '#fff',
            font: { size: 12 }
          }
        }
      }
    };
  }

  setupPieChart() {
    const categoriaHeader = this.csvHeaders[0];
    const valorHeader = this.csvHeaders.find(h => h !== categoriaHeader) ?? this.csvHeaders[0];
    const labels = this.csvData.map(row => row[categoriaHeader]);
    const data = this.csvData.map(row => row[valorHeader]);
    const backgroundColors = [
      '#42A5F5', '#66BB6A', '#FFA726', '#FF6384', '#AB47BC', '#26A69A', '#EC407A', '#7E57C2', '#FF7043', '#26C6DA',
      '#9CCC65', '#5C6BC0', '#8D6E63', '#789262', '#D4E157', '#FFB300', '#8D6E63', '#789262', '#D4E157', '#FFB300'
    ];
    this.pieData = {
      labels,
      datasets: [{ data, backgroundColor: backgroundColors }]
    };
    this.pieOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#fff',
            font: { size: 14 }
          }
        }
      }
    };
  }

  setupLineChartWithTrend() {
    const categoriaHeader = this.csvHeaders[0];
    const valorHeader = this.csvHeaders.find(h => h !== categoriaHeader) ?? this.csvHeaders[0];
    const labels = this.csvData.map(row => row[categoriaHeader]);
    const data = this.csvData.map(row => row[valorHeader]);
    const xVals = labels.map((_, i) => i + 1);
    const yVals = data.map(val => typeof val === 'number' ? val : NaN).filter(v => !isNaN(v));
    const trend = this.csvService.getLinearTrend(xVals, yVals);

    this.lineData = {
      labels,
      datasets: [
        {
          label: 'Valores',
          data,
          fill: false,
          borderColor: '#42A5F5',
          tension: 0.4,
          pointBackgroundColor: '#fff'
        },
        {
          label: 'Tendencia',
          data: trend,
          fill: false,
          borderColor: '#FF5733',
          borderDash: [5, 5],
          pointRadius: 0
        }
      ]
    };
    this.lineOptions = {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: '#fff',
            font: { size: 16 }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#fff',
            maxRotation: 30,
            minRotation: 30,
            font: { size: 12 }
          }
        },
        y: {
          ticks: {
            color: '#fff',
            font: { size: 12 }
          }
        }
      }
    };
  }
}
