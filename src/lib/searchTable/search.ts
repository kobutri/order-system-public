import * as comlink from 'comlink';
import type Fuse from 'fuse.js';
import type { SearchWorker } from './searchWorker'

let worker: Worker;
let workerLink: comlink.Remote<typeof SearchWorker>;

export class Search<T, S, Q> {
    searchWorker: comlink.Remote<SearchWorker<T>>;
    postTransformer: PostSearchTransformer
    initialized = false;

    async init(items: T[], postTransformer: PostSearchTransformer, keys?: string[]) {
        if (!worker) {
            worker = new Worker(new URL('./searchWorker.ts', import.meta.url), {
                type: 'module'
            });
        }
        if (!workerLink) {
            workerLink = comlink.wrap(worker);
        }

        this.postTransformer = postTransformer;
        this.searchWorker = await new workerLink() as comlink.Remote<SearchWorker<T>>;
        await this.searchWorker.init(items, keys)
        this.initialized = true;
    }

    async search(query: string, param: Q): Promise<S[]> {
        return (await this.searchWorker.searchItem(query, this.postTransformer, param)) as S[];
    }
}

export type SearchResult<T> = Fuse.FuseResult<T>;

export enum PostSearchTransformer {
    products = "products",
    suppliers = 'suppliers',
    items = 'items'
};