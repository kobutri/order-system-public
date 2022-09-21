import type { Product } from "./product";


export function copyFavorites(newProducts: Product[], oldProducts: Product[], favorites: number[]): number[] {
    const newFavorites = new Set<number>();
    for (let i = 0; i < favorites.length; i++) {
        if (favorites[i] < newProducts.length && productsSame(oldProducts[favorites[i]], newProducts[favorites[i]])) {
            newFavorites.add(favorites[i]);
        } else {
            const newIndex = newProducts.findIndex(product => productsSame(oldProducts[favorites[i]], product));
            if (newIndex != -1) {
                newFavorites.add(favorites[i]);
            }
        }
    }
    return Array.from(newFavorites);
}


export function copyDefaults(newProducts: Product[], oldProducts: Product[], defaults: { [key: string]: number }): { [key: string]: number } {
    const newDefaults: Defaults = new Map();
    Object.entries(defaults).forEach(([indexString, amount]) => {
        const index = parseInt(indexString);
        if (index < newProducts.length && productsSame(oldProducts[index], newProducts[index])) {
            newDefaults.set(index, amount);
        } else {
            const newIndex = newProducts.findIndex(product => productsSame(oldProducts[index], product));
            if (newIndex != -1) {
                newDefaults.set(newIndex, amount);
            }
        }
    });
    return Object.fromEntries(newDefaults.entries());
}

export function modifyOrders(newProducts: Product[], oldProducts: Product[], orders: Order[]): Order[] {
    return orders.map(order => {
        if (order.invalid) {
            return order
        } else if (order.index < newProducts.length && productsSame(oldProducts[order.index], newProducts[order.index])) {
            return order;
        } else {
            const newIndex = newProducts.findIndex(product => productsSame(product, oldProducts[order.index]));
            if (newIndex != -1) {
                return {
                    ...order,
                    index: newIndex,
                }
            } else {

                return {
                    ...order,
                    index: -1,
                    product: oldProducts[order.index],
                    invalid: true,
                }
            }
        }
    });
}

export function productsSame(a: Product, b: Product) {
    return a.SupplierProductNumber === b.SupplierProductNumber && a.Supplier === b.Supplier;
}

export function updateCategories(newProducts: Product[], oldProducts: Product[]) {
    newProducts.forEach((product, i) => {
        if (i < oldProducts.length && productsSame(product, oldProducts[i])) {
            product.Category = oldProducts[i].Category;
        } else {
            const newIndex = oldProducts.findIndex(oldProduct => productsSame(oldProduct, product));
            if (newIndex != -1) {
                product.Category = oldProducts[newIndex].Category;
            }
        }
    });
}

export type ProductSearchIndex = {
    InternalName: string,
    SupplierName: string
    UnitPrice: number,
    Supplier: string,
};


export type DefaultSearchResult = {
    SupplierName: string,
    InternalName: string,
    index: number,
}

export type OrderDetailsDisplay = {
    index: number,
    amount: number,
    invalid: boolean
    product?: Product
}

export type OrderDetails = {
    amount: number,
    invalid: boolean
    product?: Product
};

export type Order = {
    invalid: boolean
    index: number,
    amount: number,
    product?: Product,
    UnitPrice: number,
}

export type Orders = Map<number, OrderDetails>;
export type Defaults = Map<number, number>;

export type ProductSearchResult = {
    index: number,
    SupplierName: string,
    InternalName: string,
    UnitPrice: string,
}

export type SupplierDisplay = {
    name: string,
    display: string,
}

