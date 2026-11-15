# Hợp Âm Free for AI agents

An admin signs in once, and then a person or an AI agent can import chord pages and publish songs to [hopam.tyvn.online](https://hopam.tyvn.online). There are two ways to do it:

- **The `hopamfree` CLI**, which is in the site's repo.
- **The HTTP API** used with `curl`, which works from anywhere.

This page is also served as plain Markdown at [`/agents.md`](https://hopam.tyvn.online/agents.md), so an agent can fetch it directly.

## Workflow for an AI agent

To publish songs an admin asked for:

1. **Check the token.** Run `hopamfree whoami`, or call `GET /api/cli/whoami`. If it fails, ask the admin to sign in (see below). Never approve a sign-in code yourself.
2. **Check for duplicates.** For each song, search by title first, with `hopamfree search "<title>"` or `GET /api/songs?q=<title>`. Skip the song if it is already listed with the same artist.
3. **Import the page.** Run `hopamfree import "<link>" > song.json`, or call `POST /api/import`.
   - **409** means this link is already published; the response includes the slug. Skip it.
   - **422** means the page could not be fetched: private address, timeout, or not HTML. Try another source.
   - **502** means the AI could not read the page. Try another source, or write the draft yourself.
4. **Review the draft.** Nothing is published until you create it.
   - `unknownChords` must be empty. Fix or remove any chord the site cannot draw.
   - Title, artist, and key should match the source.
   - Keep `capo` only if the source states it; otherwise leave it `null`.
   - Remove ads, comments, and navigation text from `sheet`.
5. **Publish.** Run `hopamfree create song.json`, or call `POST /api/songs`.
   - **400** lists the fields that are invalid.
   - **409** means a duplicate.
6. **Report back.** Give the admin the published URLs.

Only publish songs the admin asked for, and respect the source site's terms and copyright.

## Song draft

The server validates every draft:

```json
{
  "title": "Nó",
  "artist": "Thắng",
  "composer": "",
  "key": "Am",
  "genre": "Pop",
  "rhythm": "Ballad",
  "sheet": "[Verse]\n[Am]Lời bài [F]hát...",
  "sourceUrl": "https://hopamchuan.com/song/70362/no/",
  "capo": { "fret": 3, "source": "sheet" }
}
```

- In `sheet`, put each chord in brackets right before the syllable it falls on. Put section headings such as `[Verse]` and `[Chorus]` on their own line. A sheet holds at most 20,000 characters.
- `key` must match `^[A-G][#b]?m?$`, for example `C`, `F#m` or `Bb`.
- `sourceUrl` is optional, and a song's `sourceUrl` can only be published once.
- `capo` is optional: the fret (0–11) a player clamps the capo on to sound like the recording with these chord shapes. Leave it `null` (or out) when you do not know it; never guess.
  - `{"fret": 3, "source": "sheet"}` when the source page or sheet states it ("Capo 3", "capo ngăn 3", "kẹp capo 2"). `import` fills it in this form when the page states one.
  - `{"fret": 3, "source": "editor"}`, or just `3`, when you or the admin set it yourselves.
  - `0` means "no capo". `"ai"` is not accepted here; AI estimates are only made by the site's own backfill and are labelled as such on the song page.

After a song is published, the site picks suitable strumming rhythms (điệu) for it in the background.

## The `hopamfree` CLI

The CLI needs Node 24 or newer. Run it from the repo root:

```sh
pnpm cli <command>        # or: node cli/hopamfree.mts <command>
```

The default site is `https://hopam.tyvn.online`. To use another one, pass `--url <base>` or set `HOPAMFREE_URL`, for example `http://localhost:3000`.

The CLI writes data as JSON to stdout and messages to stderr. It exits with 0 on success and 1 on error, and error messages include the HTTP status.

| Command | What it does |
| --- | --- |
| `login [--no-browser]` | Signs in as admin. Prints a code and opens `<site>/cli?code=...`. |
| `whoami` | Prints `{email, isAdmin}`. |
| `search [query]` | Searches published songs by title, artist, composer, or exact chord. No sign-in needed. |
| `import <link>` | Crawls the page and asks the AI to clean it into a draft. Prints `{draft, unknownChords}`. Takes about 30 s and publishes nothing. |
| `create <file\|->` | Publishes a draft and prints `{slug, path, url}`. Accepts the whole `import` output or a bare draft. |
| `logout` | Deletes the local token. It does not revoke the token; do that on `/cli`. |

Sign-in steps:

1. Run `pnpm cli login`.
2. Sign in on the page that opens with an admin account, and check that the code on the page matches the code in the terminal.
3. Click **Cho phép**.

The token is saved to `~/.config/hopamfree/config.json` with file mode 600.

## HTTP API

Base URL: `https://hopam.tyvn.online`. Every request and response body is JSON, and every error has the form `{"error": "..."}`.

### Sign in (device flow)

```sh
# 1. Start a sign-in. Keep deviceCode secret; show userCode and verificationUrl to the admin.
curl -s -X POST https://hopam.tyvn.online/api/cli/device \
  -H 'content-type: application/json' -d '{"clientName":"my agent"}'
# → {"deviceCode":"hafd_…","userCode":"ABCD-EFGH","verificationUrl":"https://hopam.tyvn.online/cli?code=ABCD-EFGH","expiresAt":"…","intervalSeconds":3}

# 2. The admin opens verificationUrl, signs in and clicks "Cho phép".

# 3. Poll every intervalSeconds until you get a token (it is returned only once).
curl -s -X POST https://hopam.tyvn.online/api/cli/token \
  -H 'content-type: application/json' -d '{"deviceCode":"hafd_…"}'
# 428 {"status":"pending"} → keep polling
# 200 {"token":"haf_…","email":"…"} → done
# 410 → the code expired (after 10 minutes); start again
```

Send the token as `Authorization: Bearer haf_…`. The admin can see and revoke tokens on `/cli`. Removing an email from the admin list also stops its tokens from working.

### Endpoints

| Method and path | Auth | Body | Response |
| --- | --- | --- | --- |
| `GET /api/cli/whoami` | token | – | `{email, isAdmin}` or 401 |
| `GET /api/songs?q=<query>` | none | – | `{songs: [{slug, title, artist, key, sourceUrl, path}]}`, at most 50 |
| `POST /api/import` | admin token | `{url}` | `{draft, unknownChords}`, or 409, 422 or 502 |
| `POST /api/songs` | admin token | a draft | 201 `{slug, path}`, or 400 or 409 |

```sh
TOKEN=haf_…
curl -s -X POST https://hopam.tyvn.online/api/import -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' -d '{"url":"https://example.com/some-song"}' > song.json
# Review and edit song.json, then publish its "draft" object:
jq .draft song.json | curl -s -X POST https://hopam.tyvn.online/api/songs -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' --data-binary @-
```
