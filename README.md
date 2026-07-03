# Consulta DNI Perú 🇵🇪

Aplicación web para consultar datos de DNI peruano. Interfaz moderna con tema oscuro y colores inspirados en la bandera de Perú.

![Preview](https://img.shields.io/badge/Estado-Activo-brightgreen) ![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)

## 🚀 Características

- ✅ Consulta de DNI peruano (8 dígitos)
- 🎨 Interfaz premium con tema oscuro
- 📱 Diseño responsive (mobile-first)
- 📋 Historial de consultas (localStorage)
- 📎 Copiar resultados al portapapeles
- ⚡ Serverless function para evitar CORS
- 🔒 Headers de seguridad configurados

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+)
- **Backend**: Vercel Serverless Functions (Node.js)
- **Scraping**: Cheerio + node-fetch
- **Fonts**: Inter, Outfit (Google Fonts)

## 📦 Estructura del Proyecto

```
├── index.html          # Página principal
├── css/
│   └── styles.css      # Estilos premium
├── js/
│   └── app.js          # Lógica del frontend
├── api/
│   └── consulta.js     # Serverless Function (proxy)
├── vercel.json         # Configuración de Vercel
├── package.json        # Dependencias
└── README.md           # Este archivo
```

## 🚀 Deploy en Vercel

### Opción 1: Deploy desde GitHub

1. Sube este proyecto a un repositorio de GitHub
2. Ve a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub
3. Haz clic en **"New Project"**
4. Selecciona el repositorio
5. Haz clic en **"Deploy"**

### Opción 2: Deploy con Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

## 💻 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Instalar Vercel CLI (si no la tienes)
npm i -g vercel

# Ejecutar en modo desarrollo
vercel dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🔧 Configuración

No se requiere configuración adicional. La aplicación funciona out-of-the-box.

## 📝 Notas

- Los datos se obtienen de fuentes públicas
- La serverless function actúa como proxy para evitar restricciones de CORS
- El historial se guarda localmente en el navegador (localStorage)
- Compatible con todos los navegadores modernos

## 📄 Licencia

Este proyecto es de uso educativo e informativo.
