---
"eridu-tech": minor
---

Renamed the serde errors to use the `UnableTo` prefix:

- `SerializationSerdeError` to `UnableToSerializeSerdeError`
- `DeserializationSerdeError` to `UnableToDeserializeSerdeError`

The `SERDE_ERRORS` fields were renamed to match:

- `SERDE_ERRORS.Serialization` to `SERDE_ERRORS.UnableToSerialize`
- `SERDE_ERRORS.Deserialization` to `SERDE_ERRORS.UnableToDeserialize`

`isSerdeError()` keeps its name and now references the renamed classes.
