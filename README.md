# 🎮 GameServer Manager

A modern desktop/web application for creating, managing, and monitoring Minecraft game servers without manually editing configuration files or dealing with complicated setup procedures.

**GameServer Manager** aims to simplify the entire server lifecycle through a clean, guided interface, making server management accessible even to users without technical experience.

## ✨ Features

- **Server Creation & Provisioning** — Create and configure Minecraft server instances through a guided workflow.
- **Lifecycle Management** — Start, stop, and restart servers from a single dashboard.
- **Real-Time Console** — Monitor server output and logs as they happen.
- **Live Server Updates** — Receive real-time server status and console updates through WebSockets.
- **Configuration Management** — Manage server settings without manually editing configuration files.
- **Directory Management** — Organize server files and directories in one place.
- **Multiple Server Instances** — Create and manage multiple Minecraft servers simultaneously.
- **Persistent Storage** — Store server metadata and configuration using PostgreSQL.
- **Modular Architecture** — Built with Nx monorepo architecture for maintainability and future expansion.

## 🎯 Why GameServer Manager?

Setting up a Minecraft server manually often involves several repetitive steps:

- Creating and organizing server directories.
- Downloading the appropriate server JAR.
- Accepting the EULA and configuring server properties.
- Adjusting memory allocation and startup arguments.
- Configuring network ports.
- Starting and stopping server processes manually.
- Monitoring console output and troubleshooting startup issues.

GameServer Manager aims to eliminate this friction by bringing these operations together in one application.

The goal is simple: **make creating and managing a Minecraft server as straightforward as possible.**

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Angular | Frontend application |
| TypeScript | Type-safe application development |
| Express.js | Backend API |
| Nx | Monorepo architecture and workspace management |
| WebSockets | Real-time console streaming and server updates |
| PostgreSQL | Persistent data storage |
| Drizzle ORM | Database schema and queries |
| Node.js | Server orchestration and process management |

## 📁 Project Structure

The project follows an Nx monorepo architecture to separate application interfaces, backend services, and reusable logic.

```text
game-server-manager/
├── apps/
│   ├── api/                # Express API and server orchestration
│   └── client/             # Angular frontend
├── libs/
│   ├── server/             # Server management and lifecycle logic
│   └── shared/             # Shared types and reusable logic
└── ...
```

The structure is designed to keep responsibilities separated and make it easier to introduce additional features and game server types in the future.

## 🚀 Use Cases

GameServer Manager is being developed to support workflows such as:

- Creating a new vanilla Minecraft server.
- Provisioning servers with supported server implementations.
- Managing multiple server instances from one dashboard.
- Monitoring live console output without opening a separate terminal.
- Starting, stopping, and restarting server processes.
- Managing server configuration and directories.
- Recovering from unexpected server crashes.
- Simplifying server setup for users who are unfamiliar with manual configuration.

## 🗺️ Project Goals

The long-term vision is to build a user-friendly game server management tool focused on:

- **Simplicity** — Make server management accessible to non-technical users.
- **Automation** — Reduce repetitive manual setup and configuration.
- **Reliability** — Provide predictable server lifecycle management and useful error reporting.
- **Real-Time Control** — Keep server status and console output synchronized with the application.
- **Extensibility** — Establish a foundation for supporting additional server implementations and games.
- **Usability** — Provide a clean, guided experience from server creation to ongoing management.

## 🚧 Current Status

GameServer Manager is an **active work-in-progress**.

The current development focuses on establishing the core infrastructure for:

- Server creation and provisioning.
- Server lifecycle management.
- Real-time console monitoring.
- Persistent server metadata.
- Modular frontend and backend architecture.

Features and supported workflows may evolve as development progresses.

## 📜 License

This project is licensed under the [MIT License](LICENSE).
