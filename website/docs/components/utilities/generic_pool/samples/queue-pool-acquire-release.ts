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
});

const client = await sftpPool.acquireOrFail();

try {
    await client.put("./report.pdf", "/uploads/report.pdf");
} finally {
    await sftpPool.release(client);
}
