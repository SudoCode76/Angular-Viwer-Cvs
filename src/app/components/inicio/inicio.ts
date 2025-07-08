import { Component, ViewChild } from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Importaciones de componentes de PrimeNG
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { ChartModule } from 'primeng/chart';
import {Navbar} from '../navbar/navbar'; // <--- Asegúrate de importar esto

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [
    FormsModule,
    ToastModule,
    CardModule,
    FileUploadModule,
    TableModule,
    ButtonModule,
    DialogModule,
    ToolbarModule,
    InputTextModule,
    PaginatorModule,
    ChartModule,
    NgIf,
    NgForOf,
    Navbar
  ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio {
  @ViewChild('dt') table!: Table;

  csvData: any[] = [];
  csvHeaders: string[] = [];
  resultadoOperacion: string = '';
  mostrarDialogoResultado: boolean = false;

  // --- PAGINADOR ---
  rows: number = 10;       // Filas por página
  first: number = 0;       // Primer índice de la página
  paginatedData: any[] = []; // Datos a mostrar en la página actual

  // --- GRÁFICO ---
  chartData: any = null;
  chartOptions: any = null;
  mostrarGrafico: boolean = false;

  constructor(private messageService: MessageService) {}

  onFileSelect(event: any): void {
    const file = event.files?.[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        const contents = e.target.result;
        this.processCSVData(contents);
      };

      reader.readAsText(file);

      this.messageService.add({
        severity: 'info',
        summary: 'Archivo cargado',
        detail: `${file.name} ha sido cargado correctamente`
      });
    }
  }

  processCSVData(csvText: string): void {
    const rows = csvText.split('\n').map(row => row.replace(/\r$/, ''));
    const headers = rows[0].split(',').map(header => header.trim());
    this.csvHeaders = headers;

    this.csvData = [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].trim()) {
        const rowData = rows[i].split(',');
        const row: any = {};

        headers.forEach((header, index) => {
          const value = rowData[index]?.trim() || '';
          row[header] = value !== '' && !isNaN(Number(value)) ? Number(value) : value;
        });

        this.csvData.push(row);
      }
    }
    this.first = 0;
    this.updatePaginatedData();
    this.mostrarGrafico = false; // Oculta el gráfico al cargar nuevos datos
  }

  calcularPromedio(): void {
    const columnaNumericaHeader = this.csvHeaders.find(header =>
      this.csvData.some(row => typeof row[header] === 'number')
    );

    if (columnaNumericaHeader) {
      const valores = this.csvData
        .map(row => row[columnaNumericaHeader])
        .filter((val: any) => typeof val === 'number');

      const suma = valores.reduce((acc: number, val: number) => acc + val, 0);
      const promedio = valores.length > 0 ? suma / valores.length : 0;

      this.resultadoOperacion = `El promedio de ${columnaNumericaHeader} es: ${promedio.toFixed(2)}`;
      this.mostrarDialogoResultado = true;
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'No hay datos numéricos',
        detail: 'No se encontró ninguna columna con valores numéricos'
      });
    }
  }



  resetDatos(event: any): void {
    this.onFileSelect(event);
    setTimeout(() => this.updatePaginatedData(), 0);
    this.mostrarGrafico = false;
  }

  // --- PAGINACIÓN ---
  onPageChange(event: any): void {
    this.first = event.first;
    this.rows = event.rows;
    this.updatePaginatedData();
  }

  updatePaginatedData(): void {
    this.paginatedData = this.csvData.slice(this.first, this.first + this.rows);
  }

  trackHeader(index: number, item: string): string {
    return item;
  }

  // --- MÉTODO GRÁFICO ---
  generarGrafico(): void {
    const columnaNumericaHeader = this.csvHeaders.find(header =>
      this.csvData.some(row => typeof row[header] === 'number')
    );

    if (columnaNumericaHeader) {
      // Ejemplo: barras por cada valor único de una columna categórica (si hay)
      const categoriaHeader = this.csvHeaders.find(header =>
        header !== columnaNumericaHeader
      );

      if (categoriaHeader) {
        // Agrupa por categoría
        const grupos = this.csvData.reduce((acc: Record<string, number[]>, row: any) => {
          const cat = row[categoriaHeader] || 'Sin categoría';
          if (!acc[cat]) acc[cat] = [];
          if (typeof row[columnaNumericaHeader] === 'number') {
            acc[cat].push(row[columnaNumericaHeader]);
          }
          return acc;
        }, {} as Record<string, number[]>);

        const labels = Object.keys(grupos);
        const promedios = labels.map(cat =>
          grupos[cat].reduce((a: number, b: number) => a + b, 0) / grupos[cat].length
        );

        this.chartData = {
          labels: labels,
          datasets: [
            {
              label: `Promedio de ${columnaNumericaHeader}`,
              data: promedios,
              backgroundColor: '#42A5F5'
            }
          ]
        };
      } else {
        // Solo una columna numérica, muestra el promedio general
        const valores = this.csvData
          .map(row => row[columnaNumericaHeader])
          .filter((val: any) => typeof val === 'number');
        const promedio = valores.reduce((a: number, b: number) => a + b, 0) / valores.length;
        this.chartData = {
          labels: [columnaNumericaHeader],
          datasets: [
            {
              label: `Promedio`,
              data: [promedio],
              backgroundColor: '#42A5F5'
            }
          ]
        };
      }
      this.chartOptions = {
        responsive: true,
        plugins: {
          legend: { display: true }
        }
      };
      this.mostrarGrafico = true;
    } else {
      this.mostrarGrafico = false;
    }
  }
}
