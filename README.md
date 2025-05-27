# SecureWipe - Aplicación Web

## Descripción
SecureWipe Web es la interfaz de administración para la plataforma SecureWipe, que permite a los usuarios gestionar sus dispositivos móviles, ver estadísticas y configurar opciones de seguridad desde cualquier navegador.

## Configuración del Proyecto

### Prerrequisitos
- Node.js (v14 o superior)
- npm o yarn

### Instalación
1. Clona este repositorio
2. Instala las dependencias:
```bash
npm install
# o
yarn install
```

### Variables de Entorno
Para ejecutar este proyecto, necesitarás configurar las variables de entorno:

1. Copia el archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```

2. Edita el archivo `.env` con tus credenciales de Firebase:
```
REACT_APP_FIREBASE_API_KEY=tu-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=tu-auth-domain
REACT_APP_FIREBASE_PROJECT_ID=tu-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=tu-storage-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=tu-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=tu-app-id
```

### Ejecución
Para ejecutar la aplicación en modo desarrollo:
```bash
npm start
# o
yarn start
```

Para construir la aplicación para producción:
```bash
npm run build
# o
yarn build
```

## Estructura del Proyecto
```
/src
  /components - Componentes reutilizables
  /pages - Páginas principales de la aplicación
  /services - Servicios (autenticación, API, etc.)
  /utils - Utilidades y funciones auxiliares
  /assets - Imágenes, iconos y otros recursos
```

## Características Principales
- Dashboard con estadísticas de dispositivos
- Gestión de dispositivos registrados
- Visualización detallada de cada dispositivo
- Configuración de opciones de seguridad
- Interfaz moderna y responsive

## Tecnologías Utilizadas
- React.js
- Firebase (Autenticación, Firestore)
- React Router para navegación
- Styled Components para estilos
- Context API para gestión de estado
