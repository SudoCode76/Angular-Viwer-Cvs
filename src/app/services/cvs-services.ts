import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';


@Injectable({
  providedIn: 'root'
})
export class CvsServices {

  processCSVData(csvText: string): { headers: string[], data: any[] } {
    const rows = csvText.split('\n').map(row => row.replace(/\r$/, ''));
    const headers = rows[0].split(',').map(header => header.trim());
    const data: any[] = [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].trim()) {
        const rowData = rows[i].split(',');
        const row: any = {};
        headers.forEach((header, index) => {
          let value = rowData[index]?.trim() || '';
          if (/^-?\d+,\d+$/.test(value)) value = value.replace(',', '.');
          row[header] = value !== '' && !isNaN(Number(value)) ? Number(value) : value;
        });
        data.push(row);
      }
    }
    return { headers, data };
  }

  // XLSX con selección de hoja y fila header
  processXLSX(file: File, options?: { headerRow?: number, sheetName?: string, selectedColumns?: string[] })
    : Promise<{ headers: string[], data: any[], allSheetNames: string[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const allSheetNames = workbook.SheetNames;
        const wsname = options?.sheetName ?? workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const sheetData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });
        const headerRow = options?.headerRow ?? 0;
        const headers = (sheetData[headerRow] || []).map((h: any) => (h ?? '').toString().trim());
        const dataRows = sheetData.slice(headerRow + 1).filter(row => row.some(cell => cell != null && cell !== ''));
        const dataArr = dataRows.map(row => {
          const obj: any = {};
          headers.forEach((header, idx) => {
            let value = (row[idx] ?? '').toString().trim();
            if (/^-?\d+,\d+$/.test(value)) value = value.replace(',', '.');
            obj[header] = value !== '' && !isNaN(Number(value)) ? Number(value) : value;
          });
          return obj;
        });
        const filteredHeaders = options?.selectedColumns && options.selectedColumns.length > 0
          ? options.selectedColumns
          : headers;
        const filteredData = dataArr.map(row => {
          const obj: any = {};
          filteredHeaders.forEach(h => obj[h] = row[h]);
          return obj;
        });
        resolve({ headers: filteredHeaders, data: filteredData, allSheetNames });
      };
      reader.onerror = err => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }

  generarGrafico(headers: string[], data: any[]): any {
    const columnaNumericaHeader = headers.find(header =>
      data.some(row => typeof row[header] === 'number')
    );
    if (columnaNumericaHeader) {
      const categoriaHeader = headers.find(header => header !== columnaNumericaHeader);
      if (categoriaHeader) {
        const grupos = data.reduce((acc: Record<string, number[]>, row: any) => {
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

        return {
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
        const valores = data
          .map(row => row[columnaNumericaHeader])
          .filter((val: any) => typeof val === 'number');
        const promedio = valores.reduce((a: number, b: number) => a + b, 0) / valores.length;
        return {
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
    }
    return null;
  }

  getDescriptiveStats(headers: string[], data: any[]) {
    const stats: any[] = [];
    headers.forEach(header => {
      const values = data.map(row => row[header]).filter(val => typeof val === 'number');
      if (values.length > 0) {
        values.sort((a, b) => a - b);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const median = values.length % 2 === 0
          ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
          : values[Math.floor(values.length / 2)];
        const mode = this.getMode(values);
        const min = values[0];
        const max = values[values.length - 1];
        const std = this.getStd(values, mean);

        stats.push({
          columna: header,
          cantidad: values.length,
          media: mean,
          mediana: median,
          moda: mode,
          minimo: min,
          maximo: max,
          desviacion: std
        });
      }
    });
    return stats;
  }

  private getMode(values: number[]): number | null {
    const freq: Record<number, number> = {};
    let maxFreq = 0;
    let mode: number | null = null;
    values.forEach(val => {
      freq[val] = (freq[val] || 0) + 1;
      if (freq[val] > maxFreq) {
        maxFreq = freq[val];
        mode = val;
      }
    });
    return mode;
  }

  private getStd(values: number[], mean: number): number {
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  // Tendencia lineal (recta de regresión)
  getLinearTrend(xVals: number[], yVals: number[]): number[] {
    if (xVals.length !== yVals.length || xVals.length === 0) return [];
    const n = xVals.length;
    const sumX = xVals.reduce((a, b) => a + b, 0);
    const sumY = yVals.reduce((a, b) => a + b, 0);
    const sumXY = xVals.reduce((sum, x, i) => sum + x * yVals[i], 0);
    const sumXX = xVals.reduce((sum, x) => sum + x * x, 0);

    // y = a * x + b
    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) return Array(n).fill(yVals[0]); // evita división por cero
    const a = (n * sumXY - sumX * sumY) / denominator;
    const b = (sumY * sumXX - sumX * sumXY) / denominator;

    return xVals.map(x => a * x + b);
  }

  // Correlación de Pearson
  getPearsonCorrelation(xVals: number[], yVals: number[]): number | null {
    if (xVals.length !== yVals.length || xVals.length === 0) return null;
    const n = xVals.length;
    const meanX = xVals.reduce((a, b) => a + b, 0) / n;
    const meanY = yVals.reduce((a, b) => a + b, 0) / n;
    let num = 0;
    let denX = 0;
    let denY = 0;
    for (let i = 0; i < n; i++) {
      const dx = xVals[i] - meanX;
      const dy = yVals[i] - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }
    if (denX === 0 || denY === 0) return null;
    return num / Math.sqrt(denX * denY);
  }
}
