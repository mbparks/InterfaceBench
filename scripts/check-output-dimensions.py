"""Independently inspect generated PDF geometry with PyMuPDF (developer QA only)."""
from pathlib import Path
import json,hashlib,datetime
import fitz
root=Path(__file__).resolve().parents[1]
source=root/'qa/dimensional-fixture.pdf'
doc=fitz.open(source);page=doc[0];k=25.4/72
expected=[30,52,40,62]
rects=[[v*k for v in item['rect']] for item in page.get_drawings()]
nearest=min(rects,key=lambda r:max(abs(a-b) for a,b in zip(r,expected)))
error=max(abs(a-b) for a,b in zip(nearest,expected))
assert error<.001,(nearest,error)
assert any(abs(r[2]-r[0]-20)<.001 and abs(r[3]-r[1]-20)<.001 for r in rects),'Missing calibration square'
result={'checked':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source':source.name,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'expectedOpeningBoundsMm':expected,'measuredOpeningBoundsMm':nearest,'maxErrorMm':error,'calibrationSquare20mm':True,'pageMm':[page.rect.width*k,page.rect.height*k],'passed':True,'physicalPrintTest':False}
(root/'qa/independent-dimensions.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))
