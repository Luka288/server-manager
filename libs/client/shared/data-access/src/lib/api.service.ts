import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from './api-config.token';

@Service()
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  private url(endpoint: string): string {
    return `${this.config.apiBase}${endpoint}`;
  }

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(this.url(endpoint));
  }

  post<T>(endpoint: string, body: object): Observable<T> {
    return this.http.post<T>(this.url(endpoint), body);
  }

  put<T>(endpoint: string, body: object): Observable<T> {
    return this.http.put<T>(this.url(endpoint), body);
  }

  patch<T>(endpoint: string, body: object): Observable<T> {
    return this.http.patch<T>(this.url(endpoint), body);
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(this.url(endpoint));
  }
}
