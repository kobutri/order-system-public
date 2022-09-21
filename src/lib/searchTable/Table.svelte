<script lang="ts">
	import { Table, TableBody, TableHead, TableHeadCell } from 'flowbite-svelte';

	interface $$Slots {
		header: { items: string[] };
		row: { item: S };
		footer: { item: number };
		customRows: {};
	}

	type S = $$Generic;

	export let headerItems: string[] = [];
	export let bodyItems: S[];
	export let border: boolean = false;
	export let hoverable: boolean = false;
	export let hightLimited = true;
</script>

<div class="space-y-1  py-1 ">
	<div class="overflow-y-auto ${hightLimited ? ' max-h-72' : ''}">
		<Table {hoverable} noboarder={!border}>
			<slot name="header" items={headerItems}>
				<TableHead>
					{#each headerItems as item}
						<TableHeadCell>{item}</TableHeadCell>
					{/each}
				</TableHead>
			</slot>
			<TableBody>
				{#each bodyItems as item}
					<slot name="row" {item} />
				{/each}
				<slot name="customRows" />
			</TableBody>
		</Table>
	</div>
	<slot name="footer" item={1} />
</div>
