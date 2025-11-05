# Amit Platform Architecture

Interactive architecture visualization using [LikeC4](https://likec4.dev/) - Architecture as Code.

## 🎯 Overview

Complete **C4 Model** documentation of the Amit Lemida Platform:

### **Systems:**
- **LMS Platform** - Core operational learning management system
- **Intelligence Platform** - Analytics, ML, and data infrastructure

### **C4 Levels:**
- **C1 (Context)** - How actors interact with systems
- **C2 (Container)** - Applications, APIs, databases
- **C3 (Component)** - Internal services and components

### **9 Interactive Views:**
1. System Context (C1)
2. LMS Containers (C2)
3. API Components (C3)
4. Intelligence Containers (C2)
5. Intelligence API Components (C3)
6. Student Learning Flow
7. Data Pipeline (ELT)
8. Teacher Analytics
9. Adaptive Personalization

## 🏗️ Architecture Highlights

### Operational Core (LMS)
- **MongoDB** - Primary operational data store
- **Redis** - Session and content caching
- **BullMQ** - Asynchronous task processing
- **Vue 3 Apps** - Student portal and teacher console
- **Node.js API** - REST services for all operations

### Intelligence Layer
- **BigQuery Medallion Architecture** - Bronze → Silver → Gold data layers
- **Dataform** - Git-based SQL transformations
- **Neo4j Graph Database** - Learning ontology and relationships
- **Intelligence API** - Unified access to analytics and graph data
- **Looker Studio** - Teacher dashboards
- **Vertex AI** - ML models for predictions

## 🚀 Quick Start

### Install Dependencies

```bash
pnpm install
```

### Run Development Server

```bash
pnpm dev
```

Open [http://localhost:5174](http://localhost:5174) to view the interactive architecture diagrams.

### Alternative: LikeC4 CLI

```bash
pnpm c4
```

This runs the LikeC4 CLI server directly on the `.c4` files.

## 📋 Views

The architecture includes 9 interactive views:

1. **Platform Overview** - Complete system landscape
2. **LMS Context** - Core LMS with actors and services
3. **LMS Internal Services** - Detailed component view
4. **Learning Intelligence & Graph Foundation** - Complete intelligence layer
5. **ELT Data Flow** - Medallion architecture pipeline
6. **Graph Intelligence** - Neo4j ontology and sync
7. **Analytics & ML Consumption** - Dashboards and models
8. **Operational → Intelligence Bridge** - Data flow from LMS to analytics
9. **Adaptive Engine Integration** - How adaptivity uses intelligence

## 📁 Project Structure

```
architecture/
├── src/
│   ├── amit-platform.c4      # Main architecture specification (DSL)
│   ├── main.tsx               # React app entry point
│   └── style.css              # Styling
├── index.html                 # HTML entry
├── vite.config.ts             # Vite + LikeC4 configuration
├── package.json
└── README.md
```

## 🎨 Key Technologies

- **LikeC4** - Architecture-as-Code DSL and visualization
- **Vite** - Build tool and dev server
- **React** - UI framework for diagram viewer
- **TypeScript** - Type safety

## 📖 C4 Model

The architecture follows the [C4 Model](https://c4model.com/) methodology:

- **System Context** - How the platform fits in its environment
- **Container** - High-level technology choices
- **Component** - Internal structure of containers

## 🔄 Updating Architecture

1. Edit `src/amit-platform.c4` with your changes
2. The dev server will auto-reload
3. View changes immediately in the browser

### DSL Syntax Example

```c4
element database {
  notation "MongoDB"
  style {
    shape storage
    icon tech:mongodb
    color secondary
  }
}

model {
  myDb = database "User Database" {
    description "Stores user profiles and preferences"
  }
}
```

## 🌐 Deployment

### Build for Production

```bash
pnpm build
```

Output will be in `dist/` directory. Deploy to any static hosting (Netlify, Vercel, etc.).

## 📚 Resources

- [LikeC4 Documentation](https://likec4.dev/docs)
- [LikeC4 Playground](https://likec4.dev/playground)
- [C4 Model](https://c4model.com/)

## 👥 Team

**Owner**: Product + Data + Engineering  
**Phase**: Upstream → Definition  
**Timeline**: February – April 2026

---

Built with ❤️ by the Amit Team

