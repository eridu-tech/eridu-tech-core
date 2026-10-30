import { Base64Codec } from "eridu-tech/codec/base-64-codec";
import {
    FtpFileStorageAdapter,
    PATH_TYPE,
    ftpPool,
} from "eridu-tech/file-storage/ftp-file-storage-adapter";

const ftpFileStorageAdapter = new FtpFileStorageAdapter({
    pool: ftpPool({
        // How the connection is opened and logged in
        accessSettings: {
            host: "ftp.example.com",
            port: 21,
            user: "user",
            password: "password",
            secure: true,
        },
        // Client-level options
        clientSettings: {
            allowSeparateTransferHost: false,
        },
        // Socket timeout in milliseconds, 0 disables it
        timeout: 30_000,
    }),

    // Writable root folder within the FTP user's chroot
    location: "/uploads",
    delimiter: "/",
    codec: new Base64Codec(),
    pathType: PATH_TYPE.POSIX,
});
