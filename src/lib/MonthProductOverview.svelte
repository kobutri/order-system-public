<script lang="ts">
	import { endAt, get, orderByKey, orderByValue, query, ref, startAt } from 'firebase/database';
	import { db } from '../Firebase';

	import { onMount } from 'svelte';
	import type { Order } from './utils/data';
	import { categoryNames, downloadOrdersTotal, type Product } from './utils/product';
	import ClientChooser from './ClientChooser.svelte';
	import {
		Button,
		Heading,
		Input,
		Label,
		Spinner,
		TableBodyCell,
		TableBodyRow
	} from 'flowbite-svelte';
	import Table from './searchTable/Table.svelte';
	import TooltipCell from './productSelector/TooltipCell.svelte';
	import { formatEuro } from './utils/util';

	onMount(async () => {
		products = (await get(ref(db, '/productInfos'))).val() ?? [];
		mounted = true;
	});

	let mounted = false;
	let products: Product[];
	let totalOrders: {
		totalValue: number;
		totalAmount: number;
		order: Order;
	}[] = [];
	let date: string = (() => {
		let currentDate = new Date(Date.now());
		let monthString = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1)
			.toString()
			.padStart(2, '0')}`;
		return monthString;
	})();
	$: orderLoading = (async () => {
		if (clientID && date) {
			let orderQuery = query(
				query(query(ref(db, `/orders/${clientID}`), orderByKey()), startAt(`${date}-01`)),
				endAt(`${date}-31`)
			);
			let newOrdersObject = (await get(orderQuery)).val() as { [key: string]: Order[] } ?? {};
			let combinedOrderObject: {
				[key: string]: {
					totalValue: number;
					order: Order;
					totalAmount: number;
				};
			} = {};
			for (const [key, orders] of Object.entries(newOrdersObject ?? {})) {
				for (const order of orders) {
					if (order.invalid) {
						let id = `${order.product.SupplierProductNumber}-${order.product.Supplier}`;
						if (Object.hasOwn(combinedOrderObject, id)) {
							combinedOrderObject[id].totalValue += order.UnitPrice * order.amount;
							combinedOrderObject[id].totalAmount += order.amount;
						} else {
							combinedOrderObject[id] = {
								totalValue: order.UnitPrice * order.amount,
								order: order,
								totalAmount: order.amount
							};
						}
					} else {
						let product = products[order.index];
						let productOrder = order;
						productOrder.product = product;
						if (Object.hasOwn(combinedOrderObject, order.index)) {
							combinedOrderObject[order.index].totalValue += order.amount * order.UnitPrice;
							combinedOrderObject[order.index].totalAmount += order.amount;
						} else {
							combinedOrderObject[order.index] = {
								totalValue: order.amount * order.UnitPrice,
								order: productOrder,
								totalAmount: order.amount
							};
						}
					}
				}
			}
			totalOrders = Array.from(Object.values(combinedOrderObject));
		}
	})();
	let clientID: string;
	let clientName: string;

	$: totalPrice = (() => {
		let total = 0;
		totalOrders.forEach((val) => {
			total += val.totalValue;
		});
		return total;
	})();
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
					headerItems={[
						'Lieferantennummer',
						'MBS5 Nummer',
						'interne Bezeichnung',
						'Lieferantenbezeichnung',
						'Gebindegröße',
						'Menge',
						'Einheit',
						'Durchschnittsstückpreis',
						'Gesamtpreis',
						'Lieferant',
						'Kategorie'
					]}
					hightLimited={false}
					bodyItems={totalOrders}
				>
					<svelte:fragment slot="row" let:item>
						<TableBodyRow>
							<TableBodyCell>{item.order.product.SupplierProductNumber}</TableBodyCell>
							<TableBodyCell>{item.order.product.InternalProductNumber}</TableBodyCell>
							<TooltipCell>{item.order.product.InternalName}</TooltipCell>
							<TooltipCell>{item.order.product.SupplierName}</TooltipCell>
							<TableBodyCell>{item.order.product.ContainerSize.toLocaleString()}</TableBodyCell>
							<TableBodyCell>{(Math.round(item.totalAmount * 1000) / 1000).toLocaleString()}</TableBodyCell>
							<TableBodyCell>{item.order.product.ContainerUnit}</TableBodyCell>
							<TableBodyCell>{formatEuro(item.totalValue / item.totalAmount)}</TableBodyCell>
							<TableBodyCell>{formatEuro(item.totalValue)}</TableBodyCell>
							<TableBodyCell>{item.order.product.Supplier}</TableBodyCell>
							<TableBodyCell
								>{categoryNames[(item.order.product.Category - 1).toString()].name}</TableBodyCell
							>
						</TableBodyRow>
					</svelte:fragment>
					<div class="mt-0 flex justify-between" slot="footer">
						<Heading customSize="" tag="h4">Gesamtpreis: {formatEuro(totalPrice)}</Heading>
						<Button
							disabled={totalOrders.length == 0}
							on:click={() => downloadOrdersTotal(totalOrders, date, clientName)}
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
