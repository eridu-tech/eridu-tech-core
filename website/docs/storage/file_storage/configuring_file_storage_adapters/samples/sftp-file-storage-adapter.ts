import {
    SftpFileStorageAdapter,
    sftpPool,
} from "eridu-tech/file-storage/sftp-file-storage-adapter";

const sftpFileStorageAdapter = new SftpFileStorageAdapter({
    pool: sftpPool({
        connectionSettings: {
            host: "sftp.example.com",
            port: 22,
            username: "user",
            password: "password",
        },
    }),
});
