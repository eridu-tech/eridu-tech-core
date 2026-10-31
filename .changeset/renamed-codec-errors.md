---
"eridu-tech": minor
---

Renamed the codec errors to use the `UnableTo` prefix:

- `EncodingError` to `UnableToEncodeCodecError`
- `DecodingError` to `UnableToDecodeCodecError`

The `CODEC_ERRORS` fields were renamed to match:

- `CODEC_ERRORS.Encoding` to `CODEC_ERRORS.UnableToEncode`
- `CODEC_ERRORS.Decoding` to `CODEC_ERRORS.UnableToDecode`

`isCodecError()` keeps its name and now references the renamed classes.
