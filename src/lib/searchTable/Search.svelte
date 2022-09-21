<script lang="ts">
	import { Dropdown, Iconinput } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import * as icons from 'svelte-heros';
	import { PostSearchTransformer, Search } from './search';

	interface $$Slots {
		results: { items: S[] };
	}

	type T = $$Generic;
	type S = $$Generic;
	type Q = $$Generic;

	export let items: T[];
	export let postTransformer: PostSearchTransformer;
	export let param: Q;
	export let keys: string[] = [];
	export let alternativeItems: S[];
	export let limit: number = 30;
	let id = 'tooltip';

	export let placeholder: string = '';
	let query = '';

	let search: Search<T, S, Q>;

	onMount(() => {
		mounted = true;
	});

	let mounted = false;

	$: {
		(async () => {
			if (mounted) {
				let newSearch = new Search<T, S, Q>();
				newSearch.init(items, postTransformer, keys);
				search = newSearch;
			}
		})();
	}

	let searchResults: S[] = [];

	$: {
		(async () => {
			if (search && query) {
				searchResults = await search.search(query, param);
			}
		})();
	}

	export let dropdownOpen = false;

	$: searchDisplay = (() => {
		if (query) {
			return searchResults.slice(0, limit + 1);
		} else {
			return alternativeItems;
		}
	})();

	let inputContainer: HTMLElement;

	$: {
		if(inputContainer) {
			let input = inputContainer.getElementsByTagName('input')[0];
			if(input && document.activeElement == input) {
				dropdownOpen = true;
			}
		}
	}
</script>

<Dropdown bind:open={dropdownOpen} triggeredBy="#mytrigger">
	<div id="mytrigger" slot="trigger" bind:this={inputContainer}>
		<Iconinput
			noBorder
			icon={icons.Search}
			autocomplete="off"
			iconClass="h-5 w-5 mr-2 dark:text-green-500"
			{placeholder}
			class="p-4"
			style="outlined"
			type="search"
			label={placeholder}
			bind:value={query}
			btnClass="hidden"
			on:click={() => (dropdownOpen = true)}
		/>
	</div>

	<div slot="content">
		<slot name="results" items={searchDisplay} />
	</div>
</Dropdown>
