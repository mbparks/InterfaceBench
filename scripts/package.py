#!/usr/bin/env python3
"""Package the tested static distribution and repository, excluding local caches."""
from pathlib import Path
import zipfile,hashlib,json,sys
root=Path(__file__).resolve().parents[1]
version=json.loads((root/'package.json').read_text())['version']
out=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else root.parent/'output'
out.mkdir(parents=True,exist_ok=True)
def pack(source,target,repo=False):
    files=[]
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for p in sorted(source.rglob('*')):
            if not p.is_file() or p.is_symlink():continue
            rel=p.relative_to(source)
            if any(s in {'.git','.openai','node_modules','__pycache__','output'} for s in rel.parts):continue
            if p.suffix in {'.pyc'}:continue
            data=p.read_bytes();z.writestr(str(rel),data);files.append({'path':str(rel),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
        z.writestr('FILE-HASHES.json',json.dumps(files,indent=2))
    with zipfile.ZipFile(target) as z:
        assert z.testzip() is None
        if not repo:assert 'index.html' in z.namelist()
    print(json.dumps({'file':str(target),'bytes':target.stat().st_size,'files':len(files),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}))
pack(root/'dist',out/f'INTERFACEBENCH-v{version}-server.zip')
pack(root,out/f'INTERFACEBENCH-v{version}-repository.zip',True)
