import { Component, ViewChild } from '@angular/core';
import {DecimalPipe, NgForOf, NgIf} from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
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
import { Navbar } from '../navbar/navbar';
import { Router } from '@angular/router';
import { CvsServices } from '../../services/cvs-services';
import { CsvSharedService } from '../../services/csv-shared-service';

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
    Navbar,
    DecimalPipe
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
  rows: number = 10;
  first: number = 0;
  paginatedData: any[] = [];

  // --- GRÁFICO ---
  chartData: any = null;
  chartOptions: any = null;
  mostrarGrafico: boolean = false;

  // --- ESTADÍSTICAS DESCRIPTIVAS ---
  descriptiveStats: any[] = [];

  constructor(
    private messageService: MessageService,
    private csvService: CvsServices,
    private csvShared: CsvSharedService,
    private router: Router
  ) {}

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
    const resultado = this.csvService.processCSVData(csvText);
    this.csvHeaders = resultado.headers;
    this.csvData = resultado.data;
    this.csvShared.setData(this.csvHeaders, this.csvData); // Guardar para la otra página

    // Calcular estadísticas descriptivas
    this.descriptiveStats = this.csvService.getDescriptiveStats(this.csvHeaders, this.csvData);

    this.first = 0;
    this.updatePaginatedData();
    this.mostrarGrafico = false;
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

  // --- NAVEGAR A GRÁFICOS ---
  irAGraficos() {
    this.router.navigate(['/graficos']);
  }
}
