# Demiurge Studio — Production Roadmap

From **local dev stack** → **Windows installer + CD-key activation**.

**Current baseline:** Local node, qor-auth, Hub, offline registration, CD-key backend, Studio auth UI.  
**Not yet done:** One-click start, project-per-chain, license UI gates, Windows installer.

---

## Phase 0 — Stabilize (2–4 weeks)

- [x] Studio branding and auth UI
- [x] CD-key licensing API
- [x] **`studio:start`** — one command starts full stack
- [x] Focused Hub navigation (hide WIP modules)
- [ ] CI smoke: build Hub + qor-auth

**Exit:** `npm run studio:start` → green health → Hub in browser.

---

## Phase 1 — Studio Core v0.1 (4–6 weeks)

- [x] `projects/<slug>/project.json` + `chain/` data dir
- [x] Active project file `projects/.studio/active-project.json`
- [x] Node reads active project's `chain/` directory
- [x] Hub **Projects** screen (new / open / recent)
- [x] CLI `demiurge studio project new|list|use`
- [ ] Economy + Items entry points from dashboard

**Exit:** New game → isolated chain → mint DRC-369 without manual copy-paste.

---

## Phase 2 — License gates (3–4 weeks)

- [x] `StudioLicenseProvider` in Hub
- [x] Feature matrix: Free / Creator / Pro / Enterprise
- [x] Gate routes: Create, Agents (nav + page-level upgrade screen)
- [x] Edition badge + upgrade CTA (header)
- [ ] Vendor key tool polish

**Exit:** Paid CD-key unlocks the right UI surfaces.

---

## Phase 3 — Creator loop (6–8 weeks)

- [ ] UE playtest preset per project
- [ ] Playtest reset (re-seed chain)
- [ ] Project export zip
- [ ] Seeded playtest QOR accounts
- [ ] Quarantine non-Studio Hub pages

**Exit:** Recordable demo: install → project → item → UE.

---

## Phase 4 — Windows-native runtime (6–10 weeks)

- [ ] Release binaries (node, qor-auth)
- [ ] Embedded Postgres + Redis (no WSL for users)
- [ ] Process supervisor + logs under `%ProgramData%\Demiurge`
- [ ] Clean Windows 11 VM test (no dev tools)

**Exit:** Non-developer machine runs Studio without WSL.

---

## Phase 5 — Licensing production (4–6 weeks)

- [ ] Vendor Key Generator (GUI/CLI `.exe`)
- [ ] Signed `.demiurge-license` offline activation (optional)
- [ ] Trial keys + revocation
- [ ] EULA / privacy docs

---

## Phase 6 — Installer (4–6 weeks)

- [ ] Inno Setup / WiX installer (signed)
- [ ] First-run wizard (account + optional CD-key + first project)
- [ ] Uninstaller + update channel

**Exit:** Friend installs from `.exe` only.

---

## Phase 7 — Beta (4–8 weeks)

- [ ] 10–30 creator beta
- [ ] Win 10/11 QA matrix
- [ ] Docs: quick start, UE, license recovery

---

## Phase 8 — Release 1.0

- [ ] Demiurge Studio 1.0 installer
- [ ] Gumroad / direct sales with CD-keys
- [ ] Free + Creator + Pro SKUs

---

## Now → Next 30 days

| Week | Focus |
|------|--------|
| 1–2 | Phase 0: `studio:start`, focused nav |
| 2–4 | Phase 1: projects + per-project chain |
| 4+ | Phase 2: license feature gates |

See [LICENSING.md](LICENSING.md) · [PROJECT_LAYOUT.md](PROJECT_LAYOUT.md) · [../DEMIURGE_STUDIO.md](../DEMIURGE_STUDIO.md)
