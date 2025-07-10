import { Component, ViewChild } from '@angular/core';
import { DecimalPipe, NgForOf, NgIf } from '@angular/common';
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
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
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
    SelectModule,
    MultiSelectModule,
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

  // --- XLSX ---
  xlsxPreview: any[][] = [];
  xlsxHeaders: string[] = [];
  xlsxFile: File | null = null;
  xlsxHeaderRow: number = 0;
  xlsxHeaderRowOptions: number[] = [];
  xlsxSelectedColumns: string[] = [];
  xlsxReady: boolean = false;
  xlsxSheetNames: string[] = [];
  xlsxSelectedSheet: string = '';
  xlsxWarnNonNumeric: boolean = false;

  // --- persistencia (opcional: localStorage, aquí en memoria) ---
  userXlsxPrefs: {
    [filename: string]: { selectedSheet: string, headerRow: number, selectedColumns: string[] }
  } = {};

  constructor(
    private messageService: MessageService,
    private csvService: CvsServices,
    private csvShared: CsvSharedService,
    private router: Router
  ) {}

  // --- CSV ---
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
    this.csvShared.setData(this.csvHeaders, this.csvData);

    this.descriptiveStats = this.csvService.getDescriptiveStats(this.csvHeaders, this.csvData);

    this.first = 0;
    this.updatePaginatedData();
    this.mostrarGrafico = false;
    this.xlsxReady = false;
  }

  // --- XLSX ---
  onXLSXSelect(event: any): void {
    const file = event.files?.[0];
    if (file) {
      this.xlsxFile = file;
      this.xlsxPreview = [];
      this.xlsxHeaders = [];
      this.xlsxHeaderRow = 0;
      this.xlsxSelectedColumns = [];
      this.xlsxReady = false;
      this.xlsxSelectedSheet = '';
      this.xlsxWarnNonNumeric = false;
      this.xlsxSheetNames = [];

      this.csvService.processXLSX(file).then(res => {
        this.xlsxSheetNames = res.allSheetNames;
        this.xlsxSelectedSheet = res.allSheetNames[0];
        // Preview primeras 10 filas de la hoja seleccionada
        this.loadXLSXPreview();
      });
    }
  }

  loadXLSXPreview(): void {
    if (!this.xlsxFile || !this.xlsxSelectedSheet) return;
    this.csvService.processXLSX(this.xlsxFile, { sheetName: this.xlsxSelectedSheet, headerRow: 0 }).then(res => {
      const sheetData: any[][] = [res.headers, ...res.data.slice(0, 9).map(row => res.headers.map(h => row[h]))];
      this.xlsxPreview = sheetData;
      this.xlsxHeaderRowOptions = Array.from({ length: Math.min(5, sheetData.length) }, (_, i) => i);
      this.xlsxHeaders = res.headers;
      // Restaurar selección previa si existe
      if (this.userXlsxPrefs[this.xlsxFile!.name]) {
        const pref = this.userXlsxPrefs[this.xlsxFile!.name];
        this.xlsxHeaderRow = pref.headerRow;
        this.xlsxSelectedColumns = [...pref.selectedColumns];
        this.xlsxSelectedSheet = pref.selectedSheet;
      } else {
        this.xlsxHeaderRow = 0;
        this.xlsxSelectedColumns = [...this.xlsxHeaders];
      }
    });
  }

  onXLSXSheetChange(): void {
    this.loadXLSXPreview();
  }

  onXLSXHeaderRowChange(): void {
    if (!this.xlsxFile || !this.xlsxSelectedSheet) return;
    this.csvService.processXLSX(this.xlsxFile, { sheetName: this.xlsxSelectedSheet, headerRow: this.xlsxHeaderRow }).then(res => {
      this.xlsxHeaders = res.headers;
      this.xlsxPreview = [res.headers, ...res.data.slice(0, 9).map(row => res.headers.map(h => row[h]))];
      this.xlsxSelectedColumns = [...this.xlsxHeaders];
    });
  }

  useXLSXColumns(): void {
    if (!this.xlsxFile || !this.xlsxSelectedSheet) return;
    // Validar si hay columnas no numéricas
    this.csvService.processXLSX(this.xlsxFile, {
      sheetName: this.xlsxSelectedSheet,
      headerRow: this.xlsxHeaderRow,
      selectedColumns: this.xlsxSelectedColumns
    }).then(res => {
      const headers = this.xlsxSelectedColumns;
      const data = res.data.map(row => {
        const filtered: any = {};
        headers.forEach(h => filtered[h] = row[h]);
        return filtered;
      });
      // Validación: ¿todas son numéricas?
      this.xlsxWarnNonNumeric = headers.some(h =>
        data.some((row: any) => row[h] !== '' && isNaN(Number(row[h])))
      );
      this.csvHeaders = headers;
      this.csvData = data;
      this.csvShared.setData(this.csvHeaders, this.csvData);
      this.descriptiveStats = this.csvService.getDescriptiveStats(this.csvHeaders, this.csvData);
      this.first = 0;
      this.updatePaginatedData();
      this.mostrarGrafico = false;
      this.xlsxReady = true;
      // Guardar preferencias
      if (this.xlsxFile) { // <-- aquí agregas la comprobación
        this.userXlsxPrefs[this.xlsxFile.name] = {
          selectedSheet: this.xlsxSelectedSheet,
          headerRow: this.xlsxHeaderRow,
          selectedColumns: [...this.xlsxSelectedColumns]
        };
      }
      this.messageService.add({
        severity: 'success',
        summary: 'Preferencias guardadas',
        detail: 'Las preferencias de la hoja se han guardado correctamente.'
      });
    });
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
