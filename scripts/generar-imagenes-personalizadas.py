#!/usr/bin/env python3
"""Genera ilustraciones PNG personalizadas para las curiosidades de SoyCurioso.

Requiere Forge con API en http://127.0.0.1:7860.
Uso:
  python scripts/generar-imagenes-personalizadas.py --dry-run
  python scripts/generar-imagenes-personalizadas.py --limit 3
  python scripts/generar-imagenes-personalizadas.py
"""
import argparse, base64, json, re, unicodedata
from datetime import date
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "datos.json"
IMAGE_DIR = ROOT / "img"
API = "http://127.0.0.1:7860/sdapi/v1/txt2img"
MODEL = "juggernautXL_v8Rundiffusion.safetensors"

GUIDES = {
    "ciencia": "Use a scientifically plausible documentary reconstruction or macro/scientific photograph. Prioritize the organism, object or physical phenomenon named in the title.",
    "tecnologia": "Use a historically accurate documentary reconstruction showing the named machine or technology in its real context, with visible scale and materials.",
    "historia": "Use a historically grounded documentary reconstruction with period-appropriate clothing, architecture, objects and lighting. Do not modernize the scene.",
    "filosofia": "Use a realistic symbolic editorial scene with concrete visual metaphors for the exact philosophical idea, avoiding generic abstract backgrounds.",
    "citas": "Use a realistic editorial scene that visualizes the exact quote's context and meaning, not a generic portrait of the author.",
    "logica": "Use a clear realistic tabletop or documentary scene containing the exact objects and arrangement needed to represent the puzzle or reasoning problem.",
    "psicologia": "Use a realistic, respectful documentary or conceptual scene showing the exact psychological phenomenon without horror clichés or stigmatizing imagery.",
    "antropologia": "Use a realistic documentary scene grounded in the people, place, culture and material details described in the article, without stereotypes.",
}
BASE = "highly realistic documentary image, photorealistic reconstruction, physically plausible materials and lighting, accurate proportions, clear central subject, natural colors, editorial science and history magazine photography, sharp detailed textures, no text, no labels, no logos, no watermark"
NEG = "illustration, cartoon, anime, vector art, flat SVG, generic stock image, fantasy, surreal distortion, text, letters, words, logo, watermark, caption, blurry, low resolution, duplicated subjects, malformed anatomy, extra limbs, plastic CGI look, oversaturated colors"

def slug(value):
    value = unicodedata.normalize("NFD", value.lower()).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")[:70]

def clean(text):
    return re.sub(r"\s+", " ", str(text)).strip()

def visual_anchors(item):
    # El título y la entradilla pesan más que el desarrollo: son la identidad visual.
    title = clean(item["titular"])
    intro = clean(item["entradilla"])
    body = clean(" ".join(item.get("cuerpo", [])))
    return f"TITLE SUBJECT: {title}. REQUIRED FACTS: {intro}. VISUAL CONTEXT: {body[:850]}"

def make_prompt(item):
    guide = GUIDES.get(item.get("cat"), GUIDES["ciencia"])
    anchors = visual_anchors(item)
    return (
        f"{BASE}. {guide} Create one single coherent scene specifically for this article. "
        f"{anchors} The title subject must be unmistakable and occupy the visual focus. "
        "Show the most distinctive factual detail from the article, not a vague mood. "
        "Do not add unrelated objects or invent a fantasy interpretation."
    )

def request_image(prompt):
    payload = {
        "prompt": prompt,
        "negative_prompt": NEG,
        "steps": 28,
        "width": 768,
        "height": 512,
        "cfg_scale": 7.0,
        "sampler_name": "DPM++ 2M Karras",
        "seed": -1,
        "override_settings": {"sd_model_checkpoint": MODEL},
    }
    req = Request(API, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"})
    with urlopen(req, timeout=600) as response:
        result = json.load(response)
    if not result.get("images"):
        raise RuntimeError("Forge no devolvió ninguna imagen")
    return base64.b64decode(result["images"][0])

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--slugs", nargs="*")
    args = parser.parse_args()
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    today = date.today().isoformat()
    items = [x for x in data["curiosidades"] if x["fecha"] <= today]
    if args.slugs:
        wanted = set(args.slugs)
        items = [x for x in items if slug(x["titular"]) in wanted]
    if args.limit:
        items = items[:args.limit]
    if not items:
        raise SystemExit("No hay curiosidades seleccionadas")
    print(f"Seleccionadas: {len(items)}")
    manifest = []
    for index, item in enumerate(items, 1):
        name = slug(item["titular"])
        prompt = make_prompt(item)
        if args.dry_run:
            print(f"\n[{index}/{len(items)}] {item['titular']}\n{prompt}\n")
            continue
        path = IMAGE_DIR / f"{name}.png"
        try:
            path.write_bytes(request_image(prompt))
            item["imagen"] = f"img/{name}.png"
            manifest.append({"slug": name, "title": item["titular"], "ok": True, "bytes": path.stat().st_size})
            print(f"[{index}/{len(items)}] OK {name}.png ({path.stat().st_size} bytes)", flush=True)
        except Exception as exc:
            manifest.append({"slug": name, "title": item["titular"], "ok": False, "error": repr(exc)})
            print(f"[{index}/{len(items)}] ERROR {name}: {exc}", flush=True)
    if not args.dry_run:
        DATA_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        (ROOT / "generacion-imagenes-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Completadas: {sum(x['ok'] for x in manifest)}/{len(manifest)}")

if __name__ == "__main__":
    main()
