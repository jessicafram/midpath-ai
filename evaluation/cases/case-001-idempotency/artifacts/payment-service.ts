export interface CreatePaymentInput {
    amount: number;
    currency: string;
}

export interface Payment {
    id: string;
    amount: number;
    currency: string;
    status: "created";
}

export interface PaymentRepository {
    create(input: CreatePaymentInput): Promise<Payment>;
}

export interface IdempotencyRecord {
    key: string;
    payment: Payment;
}

export interface IdempotencyRepository {
    findByKey(key: string): Promise<IdempotencyRecord | null>;
    save(record: IdempotencyRecord): Promise<void>;
}

export class PaymentService {
    constructor(
        private readonly paymentRepository: PaymentRepository,
        private readonly idempotencyRepository: IdempotencyRepository
    ) { }

    async createPayment(
        input: CreatePaymentInput,
        idempotencyKey?: string
    ): Promise<Payment> {
        if (!idempotencyKey) {
            throw new Error("Idempotency-Key is required");
        }

        if (!Number.isFinite(input.amount) || input.amount <= 0) {
            throw new Error("Payment amount must be greater than zero");
        }

        if (!input.currency || input.currency.trim().length !== 3) {
            throw new Error("Currency must contain exactly three characters");
        }

        const existingRecord =
            await this.idempotencyRepository.findByKey(idempotencyKey);

        if (existingRecord) {
            return existingRecord.payment;
        }

        const payment = await this.paymentRepository.create({
            amount: input.amount,
            currency: input.currency.toUpperCase()
        });

        await this.idempotencyRepository.save({
            key: idempotencyKey,
            payment
        });

        return payment;
    }
}