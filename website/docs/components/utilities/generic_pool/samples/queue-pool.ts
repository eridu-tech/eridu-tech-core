import { QueuePool } from "eridu-tech/generic-pool";
import SftpClient from "ssh2-sftp-client";

const connectionFactory = {
    create: async (): Promise<SftpClient> => {
        const client = new SftpClient("sftp-connection");
        await client.connect({
            host: "sftp.example.com",
            port: 22,
            username: "user",
            password: "password",
        });
        return client;
    },
    destroy: async (client: SftpClient): Promise<void> => {
        await client.end();
    },
};

const sftpPool = new QueuePool(connectionFactory);

const fileNames = await sftpPool.run(async (client) => {
    const files = await client.list("/uploads");
    return files.map((file) => file.name);
});

console.log(fileNames);
