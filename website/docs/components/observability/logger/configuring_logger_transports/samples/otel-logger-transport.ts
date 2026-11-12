import { logs } from "@opentelemetry/api";
import { OtelLoggerTransport } from "eridu-tech/logger/otel-logger-transport";

export const otelLoggerTransport = new OtelLoggerTransport({
    logger: logs.getLogger("my-service"),
});
