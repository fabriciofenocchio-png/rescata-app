# Rescatá — Misiones

App web para conectar comercios de Posadas con excedente de comida con
usuarios que quieren comprarla a mitad de precio.

## Cómo publicarla (gratis, con link fijo)

1. Creá una cuenta en https://github.com (si no tenés).
2. Creá un repositorio nuevo, público, llamado `rescata-app`.
3. Subí el archivo `index.html` de esta carpeta a ese repositorio
   (botón "Add file" → "Upload files" en GitHub, arrastrás el archivo,
   y confirmás con "Commit changes").
4. Creá una cuenta en https://vercel.com usando "Continue with GitHub"
   (así quedan conectadas automáticamente).
5. En Vercel: "Add New..." → "Project" → elegí el repositorio
   `rescata-app` → "Deploy". No hace falta tocar ninguna configuración,
   es un sitio estático.
6. En un minuto te da una URL tipo `rescata-app-tu-usuario.vercel.app`
   ya funcionando y con HTTPS.

## Cuando quieras el dominio propio

En Vercel: proyecto → Settings → Domains → agregás
`rescatamisiones.com` (o el que hayas comprado) y seguís las
instrucciones de DNS que te muestra ahí mismo.

## Próximos pasos técnicos (cuando estés list@)

- Backend chico para Mercado Pago (checkout + webhook).
- Login por comercio.
- Migración a React Native para Google Play / App Store.
