import { PluginFn } from "eridu-tech/middleware/contracts";
import { withCache, withInvalidation } from "./eridu/_module";
import { UserService } from "./3-service";

export const enhanceUserService: PluginFn<UserService> = (
    userService,
    enhance,
) => {
    enhance(userService, "get", [
        withCache({
            key: ([userId]) => userId,
        }),
    ]);
    enhance(userService, "delete", [
        withInvalidation({
            key: ([userId]) => userId,
        }),
    ]);
};
