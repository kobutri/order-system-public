<script lang="ts">
	import OrderTable from '$lib/OrderTable.svelte';
	import type { Order } from '$lib/utils/data';
	import { Category, findCorrespondingIndex, type Product } from '$lib/utils/product';
	import { get, onValue, ref, type Unsubscribe } from 'firebase/database';
	import { Heading, Spinner } from 'flowbite-svelte';
	import { onDestroy, onMount } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import { auth, db } from '../Firebase';
	import DateChooser from '../lib/DateChooser.svelte';
	import ProductSelector from '../lib/productSelector/ProductSelector.svelte';

	onMount(async () => {
		products.set((await get(ref(db, '/productInfos'))).val());
		if ($products === null) {
			alert('keine Produkte vorhande');
			throw 'no products available';
		}
		let favoritesData = (await get(ref(db, `/favorites/${auth.currentUser.uid}`))).val() ?? [];
		favorites.set(new Set(favoritesData));
		let supplierSet = new Set<string>();
		$products.forEach((val) => supplierSet.add(val.Supplier));
		suppliers = Array.from(supplierSet);
		let defaultsData: { [key: string]: number } =
			(await get(ref(db, `/defaults/${auth.currentUser.uid}`))).val() ?? {};
		let defaultMap = new Map<number, number>();
		for (const [key, val] of Object.entries(defaultsData)) {
			defaultMap.set(parseInt(key), val);
		}
		defaults.set(defaultMap);
		unsubscribeProducts = onValue(ref(db, '/productInfos'), (snapshot) => {
			if (snapshot.exists()) {
				let newProducts: Product[] = snapshot.val();
				productsCategoryChanged.forEach(index => {
					let newIndex = findCorrespondingIndex(newProducts, $products, index);
					console.log(newIndex);
					if(newIndex != -1) {
						newProducts[newIndex].Category = $products[index].Category;
					} else {
						productsCategoryChanged.delete(index);
					}
				})
				favorites.update((favorites) => {
					let newFavorites = new Set<number>();
					favorites.forEach((favorite) => {
						let newIndex = findCorrespondingIndex(newProducts, $products, favorite);
						if (newIndex >= 0) {
							newFavorites.add(newIndex);
						}
					});
					return newFavorites;
				});
				defaults.update((defaults) => {
					let newDefaults = new Map<number, number>();
					defaults.forEach((val, key) => {
						let newIndex = findCorrespondingIndex(newProducts, $products, key);
						if (newIndex >= 0) {
							newDefaults.set(newIndex, val);
						}
					});
					return newDefaults;
				});
				orders.update((orders) => {
					let newOrders = new Map<number, Order>();
					orders.forEach((order, index) => {
						if (index < 0) {
							newOrders.set(index, order);
						} else {
							let newIndex = findCorrespondingIndex(newProducts, $products, index);
							if (newIndex >= 0) {
								order.index = newIndex;
								order.UnitPrice = newProducts[newIndex].UnitPrice;
								newOrders.set(newIndex, order);
							}
						}
					});
					return newOrders;
				});
				let newSuppliers: Set<string> = new Set(newProducts.map((product) => product.Supplier));
				suppliers = [...newSuppliers];
				products.set(newProducts);
			}
		});
		mounted = true;
	});

	onDestroy(() => {
		if (unsubscribeProducts) {
			unsubscribeProducts();
		}
	});

	let unsubscribeProducts: Unsubscribe;

	let mounted = false;
	let suppliers: string[] = [];
	let products: Writable<Product[]> = writable([]);
	let productsCategoryChanged = new Set<number>();
	let favorites: Writable<Set<number>> = writable(new Set());
	let defaults: Writable<Map<number, number>> = writable(new Map());
	let orders: Writable<Map<number, Order>> = writable(new Map());
	let loading: Promise<void>;
	let orderEntryName = '';
	let origOrders: Order[];

	async function readData(event: CustomEvent<{ date: Date }>) {
		let newSelected = event.detail.date;
		if (newSelected) {
			loading = (async () => {
				let newOrderEntryName = `${newSelected.getFullYear()}-${(newSelected.getMonth() + 1)
					.toString()
					.padStart(2, '0')}-${newSelected.getDate().toString().padStart(2, '0')}`;
				let newOrders: Order[] | null = (
					await get(ref(db, `/orders/${auth.currentUser.uid}/${newOrderEntryName}`))
				).val();
				origOrders = newOrders ?? [];
				if (newOrders == null) {
					newOrders = [];
					$defaults.forEach((val, key) => {
						newOrders.push({
							invalid: false,
							index: key,
							UnitPrice: $products[key].UnitPrice,
							amount: val
						});
					});
				}
				let i = 0;
				orders.set(
					new Map(
						newOrders.map((order) => {
							order.index = order.invalid ? -i-- : order.index;
							return [order.index, order];
						})
					)
				);
				orderEntryName = newOrderEntryName;
			})();
		}
	}

	function addProduct(product: { index: number; amount: number }) {
		if (!$orders.has(product.index)) {
			orders.update((orders) => {
				orders.set(product.index, {
					UnitPrice: $products[product.index].UnitPrice,
					amount: product.amount,
					index: product.index,
					invalid: false
				});
				return orders;
			});
		}
	}
</script>

{#if mounted}
	<div class="flex flex-col gap-2  mt-10 mb-10">
		<Heading tag="h4" customSize="">Liefertag</Heading>
		<DateChooser on:change={readData} />
	</div>
	<div class="mb-5 mr-2">
		<ProductSelector
			{products}
			{suppliers}
			{favorites}
			{defaults}
			{orders}
			{orderEntryName}
			on:addProduct={(e) => addProduct(e.detail)}
		/>
	</div>
	{#if loading}
		{#await loading}
			<Spinner />
		{:then _}
			<OrderTable {defaults} {products} {orders} {favorites} {orderEntryName} {productsCategoryChanged} bind:origOrders />
		{/await}
	{/if}
{:else}
	<Spinner />
{/if}
