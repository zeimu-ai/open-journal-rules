# Contributing

## Adding Rules

1. **Source URL required**: Every rule must reference an official document (NTA, etc.)
2. **JSON format**: Follow the existing format in `rules/journal-rules.json`
3. **Add tests**: Add test cases in `tests/rules.test.ts`

## Rule Format

```json
{
  "id": "rule-29",
  "name": "Rule name",
  "patterns": ["keyword1", "keyword2"],
  "matchType": "partial",
  "accountName": "Account name",
  "taxCategory": "Tax category",
  "confidence": 0.90,
  "sourceUrl": "https://...",
  "notes": ""
}
```

## Rules without sources will not be accepted

"This is how it's generally done" is not sufficient. Please always include a URL to an official document.
