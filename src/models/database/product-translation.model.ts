import { BaseModel } from "./base.model";

export interface IProductTranslation {
    productId: string;
    languageCode: string; // 'en', 'vi', 'zh', etc.
    name: string;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export class ProductTranslation
    extends BaseModel
    implements IProductTranslation
{
    
    productId: string;
    languageCode: string;
    name: string;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;

    constructor(data: IProductTranslation) {
        super();
      
        this.productId = data.productId;
        this.languageCode = data.languageCode;
        this.name = data.name;
        this.description = data.description;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }
}
