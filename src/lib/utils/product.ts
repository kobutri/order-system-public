import FileSaver from 'file-saver';
import Papa from 'papaparse';
import { productsSame, type Order } from './data';
import * as windows1252 from 'windows-1252';
import { formatEuro } from './util';

export enum Category {
	Unspecified,
	Food,
	Beverages,
	CleaningSupplies,
	PackagingMaterial,
	Consumables,
	Clothing,
	Returnables,
	TradeGoods,
	CoffeSpot7,
	CoffeSpot19
}

export const categoryNames = [
	{
		value: '1',
		name: 'Lebensmittel'
	},
	{
		value: '2',
		name: 'Getränke'
	},
	{
		value: '3',
		name: 'Reinigungsmaterial'
	},
	{
		value: '4',
		name: 'Verpackung'
	},
	{
		value: '5',
		name: 'Verbrauchsgüter'
	},
	{
		value: '6',
		name: 'Bekleidung'
	},
	{
		value: '7',
		name: 'Pfand'
	},
	{
		value: '8',
		name: 'Handlesgüter'
	},
	{
		value: '9',
		name: 'Coffe Spot 7%'
	},
	{
		value: '10',
		name: 'Coffe Spot 19%'
	}
];

export type Product = {
	id: number;
	SupplierProductNumber: number;
	InternalProductNumber: number;
	SupplierName: string;
	InternalName: string;
	ContainerUnit: string;
	ContainerSize: number;
	UnitPrice: number;
	ContainerPrice: number;
	Supplier: string;
	Category: Category;
};

export type Default = {
	index: number;
	amount: number;
};

function parseProduct(row: any, supplier: string): Product | null {
	const supplierProductNumberString = row['Artikel Nr.'];
	if (supplierProductNumberString === undefined || supplierProductNumberString === null)
		return null;
	const internalProductNumberString = row[' eigene Artikel Nr.'];
	if (internalProductNumberString === undefined || internalProductNumberString === null)
		return null;
	const supplierNameString = row[' Bezeichnung des Lief.'];
	if (supplierNameString === undefined || supplierNameString === null) return null;
	const internalNameString = row[' eigene Artikelbez.'];
	if (internalNameString === undefined || internalNameString === null) return null;
	const containerUnitString = row[' Inhalt-Einheit'];
	if (containerUnitString === undefined || containerUnitString === null) return null;
	const containerSizeString = row[' Inhalt'];
	if (containerSizeString === undefined || containerSizeString === null) return null;
	const containerPriceString = row[' Gebinde Preis'];
	if (containerPriceString === undefined || containerPriceString === null) return null;

	const supplierProductNumber = parseInt(supplierProductNumberString);
	if (isNaN(supplierProductNumber)) return null;
	const internalProductNumber = parseInt(internalProductNumberString);
	if (isNaN(internalProductNumber)) return null;
	const containerSize = parseFloat(containerSizeString.replace('.', '').replace(',', '.'));
	if (isNaN(containerSize) || containerSize === 0) return null;
	const containerPrice = parseFloat(containerPriceString.replace('.', '').replace(',', '.'));
	if (isNaN(containerPrice) || containerPrice === 0) return null;
	const unitPrice = containerPrice / containerSize;

	return {
		SupplierProductNumber: supplierProductNumber,
		InternalProductNumber: internalProductNumber,
		SupplierName: supplierNameString,
		InternalName: internalNameString,
		ContainerUnit: containerUnitString,
		ContainerSize: containerSize,
		UnitPrice: unitPrice,
		ContainerPrice: containerPrice,
		Supplier: supplier,
		Category: Category.Unspecified,
		id: 0
	};
}

export function dataToProducts(data: any[], supplier: string): Product[] {
	const products = [];
	for (let i = 0; i < data.length; i++) {
		const product = parseProduct(data[i], supplier);
		if (product !== null) {
			products.push(product);
		}
	}
	return products;
}

export function unparseProduct(product: Product) {
	return {
		'Artikel Nr.': `${product.SupplierProductNumber}'`,
		' eigene Artikel Nr.': `${product.InternalProductNumber}'`,
		' Bezeichnung des Lief.': product.SupplierName,
		' eigene Artikelbez.': product.InternalName,
		' Inhalt-Einheit': product.ContainerUnit,
		' Inhalt': product.ContainerSize.toLocaleString('de-de'),
		' Gebinde Preis': (product.ContainerSize * product.UnitPrice).toLocaleString('de-de'),
	};
}

export function downloadProducts(products: Product[], supplier: string) {
	const csvString = Papa.unparse(products.map(unparseProduct), {
		delimiter: ';'
	});
	const data = windows1252.encode(csvString);
	const uint8array = new Uint8Array([...data]);
	const blob = new Blob([uint8array], { type: 'text/csv;charset=windows-1252;' });
	FileSaver.saveAs(blob, `${supplier}.csv`);
}

