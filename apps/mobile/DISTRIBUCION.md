# Cómo distribuir Verdant gratuitamente

## Para iOS (sin App Store)

Los usuarios necesitan tener instalado **Expo Go** (gratis en el App Store de Apple).

### Paso 1 — Publicar la actualización
```bash
cd apps/mobile
eas update --channel production --message "Sprint 5 completo"
```

### Paso 2 — Compartir el link
EAS genera un link tipo: `https://expo.dev/@tu-usuario/verdant`  
Compártelo por WhatsApp, email o QR.

### Paso 3 — El usuario abre la app
Al tocar el link desde iOS → se abre Expo Go con Verdant cargado.  
La próxima vez que abran Expo Go, Verdant aparece en su lista de apps.

---

## Para Android (APK directo)

### Generar el APK
```bash
eas build --platform android --profile preview-android
```

### Descargar y compartir
EAS genera un link de descarga del `.apk`  
El usuario lo descarga → instala (debe habilitar "Instalar de fuentes desconocidas")

---

## Actualizar la app (ambas plataformas)
```bash
eas update --channel production --message "descripcion del cambio"
```
Los usuarios reciben la actualización automáticamente la próxima vez que abren la app.

---

## Para el piloto en La Sabana

1. Genera el update con EAS
2. Comparte el link por el grupo de WhatsApp del piloto
3. Los de iOS instalan Expo Go primero
4. Los de Android instalan el APK directamente

---

## Comandos rápidos (desde apps/mobile)

| Acción | Comando |
|---|---|
| Publicar update | `pnpm update:prod` |
| Generar APK Android | `pnpm build:android` |
| Build dev iOS (simulador) | `pnpm build:dev` |
