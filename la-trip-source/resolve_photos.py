#!/usr/bin/env python3
import json, urllib.request, urllib.error, sys, time

KEY = sys.argv[1]
REFERER = "https://ericwangdesign.com/"

# (id, query, lat, lng)
PLACES = [
    (1, "Hospital of Emotions 2131 W 3rd St Los Angeles", 34.0607, -118.2853),
    (2, "DATALAND The Grand LA 100 S Grand Ave Los Angeles", 34.0545, -118.2480),
    (3, "The Broad museum 221 S Grand Ave Los Angeles", 34.0556, -118.2499),
    (4, "Hauser & Wirth 901 E 3rd St Los Angeles Arts District", 34.0413, -118.2354),
    (5, "Hammer Museum 10899 Wilshire Blvd Los Angeles", 34.0591, -118.4437),
    (6, "MOCA Grand Avenue 250 S Grand Ave Los Angeles", 34.0554, -118.2493),
    (7, "Dong Ting Xian 727 E Valley Blvd San Gabriel", 34.0688, -118.0963),
    (8, "OC & Lau Restaurant 10130 Garden Grove Blvd Garden Grove", 33.7774, -117.9330),
    (9, "Downtown Los Angeles skyline Arts District", 34.0522, -118.2437),
    (10, "Culver City Arts District Washington Blvd", 34.0100, -118.3860),
    (11, "Abbot Kinney Blvd Venice Los Angeles", 33.9921, -118.4698),
    (12, "Silver Lake Sunset Blvd Los Angeles", 34.0873, -118.2713),
    (13, "Highland Park York Blvd Los Angeles", 34.1078, -118.2009),
    (14, "Frogtown Elysian Valley LA River Los Angeles", 34.0920, -118.2436),
    (15, "Arts District Los Angeles murals", 34.0413, -118.2370),
    (16, "Melrose Avenue West Hollywood", 34.0838, -118.3607),
    (17, "Atwater Village Glendale Blvd Los Angeles", 34.0967, -118.2583),
    (18, "Smorgasburg ROW DTLA 777 S Alameda St Los Angeles", 34.0361, -118.2304),
    (19, "Tartine Bakery Silver Lake Los Angeles", 34.0876, -118.2706),
    (20, "Great White Larchmont Los Angeles restaurant", 34.0731, -118.3244),
    (21, "Hollywood Forever Cemetery 6000 Santa Monica Blvd", 34.0903, -118.3181),
]

def post(url, body, mask):
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("X-Goog-Api-Key", KEY)
    req.add_header("X-Goog-FieldMask", mask)
    req.add_header("Referer", REFERER)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)

def get(url):
    req = urllib.request.Request(url, method="GET")
    req.add_header("Referer", REFERER)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)

out = {}
report = []
for pid, q, lat, lng in PLACES:
    try:
        res = post(
            "https://places.googleapis.com/v1/places:searchText",
            {"textQuery": q, "maxResultCount": 1,
             "locationBias": {"circle": {"center": {"latitude": lat, "longitude": lng}, "radius": 4000}}},
            "places.id,places.displayName,places.photos",
        )
        places = res.get("places", [])
        if not places:
            report.append(f"{pid:>2}  NO RESULT  ({q[:40]})"); continue
        pl = places[0]
        name = pl.get("displayName", {}).get("text", "?")
        photos = pl.get("photos", [])
        if not photos:
            report.append(f"{pid:>2}  no photo   -> {name}"); continue
        photo_name = photos[0]["name"]
        media = get(f"https://places.googleapis.com/v1/{photo_name}/media?maxWidthPx=800&skipHttpRedirect=true&key={KEY}")
        uri = media.get("photoUri")
        if uri:
            out[pid] = uri
            report.append(f"{pid:>2}  OK         -> {name}")
        else:
            report.append(f"{pid:>2}  no uri     -> {name}")
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:200]
        report.append(f"{pid:>2}  HTTP {e.code}  {body}")
    except Exception as e:
        report.append(f"{pid:>2}  ERR {e}")
    time.sleep(0.15)

with open("photos.json", "w") as f:
    json.dump(out, f, indent=2)

print("\n".join(report))
print(f"\nResolved {len(out)}/{len(PLACES)} photos -> photos.json")
