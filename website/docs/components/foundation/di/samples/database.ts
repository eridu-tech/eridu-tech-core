import type { IDatabase } from "./idatabase.js";

export class Database implements IDatabase {
    query(sql: string, params: Array<unknown>): Promise<unknown> {
        /* ... */
        return Promise.resolve();
    }

    connect(): Promise<void> {
        console.log("db connected");
        return Promise.resolve();
    }

    disconnect(): Promise<void> {
        console.log("db disconnected");
        return Promise.resolve();
    }
}
