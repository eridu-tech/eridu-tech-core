export interface ILog {
    log(message: string): void;
}

export class Log implements ILog {
    log(message: string): void {
        /* ... */
    }
}

export class ConsoleLog implements ILog {
    log(message: string): void {
        /* ... */
    }
}

export class FileLog implements ILog {
    log(message: string): void {
        /* ... */
    }
}
