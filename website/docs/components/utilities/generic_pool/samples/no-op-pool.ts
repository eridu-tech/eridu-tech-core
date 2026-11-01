import { NoOpPool } from "eridu-tech/generic-pool";
import SftpClient from "ssh2-sftp-client";

const client = new SftpClient("shared-sftp-connection");
await client.connect({
    host: "sftp.example.com",
    port: 22,
    username: "user",
    password: "password",
});

const sftpPool = new NoOpPool({
    client,
    destroy: async (sftpClient) => {
        await sftpClient.end();
    },
});

const first = await sftpPool.acquireOrFail();
const second = await sftpPool.acquireOrFail();

// logs true, every caller receives the same connection
console.log(first === second);

await sftpPool.close();
