# Frontend de HireFire

Aplicación Angular 21 que consume la API local de HireFire en `http://localhost:3000/api`.

## Requisitos

- Node.js 22 recomendado (`.nvmrc`: `22.22.2`)
- Backend de HireFire corriendo en `http://localhost:3000`

## Scripts disponibles

```bash
npm ci
npm start      # levanta ng serve en http://localhost:4200
npm run build  # build de producción
npm run watch  # build en modo development con watch
npm test       # unit tests
```

Si el puerto `4200` está ocupado, podés levantarlo así:

```bash
npm start -- --port 4201
```

## Qué incluye hoy

- formulario de perfil con experiencia, skills y preferencias,
- importación de ZIP de LinkedIn,
- análisis del perfil con Groq,
- búsqueda y ranking de ofertas,
- búsquedas guardadas,
- historial de ejecuciones.

## Estructura principal

```text
src/app/
├── core/
│   ├── api.service.ts   # cliente HTTP hacia el backend
│   └── models.ts        # contratos compartidos con la API
├── features/home/
│   ├── home.ts          # lógica de la pantalla principal
│   ├── home.html        # template único de la app
│   └── home.scss        # estilos de la pantalla
├── app.config.ts        # providers globales
└── app.routes.ts        # ruta raíz
```

## Nota de integración

La base URL del backend está hardcodeada en `src/app/core/api.service.ts`. Si cambiás el puerto o host del backend, actualizá ese archivo.
