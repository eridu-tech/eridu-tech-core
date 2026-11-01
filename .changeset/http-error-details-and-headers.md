---
"eridu-tech": minor
---

`HttpError` now exposes arbitrary error data as `details` instead of `payload`, and accepts optional `headers` that the router applies to the error response:

- `HttpErrorSettings.payload` was renamed to `HttpErrorSettings.details`.
- `HttpError.payload` was renamed to `HttpError.details`.
- New `HttpErrorSettings.headers` setting, exposed as `HttpError.headers` (for example `{ "Retry-After": "30" }`).
- `HttpRouter` still serializes `details` as `payload` in the JSON error body, and now applies `HttpError.headers` to the response.
- Request body validation errors from `HttpReq` now attach the validation issues through `details`.
