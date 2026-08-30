export interface CreateOrderInput {
    customerId: string;
    productId: string;
    quantity: number;
    amount: number;
}

export interface Order {
    id: string;
    customerId: string;
    productId: string;
    quantity: number;
    status: "created";
}

export interface PaymentAttempt {
    id: string;
    orderId: string;
    amount: number;
    status: "pending";
}

export interface OrderRepository {
    create(input: {
        customerId: string;
        productId: string;
        quantity: number;
    }): Promise<Order>;
}

export interface InventoryRepository {
    decrease(
        productId: string,
        quantity: number
    ): Promise<void>;
}

export interface PaymentRepository {
    createAttempt(input: {
        orderId: string;
        amount: number;
    }): Promise<PaymentAttempt>;
}

export interface CreateOrderResult {
    order: Order;
    paymentAttempt: PaymentAttempt;
}

export class OrderService {
    constructor(
        private readonly orderRepository: OrderRepository,
        private readonly inventoryRepository: InventoryRepository,
        private readonly paymentRepository: PaymentRepository
    ) { }

    async createOrder(
        input: CreateOrderInput
    ): Promise<CreateOrderResult> {
        if (!input.customerId.trim()) {
            throw new Error("Customer ID is required");
        }

        if (!input.productId.trim()) {
            throw new Error("Product ID is required");
        }

        if (
            !Number.isInteger(input.quantity) ||
            input.quantity <= 0
        ) {
            throw new Error(
                "Quantity must be a positive integer"
            );
        }

        if (
            !Number.isFinite(input.amount) ||
            input.amount <= 0
        ) {
            throw new Error(
                "Amount must be greater than zero"
            );
        }

        const order =
            await this.orderRepository.create({
                customerId: input.customerId,
                productId: input.productId,
                quantity: input.quantity
            });

        await this.inventoryRepository.decrease(
            input.productId,
            input.quantity
        );

        const paymentAttempt =
            await this.paymentRepository.createAttempt({
                orderId: order.id,
                amount: input.amount
            });

        return {
            order,
            paymentAttempt
        };
    }
}