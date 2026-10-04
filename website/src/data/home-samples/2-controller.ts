import { z } from "zod";
import { HttpError, HttpHandlerFn } from "eridu-tech/http-router/contracts";
import { UserService } from "./3-service";

export class UserController {
    private static paramsSchema = z.object({ id: z.string().nonempty() });

    constructor(private readonly userService: UserService) {}

    get: HttpHandlerFn = async (args) => {
        const params = args.req.params(UserController.paramsSchema);
        const user = await this.userService.get(params.id);
        if (user === null) {
            throw HttpError.create({ message: "User not found", status: "404" });
        }
        return args.json(user).setStatus(200);
    };

    delete: HttpHandlerFn = async (args) => {
        const params = args.req.params(UserController.paramsSchema);
        await this.userService.delete(params.id);
        return args.json({ message: "User removed" }).setStatus(200);
    };
}
