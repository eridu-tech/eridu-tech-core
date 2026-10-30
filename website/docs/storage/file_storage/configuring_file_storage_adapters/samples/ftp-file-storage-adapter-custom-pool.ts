import {
    FtpFactory,
    FtpFileStorageAdapter,
} from "eridu-tech/file-storage/ftp-file-storage-adapter";
import { QueuePool } from "eridu-tech/generic-pool";

const ftpFileStorageAdapter = new FtpFileStorageAdapter({
    pool: new QueuePool(
        new FtpFactory({
            accessSettings: {
                host: "ftp.example.com",
                port: 21,
                user: "user",
                password: "password",
                secure: true,
            },
        }),
        {
            maxResources: 5,
            maxWaitSize: 100,
        },
    ),
});
