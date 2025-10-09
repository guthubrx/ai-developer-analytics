import React from 'react';
import ReactDOM from 'react-dom/client';
import { CommandBarApp } from './components/CommandBarApp';
import './styles/global.css';

// VS Code API - Mock for browser development
const vscode = typeof acquireVsCodeApi !== 'undefined'
  ? acquireVsCodeApi()
  : {
      postMessage: (message: any) => console.log('VSCode API Mock - Post Message:', message),
      setState: (state: any) => console.log('VSCode API Mock - Set State:', state),
      getState: () => {
        console.log('VSCode API Mock - Get State');
        return null;
      }
    };

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