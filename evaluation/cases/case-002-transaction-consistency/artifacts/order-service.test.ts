import { describe, expect, it, vi } from "vitest";

import {
    OrderService,
    type InventoryRepository,
    type OrderRepository,
    type PaymentRepository
} from "./order-service.js";

function createRepositories() {
    const orderRepository: OrderRepository = {
        create: vi.fn().mockResolvedValue({
            id: "order-001",
            customerId: "customer-001",
            productId: "product-001",
            quantity: 2,
            status: "created"
        })
    };

    const inventoryRepository: InventoryRepository = {
        decrease: vi.fn().mockResolvedValue(undefined)
    };

    const paymentRepository: PaymentRepository = {
        createAttempt: vi.fn().mockResolvedValue({
            id: "payment-001",
            orderId: "order-001",
            amount: 100,
            status: "pending"
        })
    };

    return {
        orderRepository,
        inventoryRepository,
        paymentRepository
    };
}

describe("OrderService", () => {
    it("creates an order, decreases inventory, and records a payment attempt", async () => {
        const repositories = createRepositories();

        const service = new OrderService(
            repositories.orderRepository,
            repositories.inventoryRepository,
            repositories.paymentRepository
        );

        const result = await service.createOrder({
            customerId: "customer-001",
            productId: "product-001",
            quantity: 2,
            amount: 100
        });

        expect(result.order.id).toBe("order-001");
        expect(result.paymentAttempt.orderId).toBe(
            "order-001"
        );

        expect(
            repositories.orderRepository.create
        ).toHaveBeenCalledOnce();

        expect(
            repositories.inventoryRepository.decrease
        ).toHaveBeenCalledWith(
            "product-001",
            2
        );

        expect(
            repositories.paymentRepository.createAttempt
        ).toHaveBeenCalledWith({
            orderId: "order-001",
            amount: 100
        });
    });

    it("rejects an empty customer ID", async () => {
        const repositories = createRepositories();

        const service = new OrderService(
            repositories.orderRepository,
            repositories.inventoryRepository,
            repositories.paymentRepository
        );

        await expect(
            service.createOrder({
                customerId: " ",
                productId: "product-001",
                quantity: 2,
                amount: 100
            })
        ).rejects.toThrow(
            "Customer ID is required"
        );
    });

    it("rejects an empty product ID", async () => {
        const repositories = createRepositories();

        const service = new OrderService(
            repositories.orderRepository,
            repositories.inventoryRepository,
            repositories.paymentRepository
        );

        await expect(
            service.createOrder({
                customerId: "customer-001",
                productId: " ",
                quantity: 2,
                amount: 100
            })
        ).rejects.toThrow(
            "Product ID is required"
        );
    });

    it("rejects an invalid quantity", async () => {
        const repositories = createRepositories();

        const service = new OrderService(
            repositories.orderRepository,
            repositories.inventoryRepository,
            repositories.paymentRepository
        );

        await expect(
            service.createOrder({
                customerId: "customer-001",
                productId: "product-001",
                quantity: 0,
                amount: 100
            })
        ).rejects.toThrow(
            "Quantity must be a positive integer"
        );
    });

    it("rejects an invalid amount", async () => {
        const repositories = createRepositories();

        const service = new OrderService(
            repositories.orderRepository,
            repositories.inventoryRepository,
            repositories.paymentRepository
        );

        await expect(
            service.createOrder({
                customerId: "customer-001",
                productId: "product-001",
                quantity: 2,
                amount: 0
            })
        ).rejects.toThrow(
            "Amount must be greater than zero"
        );
    });
});