import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ContractType, ContractTypeCreateDto, ContractTypeUpdateDto } from '../models/contract-type.model';

@Injectable({
  providedIn: 'root'
})
export class ContractTypeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/contract-types`;

  getAll(): Observable<ContractType[]> {
    return this.http.get<ContractType[]>(this.apiUrl);
  }

  getById(id: number): Observable<ContractType> {
    return this.http.get<ContractType>(`${this.apiUrl}/${id}`);
  }

  getByCompany(companyId: number): Observable<ContractType[]> {
    return this.http.get<ContractType[]>(`${this.apiUrl}/by-company/${companyId}`);
  }

  getPredefined(): Observable<ContractType[]> {
    return this.http.get<ContractType[]>(`${this.apiUrl}/predefined`);
  }

  create(dto: ContractTypeCreateDto): Observable<ContractType> {
    return this.http.post<ContractType>(this.apiUrl, dto);
  }

  update(id: number, dto: ContractTypeUpdateDto): Observable<ContractType> {
    return this.http.put<ContractType>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
