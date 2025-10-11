import React from 'react';
import ReactDOM from 'react-dom/client';
import { CommandBarApp } from './components/CommandBarApp';
import './styles/global.css';

// VS Code API
const vscode = acquireVsCodeApi();

console.log('Starting React application...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found!');
} else {
  console.log('Root element found, creating React root...');
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <CommandBarApp vscode={vscode} />
    </React.StrictMode>
  );
  console.log('React application mounted!');
}