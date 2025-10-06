/**
 * MCP (Model Context Protocol) Manager for AI Developer Analytics
 * Gestionnaire MCP pour l'analyse des développeurs IA
 *
 * @license AGPL-3.0-only
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';

export interface MCPServerConfig {
    name: string;
    command: string;
    args?: string[];
    env?: Record<string, string | undefined>;
}

export class MCPManager {
    private serverProcess: import('child_process').ChildProcess | null = null;
    private isRunning: boolean = false;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    /**
     * Get MCP server configuration
     * Obtenir la configuration du serveur MCP
     */
    private getServerConfig(): MCPServerConfig {
        const extensionPath = this.context.extensionPath;
        const serverPath = path.join(extensionPath, 'server-mcp', 'dist', 'index.js');

        return {
            name: 'ai-analytics-mcp-server',
            command: 'node',
            args: [serverPath],
            env: {
                NODE_ENV: 'production'
            }
        };
    }

    /**
     * Start the MCP server
     * Démarrer le serveur MCP
     */
    async startServer(): Promise<boolean> {
        if (this.isRunning) {
            console.log('MCP server is already running');
            return true;
        }

        try {
            const config = this.getServerConfig();

            // Check if server executable exists
            const serverPath = path.join(this.context.extensionPath, 'server-mcp', 'dist', 'index.js');
            if (!fs.existsSync(serverPath)) {
                console.error('MCP server executable not found:', serverPath);
                return false;
            }

            console.log('Starting MCP server with config:', config);

            this.serverProcess = spawn(config.command, config.args || [], {
                env: config.env,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            this.serverProcess.stdout?.on('data', (data) => {
                console.log(`MCP Server stdout: ${data}`);
            });

            this.serverProcess.stderr?.on('data', (data) => {
                console.error(`MCP Server stderr: ${data}`);
            });

            this.serverProcess.on('error', (error) => {
                console.error('Failed to start MCP server:', error);
                this.isRunning = false;
            });

            this.serverProcess.on('exit', (code) => {
                console.log(`MCP server exited with code ${code}`);
                this.isRunning = false;
                this.serverProcess = null;
            });

            // Wait a moment for server to start
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (this.serverProcess && !this.serverProcess.killed) {
                this.isRunning = true;
                console.log('MCP server started successfully');
                return true;
            } else {
                console.error('MCP server failed to start');
                return false;
            }

        } catch (error) {
            console.error('Error starting MCP server:', error);
            return false;
        }
    }

    /**
     * Stop the MCP server
     * Arrêter le serveur MCP
     */
    async stopServer(): Promise<void> {
        if (!this.isRunning || !this.serverProcess) {
            return;
        }

        console.log('Stopping MCP server...');

        return new Promise((resolve) => {
            if (this.serverProcess) {
                this.serverProcess.on('close', () => {
                    console.log('MCP server stopped');
                    this.isRunning = false;
                    this.serverProcess = null;
                    resolve();
                });

                this.serverProcess.kill('SIGTERM');

                // Force kill after 5 seconds
                setTimeout(() => {
                    if (this.serverProcess) {
                        this.serverProcess.kill('SIGKILL');
                    }
                }, 5000);
            } else {
                resolve();
            }
        });
    }

    /**
     * Get server status
     * Obtenir le statut du serveur
     */
    getServerStatus(): { isRunning: boolean; pid?: number | undefined } {
        return {
            isRunning: this.isRunning,
            pid: this.serverProcess?.pid
        };
    }

    /**
     * Restart the MCP server
     * Redémarrer le serveur MCP
     */
    async restartServer(): Promise<boolean> {
        await this.stopServer();
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.startServer();
    }

    /**
     * Dispose resources
     * Libérer les ressources
     */
    async dispose(): Promise<void> {
        await this.stopServer();
    }
}