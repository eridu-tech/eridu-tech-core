import {
    SftpFactory,
    SftpFileStorageAdapter,
} from "eridu-tech/file-storage/sftp-file-storage-adapter";
import { QueuePool } from "eridu-tech/generic-pool";

const sftpFileStorageAdapter = new SftpFileStorageAdapter({
    pool: new QueuePool(
        new SftpFactory({
            connectionSettings: {
                host: "sftp.example.com",
                port: 22,
                username: "user",
                password: "password",
            },
        }),
        {
            maxResources: 5,
            maxWaitSize: 100,
        },
    ),
});
