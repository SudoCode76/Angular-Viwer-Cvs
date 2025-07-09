import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CsvSharedService {

  headers: string[] = [];
  data: any[] = [];

  setData(headers: string[], data: any[]) {
    this.headers = headers;
    this.data = data;
  }
  clear() {
    this.headers = [];
    this.data = [];
  }
}
