# Trade-in pricing JSON

In Shop Admin > Trade-in > Products, **Export all pricing JSON** downloads every product's rules. The pricing editor also exports one product. Both files use the same format:

```json
{
  "format": "zezva-trade-in-pricing",
  "version": 1,
  "products": [
    {
      "id": 123,
      "slug": "brand-phone/model",
      "name": "Model",
      "tree_json": [
        {
          "name": "Conditions",
          "enabled": true,
          "questions": [
            {
              "text": "What is the condition?",
              "text_ka": "რა მდგომარეობაშია?",
              "label": "condition",
              "type": 0,
              "enabled": true,
              "answers": [
                {
                  "text": "Good",
                  "text_ka": "კარგი",
                  "tooltip": "Minor wear",
                  "tooltip_ka": "მცირე ცვეთა",
                  "value": 500,
                  "value_enabled": 1,
                  "result": 2,
                  "go_to": "2,1"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

`text` is English; optional `text_ka` overrides the Georgian display text. `label` is a machine key used by the valuation UI, so change it only when changing that behavior intentionally. `type: 0` selects one answer; `type: 1` selects multiple. `enabled: false` hides a section or question without changing numbered references. `value_enabled: 0` hides an answer.

Answer `value` is a GEL amount. `result` controls the next step: `0` finish, `1` next question in the same section, `2` jump to `go_to`, `3` manual assessment, `4` set the current price and finish. `go_to` is 1-based `section,question`, for example `2,1`. Adding sections or questions at the end preserves existing references; reordering them requires updating every affected `go_to`.

Import updates existing products only, matched by both ID and slug. It processes validated batches and stops on the first failed batch. Earlier batches remain saved, and importing the same file again is safe. Export a backup before changing many rules. The separate **Replace selected rules** action copies one product's entire tree to selected products in batches of 100; it does not merge individual answer prices. If a later batch fails, earlier batches remain saved.
