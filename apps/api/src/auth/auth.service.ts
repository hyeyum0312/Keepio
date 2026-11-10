import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ApiException } from "../common/api-error.js";
import { maskEmail } from "../common/mask-email.js";
import { loadEnv } from "../config/env.js";
import type { MailMessage } from "../mail/mail.sender.js";
import { MailSender } from "../mail/mail.sender.js";
import {
  alreadyRegisteredMail,
  RESET_PASSWORD_TTL_MS,
  resetPasswordMail,
  VERIFY_EMAIL_TTL_MS,
  verifyEmailMail,
} from "./auth-mail.js";
import { AuthRepository } from "./auth.repository.js";
import { normalizeEmail } from "./lib/email.js";
import {
  hashPassword,
  isValidPassword,
  verifyDummyPassword,
  verifyPassword,
} from "./lib/password.js";
import { generateToken, hashToken, isWellFormedToken } from "./lib/token.js";
import { type Session, SessionService } from "./session.service.js";

// 운영은 loadEnv가 WEB_ORIGIN을 필수로 검증한다. 개발·테스트에서 비어 있을 때만 쓴다(SETUP 포트)
const LOCAL_WEB_ORIGIN = "http://localhost:7710";

export type Me = { id: string; email: string | null; emailVerified: boolean };

const logger = new Logger("Auth");

// 이메일/비밀번호 흐름(FEAT-003). 세션 발급은 SessionService에 맡긴다
@Injectable()
export class AuthService {
  private webOrigin?: string;

  constructor(
    private readonly repo: AuthRepository,
    private readonly sessions: SessionService,
    private readonly mail: MailSender,
  ) {}

  // AC-01~04. 새 가입이든 이미 있는 이메일이든 같은 응답·같은 일(해시 1회, 메일 1통)을 한다
  async signup(email: string, password: string): Promise<void> {
    const normalized = normalizeEmail(email);
    if (!normalized.ok) throw invalidEmail();
    if (!isValidPassword(password)) throw weakPassword();

    const passwordHash = await hashPassword(password);
    const token = generateToken();
    const userId = await this.repo.createPasswordUser({
      email: normalized.email,
      passwordHash,
      verifyTokenHash: hashToken(token),
      verifyExpiresAt: new Date(Date.now() + VERIFY_EMAIL_TTL_MS),
    });
    await this.send(
      userId
        ? verifyEmailMail(normalized.email, this.origin(), token)
        : alreadyRegisteredMail(normalized.email, this.origin()),
    );
  }

  // AC-05
  async verifyEmail(token: string): Promise<void> {
    if (!isWellFormedToken(token)) throw invalidToken();
    if (!(await this.repo.verifyEmail(hashToken(token), new Date()))) {
      throw invalidToken();
    }
  }

  // 항상 202. 가입했고 아직 인증 전인 주소에만 새 링크를 보낸다(이전 링크도 만료 전이면 계속 쓸 수 있다)
  async resendVerification(email: string): Promise<void> {
    const normalized = normalizeEmail(email);
    if (!normalized.ok) return;
    const user = await this.repo.findUserByEmail(normalized.email);
    if (!user || user.emailVerifiedAt) return;

    const token = generateToken();
    await this.repo.insertEmailToken({
      userId: user.id,
      purpose: "verify_email",
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + VERIFY_EMAIL_TTL_MS),
    });
    await this.send(verifyEmailMail(normalized.email, this.origin(), token));
  }

  // AC-07·AC-08. 실패 이유(형식·없음·비밀번호 없음·불일치)를 응답과 응답 시간으로 구분할 수 없게 한다
  async login(email: string, password: string): Promise<Session> {
    const normalized = normalizeEmail(email);
    const account = normalized.ok
      ? await this.repo.findPasswordLogin(normalized.email)
      : null;
    if (!account) {
      await verifyDummyPassword(password);
      throw invalidCredentials();
    }
    if (!(await verifyPassword(account.passwordHash, password))) {
      throw invalidCredentials();
    }
    return this.sessions.issue(account.userId);
  }

  // AC-14. 항상 202. 가입된 주소에만 메일을 보낸다
  async requestPasswordReset(email: string): Promise<void> {
    const normalized = normalizeEmail(email);
    if (!normalized.ok) return;
    const user = await this.repo.findUserByEmail(normalized.email);
    if (!user) return;

    const token = generateToken();
    await this.repo.insertEmailToken({
      userId: user.id,
      purpose: "reset_password",
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_PASSWORD_TTL_MS),
    });
    await this.send(resetPasswordMail(normalized.email, this.origin(), token));
  }

  // AC-15. 비밀번호 정책을 먼저 본다(토큰을 쓰고 나서 거부하면 사용자가 메일을 다시 받아야 한다)
  async confirmPasswordReset(
    token: string,
    newPassword: string,
  ): Promise<void> {
    if (!isValidPassword(newPassword)) throw weakPassword();
    if (!isWellFormedToken(token)) throw invalidToken();
    const passwordHash = await hashPassword(newPassword);
    const done = await this.repo.resetPassword(
      hashToken(token),
      passwordHash,
      new Date(),
    );
    if (!done) throw invalidToken();
  }

  // AC-06. 토큰은 유효한데 사용자가 없으면(삭제 등) 로그인이 필요하다
  async me(userId: string): Promise<Me> {
    const user = await this.repo.findMe(userId);
    if (!user) throw unauthenticated();
    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerifiedAt !== null,
    };
  }

  // 발송 실패는 응답을 바꾸지 않는다(가입은 유지, 사용자가 재발송). 주소는 가려서 남긴다
  private async send(message: MailMessage) {
    try {
      await this.mail.send(message);
    } catch (error) {
      logger.error(
        `mail send failed: to=${maskEmail(message.to)} subject=${message.subject}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private origin() {
    this.webOrigin ??= loadEnv().webOrigin ?? LOCAL_WEB_ORIGIN;
    return this.webOrigin;
  }
}

function invalidCredentials() {
  return new ApiException(
    HttpStatus.UNAUTHORIZED,
    "INVALID_CREDENTIALS",
    "이메일 또는 비밀번호가 맞지 않아요.",
  );
}

function invalidEmail() {
  return new ApiException(
    HttpStatus.BAD_REQUEST,
    "INVALID_EMAIL",
    "올바른 이메일 주소가 아니에요.",
  );
}

function weakPassword() {
  return new ApiException(
    HttpStatus.BAD_REQUEST,
    "WEAK_PASSWORD",
    "비밀번호는 8자 이상 128자 이하로 입력해 주세요.",
  );
}

function invalidToken() {
  return new ApiException(
    HttpStatus.BAD_REQUEST,
    "INVALID_TOKEN",
    "링크가 만료되었거나 이미 사용되었어요. 다시 요청해 주세요.",
  );
}

function unauthenticated() {
  return new ApiException(
    HttpStatus.UNAUTHORIZED,
    "UNAUTHENTICATED",
    "로그인이 필요해요.",
  );
}
