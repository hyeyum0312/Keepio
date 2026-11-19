import { randomBytes } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Injectable } from "@nestjs/common";
import { loadEnv } from "../config/env.js";
import type { ImageType } from "./lib/image-type.js";
import { isThumbnailKey } from "./lib/signed-url.js";

// FEAT-010. 개발용 로컬 디스크 보관. 운영 스토리지(S3 등)는 배포 결정(D-12) 때 같은 메서드로 바꾼다.
// 파일 이름은 서버가 만든 무작위 키뿐이라 사용자 입력이 경로에 들어가지 않는다
@Injectable()
export class ThumbnailStorage {
  private dir?: string;

  // 폴더 이름이 .storage처럼 점으로 시작해도 파일 전송이 숨김 파일로 보지 않게, 보낼 때는 이 폴더를 root로 쓴다
  root(): string {
    this.dir ??= path.resolve(loadEnv().storageDir, "thumbnails");
    return this.dir;
  }

  async save(bytes: Buffer, type: ImageType): Promise<string> {
    const key = `${randomBytes(16).toString("hex")}.${type.ext}`;
    await mkdir(this.root(), { recursive: true });
    await writeFile(this.filePath(key), bytes, { flag: "wx" });
    return key;
  }

  // 키 형식을 다시 확인해 폴더 밖 경로가 만들어지지 않게 한다
  filePath(key: string): string {
    if (!isThumbnailKey(key)) throw new Error("invalid thumbnail key");
    return path.join(this.root(), key);
  }

  async remove(key: string | null | undefined): Promise<void> {
    if (!key || !isThumbnailKey(key)) return;
    await rm(this.filePath(key), { force: true });
  }
}
