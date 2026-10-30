import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";

const adapter = new MemoryFileStorageAdapter();

await adapter.getBytes("uploads/report.pdf");
// -> retrieves "uploads/report.pdf"
