import { eq } from "drizzle-orm";
import { db } from "./client";
import { orders } from "./schema";
import { SajuInput, SajuResult } from "../saju/types";

export async function createOrder(sajuInput: SajuInput, amount: number) {
  const [order] = await db
    .insert(orders)
    .values({
      sajuInput: sajuInput as unknown as Record<string, unknown>,
      amount,
      status: "pending",
    })
    .returning();
  return order;
}

export async function getOrder(orderId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  return order ?? null;
}

export async function updateOrderPaid(orderId: string, paymentId: string) {
  const [order] = await db
    .update(orders)
    .set({
      status: "paid",
      paymentId,
      paidAt: new Date(),
    })
    .where(eq(orders.id, orderId))
    .returning();
  return order;
}

export async function updateOrderReading(orderId: string, readingCache: string) {
  const [order] = await db
    .update(orders)
    .set({ readingCache })
    .where(eq(orders.id, orderId))
    .returning();
  return order;
}

export async function getOrderByPaymentId(paymentId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.paymentId, paymentId))
    .limit(1);
  return order ?? null;
}

export async function updateOrderSajuResult(orderId: string, sajuResult: SajuResult) {
  const [order] = await db
    .update(orders)
    .set({ sajuResult: sajuResult as unknown as Record<string, unknown> })
    .where(eq(orders.id, orderId))
    .returning();
  return order;
}

export async function getOrderByShareId(shareId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.shareId, shareId))
    .limit(1);
  return order ?? null;
}

export async function updateOrderShareId(orderId: string, shareId: string) {
  const [order] = await db
    .update(orders)
    .set({ shareId })
    .where(eq(orders.id, orderId))
    .returning();
  return order;
}
