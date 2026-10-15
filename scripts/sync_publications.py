"""Weekly publication sync.

Reads Google Scholar (profile page) and OpenAlex (via ORCID), adds any new
publications to content/publications.json and refreshes the Google Scholar
metrics in content/impact.json. Entries written by hand are never changed.

Settings live in content/sync.json so they can be edited from the site editor.
Run locally with:  python scripts/sync_publications.py
"""
import datetime as dt
import html
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "content")
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

UTD_FT50 = {
    "manufacturing & service operations management", "management science", "operations research",
    "production and operations management", "journal of operations management",
    "information systems research", "mis quarterly", "marketing science", "journal of marketing",
    "journal of marketing research", "journal of consumer research", "strategic management journal",
    "academy of management journal", "academy of management review", "administrative science quarterly",
    "organization science", "journal of finance", "journal of financial economics",
    "review of financial studies", "the accounting review", "journal of accounting research",
    "journal of accounting and economics", "journal of international business studies",
    "journal of management", "journal of management studies", "research policy",
    "american economic review", "econometrica", "quarterly journal of economics",
    "journal of political economy", "review of economic studies", "harvard business review",
    "mit sloan management review", "journal of business ethics", "human resource management",
}
ABS4 = {
    "european journal of operational research", "british journal of management", "risk analysis",
    "international journal of operations & production management",
    "international journal of operations and production management",
    "transportation research part b: methodological", "transportation research part b methodological",
    "journal of supply chain management", "decision sciences", "omega", "naval research logistics",
    "iise transactions", "transportation science", "mathematical programming",
    "informs journal on computing", "international journal of production economics",
    "international journal of production research", "ieee transactions on engineering management",
    "transportation research part e: logistics and transportation review",
    "transportation research part e logistics and transportation review",
}
KEEP_TYPES = {"article", "review", "book", "book-chapter"}
# Front matter and notes that are not research papers
SKIP_TITLE = re.compile(r"best paper award|editorial|corrigendum|erratum|in memoriam|reviewers|"
                        r"^\d+ years of|call for papers|retraction", re.I)


def load(name):
    with open(os.path.join(CONTENT, name), encoding="utf8") as f:
        return json.load(f)


def save(name, data):
    with open(os.path.join(CONTENT, name), "w", encoding="utf8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def get(url, as_json=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en"})
    with urllib.request.urlopen(req, timeout=30) as r:
        body = r.read().decode("utf8")
    return json.loads(body) if as_json else body


def tokens(text):
    text = text.lower().replace("iour", "ior")
    return {w.rstrip("s") for w in re.findall(r"[a-z0-9]+", text) if len(w) > 2}


def is_known(title, doi, existing):
    """True if a title or DOI already appears in an existing entry."""
    t = tokens(title)
    if not t:
        return True
    for p in existing:
        if doi and doi.lower() in (p.get("link", "") + p.get("citation", "")).lower():
            return True
        other = tokens(p.get("title") or p["citation"])
        if len(t & other) / min(len(t), len(other) or 1) >= 0.85:
            return True
    return False


def category_for(journal, kind):
    if kind in ("book", "book-chapter") and not journal:
        return "Books"
    j = journal.lower().strip()
    if j in UTD_FT50:
        return "UTD24 / FT50 journals"
    if j in ABS4:
        return "Other ABS 4* journals"
    return "Other selected journals"


def from_openalex(orcid, from_year):
    url = ("https://api.openalex.org/works?filter=author.orcid:{},from_publication_date:{}-01-01"
           "&sort=publication_date:desc&per-page=100").format(orcid, from_year)
    found = []
    for w in get(url, as_json=True)["results"]:
        if w.get("type") not in KEEP_TYPES or not w.get("title"):
            continue
        src = ((w.get("primary_location") or {}).get("source") or {})
        journal = src.get("display_name") or ""
        names = []
        for a in w.get("authorships", []):
            parts = a["author"]["display_name"].split()
            if parts:
                initials = "".join(p[0] + "." for p in parts[:-1])
                names.append(f"{parts[-1]}, {initials}" if initials else parts[-1])
        bib = w.get("biblio") or {}
        details = ""
        if bib.get("volume"):
            details = bib["volume"] + (f"({bib['issue']})" if bib.get("issue") else "")
            if bib.get("first_page"):
                details += f", {bib['first_page']}" + (f"-{bib['last_page']}" if bib.get("last_page") else "")
        title = html.unescape(re.sub(r"<[^>]+>", "", w["title"]))
        doi = (w.get("doi") or "").replace("https://doi.org/", "")
        citation = f"{', '.join(names)} ({w['publication_year']}). {title}. {journal}"
        citation += f", {details}." if details else (", published online." if journal else ".")
        found.append({"title": title, "doi": doi, "year": w["publication_year"], "journal": journal,
                      "citation": citation, "kind": w["type"], "source": "openalex"})
    return found


