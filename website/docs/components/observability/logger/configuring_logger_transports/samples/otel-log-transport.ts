import { logs } from "@opentelemetry/api";
import { OtelLogTransport } from "eridu-tech/log/otel-log-transport";

export const otelLogTransport = new OtelLogTransport({
    log: logs.getLogger("my-service"),
});
