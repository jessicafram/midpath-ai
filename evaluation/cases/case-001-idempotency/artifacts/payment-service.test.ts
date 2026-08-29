import { beforeEach, describe, expect, it } from "vitest";

import { PaymentService } from "./payment-service.js";

import type {
    CreatePaymentInput,
    IdempotencyRecord,
    IdempotencyRepository,
    Payment,
    PaymentRepository
} from "./payment-service.js";

class InMemoryPaymentRepository implements PaymentRepository {
    public payments: Payment[] = [];

    async create(input: CreatePaymentInput): Promise<Payment> {
        const payment: Payment = {
            id: `payment-${this.payments.length + 1}`,
            amount: input.amount,
            currency: input.currency,
            status: "created"
        };

        this.payments.push(payment);

        return payment;
    }
}

class InMemoryIdempotencyRepository
    implements IdempotencyRepository {
    private readonly records = new Map<string, IdempotencyRecord>();

    async findByKey(key: string): Promise<IdempotencyRecord | null> {
        return this.records.get(key) ?? null;
    }

    async save(record: IdempotencyRecord): Promise<void> {
        this.records.set(record.key, record);
    }
}

describe("PaymentService", () => {
    let paymentRepository: InMemoryPaymentRepository;
    let idempotencyRepository: InMemoryIdempotencyRepository;
    let service: PaymentService;

    beforeEach(() => {
        paymentRepository = new InMemoryPaymentRepository();
        idempotencyRepository = new InMemoryIdempotencyRepository();

        service = new PaymentService(
            paymentRepository,
            idempotencyRepository
        );
    });

    it("creates a payment", async () => {
        const result = await service.createPayment(
            {
                amount: 250,
                currency: "BRL"
            },
            "payment-order-123"
        );

        expect(result.amount).toBe(250);
        expect(result.currency).toBe("BRL");
        expect(paymentRepository.payments).toHaveLength(1);
    });

    it("returns the original payment when the same idempotency key is reused", async () => {
        const first = await service.createPayment(
            {
                amount: 250,
                currency: "BRL"
            },
            "payment-order-123"
        );

        const second = await service.createPayment(
            {
                amount: 250,
                currency: "BRL"
            },
            "payment-order-123"
        );

        expect(second.id).toBe(first.id);
        expect(paymentRepository.payments).toHaveLength(1);
    });

    it("rejects a request without an idempotency key", async () => {
        await expect(
            service.createPayment({
                amount: 250,
                currency: "BRL"
            })
        ).rejects.toThrow("Idempotency-Key is required");
    });

    it("rejects a payment with an invalid amount", async () => {
        await expect(
            service.createPayment(
                {
                    amount: 0,
                    currency: "BRL"
                },
                "payment-order-456"
            )
        ).rejects.toThrow(
            "Payment amount must be greater than zero"
        );
    });

    it("normalizes the currency to uppercase", async () => {
        const result = await service.createPayment(
            {
                amount: 100,
                currency: "brl"
            },
            "payment-order-789"
        );

        expect(result.currency).toBe("BRL");
    });
});