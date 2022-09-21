<script lang="ts">
	import { endAt,get,orderByKey,query,ref,startAt } from 'firebase/database';
	import { db } from '../Firebase';

	import {
	Button,Input,
	Label,
	Spinner,TableBodyCell,
	TableBodyRow
	} from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import ClientChooser from './ClientChooser.svelte';
	import Table from './searchTable/Table.svelte';
	import type { Order } from './utils/data';
	import { categoryNames,downloadCategories,type Product } from './utils/product';
	import { formatEuro } from './utils/util';

	onMount(async () => {
		products = (await get(ref(db, '/productInfos'))).val() ?? [];
		mounted = true;
	});

	let mounted = false;
	let products: Product[];
	let categoriesTotal: { [key: string]: number;} = {}; 
			
	let date: string = (() => {
		let currentDate = new Date(Date.now());
		let monthString = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1)
			.toString()
			.padStart(2, '0')}`;
		console.log(monthString);
		return monthString;
	})();
	$: orderLoading = (async () => {
		if (clientID && date) {
			let orderQuery = query(
				query(query(ref(db, `/orders/${clientID}`), orderByKey()), startAt(`${date}-01`)),
				endAt(`${date}-31`)
			);
			let newOrdersObject = (await get(orderQuery)).val() as { [key: string]: Order[] } ?? {};
			let combinedCategories: {
				[key: string]: number;
			} = {};
			for (const [key, orders] of Object.entries(newOrdersObject ?? {})) {
				for (const order of orders) {
					if (order.invalid) {
						if (Object.hasOwn(combinedCategories, order.product.Category)) {
							combinedCategories[order.product.Category] += order.UnitPrice * order.amount;
						} else {
							combinedCategories[order.product.Category] = order.UnitPrice * order.amount;
						}
					} else {
						let product = products[order.index];
						if (Object.hasOwn(combinedCategories, product.Category)) {
							combinedCategories[product.Category] += order.amount * order.UnitPrice;
						} else {
							combinedCategories[product.Category] = order.amount * order.UnitPrice;
						}
					}
				}
			}
			categoriesTotal = combinedCategories;
		}
	})();
	let clientID: string;
	let clientName: string;
</script>

{#if mounted}
	<div class="grid grid-cols-[auto_auto_1fr] gap-x-10 mb-5">
		<div />
		<Label>Monat</Label>
		<div />
		<ClientChooser bind:selectedClientID={clientID} bind:selectedClientName={clientName} />
		<Input type="month" placeholder="Monat" bind:value={date} />
	</div>
	{#if orderLoading}
		{#await orderLoading}
			<Spinner />
		{:then _}
			<div class="drop-shadow-md">
				<Table
					border={true}
					headerItems={categoryNames.map((val) => val.name)}
					hightLimited={false}
					bodyItems={[1]}
				>
					<svelte:fragment slot="row">
						<TableBodyRow>
							{#each Array.from(Array(10).keys()) as i}
                                <TableBodyCell>{formatEuro(categoriesTotal[i+1] ?? 0)}</TableBodyCell>
                            {/each}
						</TableBodyRow>
					</svelte:fragment>
					<div class="mt-0 flex justify-end" slot="footer">
						<Button
							disabled={categoriesTotal.length}
							on:click={() => downloadCategories(categoriesTotal, date, clientName)}
							>Herunterladen</Button
						>
					</div>
				</Table>
			</div>
		{/await}
	{/if}
{:else}
	<Spinner />
{/if}
