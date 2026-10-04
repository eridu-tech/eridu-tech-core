import { Container } from "eridu-tech/di";
import { executionContext } from "./execution-context";

export const container = new Container({
    executionContext,
});
