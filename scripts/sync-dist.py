#!/usr/bin/env python3
"""Copy authored source to the server distribution; no compilation."""
from pathlib import Path
import shutil
root=Path(__file__).resolve().parents[1]
for source in (root/'src').rglob('*'):
    if source.is_file():
        target=root/'dist'/source.relative_to(root/'src')
        target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(source,target)
print('Authored source copied to dist; local vendor/font assets preserved.')