function unparseOrder(order: Order) {
	return {
		Lieferantennummer: order.product.SupplierProductNumber,
		'MBS5 Nummer': order.product.InternalProductNumber,
		'interne Bezeichnung': order.product.InternalName,
		Lieferantenbezeichnung: order.product.SupplierName,
		Gebindegröße: order.product.ContainerSize.toLocaleString('de-de'),
		Einheit: order.product.ContainerUnit,
		Stückpreis: formatEuro(order.UnitPrice),
		Lieferant: order.product.Supplier,
		Menge: order.amount,
		Kategorie: categoryNames[(order.product.Category - 1).toString()].name
	};
}

export function downloadOrders(orders: Order[], entryName: string, client: string) {
	const csvString = Papa.unparse(orders.map(unparseOrder), { delimiter: ';' });
	const data = windows1252.encode(csvString);
	const uint8array = new Uint8Array([...data]);
	const blob = new Blob([uint8array], { type: 'text/csv;charset=windows-1252;' });
	FileSaver.saveAs(blob, `${entryName} KST626_50hertz_${client.split("@")[0]}_Bestellung.csv`);
}

export function getOrdersAttachment(orders: Order[]) {
	return Papa.unparse(orders.map(unparseOrderCompact), { delimiter: ';' });
}

function unparseOrderCompact(order: Order) {
	return {
		'interne Bezeichnung': order.product.InternalName,
		Lieferantenbezeichnung: order.product.SupplierName,
		Gebindegröße: order.product.ContainerSize.toLocaleString('de-de'),
		Einheit: order.product.ContainerUnit,
		Menge: order.amount
	};
}

export function downloadOrdersCompact(orders: Order[], entryName: string, client: string) {
	const csvString = Papa.unparse(orders.map(unparseOrderCompact), { delimiter: ';' });
	const data = windows1252.encode(csvString);
	const uint8array = new Uint8Array([...data]);
	const blob = new Blob([uint8array], {type: 'text/csv;charset=windows-1252;'});
	FileSaver.saveAs(blob, `compact_${entryName} KST626_50hertz_${client.split("@")[0]}_Bestellung.csv`);
}

function unparseOrderTotal(order: { totalValue: number; totalAmount: number; order: Order }) {
	return {
		Lieferantennummer: order.order.product.SupplierProductNumber,
		'MBS5 Nummer': order.order.product.InternalProductNumber,
		'interne Bezeichnung': order.order.product.InternalName,
		Lieferantenbezeichnung: order.order.product.SupplierName,
		Gebindegröße: order.order.product.ContainerSize.toLocaleString('de-de'),
		Einheit: order.order.product.ContainerUnit,
		Durchschnittsstückpreis: formatEuro(order.totalValue / order.totalAmount),
		Lieferant: order.order.product.Supplier,
		Menge: order.totalAmount,
		Kategorie: categoryNames[(order.order.product.Category - 1).toString()].name
	};
}

export function downloadOrdersTotal(
	orders: { totalValue: number; totalAmount: number; order: Order }[],
	entryName: string,
	client: string
) {
	const csvString = Papa.unparse(orders.map(unparseOrderTotal), { delimiter: ';' });
	const data = windows1252.encode(csvString);
	const uint8array = new Uint8Array([...data]);
	const blob = new Blob([uint8array], {type: 'text/csv;charset=windows-1252;'});
	FileSaver.saveAs(blob, `products_${entryName} KST626_50hertz_${client.split("@")[0]}_Bestellung.csv`);
}

function unparseCategories(categories: { [key: string]: number }) {
	const ret = new Object();
	Object.entries(categories).forEach(([key, val]) => {
		ret[categoryNames[parseInt(key) - 1].name] = val;
	});
	return ret;
}

export function downloadCategories(
	categories: { [key: string]: number },
	entryName: string,
	client: string
) {
	const csvString = Papa.unparse([unparseCategories(categories)], { delimiter: ';' });
	const data = windows1252.encode(csvString);
	const uint8array = new Uint8Array([...data]);
	const blob = new Blob([uint8array], {type: 'text/csv;charset=windows-1252;'});
	FileSaver.saveAs(blob, `categories_${entryName} KST626_50hertz_${client.split("@")[0]}_Bestellung.csv`);
}

export function findCorrespondingIndex(
	newProducts: Product[],
	oldProducts: Product[],
	index: number
) {
	if (index < newProducts.length && productsSame(oldProducts[index], newProducts[index])) {
		return index;
	} else {
		return newProducts.findIndex((product) => productsSame(product, oldProducts[index]));
	}
}
