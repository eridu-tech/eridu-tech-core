export class RequestHandler {
    constructor(private requestId: string) {
        /* ... */
    }

    handle(): void {
        console.log(`Handling request: ${this.requestId}`);
    }
}
