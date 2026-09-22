import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { App } from './app';

describe('App Component', () => {
  it('debe instanciar la clase App correctamente', () => {
    const app = new App();
    expect(app).toBeTruthy();
  });
});
