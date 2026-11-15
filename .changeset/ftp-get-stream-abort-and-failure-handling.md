---
"eridu-tech": patch
---

`FtpFileStorageAdapter.getStream` no longer produces unhandled rejections when a download is aborted, and a failed download now fails the read instead of quietly ending it.

- Stopping a download early is now a normal end of the read: it no longer leaves an unhandled rejection behind, so it can no longer crash the server.
- When a download fails for any other reason, the consumer's `for await` throws instead of handing back a truncated file.
- The pooled client is returned exactly once when the stream ends, and the return completes before the read is reported as finished.
- `getStream` still resolves as soon as the existence check completes; it does not wait for the download to finish.
