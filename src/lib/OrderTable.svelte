<script lang="ts">
	import {
		Button,
		Heading,
		Input,
		Spinner,
		TableBodyCell,
		TableBodyRow,
		Tooltip
	} from 'flowbite-svelte';
	import { auth, db, user } from '../Firebase';

	import { get, ref, update } from 'firebase/database';
	import { Bookmark, ShieldExclamation, X } from 'svelte-heros';
	import { derived, type Writable } from 'svelte/store';
	import CategorySelector from './CategorySelector.svelte';
	import TooltipCell from './productSelector/TooltipCell.svelte';
	import Table from './searchTable/Table.svelte';
	import type { Order } from './utils/data';
	import { Category, getOrdersAttachment, type Product } from './utils/product';
	import { arrayEquals, formatEuro } from './utils/util';

	export let orders: Writable<Map<number, Order>>;
	export let products: Writable<Product[]>;
	export let defaults: Writable<Map<number, number>>;
	export let favorites: Writable<Set<number>>;
	export let orderEntryName: string;
	export let origOrders: Order[];
	export let productsCategoryChanged: Set<number>;

	$: totalPrice = (() => {
		let total = 0;
		$orders.forEach((val) => {
			total += val.UnitPrice * val.amount;
		});
		return total;
	})();

	function changeAmount(index: number, target: EventTarget) {
		let val: number = parseFloat((target as HTMLInputElement).value);
		if(Number.isNaN(val)) val = 0;
		orders.update((orders) => {
			orders.set(index, {
				...orders.get(index),
				amount: val
			});
			return orders;
		});
	}

	let categoriesComplete = derived([products, orders], ([$products, $orders]) => {
		for (let order of $orders.values()) {
			if (order.invalid) continue;
			if ($products[order.index].Category === Category.Unspecified) {
				return false;
			}
		}
		return true;
	});

	function toggleDefault(index: number) {
		defaults.update((defaults) => {
			if (defaults.has(index)) {
				defaults.delete(index);
			} else {
				defaults.set(index, $orders.get(index).amount);
			}
			return defaults;
		});
	}

	function setCategory(index: number, category: Category) {
		products.update((products) => {
			if (products[index].Category != category) {
				productsCategoryChanged.add(index);
			}
			products[index].Category = category;
			return products;
		});
	}

	function removeOrder(index: number) {
		orders.update((orders) => {
			orders.delete(index);
			return orders;
		});
	}

	let uploading = false;
	async function save() {
		if (uploading) return;
		uploading = true;
		let updates = {};
		productsCategoryChanged.forEach((index) => {
			updates[`/productInfos/${index}/Category`] = $products[index].Category;
		});
		updates[`/favorites/${auth.currentUser.uid}`] = Array.from($favorites);
		let defaultsData: { [key: string]: number } = {};
		$defaults.forEach((val, key) => {
			defaultsData[`${key}`] = val;
		});
		updates[`defaults/${auth.currentUser.uid}`] = defaultsData;
		let orderData: Order[] = Array.from($orders.values());
		let ordersChanged = !arrayEquals(origOrders, orderData);
		if (ordersChanged) {
			updates[`/orders/${auth.currentUser.uid}/${orderEntryName}`] = orderData;
			updates[`/userInfos/${auth.currentUser.uid}`] = auth.currentUser.email;
		}
		await update(ref(db), updates);

		if (ordersChanged) {
			let mailData: { key: string; to: string; enabled: boolean } = (
				await get(ref(db, '/mail'))
			).val();
			if (mailData.enabled) {
				let completeOrderData = orderData.map((order) => {
					if (order.invalid) {
						return order;
					} else {
						return {
							...order,
							product: $products[order.index]
						};
					}
				});
				await fetch(`/api/sendmail`, {
					method: 'POST',
					body: JSON.stringify({
						to: mailData.to,
						from: $user.email,
						entryName: orderEntryName,
						attachment: getOrdersAttachment(completeOrderData),
						token: await auth.currentUser.getIdToken()
					})
				});
				alert('Speichern erfolgreich: email versendet');
			} else {
				alert('Speichern erfolgreich: keine email versendet (Grund: emails ausgeschaltet)');
			}
		} else {
			alert('speichern erfolgreich: keine email versendet (Grund: Bestellung nicht verändert)');
		}
		origOrders = orderData;
		uploading = false;
	}
</script>

