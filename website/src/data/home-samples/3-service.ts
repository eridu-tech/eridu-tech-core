import { ITransactionConnection } from "eridu-tech/transaction-context/contracts";
import { Kysely } from "kysely";
import { Tables, User } from "./tables";

export class UserService {
    constructor(
        private readonly kysely: ITransactionConnection<Kysely<Tables>>,
    ) {}

    async get(userId: string): Promise<User | null> {
        const user = await this.kysely.current
            .selectFrom("user")
            .where("user.id", "=", userId)
            .select(["user.id", "user.name", "user.age"])
            .executeTakeFirst();
        return user ?? null;
    }

    async delete(userId: string): Promise<void> {
        await this.kysely.current
            .deleteFrom("user")
            .where("user.id", "=", userId)
            .execute();
    }
}
