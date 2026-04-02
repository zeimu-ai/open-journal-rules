# Open Journal Rules

Open-source Japanese accounting journal entry rules dataset.

## What's included

| File | Description | Count |
|------|-------------|-------|
| `rules/journal-rules.json` | Description pattern to account mapping | 28 rules |
| `rules/account-master.json` | Account items master (NTA blue return) | 28 accounts |
| `rules/tax-categories.json` | Consumption tax category mapping | 17 entries |
| `rules/amount-thresholds.json` | Amount-based classification rules | 5 thresholds |

## Data License

Rule data (`rules/`) is licensed under [CC BY 4.0](LICENSE).
Code (`tests/`, scripts) is licensed under [MIT](LICENSE-CODE).

## Sources

All rules are based on official Japanese National Tax Agency (NTA) documents. See [docs/sources.md](docs/sources.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Every rule must include a source URL.

[README.ja.md](README.ja.md)
