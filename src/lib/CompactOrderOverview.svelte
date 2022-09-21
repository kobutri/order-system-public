<script lang="ts">
	import { Button, Heading, Spinner, TableBodyCell } from 'flowbite-svelte';
	import { DateInput, localeFromDateFnsLocale } from 'date-picker-svelte';
	import ClientChooser from './ClientChooser.svelte';
	import { get, ref } from 'firebase/database';
	import { db } from '../Firebase';
	import type { Order } from './utils/data';
	import { onMount } from 'svelte';
	import Table from './searchTable/Table.svelte';
	import TableBodyRow from 'flowbite-svelte/tables/TableBodyRow.svelte';
	import TooltipCell from './productSelector/TooltipCell.svelte';
	import { downloadOrdersCompact, type Product } from './utils/product';

	onMount(async () => {
		products = (await get(ref(db, '/productInfos'))).val() ?? [];
		mounted = true;
	});

	let mounted = false;
	let products: Product[];
	let date = new Date(Date.now());
	let orders: Order[] = [];
	let entryName = '';
	$: orderLoading = (async () => {
		if (date && clientID) {
			entryName = `${date.getFullYear()}-${(date.getMonth() + 1)
				.toString()
				.padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
			let newOrders = (
				await get(ref(db, `/orders/${clientID}/${entryName}`))
			).val() as Order[];
			orders = newOrders ?? [];
		}
	})();
	let clientID: string;
	let clientName: string;

	$: orderProducts = orders.map((order) => {
		let newOrder = order;
		if (!order.invalid) {
			newOrder.product = products[order.index];
		}
		return newOrder;
	});
</script>

{#if mounted}
	<div class="flex gap-10 mb-5 align-bottom">
		<ClientChooser bind:selectedClientID={clientID} bind:selectedClientName={clientName} />
		<DateInput bind:value={date} format="yyyy-MM-dd" />
	</div>
	{#if orderLoading}
		{#await orderLoading}
			<Spinner />
		{:then _}
			<div class="max-w-5xl drop-shadow-md border-1">
                <Table
				border={true}
				headerItems={[
					'interne Bezeichnung',
					'Lieferantenbezeichnung',
					'Einheit',
					'Menge',
				]}
				hightLimited={false}
				bodyItems={orderProducts}
			>
				<svelte:fragment slot="row" let:item>
					<TableBodyRow>
						<TooltipCell>{item.product.InternalName}</TooltipCell>
						<TooltipCell>{item.product.SupplierName}</TooltipCell>
						<TableBodyCell>{item.product.ContainerUnit}</TableBodyCell>
						<TableBodyCell>{(Math.round(item.amount * 1000) / 1000).toLocaleString()}</TableBodyCell>
					</TableBodyRow>
				</svelte:fragment>
                <div class="mt-0 flex justify-end" slot="footer">
					<Button disabled={orderProducts.length == 0} on:click={() => downloadOrdersCompact(orderProducts, entryName, clientName)}>Herunterladen</Button>
				</div>
			</Table>
            </div>
		{/await}
	{/if}
{:else}
	<Spinner />
{/if}

<style>
	:root {
		--date-picker-background: #1b1e27;
		--date-picker-foreground: #f7f7f7;
	}
</style>
