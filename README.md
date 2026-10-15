# Prof. Tsan-Ming (Jason) Choi — personal website

A fast, modern academic website. All text, photos and publications live in the
`content/` folder as plain data files, so nobody has to touch code to update the site.

| What | How |
|---|---|
| Hosting | GitHub Pages (free, HTTPS, custom domain possible) |
| Editing | Pages CMS: a web editor with forms, photo upload, no coding |
| New publications | Added automatically every Monday from Google Scholar and OpenAlex (his ORCID) |
| Citation numbers | Google Scholar citations, h-index and i10-index refresh weekly |

---

## Part A — One-time setup (about 20 minutes)

Ideally Prof. Choi owns the GitHub account so the site stays his.

1. **Create the repository.** Sign in at <https://github.com> → **New repository** → name it
   `jason-choi` (or `<username>.github.io` for a shorter address) → Public → Create.
2. **Upload the files.** On the new repository page choose **uploading an existing file**, drag in
   everything inside this folder (including the hidden `.github` folder, `.pages.yml` and `.nojekyll`),
   then **Commit changes**. If the hidden files do not upload by dragging, use GitHub Desktop instead.
3. **Turn on the website.** Repository → **Settings → Pages** → Source: *Deploy from a branch* →
   Branch `main`, folder `/ (root)` → Save. After a minute the site is live at
   `https://<username>.github.io/jason-choi/`.
4. **Turn on the weekly sync.** Repository → **Actions** tab → enable workflows → open
   *Sync publications* → **Run workflow** once to test it. Then **Settings → Actions → General →
   Workflow permissions** → *Read and write permissions* → Save.
5. **Connect the editor.** Go to <https://app.pagescms.org> → *Sign in with GitHub* → install the
   Pages CMS app on this repository → open the repository. The menu on the left shows Profile,
   Latest news, Publications, Research, Team, Funding & impact, Teaching, Service.
6. **Optional: own domain** (e.g. `jasonchoi.org`, about £10/year). Buy it from any registrar, then
   Settings → Pages → Custom domain, and follow GitHub's DNS instructions.
7. **Point people to the new site.** Add a link on the old Google Site, the ULMS profile, ORCID and
   Google Scholar homepage field.

To give a student editing rights: Settings → Collaborators → Add people. They then log in to
Pages CMS with their own GitHub account. Prof. Choi can remove them at any time.

---

## Part B — How Prof. Choi edits the site

1. Open **<https://app.pagescms.org>** and sign in with GitHub (or click *Edit site* at the bottom of the website).
2. Pick a section on the left, change the text in the form, and press **Save**.
3. The live website updates within about one minute.

Common tasks:

- **Add a publication:** Publications → *Add an entry* → choose the category, year, paste the full
  citation, the journal name and the DOI link → Save. New entries can go anywhere; the site sorts by year.
- **Hide a publication** (for example an item the automatic sync added that he doesn't want shown):
  open it and tick **Hide from website**.
- **Add news:** Latest news → *Add an entry* → date, title, one line of text, optional photo.
- **Change a photo:** click the image field → upload a new photo.
- **Add a PhD student:** Research team → Groups → Current PhD students → *Add an entry*.
- **Change the whiteboard or hero words:** Profile & contact → *Whiteboard lines* / *Animated words in the hero*.
- **Change or turn off the little truck guide:** Guide → edit the tips, or untick *Show the guide*.
- **Research area paper lists:** Research → each area's *Keywords*. Papers whose citation contains
  one of the keywords are listed under that area automatically.

Every change is saved with full history, so any mistake can be undone (GitHub → the file → *History*).

---

## How the automatic publication sync works

`scripts/sync_publications.py` runs every Monday through GitHub Actions
(`.github/workflows/sync-publications.yml`). It:

1. reads his **OpenAlex** record (free, official scholarly database, matched by ORCID);
2. reads his **Google Scholar** profile page, newest first;
3. skips anything already on the site (matched by DOI or title), editorials, corrigenda and
   venues listed under *Never add items from these venues*;
4. adds the rest to `content/publications.json` with a **New** label for 90 days;
5. updates the Google Scholar citation numbers on the homepage.

Settings are under **Automatic publication sync** in the editor:
the start year, the Scholar ID, the ORCID, and titles or venues to always skip.

Limits to know:

- Google has no official Scholar API and sometimes blocks automated requests from GitHub's servers.
  When that happens the run still adds papers from OpenAlex and simply keeps last week's citation
  numbers. Nothing breaks.
- New papers appear in OpenAlex and Scholar a few days to a few weeks after publication.
- The sync guesses the category from the journal name (UTD24/FT50, ABS 4*, other). He can change
  the category of any entry in the editor.
- GitHub pauses scheduled jobs in repositories with no activity for 60 days. If the weekly job is
  paused, Actions → Sync publications → *Enable workflow*.

## Preview on your own computer

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>. (Opening `index.html` directly does not work, because the page
loads its content files.)

## Files

```
index.html                 page layout
assets/style.css           design
assets/app.js              builds the page from content/*.json
content/*.json             ALL text, links, numbers and publication lists
images/                    photos
scripts/sync_publications.py   weekly Google Scholar / OpenAlex sync
.github/workflows/         the weekly schedule
.pages.yml                 editor forms for Pages CMS
```