<Table
	headerItems={[
		'',
		'interne Bezeichnung',
		'Lieferantenbezeichnung',
		'Gebindegröße',
		'Einheit',
		'Stückpreis',
		'Lieferant',
		'Menge',
		'Gesamtpreis',
		'Kategorie',
		''
	]}
	bodyItems={Array.from($orders.values())}
	border={true}
>
	<svelte:fragment slot="customRows">
		{#if $orders.size === 0}
			{#each Array(5) as i}
				<TableBodyRow>
					{#each Array(11) as j}
						<TableBodyCell />
					{/each}
				</TableBodyRow>
			{/each}
		{/if}
	</svelte:fragment>

	<svelte:fragment slot="row" let:item>
		{#if !item.invalid}
			<TableBodyRow>
				<TableBodyCell>
					<Tooltip content="Default">
						<div class="content" on:click|stopPropagation={() => toggleDefault(item.index)}>
							{#if $defaults.has(item.index)}
								<Bookmark variation="solid" />
							{:else}
								<Bookmark variation="outline" />
							{/if}
						</div>
					</Tooltip>
				</TableBodyCell>
				<TooltipCell>
					{@html $products[item.index].InternalName}
				</TooltipCell>
				<TooltipCell>
					{@html $products[item.index].SupplierName}
				</TooltipCell>
				<TableBodyCell>
					{$products[item.index].ContainerSize.toLocaleString()}
				</TableBodyCell>
				<TableBodyCell>
					{$products[item.index].ContainerUnit}
				</TableBodyCell>
				<TableBodyCell>
					{formatEuro(item.UnitPrice)}
				</TableBodyCell>
				<TableBodyCell>
					{$products[item.index].Supplier}
				</TableBodyCell>
				<TableBodyCell
					><Input
						id="large-input"
						size="sm"
						placeholder="Large input"
						value={item.amount.toString()}
						on:change={(e) => changeAmount(item.index, e.target)}
						type="number"
						step="any"
					/></TableBodyCell
				>
				<TableBodyCell>
					<span class="font-black text-lg">{formatEuro(item.amount * item.UnitPrice)}</span>
				</TableBodyCell>
				<TableBodyCell
					><CategorySelector
						category={$products[item.index].Category}
						on:selected={(e) => setCategory(item.index, e.detail)}
					/></TableBodyCell
				>
				<TableBodyCell
					><Button class="!p-2" on:click={() => removeOrder(item.index)}
						><X class="w-5 h-5" /></Button
					></TableBodyCell
				>
			</TableBodyRow>
		{:else}
			<TableBodyRow class="border-box border-2" style="border-color: rgb(224 36 36);">
				<TableBodyCell>
					<Tooltip content="dieses Produkt wird nicht mehr verkauft"
						><ShieldExclamation color="red" /></Tooltip
					>
				</TableBodyCell>
				<TooltipCell>{item.product.InternalName}</TooltipCell>
				<TooltipCell>{item.product.SupplierName}</TooltipCell>
				<TableBodyCell>{item.product.ContainerSize.toLocaleString()}</TableBodyCell>
				<TableBodyCell>{item.product.ContainerUnit}</TableBodyCell>
				<TableBodyCell>{formatEuro(item.UnitPrice)}</TableBodyCell>
				<TableBodyCell>{item.product.Supplier}</TableBodyCell>
				<TableBodyCell>{(Math.round(item.amount * 1000) / 1000).toLocaleString()}</TableBodyCell>
				<TableBodyCell>
					<span class="font-black text-lg">{formatEuro(item.amount * item.UnitPrice)}</span>
				</TableBodyCell>
				<TableBodyCell
					><CategorySelector disabled={true} category={item.product.Category} /></TableBodyCell
				>
				<TableBodyCell
					><Button class="!p-2" on:click={() => removeOrder(item.index)}
						><X class="w-5 h-5" /></Button
					></TableBodyCell
				>
			</TableBodyRow>
		{/if}
	</svelte:fragment>
	<div class="mt-10 flex justify-between" slot="footer">
		<Heading customSize="" tag="h4">Gesamtpreis: {formatEuro(totalPrice)}</Heading>
		<Button size="lg" on:click={() => save()} disabled={!$categoriesComplete}>
			{#if uploading}
				<Spinner />
			{:else}
				Speichern
			{/if}
		</Button>
	</div>
</Table>
