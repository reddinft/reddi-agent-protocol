# Provider catalog

> Reference for searching, listing, installing, probing, and validating pay-skills providers.

`pay skills` manages provider discovery and registry authoring workflows.

## Agent summary

- Search with task language.
- Use `endpoints` to inspect a selected provider resource.
- Use `probe` and `validate` for provider PRs.
- Do not install arbitrary provider sources unless the user asks.

## Discovery

```sh
pay skills search "gemini"
pay skills search "translate text" --category translation --json
pay skills endpoints google/translate translateText
pay skills list
pay skills update
```

## Sources

```sh
pay skills add org/catalog
pay skills remove org/catalog
pay install org/catalog
```

`pay install` is shorthand for adding a provider source.

## Registry authoring

```sh
pay skills build . --output dist
pay skills probe . --files providers/<operator>/<name>.md
pay skills validate . --files providers/<operator>/<name>.md
pay skills provider sync providers/google/*.yml --operator solana-foundation
```
