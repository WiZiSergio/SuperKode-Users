# 📁 Sistema de Comandos - SuperKode Bot

Esta carpeta contiene todo el sistema de comandos del bot, organizado por tipos de interacción.

## 🏗️ Estructura Organizacional

```
src/commands/
├── slash/          # Comandos Slash (/)
│   ├── moderation/ # Comandos de moderación
│   ├── owner/      # Comandos de propietario
│   ├── fun/        # Comandos de entretenimiento
│   └── utility/    # Comandos de utilidad
├── context/        # Comandos de Contexto (clic derecho)
└── prefix/         # Comandos de Prefijo tradicionales
```

## 🔧 Tipos de Comandos

### 1. 🔸 **Comandos Slash** (`/comando`)
- **Ubicación:** `src/commands/slash/`
- **Descripción:** Comandos modernos de Discord con autocompletado
- **Registro:** Automático en Discord
- **Ventajas:** Interfaz intuitiva, validación automática, permisos integrados

### 2. 🖱️ **Comandos de Contexto** (Clic derecho)
- **Ubicación:** `src/commands/context/`
- **Descripción:** Comandos que aparecen en menús contextuales
- **Tipos:** Usuario y Mensaje
- **Ventajas:** Acceso rápido, integración nativa

### 3. 🔤 **Comandos de Prefijo** (`!comando`)
- **Ubicación:** `src/commands/prefix/`
- **Descripción:** Comandos tradicionales con prefijo
- **Ventajas:** Flexibilidad, compatibilidad, rapidez

## 📊 Estado Actual del Sistema

### ✅ **Comandos Slash Activos (10)**

#### 🛡️ **Moderación (8 comandos):**
- `/ban` - Banear usuarios (con soporte para ID)
- `/unban` - Desbanear usuarios
- `/kick` - Expulsar usuarios
- `/timeout` - Aplicar timeout
- `/untimeout` - Quitar timeout
- `/warn` - Advertir usuarios
- `/unwarn` - Quitar advertencias
- `/cases` - Historial de moderación (con botones)

#### 👑 **Owner (2 comandos):**
- `/mod` - Gestión de moderadores
- `/reload` - Recargar componentes del bot

### 🔄 **Comandos en Desarrollo (0)**
- **Context:** 0 comandos
- **Prefix:** 0 comandos

## 🚀 Características Implementadas

### 🔐 **Sistema de Permisos:**
- ✅ Verificación de moderadores configurados
- ✅ Permisos de Discord integrados
- ✅ Jerarquía de roles respetada
- ✅ Comandos exclusivos para owners

### 📊 **Sistema de Logging:**
- ✅ Logs detallados de todas las acciones
- ✅ Base de datos persistente
- ✅ Tracking de errores y éxitos
- ✅ Información de usuario y servidor

### 🎨 **Interfaz Profesional:**
- ✅ Embeds con colores apropiados
- ✅ Emojis descriptivos
- ✅ Menciones clickeables
- ✅ Información detallada y organizada

### 🔄 **Sistema de Botones:**
- ✅ Navegación por páginas en `/cases`
- ✅ Confirmaciones en comandos críticos
- ✅ Timeout automático
- ✅ Verificación de usuario

## 🛠️ Carga de Comandos

### **Sistema Actual:**
- **Carga automática** desde `src/commands/slash/`
- **Búsqueda recursiva** en subcarpetas
- **Validación** de estructura de comandos
- **Logging detallado** del proceso de carga
- **Manejo de errores** robusto

### **Función de Carga:**
```javascript
// En src/structure/loadfolders.js
function loadCommands(client) {
    // Carga recursiva desde slash/
    // Validación de estructura
    // Registro en client.commands
}
```

## 📈 Próximas Expansiones

### 🎯 **Comandos Planeados:**

#### **Context Commands:**
- Ver perfil de usuario
- Moderar usuario rápido
- Reportar mensaje

#### **Prefix Commands:**
- Sistema de ayuda
- Comandos de configuración
- Comandos de información

#### **Slash Commands:**
- Comandos de diversión
- Utilidades del servidor
- Sistema de tickets

## 🔧 Desarrollo

### **Agregar Nuevo Comando Slash:**
1. Crear archivo en `src/commands/slash/categoria/`
2. Seguir estructura estándar
3. El sistema lo cargará automáticamente

### **Estructura Requerida:**
```javascript
module.exports = {
    data: new SlashCommandBuilder()
        .setName('nombre')
        .setDescription('descripción'),
    
    async execute(interaction) {
        // Lógica del comando
    }
};
```

---

**📊 Total de Comandos Activos: 10**  
**🔄 Última Actualización: 16/07/2025**  
**✅ Sistema Completamente Funcional**
