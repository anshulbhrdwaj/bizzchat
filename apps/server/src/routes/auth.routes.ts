import { Router } from "express";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "../lib/prisma";
import logger from "../lib/logger";
import { validateBody } from "../middleware/validate";
import { sendOtpSchema, verifyOtpSchema } from "@bizchat/shared";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router: Router = Router();

// Rate limit: 1000 OTP requests per hour (relaxed for testing)
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  message: { error: "Too many OTP requests, try again later" },
});

// POST /send-otp
router.post(
  "/send-otp",
  otpLimiter,
  validateBody(sendOtpSchema),
  async (req, res) => {
    try {
      const { phone } = req.body;
      const code =
        process.env.NODE_ENV !== "production"
          ? "123456"
          : String(Math.floor(100000 + Math.random() * 900000));
      const hashedCode = await bcrypt.hash(code, 10);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min TTL

      // Store hashed OTP using Prisma client
      await prisma.otpCode.create({
        data: {
          phone,
          code: hashedCode,
          expiresAt,
        },
      });

      // In production: send via SMS gateway
      // In development: log the OTP
      logger.info(`OTP generated for phone`, {
        phone,
        code: process.env.NODE_ENV === "development" ? code : "***",
      });

      res.json({ message: "OTP sent", expiresAt: expiresAt.toISOString() });
    } catch (error) {
      logger.error("Send OTP error", { error });
      res.status(500).json({ error: "Failed to send OTP" });
    }
  },
);

// POST /verify-otp
router.post("/verify-otp", validateBody(verifyOtpSchema), async (req, res) => {
  try {
    const { phone, code } = req.body;

    // Find latest unused OTP for this phone using Prisma client
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        phone,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      res.status(400).json({ error: "Invalid or expired OTP" });
      return;
    }

    const isValid = await bcrypt.compare(code, otpRecord.code);
    if (!isValid) {
      res.status(400).json({ error: "Invalid OTP" });
      return;
    }

    // Mark OTP as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // Create user if new, or fetch existing
    let user = await prisma.user.findUnique({ where: { phone } });
    const isNewUser = !user;
    if (!user) {
      user = await prisma.user.create({ data: { phone } });
    }

    // Generate JWT pair
    const tokenFamily = crypto.randomUUID();
    const accessToken = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(
      { sub: user.id, family: tokenFamily },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: "30d" },
    );

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: await bcrypt.hash(refreshToken, 10),
        userId: user.id,
        family: tokenFamily,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        avatarUrl: user.avatarUrl,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen.toISOString(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      accessToken,
      refreshToken,
      isNewUser,
    });
  } catch (error) {
    logger.error("Verify OTP error", { error });
    res.status(500).json({ error: "Verification failed" });
  }
});

// POST /refresh
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(401).json({ error: "No refresh token" });
      return;
    }

    const payload = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!,
    ) as {
      sub: string;
      family: string;
    };

    // Find tokens in this family
    const tokens = await prisma.refreshToken.findMany({
      where: { family: payload.family },
      orderBy: { createdAt: "desc" },
    });

    // Check for token reuse (security)
    const currentToken = tokens.find((t) => !t.used);
    if (!currentToken) {
      // Token reuse detected — invalidate entire family
      await prisma.refreshToken.deleteMany({
        where: { family: payload.family },
      });
      res.status(401).json({ error: "Token reuse detected" });
      return;
    }

    // Verify the token matches
    const isValid = await bcrypt.compare(refreshToken, currentToken.token);
    if (!isValid) {
      res.status(401).json({ error: "Invalid refresh token" });
      return;
    }

    // Mark as used
    await prisma.refreshToken.update({
      where: { id: currentToken.id },
      data: { used: true },
    });

    // Generate new pair (rotation)
    const newAccessToken = jwt.sign(
      { sub: payload.sub },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" },
    );
    const newRefreshToken = jwt.sign(
      { sub: payload.sub, family: payload.family },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: "30d" },
    );

    await prisma.refreshToken.create({
      data: {
        token: await bcrypt.hash(newRefreshToken, 10),
        userId: payload.sub,
        family: payload.family,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    res.json({
      user: user
        ? {
            id: user.id,
            phone: user.phone,
            name: user.name,
            avatarUrl: user.avatarUrl,
            isOnline: user.isOnline,
            lastSeen: user.lastSeen.toISOString(),
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
          }
        : null,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error("Refresh token error", { error });
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// POST /logout
router.post("/logout", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      try {
        const payload = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET!,
        ) as { family: string };
        await prisma.refreshToken.deleteMany({
          where: { family: payload.family },
        });
      } catch {
        // Token already invalid, that's fine
      }
    }
    res.json({ message: "Logged out" });
  } catch (error) {
    logger.error("Logout error", { error });
    res.status(500).json({ error: "Logout failed" });
  }
});

export default router;
