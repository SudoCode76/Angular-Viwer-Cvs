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
    NgIf,
    NgForOf
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
  }

  calcularPromedio(): void {
    const columnaNumericaHeader = this.csvHeaders.find(header =>
      this.csvData.some(row => typeof row[header] === 'number')
    );

    if (columnaNumericaHeader) {
      const valores = this.csvData
        .map(row => row[columnaNumericaHeader])
        .filter(val => typeof val === 'number');

      const suma = valores.reduce((acc, val) => acc + val, 0);
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

  filtrarDatos(): void {
    const columnaNumericaHeader = this.csvHeaders.find(header =>
      this.csvData.some(row => typeof row[header] === 'number')
    );

    if (columnaNumericaHeader) {
      const valores = this.csvData.map(row => row[columnaNumericaHeader])
        .filter(val => typeof val === 'number');

      const suma = valores.reduce((acc, val) => acc + val, 0);
      const promedio = valores.length > 0 ? suma / valores.length : 0;

      const datosFiltrados = this.csvData.filter(row =>
        typeof row[columnaNumericaHeader] === 'number' && row[columnaNumericaHeader] > promedio
      );

      this.csvData = datosFiltrados;
      this.first = 0; // volver a la primera página tras filtrar
      this.updatePaginatedData();

      this.messageService.add({
        severity: 'success',
        summary: 'Datos filtrados',
        detail: `Mostrando ${datosFiltrados.length} registros con ${columnaNumericaHeader} mayor que ${promedio.toFixed(2)}`
      });
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'No hay datos numéricos',
        detail: 'No se encontró ninguna columna con valores numéricos para filtrar'
      });
    }
  }

  resetDatos(event: any): void {
    this.onFileSelect(event);
    setTimeout(() => this.updatePaginatedData(), 0);
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
}
