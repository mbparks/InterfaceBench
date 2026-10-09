#!/usr/bin/env python3
"""Add the reviewed label-side example to the generated release/catalog report."""
from pathlib import Path
import base64,json
root=Path(__file__).resolve().parents[1]
version=json.loads((root/'package.json').read_text())['version']
report=root.parent/'output'/f'INTERFACEBENCH-v{version}-release-report.html'
html=report.read_text().replace('A much bigger parts bench.','Clean front. Useful rear.')
cards=[]
for side,title in [('front','Front labels off'),('rear','Rear labels and references on')]:
    data=base64.b64encode((root/'qa'/f'labels-{side}-canvas.png').read_bytes()).decode()
    cards.append(f'<figure style="margin:0"><img style="width:100%;height:auto;border-radius:8px" alt="{title}: rendered component geometry" src="data:image/png;base64,{data}"><figcaption>{title}</figcaption></figure>')
section='''<section><h2>New in 1.4.1: independent label sides</h2>
<p>In Arrange, use <strong>Labels → Front / Rear</strong> beside the view controls. Turn Front off and leave Rear on for a clean front with useful assembly labels. The panel switches are master controls; each component also has its own front/rear switches in the inspector. Changes save with the project and support undo.</p>
<p>Front SVG/PDF/PNG respects the front flags. Fabricate offers <strong>Rear guide SVG / PDF</strong> with mirrored positions and readable labels/references; these can also accompany the fabrication ZIP. Rear guides are assembly references, not cutting templates. Independent front artwork keeps its existing layer controls.</p>
<p><strong>64 tests pass.</strong> The images below are static renders from the actual canvas geometry, not browser screenshots. The rear assembly PDF was also rendered and visually reviewed. Real-browser acceptance remains pending under the Sites workflow restriction.</p>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px">'''+''.join(cards)+'''</div></section>'''
html=html.replace('<main>','<main>'+section,1)
report.write_text(html)
print(report)
