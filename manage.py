#!/usr/bin/env python
import os
import sys
from pathlib import Path


def main():
    base_dir = Path(__file__).resolve().parent
    backend_dir = base_dir / "main"

    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "main.settings")

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
