import { db } from "@/db";
import { otpCodes } from "@/db/schema";
import { eq, lt, and, gt } from "drizzle-orm";
import { generateOTP, hashOTP } from "./utils";

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_MINUTES = 1;

export async function generateAndSendOTP(email: string): Promise<{ success: boolean; message: string }> {
  try {
    // Check rate limit
    const recentOTP = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.email, email),
          gt(
            otpCodes.createdAt,
            new Date(Date.now() - RATE_LIMIT_MINUTES * 60 * 1000)
          )
        )
      )
      .limit(1);

    if (recentOTP.length > 0) {
      return {
        success: false,
        message: `Please wait ${RATE_LIMIT_MINUTES} minute before requesting a new OTP`,
      };
    }

    // Invalidate previous OTPs for this email
    await db.delete(otpCodes).where(eq(otpCodes.email, email));

    const otp = generateOTP();
    const codeHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await db.insert(otpCodes).values({
      email,
      code: otp,
      codeHash,
      expiresAt,
      attempts: 0,
    });

    // TODO: Send email with OTP
    console.log(`OTP for ${email}: ${otp}`);

    return {
      success: true,
      message: "OTP sent to your email",
    };
  } catch (error) {
    console.error("Error generating OTP:", error);
    return {
      success: false,
      message: "Failed to generate OTP",
    };
  }
}

export async function verifyOTP(
  email: string,
  code: string
): Promise<{ success: boolean; message: string }> {
  try {
    const otpRecord = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.email, email),
          gt(otpCodes.expiresAt, new Date())
        )
      )
      .limit(1);

    if (otpRecord.length === 0) {
      return {
        success: false,
        message: "OTP has expired",
      };
    }

    const record = otpRecord[0];

    if (record.attempts >= MAX_ATTEMPTS) {
      await db.delete(otpCodes).where(eq(otpCodes.id, record.id));
      return {
        success: false,
        message: "Maximum attempts exceeded. Please request a new OTP",
      };
    }

    const codeHash = hashOTP(code);
    if (codeHash !== record.codeHash) {
      await db
        .update(otpCodes)
        .set({ attempts: record.attempts + 1 })
        .where(eq(otpCodes.id, record.id));

      return {
        success: false,
        message: "Invalid OTP",
      };
    }

    // Delete used OTP
    await db.delete(otpCodes).where(eq(otpCodes.id, record.id));

    return {
      success: true,
      message: "OTP verified successfully",
    };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return {
      success: false,
      message: "Failed to verify OTP",
    };
  }
}

export async function cleanupExpiredOTPs(): Promise<void> {
  try {
    await db.delete(otpCodes).where(lt(otpCodes.expiresAt, new Date()));
  } catch (error) {
    console.error("Error cleaning up expired OTPs:", error);
  }
}
