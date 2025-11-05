import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="architecture-container">
      <header className="header">
        <h1>Amit Lemida Platform Architecture</h1>
        <div className="header-tags">
          <span className="tag tag-phase">Upstream → Definition</span>
          <span className="tag tag-timeline">Feb–Apr 2026</span>
          <span className="tag tag-owner">Product + Data + Engineering</span>
        </div>
      </header>
      
      <div className="instructions">
        <div className="card">
          <h2>📐 Architecture Visualization</h2>
          <p>This architecture is built with <strong>LikeC4</strong> - Architecture as Code.</p>
          
          <div className="command-box">
            <h3>🚀 View Interactive Diagrams:</h3>
            <code>pnpm c4</code>
            <p className="note">Opens LikeC4 viewer at <a href="http://localhost:3333" target="_blank">http://localhost:3333</a></p>
          </div>
          
          <div className="command-box">
            <h3>🏗️ Build Static Site:</h3>
            <code>pnpm run build:c4</code>
            <p className="note">Generates static HTML/SVG diagrams</p>
          </div>
          
          <div className="features">
            <h3>✨ Features:</h3>
            <ul>
              <li><strong>9 Interactive Views</strong> - Navigate between different perspectives</li>
              <li><strong>Complete LMS + Intelligence Layer</strong> - All systems documented</li>
              <li><strong>Technology Icons</strong> - MongoDB, Redis, BigQuery, Neo4j, Vue, Node.js</li>
              <li><strong>Auto-Layout</strong> - Clean, organized diagrams</li>
              <li><strong>Zoom & Pan</strong> - Explore large architectures easily</li>
            </ul>
          </div>
          
          <div className="links">
            <a href="https://likec4.dev/docs" target="_blank" className="btn">📖 LikeC4 Docs</a>
            <a href="src/amit-platform.c4" className="btn">📝 View DSL Source</a>
          </div>
        </div>
      </div>
    </div>
  </StrictMode>
);

