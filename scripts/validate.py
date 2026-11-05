"""Validate the local archive, or metadata alone in a code-only checkout."""
import argparse, hashlib, json, pathlib, re, sys

root=pathlib.Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--metadata-only',action='store_true');args=parser.parse_args()
products=json.loads((root/'data/products.json').read_text(encoding='utf8'))
assets=json.loads((root/'data/assets.json').read_text(encoding='utf8'))
errors=[];ids=[p['id'] for p in products]
if len(set(ids))!=len(ids):errors.append('duplicate product id')
expected={'t1','u1','t2','m1','m1l','pro','pro2','nut3','r1','pro2s','pro3','r2'}
if {p['id'] for p in products if p['category']=='手机'}!=expected:errors.append('phone baseline mismatch')
phones=[p for p in products if p['category']=='手机']
if [p['release_date'] for p in phones]!=sorted(p['release_date'] for p in phones):errors.append('phone release order mismatch')
for p in phones:
    if not p.get('launch_options'):errors.append(p['id']+': missing launch prices')
for p in products:
    if p.get('collection_group')=='手机' and (not p.get('release_date') or not p.get('release_date_source')):
        errors.append(p['id']+': missing sourced phone release date')
    highlights=p.get('design_highlights',[])
    if len(highlights)<5 or len({h.get('title') for h in highlights})!=len(highlights):
        errors.append(p['id']+': insufficient or duplicate design highlights')
    if not p.get('design_headline') or any(not h.get('text') for h in highlights):
        errors.append(p['id']+': missing design note content')
    if not p.get('images'):errors.append(p['id']+': no local image reference')
    if not p.get('sources'):errors.append(p['id']+': missing source')
    if p['release_date'] and not re.fullmatch(r'\d{4}-\d{2}-\d{2}',p['release_date']):errors.append(p['id']+': malformed date')
    for rid in p.get('related_accessories',[]):
        if rid not in ids:errors.append(p['id']+': broken relation '+rid)
    for rel in p['images']:
        resolved=(root/rel).resolve()
        if not resolved.is_relative_to(root):errors.append('path traversal '+rel)
        if not args.metadata_only and not resolved.is_file():errors.append('missing '+rel)
seen=set()
for a in assets:
    if a['asset_id'] in seen:errors.append('duplicate asset '+a['asset_id'])
    seen.add(a['asset_id'])
    if not a.get('rights') or not a.get('url') or not a.get('sha256'):errors.append('asset provenance missing')
    if not args.metadata_only:
        for field,hashfield in [('path','sha256'),('display_path','display_sha256')]:
            path=root/a[field]
            if not path.is_file():errors.append('missing '+a[field]);continue
            if hashlib.file_digest(path.open('rb'),'sha256').hexdigest()!=a[hashfield]:errors.append('hash mismatch '+a[field])
for rel in ['index.html','museum.js','museum.css','player.css','motion.css','DATA_STATUS.md','DATES.md','data/catalog.js','assets/fonts/OFL.txt']:
    if not (root/rel).is_file():errors.append('missing '+rel)
print(json.dumps({'mode':'metadata-only' if args.metadata_only else 'local-full','products':len(products),'phones':12,'assets':len(assets),'errors':errors},ensure_ascii=False,indent=2))
sys.exit(1 if errors else 0)
