<script lang="ts">
	import DeleteButton from '$lib/DeleteButton.svelte';
	import {
		copyDefaults,
		copyFavorites,
		modifyOrders,
		updateCategories,
		type Order
	} from '$lib/utils/data';
	import { dataToProducts, downloadProducts, type Product } from '$lib/utils/product';
	import { get, onValue, ref, remove, update, type Unsubscribe } from 'firebase/database';
	import {
		Button,
		Fileupload,
		Footer,
		Helper,
		Input,
		Spinner,
		Table,
		TableBodyCell,
		TableBodyRow
	} from 'flowbite-svelte';
	import Papa from 'papaparse';
	import { onDestroy, onMount } from 'svelte';
	import { db, user } from '../../Firebase';

	onMount(async () => {
		let productData = await get(ref(db, '/productInfos'));
		if (productData.exists()) {
			oldProducts = productData.val();
			let supplierMap: Map<string, Product[]> = new Map();
			oldProducts.forEach((product) => {
				if (supplierMap.has(product.Supplier)) {
					supplierMap.set(product.Supplier, [...supplierMap.get(product.Supplier), product]);
				} else {
					supplierMap.set(product.Supplier, [product]);
				}
			});
			supplierMap.forEach((val, key) => {
				rows.push({
					supplier: key,
					products: val
				});
			});
		}
		unsubscribeProducts = onValue(ref(db, '/productInfos'), (snapshot) => {
			if (snapshot.exists()) {
				let newProducts = snapshot.val();
				let supplierMap: Map<string, Product[]> = new Map();
				newProducts.forEach((product) => {
					if (supplierMap.has(product.Supplier)) {
						supplierMap.set(product.Supplier, [...supplierMap.get(product.Supplier), product]);
					} else {
						supplierMap.set(product.Supplier, [product]);
					}
				});
				rows = rows.filter((row) => {
					if (supplierMap.has(row.supplier)) {
						row.products = supplierMap.get(row.supplier);
						supplierMap.delete(row.supplier);
						return true;
					} else if (row.rows.length > 0) {
						return true;
					} else {
						return false;
					}
				});
				supplierMap.forEach((val, key) => {
					rows.push({
						supplier: key,
						products: val
					});
				});
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

	type ConvertItem = { rows?: any[]; products?: Product[]; supplier: string };

	let oldProducts: Product[] = [];
	let fileInput: HTMLInputElement;
	let rows: ConvertItem[] = [];
	$: duplicates = (() => {
		let supplierSet = new Set<string>();
		let duplicates = new Set<string>();
		for (const row of rows) {
			if (supplierSet.has(row.supplier)) duplicates.add(row.supplier);
			supplierSet.add(row.supplier);
		}
		return duplicates;
	})();

	async function fileSelected(e: EventTarget, updateRow?: number) {
		let files = (e as HTMLInputElement).files;
		if (files) {
			for (var i = 0; i < files.length; i++) {
				const file = files[i];
				let newRow: ConvertItem = await new Promise((resolve, reject) => {
					Papa.parse(file, {
						delimiter: ';',
						header: true,
						dynamicTyping: false,
						encoding: 'ISO-8859-1',
						preview: 6000,
						worker: true,
						complete: (result, _file) => {
							let name = file.name.replace(/\.[^/.]+$/, '');
							resolve({ rows: result.data, supplier: name });
						},
						error: (error, file) => {
							reject(error);
						}
					});
				});
				if (updateRow != undefined) {
					rows[updateRow].rows = newRow.rows;
				} else {
					rows = [...rows, newRow];
				}
			}
			fileInput.value = null;
		}
	}

	function deleteRow(index: number) {
		rows.splice(index, 1);
		rows = rows;
	}

	let uploading = false;
	async function upload() {
		if (uploading) return;
		uploading = true;

		let updates = {};

		oldProducts = (await get(ref(db, '/productInfos'))).val() ?? [];

		let combinedProducts: Product[] = [];
		let supplierNameChange: { start: number; length: number; supplier: string }[] = [];
		for (const row of rows) {
			if (row.rows) {
				let products: Product[];
				if (row.products && row.products.length > 0) {
					products = dataToProducts(row.rows, row.products[0].Supplier);
					updateCategories(products, row.products);
					supplierNameChange.push({
						start: combinedProducts.length,
						length: products.length,
						supplier: row.supplier
					});
				} else {
					products = dataToProducts(row.rows, row.supplier);
				}
				combinedProducts = [...combinedProducts, ...products];
			} else if (row.products) {
				supplierNameChange.push({
					start: combinedProducts.length,
					length: row.products.length,
					supplier: row.supplier
				});
				combinedProducts = [...combinedProducts, ...row.products];
			}
		}
		for (let index = 0; index < combinedProducts.length; index++) {
			const element = combinedProducts[index];
			element.id = index;
		}
		updates['/productInfos'] = combinedProducts;

		let favoritesResult = await get(ref(db, '/favorites'));
		if (favoritesResult.exists()) {
			let favoritesData: { [key: string]: number[] } = favoritesResult.val();
			Object.entries(favoritesData).forEach(([key, favorites]) => {
				favoritesData[key] = copyFavorites(combinedProducts, oldProducts, favorites);
			});
			updates['/favorites'] = favoritesData;
		}

		let defaultsResult = await get(ref(db, '/defaults'));
		if (defaultsResult.exists()) {
			let defaultsData: {
				[key: string]: { [key: string]: number };
			} = defaultsResult.val();
			Object.entries(defaultsData).forEach(([key, val]) => {
				defaultsData[key] = copyDefaults(combinedProducts, oldProducts, val);
			});
			updates['/defaults'] = defaultsData;
		}

		let ordersResult = await get(ref(db, '/orders'));
		if (ordersResult.exists()) {
			let orderData: {
				[key: string]: {
					[key: string]: Order[];
				};
			} = ordersResult.val();
			Object.entries(orderData).forEach(([user, val]) => {
				Object.entries(val).forEach(([date, orders]) => {
					orderData[user][date] = modifyOrders(combinedProducts, oldProducts, orders);
				});
			});
			updates['/orders'] = orderData;
		}

		for (const change of supplierNameChange) {
			for (let i = change.start; i < change.start + change.length; i++) {
				combinedProducts[i].Supplier = change.supplier;
			}
		}

		await update(ref(db), updates);

		alert('Hochladen erfolgriech');

		uploading = false;
		//document.location.reload();
	}

	let size: any = 'md';
</script>

{#if mounted}
	<input
		class="hidden"
		bind:this={fileInput}
		type="file"
		multiple
		on:change={(e) => fileSelected(e.target)}
	/>
	<div class="mb-5">
		<Button on:click={() => fileInput.click()}>Lieferant hinzufügen</Button>
	</div>

	<Table>
		{#each rows as row, i}
			<TableBodyRow>
				<TableBodyCell
					>Produkte: {row.products ? row.products.length : row.rows.length}</TableBodyCell
				>
				<TableBodyCell>
					<Input color={duplicates.has(row.supplier) ? 'red' : 'base'} bind:value={row.supplier} />
					{#if duplicates.has(row.supplier)}
						<Helper color="red">Es darf diesen Lieferanten nur ein mal geben</Helper>
					{/if}
				</TableBodyCell>
				<TableBodyCell>
					<Fileupload on:change={(e) => fileSelected(e.target, i)} {size} />
				</TableBodyCell>
				<TableBodyCell>
					<Button
						disabled={!row.products}
						on:click={() => downloadProducts(row.products, row.supplier)}>Herunterladen</Button
					>
				</TableBodyCell>
				<TableBodyCell><DeleteButton on:click={() => deleteRow(i)} /></TableBodyCell>
			</TableBodyRow>
		{/each}
		{#if rows.length === 0}
			{#each Array(5) as i}
				<TableBodyRow>
					<TableBodyCell />
				</TableBodyRow>
			{/each}
		{/if}
	</Table>
{:else}
	<Spinner />
{/if}

<div class="h-14" />

<Footer class="fixed py-3 flex justify-between bottom-0 left-0 z-20 h-12 w-full"
	><Button
		color="red"
		size="xs"
		on:click={async () => {
			if (confirm('wirklich')) {
				await Promise.all([
					remove(ref(db, '/productInfos')),
					remove(ref(db, '/favorites')),
					remove(ref(db, '/defaults')),
					remove(ref(db, '/orders')),
					remove(ref(db, '/userInfos'))
				]);
				alert('Its done');
			}
		}}
		>delete all
	</Button>
	<Button
		disabled={!$user ||
			rows.length === 0 ||
			duplicates.size !== 0 ||
			rows.some((val) => !val.supplier)}
		on:click={() => upload()}
		>{#if uploading}
			<Spinner />
		{:else}
			Hochladen
		{/if}
	</Button>
</Footer>
