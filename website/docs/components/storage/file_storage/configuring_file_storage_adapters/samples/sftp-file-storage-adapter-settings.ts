import { Base64Codec } from "eridu-tech/codec/base-64-codec";
import {
    PATH_TYPE,
    SftpFileStorageAdapter,
    sftpPool,
} from "eridu-tech/file-storage/sftp-file-storage-adapter";

const sftpFileStorageAdapter = new SftpFileStorageAdapter({
    pool: sftpPool({
        // Forwarded to client.connect()
        connectionSettings: {
            host: "sftp.example.com",
            port: 22,
            username: "user",
            password: "password",
            retries: 3,
        },
    }),

    // Writable root folder within the SFTP user's chroot
    location: "/uploads",
    delimiter: "/",
    codec: new Base64Codec(),
    pathType: PATH_TYPE.POSIX,
});
