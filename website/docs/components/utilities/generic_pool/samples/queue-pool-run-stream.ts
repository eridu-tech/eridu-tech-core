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

// The client stays out of the pool until this stream is drained, stopped early or fails.
const fileStream = await sftpPool.runStream({
    stream: client.createReadStream("/uploads/report.pdf"),
    client,
});

for await (const chunk of fileStream) {
    process.stdout.write(chunk);
}
