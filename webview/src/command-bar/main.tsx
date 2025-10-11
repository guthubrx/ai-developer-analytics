import React from 'react';
import ReactDOM from 'react-dom/client';
import { CommandBarApp } from './components/CommandBarApp';
import './styles/global.css';

// VS Code API
const vscode = acquireVsCodeApi();

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found!');
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <CommandBarApp vscode={vscode} />
    </React.StrictMode>
  );
}