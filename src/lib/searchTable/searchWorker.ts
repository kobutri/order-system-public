import Fuse from 'fuse.js';
import * as comlink from 'comlink';
import type { PostSearchTransformer, SearchResult } from './search';
import type { SupplierDisplay } from '$lib/utils/data';
import type { Product } from '$lib/utils/product';

export class SearchWorker<T> {
	fuse: Fuse<T>;
	initialized = false;

	async init(items: T[], keys?: string[]) {
		this.fuse = new Fuse(items, {
			includeScore: true,
			threshold: 0.2,
			fieldNormWeight: 0.3,
			includeMatches: true,
			findAllMatches: false,
			keys: keys,
			minMatchCharLength: 2
		});
	}

	searchItem<S, Q>(query: string, postTransformer: PostSearchTransformer, param: Q): S[] {
		const searchResults = this.fuse.search(query);
		return postSearchTransformers[postTransformer as string](
			searchResults as SearchResult<any>[],
			param
		);
	}
}

comlink.expose(SearchWorker);

const postSearchTransformers = {
	items: (results: SearchResult<any>[], param: unknown) => {
		return results.map((res) => res.item);
	},
	products: (results: SearchResult<Product>[], param: { selectedSuppliers?: Set<string> }) => {
		let ret = results;
		if (param.selectedSuppliers) {
			ret = results.filter((result) => {
				return param.selectedSuppliers.has(result.item.Supplier);
			});
		}
		return ret.map((result) => {
			const item = result.item;
			if (result.matches) {
				result.matches.forEach((match) => {
					const newVal = highlight(match.indices, match.value);
					if (match.key.includes('InternalName')) {
						item.InternalName = newVal;
					} else if (match.key.includes('SupplierName')) {
						item.SupplierName = newVal;
					}
				});
			}
			return item;
		});
	},
	suppliers: (results: SearchResult<string>[], param: unknown) => {
		return results
			.filter((val) => val.matches)
			.map((val) => ({
				name: val.matches[0].value,
				display: highlight(val.matches[0].indices, val.matches[0].value)
			})) as SupplierDisplay[];
	}
};

function highlight(indices: ReadonlyArray<Fuse.RangeTuple>, val: string): string {
	let newVal = val.substring(0, indices[0][0]);
	for (let i = 0; i < indices.length; i++) {
		newVal += `<span class="bg-sky-800  whitespace-pre">${val.substring(
			indices[i][0],
			indices[i][1] + 1
		)}</span>`;
		if (i === indices.length - 1) {
			newVal += `<span class="whitespace-pre">${val.substring(
				indices[i][1] + 1,
				val.length
			)}</span>`;
		} else {
			newVal += `<span class="whitespace-pre">${val.substring(
				indices[i][1] + 1,
				indices[i + 1][0]
			)}</span>`;
		}
	}
	return newVal;
}
