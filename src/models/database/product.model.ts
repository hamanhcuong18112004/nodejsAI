import { BaseModel } from "./base.model";
import { IProductTranslation } from "./product-translation.model";

export interface IProduct {
    sku: string;
    price: number;
    stock: number;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    // Virtual fields for translations
    translations?: IProductTranslation[];
    name?: string; // Populated based on language
    description?: string; // Populated based on language
}

export class Product extends BaseModel implements IProduct {
    sku: string;
    price: number;
    stock: number;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    translations?: IProductTranslation[];
    name?: string;
    description?: string;

    constructor(data: IProduct) {
        super();
        this.sku = data.sku;
        this.price = data.price;
        this.stock = data.stock;
        this.isActive = data.isActive ?? true;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
        this.translations = data.translations;
        this.name = data.name;
        this.description = data.description;
    }
}
