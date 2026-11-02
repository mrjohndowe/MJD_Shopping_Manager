# 🛒 MJD Shopping Manager

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) ![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white) ![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white) ![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black) ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) ![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)

A comprehensive, dual-interface shopping management application designed to streamline your shopping experience. MJD Shopping Manager offers powerful tools for instant budget tracking, itemized sales tax calculations (specifically tailored for Pueblo, Colorado 🏔️), flexible receipt generation, multi-list organization, and detailed historical analytics. It provides a modern web-based GUI (built with Next.js & React) and a robust interactive Python terminal interface, ensuring a versatile and efficient way to manage your shopping trips.

## 📝 Table of Contents

- [✨ Features](#-features)
- [🚀 Tech Stack](#-tech-stack)
- [📦 Installation](#-installation)
  - [Prerequisites](#prerequisites)
  - [Clone Repository](#clone-repository)
  - [Backend (Python) Setup](#backend-python-setup)
  - [Frontend (Next.js) Setup](#frontend-nextjs-setup)
- [💡 Usage](#-usage)
  - [Web Interface](#web-interface)
  - [Python CLI](#python-cli)
- [📂 Project Structure](#-project-structure)
- [🌐 API Reference](#-api-reference)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)
- [🔗 Important Links](#-important-links)
- [©️ Footer](#️-footer)

## ✨ Features

MJD Shopping Manager is packed with features to make your shopping trips effortless and smart:

- **🛒 Smart Shopping Cart Management**: Add, edit, remove, and duplicate items with ease. Each item supports quantity, regular price, per-unit sale discounts, and coupon discounts. You can also mark items as taxable or favorites for quick access. (See: `shopping/cart.py`, `shopping/item.py`, `src/app/api/cart/route.ts`, `src/components/CartView.tsx`, `src/components/ItemModal.tsx`)
- **💰 Real-time Budget Tracking**: Keep a close eye on your spending with a live budget utilization meter. Get instant warnings if you're over budget and see your remaining balance. (See: `shopping/cart.py`, `src/app/api/cart/route.ts`, `src/components/DashboardView.tsx`)
- **📊 Itemized Sales Tax Calculation**: Accurately calculates state, county, city, and special district taxes. By default, it's configured for Pueblo, Colorado, with precise rates: Colorado State (2.90%), Pueblo County (1.00%), and City of Pueblo (3.70%). Custom store profiles can have their own tax overrides. (See: `taxes/calculator.py`, `storage/storage.py` (StoreManager), `src/app/api/cart/route.ts`, `src/app/api/stores/route.ts`, `src/components/TaxesStoresView.tsx`)
- **🧾 Versatile Receipt Generation**: Generate 5 distinct, professional receipt styles including Standard, Store Branded, Detailed Audit, Budget Summary, and a classic Thermal Slip. Print or export these directly. (See: `receipts/printer.py`, `src/app/api/receipts/route.ts`, `src/components/ReceiptsView.tsx`)
- **📜 Shopping History & Analytics**: Record and manage all your completed shopping trips. View comprehensive spending statistics, identify your favorite stores and most purchased items, track total taxes paid, and measure your savings. Restore past trips to an active cart. (See: `history/history.py`, `statistics/statistics.py`, `src/app/api/history/route.ts`, `src/app/api/statistics/route.ts`, `src/components/HistoryStatsView.tsx`)
- **💾 Flexible Data Export Options**: Export your cart data and reports to various formats such as TXT, CSV, JSON, and Markdown. Exports can be optionally secured with XOR encryption and marked as read-only. (See: `exports/exporter.py`, `src/app/api/exports/route.ts`, `src/components/ExportsView.tsx`)
- **📚 Reusable Item Catalog**: Maintain a catalog of frequently purchased items for quick addition to any shopping list, streamlining recurring purchases. (See: `storage/storage.py` (ItemManager), `src/app/api/catalog/route.ts`, `src/components/ListsCatalogView.tsx`)
- **📝 Multiple Shopping Lists**: Create, switch between, duplicate, and delete multiple shopping lists to manage different shopping scenarios (e.g., weekly groceries, special events, specific stores). (See: `src/app/api/lists/route.ts`, `src/components/ListsCatalogView.tsx`)
- **⚙️ Configurable Application Settings**: Personalize your experience by adjusting themes, currency symbols, autosave timers, receipt print width, and database backend preferences (SQLite, MySQL, PostgreSQL). (See: `settings/settings.py`, `src/app/api/settings/route.ts`, `src/components/SettingsView.tsx`)
- **💻 Interactive Terminal UI**: A rich terminal-based user interface, built with Python's `rich` library, provides full functionality for command-line enthusiasts. (See: `main.py`, `shopping/app.py`, `ui/dialogs.py`, `ui/screens.py`, `ui/widgets.py`)
- **🌐 Modern Web-based GUI**: A sleek and responsive graphical user interface built with Next.js, React, and Tailwind CSS offers a complete visual experience. (See: `src/app/page.tsx`, `src/components/*View.tsx`)
- **🔊 Web Audio FX**: Enhance user interaction with synthesized interface sounds (no external audio files required), making the experience more engaging. (See: `src/lib/audio.ts`)
- **🚀 First-Time Setup Wizard**: A guided wizard helps new users quickly configure their location, default tax rates, and initial budget. (See: `ui/dialogs.py`, `src/components/SetupWizardModal.tsx`)

## 🚀 Tech Stack

This project leverages a hybrid architecture combining a Python backend for core logic and a Next.js/TypeScript frontend for a rich web interface.

**Frontend/Web Interface:**
-   **Framework**: Next.js 16.3.6
-   **UI Library**: React 19.2.6
-   **Styling**: Tailwind CSS 4.1.17, PostCSS
-   **Icons**: Lucide-React
-   **Confetti Effects**: Canvas-Confetti
-   **Utility**: `clsx`, `tailwind-merge`

**Backend/Python CLI:**
-   **Language**: Python 3.10+
-   **CLI Framework**: `argparse`
-   **Rich Terminal Output**: `rich` library
-   **Database**: `sqlite3` for local persistence (`records.db`, `autosave.json`, `settings.json`)
-   **Decimal Precision**: Python `decimal` module for financial calculations

**Data Storage & APIs:**
-   **Language**: TypeScript
-   **ORM**: Drizzle ORM 0.45.2
-   **Database Driver**: `better-sqlite3` 13.0.3
-   **Database**: SQLite (file-based: `data/app.db`)
-   **Environment Management**: `dotenv`
-   **Drizzle Migrations**: `drizzle-kit`

**Development Tools:**
-   **Linting**: ESLint
-   **Type Checking**: TypeScript

## 📦 Installation

Follow these steps to get MJD Shopping Manager up and running on your local machine.

### Prerequisites

Ensure you have the following installed:

-   **Node.js**: Version 18.x or higher (for Next.js frontend and API)
-   **npm** or **pnpm**: A package manager for Node.js. `pnpm` is used in `package.json` scripts.
-   **Python**: Version 3.10 or higher (for the Python CLI backend)
-   **Git**: For cloning the repository

### Clone Repository

First, clone the repository to your local machine:

```bash
git clone https://github.com/mrjohndowe/MJD_Shopping_Manager.git
cd MJD_Shopping_Manager
```

### Backend (Python) Setup

The Python CLI requires the `rich` library. Install it using pip:

```bash
pip install rich
```

The Python backend also uses the standard `sqlite3` module for managing history, settings, and autosave, which is built-in with Python.

### Frontend (Next.js) Setup

Install the Node.js dependencies using `pnpm` (as indicated in `package.json`):

```bash
pnpm install
```

**Database Initialization (Drizzle ORM):**

The Next.js API routes use Drizzle ORM with `better-sqlite3`. The database schema is defined in `src/db/schema.ts`, and migrations are handled via `drizzle-kit`.

To ensure the database is set up, Drizzle migrations are automatically run on application startup by `src/db/index.ts`:

```typescript
migrate(db, { migrationsFolder: resolve(process.cwd(), "drizzle") });
```

This will create or update the `data/app.db` SQLite database based on the schema defined in `drizzle/` migration files. Initial data (user profile, stores, catalog, and an example shopping list) is seeded via `src/db/seed.ts` if the database is empty.

## 💡 Usage

MJD Shopping Manager offers two primary interfaces: a modern web application and a traditional Python command-line interface.

### Web Interface

To start the web application, run the development server:

```bash
pnpm dev
```

Open your browser and navigate to `http://localhost:3000`. You will be greeted by the MJD Shopping Manager dashboard. The application is designed to be intuitive:

-   **Dashboard**: Get a quick overview of your budget, current grand total, remaining funds, and savings. Quickly add items or navigate to other sections.
-   **Cart & Items**: Manage all items in your active shopping list, including quantities, prices, discounts, and taxable status. Supports editing, duplicating, reordering, and clearing items.
-   **Stores & Taxes**: View and manage different store profiles and their associated itemized tax rates. Includes a sandbox calculator to test tax amounts for any given value.
-   **Receipt Studio**: Generate 5 distinct receipt styles for your current cart, which can be copied, printed, or downloaded.
-   **Lists & Catalog**: Organize multiple shopping lists and manage your reusable item catalog for frequent purchases.
-   **History & Stats**: Review past shopping trips, restore them, and view detailed spending analytics and category breakdowns.
-   **Export Center**: Export your current shopping cart in various formats (TXT, CSV, JSON, Markdown) with optional encryption.
-   **Python Terminal**: A live interactive terminal to execute Python CLI commands directly from the web interface.
-   **Settings**: Configure application preferences like themes, currency, and database options.

### Python CLI

The Python CLI provides full functionality and can be run directly from your terminal. Navigate to the project's root directory:

```bash
cd MJD_Shopping_Manager
```

**Launch Interactive Terminal UI:**

```bash
python main.py
```

This will launch the full interactive terminal application with a dashboard, allowing you to manage your cart, access menus for receipts, history, exports, and more using keyboard commands.

**CLI Command Examples:**

-   **Run Demo Cart with Pueblo, CO Taxes**: Automatically populates a sample shopping cart and displays the dashboard.
    ```bash
    python main.py --demo
    ```

-   **Calculate Sales Tax for an Amount**: Calculates the itemized sales tax for a given dollar amount in Pueblo, CO.
    ```bash
    python main.py --tax-calc 100.00
    ```

-   **Render a Specific Receipt Style**: Outputs a formatted receipt to the terminal. Available styles: `standard`, `store`, `detailed`, `budget`, `thermal`.
    ```bash
    python main.py --receipt thermal
    ```

-   **Output Current Cart Summary (JSON)**:
    ```bash
    python main.py --summary
    ```

-   **Display Aggregated Spending Statistics**:
    ```bash
    python main.py --stats
    ```

-   **Launch First-Time Setup Wizard** (if not already completed):
    ```bash
    python main.py --setup
    ```

For a general system boot and interactive session, you can also use `runSystem.py`:

```bash
python runSystem.py
```

## 📂 Project Structure

The repository is organized into distinct modules for clarity and maintainability:

-   `config/`: Constants and shared configuration values.
-   `data/`: SQLite database files (`app.db`, `records.db`), `autosave.json`, and `settings.json`.
-   `drizzle/`: Drizzle ORM migration files for the Next.js API database.
-   `exports/`: Python module for exporting shopping cart data to various formats (TXT, CSV, JSON, Markdown).
-   `history/`: Python module for managing and storing completed shopping trips.
-   `receipts/`: Python module for generating different styled receipts.
-   `settings/`: Python module for application-wide settings management.
-   `shopping/`: Core Python business logic for `ShoppingItem`, `ShoppingCart`, and `ShoppingApp`.
-   `storage/`: Python module for handling data persistence (SQLite, JSON for autosave/settings) and managers for stores, addresses, clients, and items.
-   `statistics/`: Python module for calculating shopping analytics.
-   `taxes/`: Python module for precise sales tax calculations.
-   `themes/`: Python module for managing UI themes and color palettes for the terminal.
-   `ui/`: Python modules (`dialogs.py`, `screens.py`, `widgets.py`) for rendering the interactive terminal UI using `rich`.
-   `src/app/api/`: Next.js API routes (TypeScript) for all core functionalities, interacting with the SQLite database via Drizzle ORM.
-   `src/components/`: React components for the web-based GUI.
-   `src/db/`: TypeScript code for Drizzle ORM database connection and schema definition.
-   `src/lib/`: Shared utility functions, including Web Audio API sound effects.
-   `main.py`: Main entry point for the Python CLI application.
-   `runSystem.py`: Python script for bootstrapping the Python CLI application.
-   `package.json`: Node.js project configuration and scripts for frontend/API development.
-   `tsconfig.json`: TypeScript compiler configuration.

## 🌐 API Reference

The Next.js application exposes several API endpoints (TypeScript) to manage shopping data and application logic:

| Endpoint             | HTTP Method(s) | Description                                                               |
| :------------------- | :------------- | :------------------------------------------------------------------------ |
| `/api/cart`          | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` | Manage active shopping cart items, calculate totals.                        |
| `/api/catalog`       | `GET`, `POST`  | Retrieve and add items to the reusable catalog.                           |
| `/api/checkout`      | `POST`         | Finalize a shopping trip, record to history, and clear the cart.          |
| `/api/exports`       | `POST`         | Export cart data in various formats with optional encryption.             |
| `/api/health`        | `GET`          | Perform a database health check.                                          |
| `/api/history`       | `GET`, `POST`, `DELETE` | Retrieve, restore, and delete past shopping trip records.                 |
| `/api/lists`         | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` | Manage multiple shopping lists (create, switch, duplicate, delete, update). |
| `/api/receipts`      | `POST`         | Generate and retrieve styled receipt content.                             |
| `/api/settings`      | `GET`, `PUT`   | Fetch and update application settings.                                    |
| `/api/setup`         | `GET`, `POST`  | Handle initial user profile and default store setup.                      |
| `/api/statistics`    | `GET`          | Retrieve aggregated shopping statistics.                                  |
| `/api/stores`        | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` | Manage store profiles and their associated tax rates.                     |
| `/api/terminal`      | `POST`         | Execute Python CLI commands from the web interface.                       |

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improvements, new features, or bug fixes, please feel free to:

1.  **Fork** the repository.
2.  **Create a new branch** (`git checkout -b feature/AmazingFeature`).
3.  **Commit** your changes (`git commit -m 'Add some AmazingFeature'`).
4.  **Push** to the branch (`git push origin feature/AmazingFeature`).
5.  **Open a Pull Request**.

Please ensure your code adheres to the existing style and conventions.

## 📜 License

This project is currently without a specified license.

## 🔗 Important Links

-   **GitHub Repository**: [https://github.com/mrjohndowe/MJD_Shopping_Manager](https://github.com/mrjohndowe/MJD_Shopping_Manager)

## ©️ Footer

Developed with ❤️ by Mr. John Dowe.

Found this project helpful? Give it a ⭐️ star, 🍴 fork it, or open an 🐛 issue to show your support!

[MJD_Shopping_Manager on GitHub](https://github.com/mrjohndowe/MJD_Shopping_Manager)

Contact: mrjohndowe@example.com


---
**<p align="center">Generated by [ReadmeCodeGen](https://www.readmecodegen.com/)</p>**