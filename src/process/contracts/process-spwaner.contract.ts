/**
 * @module Process
 */
import type { ByteStream, Bytes, Sink } from "@/utilities/_module-exports.js";

/**
 * Describes the process to spawn.
 *
 * IMPORT_PATH: `"eridu-tech/process/contracts"`
 * @group Contracts
 */
export type SpawnArgs = {
    /**
     * Executable to run. The process is spawned without a shell, so shell
     * built-ins and shell operators (`&&`, pipes, redirections) are not available.
     * On Windows, `.bat` and `.cmd` files must be run through `cmd.exe`.
     */
    command: string;

    /**
     * Arguments passed verbatim to the executable.
     * The array is copied when the process is spawned, so later mutations by the
     * caller do not affect the running process or the values reported by
     * `IRunningProcess.args()`.
     */
    args: Array<string>;

    /**
     * Environment variables of the child process.
     *
     * When provided it replaces the inherited environment entirely, it is not
     * merged with `process.env`. Spread the parent environment to extend it:
     * `{ ...process.env, NODE_ENV: "production" }`.
     *
     * When omitted the child process inherits `process.env`.
     */
    env?: Record<string, string>;

    /**
     * Working directory of the child process.
     * Defaults to the current working directory of the parent process.
     */
    cwd?: string;
};

/**
 * Describes how a process ended.
 *
 * IMPORT_PATH: `"eridu-tech/process/contracts"`
 * @group Contracts
 */
export type ProcessExit = {
    /**
     * Exit code reported by the process, or `null` when the process was
     * terminated by a signal.
     */
    code: number | null;

    /**
     * Name of the signal that terminated the process, or `null` when the process
     * exited on its own.
     */
    signal: string | null;
};

/**
 * IMPORT_PATH: `"eridu-tech/process/contracts"`
 * @group Contracts
 */
export type IRunningProcess = {
    getInputStream(): Sink<Bytes>;

    getOutputStream(): ByteStream;

    getErrorStream(): ByteStream;

    waitForClosing(): Promise<ProcessExit>;

    close(): Promise<ProcessExit>;

    args(): Promise<Array<string>>;
};

/**
 * IMPORT_PATH: `"eridu-tech/process/contracts"`
 * @group Contracts
 */
export type IProcessSpawner = {
    spawn(spec: SpawnArgs): Promise<IRunningProcess>;
};
