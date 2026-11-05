"""Create a code-only package; never publishes or changes the local archive."""
import json,pathlib,shutil,zipfile,re,datetime

root=pathlib.Path(__file__).resolve().parents[1]
dest=root/'dist/smartisan-museum-code'
if dest.exists():dest=root/('dist/smartisan-museum-code-'+datetime.datetime.now().strftime('%Y%m%d-%H%M%S'))
dest.mkdir(parents=True)
for name in ['index.html','about.html','museum.css','player.css','motion.css','museum.js','README.md','CATALOG.md','DATES.md','DATA_STATUS.md','LICENSE','MEDIA_RIGHTS.md','CONTRIBUTING.md','.gitignore']:
    shutil.copy2(root/name,dest/name)
for dirname in ['scripts','.github','assets/fonts']:
    shutil.copytree(root/dirname,dest/dirname)
(dest/'docs').mkdir();(dest/'data').mkdir();(dest/'assets').mkdir(exist_ok=True)
for name in ['products.json','assets.json','sources.json','coverage.json','acquisition-failures.json']:
    if (root/'data'/name).exists():shutil.copy2(root/'data'/name,dest/'data'/name)
placeholder='<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000"><rect width="800" height="1000" fill="#eee9df"/><rect x="60" y="60" width="680" height="880" rx="18" fill="#faf8f2" stroke="#c7bcab"/><text x="400" y="465" text-anchor="middle" fill="#8d7860" font-family="sans-serif" font-size="30">MEDIA NOT INCLUDED</text><text x="400" y="520" text-anchor="middle" fill="#a08f7a" font-family="sans-serif" font-size="18">Code-only archive / add licensed media</text></svg>'
(dest/'assets/archive-placeholder.svg').write_text(placeholder,encoding='utf8')
products=json.loads((dest/'data/products.json').read_text(encoding='utf8'))
for p in products:
    p['images']=['assets/archive-placeholder.svg']
    p['image_status']='媒体占位牌'
    p.pop('date_status',None)
    p.pop('verification',None)
(dest/'data/products.json').write_text(json.dumps(products,ensure_ascii=False,indent=2),encoding='utf8')
(dest/'data/catalog.js').write_text('window.MUSEUM_DATA='+json.dumps(products,ensure_ascii=False)+';window.MUSEUM_ASSETS=[];',encoding='utf8')
(dest/'MEDIA_PACKAGE.md').write_text('# Media package\n\n此包保留藏品数据和来源索引，第三方图片单独管理，页面显示明确的媒体占位牌。Noto Sans SC 及 OFL 许可证随包提供。\n',encoding='utf8')
archive=dest.parent/'smartisan-museum-code.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
    for p in dest.rglob('*'):
        if p.is_file() and '__pycache__' not in p.parts:z.write(p,p.relative_to(dest.parent))
print(archive)
