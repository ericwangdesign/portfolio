#!/usr/bin/env python3
import json, urllib.request, urllib.error, sys, time
from io import BytesIO
from PIL import Image

KEY = sys.argv[1]
REFERER = "https://ericwangdesign.com/"

# id, query — neighborhood queries point at photogenic, well-photographed landmarks
PLACES = [
    (1,  "Hospital of Emotions 2131 W 3rd St Los Angeles", 34.0607, -118.2853),
    (2,  "DATALAND The Grand LA Los Angeles", 34.0545, -118.2480),
    (3,  "The Broad museum Los Angeles", 34.0556, -118.2499),
    (4,  "Hauser & Wirth Los Angeles Arts District", 34.0413, -118.2354),
    (5,  "Hammer Museum Los Angeles", 34.0591, -118.4437),
    (6,  "Museum of Contemporary Art MOCA Grand Avenue Los Angeles", 34.0554, -118.2493),
    (7,  "Dong Ting Xian restaurant San Gabriel", 34.0688, -118.0963),
    (8,  "OC & Lau Restaurant Garden Grove", 33.7774, -117.9330),
    (9,  "Downtown Los Angeles skyline night", 34.0490, -118.2530),
    (10, "Hayden Tract Culver City architecture", 34.0274, -118.3870),
    (11, "Abbot Kinney Boulevard Venice shops", 33.9921, -118.4698),
    (12, "Intelligentsia Coffee Silver Lake Los Angeles", 34.0873, -118.2713),
    (13, "Highland Park Bowl Los Angeles", 34.1110, -118.1920),
    (14, "Spoke Bicycle Cafe Frogtown Los Angeles", 34.1010, -118.2480),
    (15, "Arts District Los Angeles street mural", 34.0413, -118.2370),
    (16, "Paul Smith Pink Wall Melrose Los Angeles", 34.0838, -118.3607),
    (17, "Dune Atwater Village Los Angeles restaurant", 34.0967, -118.2583),
    (18, "Smorgasburg ROW DTLA food market Los Angeles", 34.0361, -118.2304),
    (19, "Tartine Bakery Los Angeles", 34.0876, -118.2706),
    (20, "Great White restaurant Larchmont Los Angeles", 34.0731, -118.3244),
    (21, "Hollywood Forever Cemetery Los Angeles", 34.0903, -118.3181),
]

def post(url, body, mask):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("X-Goog-Api-Key", KEY)
    req.add_header("X-Goog-FieldMask", mask)
    req.add_header("Referer", REFERER)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)

def get_json(url):
    req = urllib.request.Request(url, method="GET"); req.add_header("Referer", REFERER)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)

def get_bytes(url):
    req = urllib.request.Request(url); req.add_header("Referer", REFERER)
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read()

def score(b):
    """Higher = more visual content. Penalizes blank sky / flat walls."""
    im = Image.open(BytesIO(b)).convert("RGB").resize((48, 48))
    px = list(im.getdata()); n = len(px)
    lums = [0.299*r + 0.587*g + 0.114*bl for r, g, bl in px]
    m = sum(lums)/n
    lum_std = (sum((l-m)**2 for l in lums)/n) ** 0.5
    rg = [abs(r-g) for r, g, bl in px]
    yb = [abs(0.5*(r+g)-bl) for r, g, bl in px]
    def ms(a):
        mm = sum(a)/n; return mm, (sum((x-mm)**2 for x in a)/n) ** 0.5
    rgm, rgs = ms(rg); ybm, ybs = ms(yb)
    colorful = (rgs**2 + ybs**2) ** 0.5 + 0.3*((rgm**2 + ybm**2) ** 0.5)
    # extra penalty: very bright + flat (classic sky) or very dark
    sky_pen = 8 if (m > 175 and lum_std < 30) else 0
    dark_pen = 8 if m < 35 else 0
    return lum_std + 0.7*colorful - sky_pen - dark_pen

out, report = {}, []
for pid, q, lat, lng in PLACES:
    try:
        res = post("https://places.googleapis.com/v1/places:searchText",
                   {"textQuery": q, "maxResultCount": 1,
                    "locationBias": {"circle": {"center": {"latitude": lat, "longitude": lng}, "radius": 5000}}},
                   "places.displayName,places.photos")
        pls = res.get("places", [])
        if not pls or not pls[0].get("photos"):
            report.append(f"{pid:>2}  NO PHOTOS  ({q[:38]})"); continue
        name = pls[0].get("displayName", {}).get("text", "?")
        photos = pls[0]["photos"][:6]  # score up to 6 candidates
        best_uri, best_score = None, -1e9
        for ph in photos:
            try:
                media = get_json(f"https://places.googleapis.com/v1/{ph['name']}/media?maxWidthPx=1000&skipHttpRedirect=true&key={KEY}")
                uri = media.get("photoUri")
                if not uri: continue
                try: img = get_bytes(uri + "=w220")   # small version for fast scoring
                except Exception: img = get_bytes(uri)
                sc = score(img)
                if sc > best_score:
                    best_score, best_uri = sc, uri
            except Exception:
                continue
        if best_uri:
            out[pid] = best_uri
            report.append(f"{pid:>2}  score {best_score:6.1f}  {name[:34]}")
        else:
            report.append(f"{pid:>2}  no usable  {name[:34]}")
    except urllib.error.HTTPError as e:
        report.append(f"{pid:>2}  HTTP {e.code}  {e.read().decode()[:120]}")
    except Exception as e:
        report.append(f"{pid:>2}  ERR {e}")
    time.sleep(0.1)

json.dump(out, open("photos.json", "w"), indent=2)
print("\n".join(report))
print(f"\nResolved {len(out)}/{len(PLACES)} -> photos.json")
