import { QueuePool } from "eridu-tech/generic-pool";
import { UnableToAcquireError } from "eridu-tech/generic-pool/contracts";
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

// Ends the idle connections, waiting callers are rejected.
await sftpPool.close();

// Later acquisitions are rejected too.
try {
    await sftpPool.acquireOrFail();
} catch (error) {
    console.log(error instanceof UnableToAcquireError);
}

// The borrowed connection is ended when it is released.
await sftpPool.release(client);
