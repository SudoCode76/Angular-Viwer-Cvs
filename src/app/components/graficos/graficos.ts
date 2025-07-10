import { Component, OnInit } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import {DecimalPipe, NgIf} from '@angular/common';
import { CvsServices } from '../../services/cvs-services';
import { CsvSharedService } from '../../services/csv-shared-service';
import { Navbar } from '../navbar/navbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-graficos',
  standalone: true,
  imports: [ChartModule, NgIf, Navbar, ProgressSpinnerModule, SelectModule, FormsModule, DecimalPipe],
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

  // Correlación
  numericHeaders: string[] = [];
  colX: string = '';
  colY: string = '';
  correlation: number | null = null;
  correlationDescription: string = '';
  scatterData: any = null;
  scatterOptions: any = null;

  constructor(
    private csvShared: CsvSharedService,
    private csvService: CvsServices
  ) {}

  ngOnInit() {
    this.loading = true;
    this.errorMsg = null;
    Promise.resolve().then(() => {
      this.csvHeaders = this.csvShared.headers;
      this.csvData = this.csvShared.data;

      if (!this.csvHeaders.length || !this.csvData.length) {
        this.errorMsg = 'No hay datos para mostrar. Por favor, cargue un archivo CSV en la página de Inicio.';
      } else {
        this.setupBarChart();
        this.setupPieChart();
        this.setupLineChartWithTrend();

        // Númericas para correlación
        this.numericHeaders = this.csvHeaders.filter(h =>
          this.csvData.some(row => typeof row[h] === 'number')
        );
        if (this.numericHeaders.length > 1) {
          this.colX = this.numericHeaders[0];
          this.colY = this.numericHeaders[1];
          this.calcularCorrelacion();
        }
      }
      this.loading = false;
    });
  }

  calcularCorrelacion() {
    if (!this.colX || !this.colY || this.colX === this.colY) {
      this.correlation = null;
      this.correlationDescription = '';
      this.scatterData = null;
      return;
    }
    // Emparejar por índices válidos en ambos
    const paired = [];
    for (let i = 0; i < this.csvData.length; i++) {
      const x = this.csvData[i][this.colX];
      const y = this.csvData[i][this.colY];
      if (typeof x === 'number' && typeof y === 'number') {
        paired.push({ x, y });
      }
    }
    const xArr = paired.map(p => p.x);
    const yArr = paired.map(p => p.y);

    this.correlation = this.csvService.getPearsonCorrelation(xArr, yArr);
    this.correlationDescription = this.interpretarCorrelacion(this.correlation);

    // Preparar datos para scatter plot
    // Para la línea de tendencia necesitamos calcular y = a*x + b para cada x
    let trendLine: { x: number, y: number }[] = [];
    if (paired.length > 1) {
      // Calculo de regresión lineal
      const n = paired.length;
      const sumX = xArr.reduce((a, b) => a + b, 0);
      const sumY = yArr.reduce((a, b) => a + b, 0);
      const sumXY = paired.reduce((sum, p) => sum + p.x * p.y, 0);
      const sumXX = xArr.reduce((sum, x) => sum + x * x, 0);
      const denominator = n * sumXX - sumX * sumX;
      if (denominator !== 0) {
        const a = (n * sumXY - sumX * sumY) / denominator;
        const b = (sumY * sumXX - sumX * sumXY) / denominator;
        // Para graficar la recta de tendencia, usamos el mínimo y máximo de X:
        const minX = Math.min(...xArr);
        const maxX = Math.max(...xArr);
        trendLine = [
          { x: minX, y: a * minX + b },
          { x: maxX, y: a * maxX + b }
        ];
      }
    }

    this.scatterData = {
      datasets: [
        {
          label: 'Datos',
          data: paired,
          backgroundColor: '#42A5F5',
          pointRadius: 5,
          showLine: false,
          type: 'scatter'
        },
        ...(trendLine.length > 1 ? [{
          label: 'Tendencia',
          data: trendLine,
          borderColor: '#FF5733',
          borderWidth: 2,
          fill: false,
          pointRadius: 0,
          type: 'line'
        }] : [])
      ]
    };
    this.scatterOptions = {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          labels: { color: '#fff', font: { size: 14 } }
        }
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: { display: true, text: this.colX, color: '#fff' },
          ticks: { color: '#fff' }
        },
        y: {
          title: { display: true, text: this.colY, color: '#fff' },
          ticks: { color: '#fff' }
        }
      }
    };
  }

  interpretarCorrelacion(r: number | null): string {
    if (r === null || isNaN(r)) return 'No se pudo calcular la correlación.';
    const abs = Math.abs(r);
    if (abs < 0.1) return 'Sin correlación lineal.';
    if (abs < 0.3) return 'Correlación muy débil.';
    if (abs < 0.5) return 'Correlación débil.';
    if (abs < 0.7) return 'Correlación moderada.';
    if (abs < 0.9) return 'Correlación fuerte.';
    return 'Correlación muy fuerte.';
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