def from_scholar(user, from_year):
    page = get(f"https://scholar.google.com/citations?user={user}&hl=en&sortby=pubdate&pagesize=100")
    if "gsc_a_at" not in page:
        raise RuntimeError("Google Scholar returned no publication rows (likely blocked)")
    stats = re.findall(r'class="gsc_rsb_std">(\d+)<', page)
    metrics = {"citations": stats[0], "h": stats[2], "i10": stats[4]} if len(stats) >= 6 else None
    found = []
    for row in re.findall(r'<tr class="gsc_a_tr">(.*?)</tr>', page, re.S):
        title = re.search(r'class="gsc_a_at"[^>]*>(.*?)</a>', row, re.S)
        grays = re.findall(r'<div class="gs_gray">(.*?)</div>', row, re.S)
        year = re.search(r'class="gsc_a_h gsc_a_hc gs_ibl">(\d{4})<', row)
        if not (title and year) or int(year.group(1)) < from_year:
            continue
        clean = lambda s: html.unescape(re.sub(r"<[^>]+>", "", s)).strip()
        authors = clean(grays[0]) if grays else ""
        venue = clean(grays[1]) if len(grays) > 1 else ""
        journal = re.split(r"\s+\d", venue)[0].strip(" ,")
        t = clean(title.group(1))
        found.append({"title": t, "doi": "", "year": int(year.group(1)), "journal": journal,
                      "citation": f"{authors} ({year.group(1)}). {t}. {venue}.", "kind": "article",
                      "source": "scholar"})
    return found, metrics


def fmt(n):
    return f"{int(n):,}"


def main():
    cfg = load("sync.json")
    if not cfg.get("enabled", True):
        print("Sync disabled in content/sync.json")
        return
    pubs = load("publications.json")
    from_year = int(cfg.get("auto_add_from_year", dt.date.today().year))
    excluded = [tokens(t) for t in cfg.get("exclude_titles", [])]
    skip_venues = [v.lower() for v in cfg.get("exclude_venues", [])]
    candidates, notes = [], []

    try:
        candidates += from_openalex(cfg["orcid"], from_year)
    except Exception as e:  # keep going with Scholar
        notes.append(f"OpenAlex failed: {e}")

    metrics = None
    try:
        time.sleep(1)
        found, metrics = from_scholar(cfg["scholar_id"], from_year)
        candidates += found
    except Exception as e:
        notes.append(f"Google Scholar skipped: {e}")

    added = []
    for c in candidates:
        t = tokens(c["title"])
        if any(t and len(t & x) / len(t) >= 0.85 for x in excluded):
            continue
        if SKIP_TITLE.search(c["title"]) or any(v in c["citation"].lower() for v in skip_venues):
            continue
        if is_known(c["title"], c["doi"], pubs + added):
            continue
        added.append({
            "category": category_for(c["journal"], c["kind"]),
            "title": c["title"],
            "year": c["year"],
            "citation": c["citation"],
            "journal": c["journal"],
            "link": f"https://doi.org/{c['doi']}" if c["doi"] else "",
            "source": c["source"],
            "added": dt.date.today().isoformat(),
            "hidden": False,
        })

    if added:
        save("publications.json", added + pubs)

    if metrics and cfg.get("update_metrics", True):
        impact = load("impact.json")
        new_values = {"Google Scholar citations": fmt(metrics["citations"]),
                      "Google Scholar h-index": metrics["h"],
                      "Google Scholar i10-index": metrics["i10"]}
        changed = False
        for m in impact["metrics"]:
            if m["label"] in new_values and m["value"] != new_values[m["label"]]:
                m["value"] = new_values[m["label"]]
                changed = True
        if changed:
            impact["metrics_updated"] = dt.date.today().strftime("%B %Y")
            save("impact.json", impact)
            notes.append("Google Scholar metrics updated")

    print(f"Added {len(added)} publication(s)")
    for a in added:
        print(f"  + [{a['source']}] {a['citation'][:110]}")
    for n in notes:
        print(n)


if __name__ == "__main__":
    sys.exit(main())
