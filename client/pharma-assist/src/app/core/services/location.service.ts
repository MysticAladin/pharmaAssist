import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/product.model';

export interface Canton {
  id: number;
  name: string;
  nameLocal: string;
  code: string;
  biHEntityId: number;
  biHEntityName: string;
  municipalityCount: number;
  cityCount: number;
}

export interface City {
  id: number;
  name: string;
  nameLocal: string;
  postalCode: string;
  municipalityId: number;
  municipalityName: string;
  cantonId: number;
  cantonName: string;
  biHEntityId: number;
  biHEntityName: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/locations`;

  getAllCantons(): Observable<ApiResponse<Canton[]>> {
    return this.http.get<ApiResponse<Canton[]>>(`${this.apiUrl}/cantons`);
  }

  getAllCities(): Observable<ApiResponse<City[]>> {
    return this.http.get<ApiResponse<City[]>>(`${this.apiUrl}/cities`);
  }
}
