import type { HttpHandlerFn } from "eridu-tech/http-router/contracts";
import { container } from "./container.js";

export class UsersController {
    getUser: HttpHandlerFn = ({ req, json }) => {
        const { id } = req.params();
        return json({ id });
    };
}

container.registerValue({
    token: UsersController,
    value: new UsersController(),
});

await container.init();
