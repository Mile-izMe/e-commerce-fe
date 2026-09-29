export interface Cart {
  id: string | null;
  version: number;
  totalQuantity: number;
  items: {
    id: string;
    variantId: string;
    productName: string;
    variantName: string;
    imageUrl: string | null;
    quantity: number;
    unitPriceAmount: string;
    lineTotalAmount: string;
    currency: string;
    availableQuantity: number;
    purchasable: boolean;
  }[];
}

export interface AddCartItem {
  variantId: string;
  quantity: number;
}
