# Notas para migrar a Angular 21

El proyecto corre en **Angular 20.3.x**. Esta guía documenta lo que cambia en Angular 21
y cómo aprovechar sus mejoras cuando se decida actualizar.

## Cambios de versión requeridos

| Paquete | Actual (v20) | Target (v21) |
|---|---|---|
| `@angular/core` | `^20.3.x` | `^21.0.x` |
| `@angular/material` | `^20.2.x` | `^21.0.x` |
| `@angular-eslint/*` | `^20.7.x` | `^21.0.x` |
| `typescript` | `~5.9.x` | `~5.9.x` (compatible) |

```bash
# Comando de actualización (frontend)
npm install @angular/core@^21 @angular/common@^21 @angular/forms@^21 \
  @angular/router@^21 @angular/platform-browser@^21 @angular/animations@^21 \
  @angular/material@^21 @angular/cdk@^21 --legacy-peer-deps

npm install -D @angular/build@^21 @angular/cli@^21 @angular/compiler-cli@^21 \
  @angular-eslint/eslint-plugin@^21 @angular-eslint/eslint-plugin-template@^21 \
  @angular-eslint/template-parser@^21 --legacy-peer-deps
```

## Mejoras relevantes en Angular 21

### 1. `linkedSignal` — señal derivada con escritura
Permite crear una señal que depende de otra pero puede ser sobreescrita localmente.
Útil para el formulario de búsqueda donde el valor puede venir de una búsqueda guardada.

```typescript
// Antes (Angular 20): signal separada + efecto
readonly keywords = signal('');

// Después (Angular 21): linkedSignal
readonly keywords = linkedSignal(() => this.lastSearch()?.keywords ?? '');
```

### 2. `effect()` sin `allowSignalWrites`
En Angular 21 los efectos pueden escribir en señales sin el flag adicional, limpiando código boilerplate.

### 3. `@let` en templates — variables locales en HTML
Permite declarar variables dentro del template sin necesitar componentes intermedios.

```html
<!-- Angular 21 -->
@let score = job.score;
@let cls = score >= 75 ? 'high' : score >= 50 ? 'mid' : 'low';
<span [class]="'score-ring score-ring--' + cls">{{ score }}</span>
```

### 4. Mejoras en defer
`@defer` en Angular 21 soporta `on timer()` y mejoras en el manejo de
loading/placeholder/error sin plantillas extra.

```html
<!-- Skeleton loader simplificado con @defer -->
@defer (on timer(0ms); prefetch on idle) {
  <app-results [results]="results()" />
} @loading {
  <app-results-skeleton />
}
```

### 5. Material 21 — componentes nuevos
- `MatTimepicker` (selector de hora)
- Mejoras en `MatDataTable` con virtual scroll integrado
- `MatButtonToggle` con soporte M3 completo

## Pasos de migración sugeridos

1. Actualizar paquetes con el comando de arriba
2. Correr `ng update @angular/core@21 @angular/material@21` para los schematics automáticos
3. Reemplazar `effect({ allowSignalWrites: true })` → `effect()` donde aplique
4. Evaluar migrar skeleton loaders a `@defer` con `@loading`
5. Correr `npm run lint` y `npm run build` para validar

## Compatibilidad con TypeScript

TypeScript `~5.9.x` (ya instalado) es compatible con Angular 21, no requiere cambios.
