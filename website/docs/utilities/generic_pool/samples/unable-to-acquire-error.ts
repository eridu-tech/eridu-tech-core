import { QueuePool } from "eridu-tech/generic-pool";
import { UnableToAcquireError } from "eridu-tech/generic-pool/contracts";
import SftpClient from "ssh2-sftp-client";

const sftpPool = new QueuePool<SftpClient>(
    {
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
    },
    {
        maxResources: 1,
        maxWaitSize: 0,
    },
);

const client = await sftpPool.acquireOrFail();

try {
    // The only connection is borrowed and no caller is allowed to wait.
    await sftpPool.acquireOrFail();
} catch (error) {
    // logs true
    console.log(error instanceof UnableToAcquireError);
}

await sftpPool.release(client);
