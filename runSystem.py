#!/usr/bin/env python
"""
MJD Shopping Manager - System Bootstrapper & Runner
Validates Python runtime environment, initiates database, and launches MJD Shopping Manager.
"""
import sys
import subprocess
from pathlib import Path


def check_python_version():
    if sys.version_info < (3, 10):
        print(f"[!] Warning: MJD Shopping Manager recommends Python 3.10+ (Current: {sys.version})")


def bootstrap():
    check_python_version()

    # Ensure directories exist
    base_dir = Path(__file__).resolve().parent
    data_dir = base_dir / "data"
    data_dir.mkdir(parents=True, exist_ok=True)

    # Launch main application
    from shopping.app import ShoppingApp
    app = ShoppingApp()
    app.run_interactive()


if __name__ == "__main__":
    try:
        bootstrap()
    except KeyboardInterrupt:
        print("\n\n[✓] MJD Shopping Manager session exited cleanly.")
        sys.exit(0)
