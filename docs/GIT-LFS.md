# Git LFS

We gebruiken Git LFS om grote data-bestanden uit de repository-geschiedenis te houden. Dit voorkomt trage clones en keeps de Git-history licht.

## Wat staat er nu in LFS

De huidige LFS-regels staan in `.gitattributes`:

- `embuild-analyses/public/data/**/*.json` (publieke, gechunkte JSON-data)
- `embuild-analyses/analyses/**/results/*.json` (grote analyse-output)
- `embuild-analyses/public/maps/*.json` (GeoJSON kaarten)

## Gebruik

Installeer en activeer LFS (eenmalig per machine):

```sh
git lfs install
```

LFS-bestanden binnenhalen na een clone:

```sh
git lfs pull
```

LFS-status controleren:

```sh
git lfs ls-files
```

## Nieuwe LFS-regels toevoegen

1. Voeg een pattern toe in `.gitattributes`.
2. Commit `.gitattributes`.
3. Voeg de bestanden opnieuw toe zodat ze door LFS worden opgepakt:

```sh
git add path/to/file
```

Tip: als je bestaande, grote bestanden naar LFS wil migreren, overleg even, zodat we een gecontroleerde rewrite kunnen doen.
