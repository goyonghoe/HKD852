import { z } from "zod";

const hanjaCharacterSchema = z.object({
  hanja: z.string().length(1),
  meaning: z.string().min(1),
  strokes: z.number().int().positive(),
});

const nameInfoSchema = z.object({
  koreanName: z.string().min(2).max(5).regex(/^[가-힣]+$/, "한글 이름만 입력해주세요"),
  familyName: z.string().min(1).max(2).regex(/^[가-힣]+$/),
  givenNameSyllables: z.array(z.string().length(1)).min(1).max(3),
  selectedHanja: z.array(hanjaCharacterSchema).optional(),
});

export const sajuInputSchema = z.object({
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "생년월일 형식이 올바르지 않습니다 (YYYY-MM-DD)")
    .refine((date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      return year >= 1920 && year <= 2025;
    }, "1920년~2025년 사이의 생년월일을 입력해주세요"),
  birthTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "시간 형식이 올바르지 않습니다 (HH:mm)")
    .nullable(),
  gender: z.enum(["male", "female"], {
    errorMap: () => ({ message: "성별을 선택해주세요" }),
  }),
  isLunar: z.boolean().default(false),
  nameInfo: nameInfoSchema.optional(),
});

export const orderIdSchema = z.object({
  orderId: z.string().uuid("올바르지 않은 주문 ID입니다"),
});

export const paymentVerifySchema = z.object({
  paymentId: z.string().min(1, "결제 ID가 필요합니다"),
  orderId: z.string().uuid("올바르지 않은 주문 ID입니다"),
});

export type SajuInputForm = z.infer<typeof sajuInputSchema>;
