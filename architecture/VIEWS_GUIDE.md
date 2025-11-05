# Architecture Views Guide

## 📐 Complete C4 Model - All Perspectives

### **View 1: System Context (C1)** 🌍
**ID:** `systemContext`  
**Level:** C1 - System Context  
**Purpose:** Show how users interact with the platform

**Elements:**
- **Actors:** Student, Teacher, Admin, Data Scientist
- **Systems:** LMS Platform, Intelligence Platform
- **External:** Firebase, Ministry SSO, Shahaf SIS

**Relationships:**
- Student → LMS Platform (learning)
- Teacher → LMS Platform (content creation)
- Teacher → Intelligence Platform (analytics)
- Data Scientist → Intelligence Platform (ML models)
- LMS → Intelligence (telemetry streaming)

**Layout:** TopBottom

---

### **View 2: LMS Platform - Containers (C2)** 📦
**ID:** `lmsContainers`  
**Level:** C2 - Container  
**Purpose:** Show applications and data stores within LMS

**Containers:**
- **Student Portal** (Vue 3)
- **Teacher Console** (Vue 3)
- **API Gateway** (Node.js + NestJS)
- **MongoDB Atlas** (Database)
- **Redis Cache** (Cache)
- **BullMQ** (Queue)

**Key Flows:**
- Student Portal → API Gateway
- Teacher Console → API Gateway
- API Gateway → MongoDB (CRUD)
- API Gateway → Redis (caching)
- API Gateway → BullMQ (async tasks)

**Layout:** TopBottom

---

### **View 3: API Gateway - Components (C3)** 🔧
**ID:** `apiComponents`  
**Level:** C3 - Component  
**Purpose:** Internal structure of the API Gateway

**Components:**
- **Auth Controller** - JWT and sessions
- **Content Service** - Lessons, blocks, variants
- **Enrollment Service** - Student assignments
- **Submission Service** - Answers and grading
- **Adaptive Engine** - Personalization
- **Telemetry Emitter** - Event streaming

**Relationships:**
- All components → MongoDB
- Submission Service → BullMQ (grading jobs)
- Telemetry Emitter → Intelligence Platform
- Adaptive Engine → Intelligence API

**Layout:** TopBottom

---

### **View 4: Intelligence Platform - Containers (C2)** 📊
**ID:** `intelligenceContainers`  
**Level:** C2 - Container  
**Purpose:** Data pipeline, storage, and analytics tools

**Containers:**

**Data Pipeline:**
- **Telemetry Stream** (Pub/Sub + Dataflow)
- **Dataform** (SQL transformations)

**Storage (Medallion):**
- **Bronze Layer** (Raw data - BigQuery)
- **Silver Layer** (Cleaned data - BigQuery)
- **Gold Layer** (Metrics - BigQuery)
- **Neo4j Graph** (Ontology - Neo4j AuraDB)

**APIs & Tools:**
- **Intelligence API** (NestJS)
- **Looker Studio** (Dashboards)
- **Vertex AI** (ML Models)

**Flow:**
- Telemetry → Bronze
- MongoDB → Bronze (daily export)
- Dataform: Bronze → Silver → Gold
- Silver/Gold → Neo4j (sync)
- Gold → Looker, Vertex AI
- Neo4j + Gold → Intelligence API

**Layout:** LeftRight

---

### **View 5: Intelligence API - Components (C3)** 🧠
**ID:** `intelligenceComponents`  
**Level:** C3 - Component  
**Purpose:** Internal services of the Intelligence API

**Components:**
- **Metrics Service** - Query BigQuery for metrics
- **Graph Service** - Query Neo4j for relationships
- **Prediction Service** - Serve ML predictions

**Relationships:**
- Metrics Service → Gold Layer
- Graph Service → Neo4j
- Prediction Service → Vertex AI

**Layout:** TopBottom

---

### **View 6: Student Learning Flow** 🎓
**ID:** `studentFlow`  
**Purpose:** End-to-end student interaction

