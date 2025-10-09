import React from 'react';
import ReactDOM from 'react-dom/client';
import { CommandBarApp } from './components/CommandBarApp';
import './styles/global.css';

// VS Code API
const vscode = acquireVsCodeApi();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CommandBarApp vscode={vscode} />
  </React.StrictMode>
);