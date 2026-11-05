"""Rebuild browser data from JSON sources, offline."""
import json,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
products=json.loads((root/'data/products.json').read_text(encoding='utf8'))
assets=json.loads((root/'data/assets.json').read_text(encoding='utf8'))
(root/'data/catalog.js').write_text('window.MUSEUM_DATA='+json.dumps(products,ensure_ascii=False)+';window.MUSEUM_ASSETS='+json.dumps(assets,ensure_ascii=False)+';',encoding='utf8')
print('Built catalog:',len(products),'records')
