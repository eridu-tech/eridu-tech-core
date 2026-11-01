import { QueuePool } from "eridu-tech/generic-pool";
import SftpClient from "ssh2-sftp-client";

const sftpPool = new QueuePool<SftpClient>({
    create: async () => {
        const client = new SftpClient("sftp-connection");
        await client.connect({
            host: "sftp.example.com",
            port: 22,
            username: "user",
            password: "password",
        });
        return client;
    },
    destroy: async (client) => {
        await client.end();
    },
    // A connection that no longer responds is ended and replaced.
    validate: async (client) => {
        try {
            await client.cwd();
            return true;
        } catch {
            return false;
        }
    },
});
