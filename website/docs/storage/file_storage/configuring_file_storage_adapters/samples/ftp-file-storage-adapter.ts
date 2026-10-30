import {
    FtpFileStorageAdapter,
    ftpPool,
} from "eridu-tech/file-storage/ftp-file-storage-adapter";

const ftpFileStorageAdapter = new FtpFileStorageAdapter({
    pool: ftpPool({
        accessSettings: {
            host: "ftp.example.com",
            port: 21,
            user: "user",
            password: "password",
            // Use FTPS over TLS
            secure: true,
        },
    }),
});
