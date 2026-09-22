import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    if (typeof localStorage !== 'undefined') {
      const savedUser = localStorage.getItem('medishare_user');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          if (user.email) {
            headers = headers.set('x-user-email', user.email);
          }
        } catch {
          // Ignorar
        }
      }
    }

    return headers;
  }

  public get<T>(endpoint: string, params?: { [param: string]: string | number | boolean }): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return this.http
      .get<T>(`${this.baseUrl}${endpoint}`, {
        headers: this.getHeaders(),
        params: httpParams,
      })
      .pipe(
        catchError((err) => {
          console.warn(`[ApiService GET ${endpoint}]:`, err);
          return throwError(() => err);
        })
      );
  }

  public post<T>(endpoint: string, body: any): Observable<T> {
    return this.http
      .post<T>(`${this.baseUrl}${endpoint}`, body, {
        headers: this.getHeaders(),
      })
      .pipe(
        catchError((err) => {
          console.warn(`[ApiService POST ${endpoint}]:`, err);
          return throwError(() => err);
        })
      );
  }

  public put<T>(endpoint: string, body: any): Observable<T> {
    return this.http
      .put<T>(`${this.baseUrl}${endpoint}`, body, {
        headers: this.getHeaders(),
      })
      .pipe(
        catchError((err) => {
          console.warn(`[ApiService PUT ${endpoint}]:`, err);
          return throwError(() => err);
        })
      );
  }

  public delete<T>(endpoint: string): Observable<T> {
    return this.http
      .delete<T>(`${this.baseUrl}${endpoint}`, {
        headers: this.getHeaders(),
      })
      .pipe(
        catchError((err) => {
          console.warn(`[ApiService DELETE ${endpoint}]:`, err);
          return throwError(() => err);
        })
      );
  }
}
