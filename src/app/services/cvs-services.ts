import { Injectable } from '@angular/core';

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
          const value = rowData[index]?.trim() || '';
          row[header] = value !== '' && !isNaN(Number(value)) ? Number(value) : value;
        });
        data.push(row);
      }
    }
    return { headers, data };
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

  // NUEVO: tendencia lineal (recta de regresión)
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
}
