<script lang="ts">
	import { get, ref } from 'firebase/database';

	import { Dropdown, DropdownItem, Spinner } from 'flowbite-svelte';
	import { db } from '..//Firebase';
	import { onMount } from 'svelte';

	onMount(async () => {
		let data = (await get(ref(db, '/userInfos'))).val();
		items = Array.from(Object.entries(data) ?? []);
	});

	$: label = selectedClientName ?? 'Außenstelle';

	let items: [string, string][];

	export let selectedClientID: string = undefined;
	export let selectedClientName: string = undefined;

	const onClick = (index: number) => {
		selectedClientID = items[index][0];
		selectedClientName = items[index][1];
		open = false;
	};

	let open = false;
</script>

<Dropdown {label} bind:open>
	{#if items}
		{#each items as item, i}
			<div class="contents" on:click={() => onClick(i)}><DropdownItem>{item[1]}</DropdownItem></div>
		{/each}
	{:else}
		<DropdownItem><Spinner /></DropdownItem>
	{/if}
</Dropdown>