**Path:**
```
Student
  ↓
Student Portal (Vue 3)
  ↓
API Gateway
  ↓
├─→ Content Service → MongoDB (lessons)
├─→ Submission Service → MongoDB (answers)
├─→ Adaptive Engine → Intelligence API (personalization)
└─→ Telemetry Emitter → Telemetry Stream (events)
```

**Shows:**
- How content is delivered
- How submissions are processed
- How adaptive decisions are made
- How data flows to analytics

**Layout:** TopBottom

---

### **View 7: Data Pipeline - ELT Flow** 🔄
**ID:** `dataPipeline`  
**Purpose:** Medallion architecture visualization

**Flow:**
```
Sources:
├─ MongoDB (daily export)
└─ Telemetry Emitter (real-time)
     ↓
Bronze Layer (raw)
     ↓
Dataform (transform)
     ↓
Silver Layer (cleaned)
     ↓
Dataform (aggregate)
     ↓
Gold Layer (metrics)
     ↓
├─→ Looker Studio (dashboards)
├─→ Vertex AI (ML training)
└─→ Neo4j Graph (ontology)
```

**Purpose:** Show data transformation stages

**Layout:** LeftRight

---

### **View 8: Teacher Analytics Flow** 👩‍🏫
**ID:** `teacherAnalytics`  
**Purpose:** How teachers access insights

**Path:**
```
Teacher
  ↓
Teacher Console (Vue 3)
  ↓
├─→ Looker Studio (direct dashboards)
└─→ Intelligence API
      ↓
      ├─→ Metrics Service → Gold Layer
      └─→ Graph Service → Neo4j
```

**Shows:**
- Dashboard access
- Metric querying
- Relationship exploration

**Layout:** TopBottom

---

### **View 9: Adaptive Personalization** 🎯
**ID:** `adaptiveFlow`  
**Purpose:** How adaptive engine makes decisions

**Path:**
```
Student → Student Portal
  ↓
Adaptive Engine
  ↓
Intelligence API
  ↓
├─→ Prediction Service → Vertex AI (ML predictions)
├─→ Metrics Service → Gold Layer (student history)
└─→ Graph Service → Neo4j (skill relationships)
```

**Shows:**
- ML model integration
- Historical data access
- Graph-based reasoning
- Real-time personalization

**Layout:** TopBottom

---

## 🎨 Visual Design

### **Color Coding:**
- **Primary Blue** - Systems
- **Blue** - Containers
- **Green** - Components
- **Gray** - External systems
- **Amber** - Caches
- **Orange** - Queues
- **Purple** - Graph databases

### **Icons:**
- 🔵 **Vue** - Frontend apps
- 🟢 **Node.js** - Backend services
- 🟠 **MongoDB** - Database
- 🔴 **Redis** - Cache
- 🟣 **Neo4j** - Graph DB
- ☁️ **BigQuery** - Data warehouse
- 🤖 **Vertex AI** - ML models

---

## 🚀 Viewing the Architecture

### **Interactive Viewer:**
```bash
cd architecture
pnpm c4
# Opens http://localhost:3333
```

**Features:**
- ✅ Click between views
- ✅ Zoom and pan
- ✅ Hover for details
- ✅ Export to PNG/SVG
- ✅ Navigate relationships

### **Build Static Site:**
```bash
pnpm run build:c4
# Output: dist-c4/
```

---

## 📚 C4 Model Levels Explained

### **Level 1: System Context**
"The big picture" - Shows systems and their users

### **Level 2: Container**
"Zoom into a system" - Shows applications, APIs, databases

### **Level 3: Component**
"Zoom into a container" - Shows internal services

### **Level 4: Code** *(not typically done)*
"Zoom into a component" - Shows classes and methods

---

## 🎯 Which View Should I Use?

| Question | View |
|----------|------|
| Who uses the platform? | System Context |
| What apps exist? | LMS Containers / Intelligence Containers |
| How does the API work internally? | API Components / Intelligence Components |
| How do students learn? | Student Learning Flow |
| How does data move? | Data Pipeline |
| How do teachers get insights? | Teacher Analytics |
| How does adaptive work? | Adaptive Personalization |

---

**Total Views:** 9  
**Total Elements:** 30+  
**Total Relationships:** 40+  

Ready for presentation and documentation! 🚀

