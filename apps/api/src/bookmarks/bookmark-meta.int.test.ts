import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../app.module.js";
import { AccessTokenService } from "../auth/access-token.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { setupApp } from "../setup-app.js";
import { BookmarkThumbnailsService } from "./bookmark-thumbnails.service.js";
import { SafeFetchError } from "./lib/safe-fetch.js";
import {
  LinkPreviewFetcher,
  LinkPreviewHttpError,
} from "./link-preview.fetcher.js";

const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(64, 1),
]);
const JPG = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  Buffer.alloc(64, 2),
]);
const OG_PAGE = `<html><head>
  <meta property="og:title" content="Studio on Instagram: &quot;motion&quot;">
  <meta property="og:image" content="https://cdn.example.com/a.png">
</head></html>`;

const fetcher = {
  fetchPage: vi.fn<LinkPreviewFetcher["fetchPage"]>(),
  fetchImage: vi.fn<LinkPreviewFetcher["fetchImage"]>(),
};

describe("링크 저장 시 제목·태그와 썸네일 (실제 PostgreSQL, FEAT-010)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: AccessTokenService;
  let thumbnails: BookmarkThumbnailsService;
  let storageDir: string;
  let tempRoot: string;
  const userIds: string[] = [];

  beforeAll(async () => {
    // 기본값(.storage)처럼 점으로 시작하는 폴더 아래에 둔다(점 폴더 경로에서 이미지가 404였던 회귀 방지)
    tempRoot = await mkdtemp(path.join(tmpdir(), "keepio-thumbs-"));
    storageDir = path.join(tempRoot, ".storage");
    vi.stubEnv("STORAGE_DIR", storageDir);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(LinkPreviewFetcher)
      .useValue(fetcher)
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    tokens = app.get(AccessTokenService);
    thumbnails = app.get(BookmarkThumbnailsService);
  });

  beforeEach(() => {
    fetcher.fetchPage.mockReset().mockRejectedValue(new Error("offline"));
    fetcher.fetchImage.mockReset().mockRejectedValue(new Error("offline"));
  });

  afterAll(async () => {
    await thumbnails.drain();
    await prisma.bookmark.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
    await rm(tempRoot, { recursive: true, force: true });
    vi.unstubAllEnvs();
  });

  async function expectOnlyReferencedFiles() {
    const files = await readdir(path.join(storageDir, "thumbnails"));
    const used = await prisma.bookmark.findMany({
      where: { thumbnailKey: { in: files } },
      select: { thumbnailKey: true },
    });
    expect(files.sort()).toEqual(used.map((u) => u.thumbnailKey).sort());
  }

  async function newUser() {
    const user = await prisma.user.create({ data: {} });
    userIds.push(user.id);
    return user.id;
  }

  async function auth(userId: string) {
    return `Bearer ${await tokens.sign(userId)}`;
  }

  async function save(userId: string, body: object) {
    return request(app.getHttpServer())
      .post("/api/bookmarks")
      .set("Authorization", await auth(userId))
      .send(body);
  }

  async function list(userId: string) {
    const res = await request(app.getHttpServer())
      .get("/api/bookmarks")
      .set("Authorization", await auth(userId));
    return res.body.items as Array<Record<string, unknown>>;
  }

  async function upload(
    userId: string,
    id: string,
    bytes: Buffer,
    name = "a.png",
  ) {
    return request(app.getHttpServer())
      .put(`/api/bookmarks/${id}/thumbnail`)
      .set("Authorization", await auth(userId))
      .attach("file", bytes, name);
  }

  it("AC-01: 제목과 태그를 함께 저장하고 응답에 담는다(태그는 이름순)", async () => {
    const userId = await newUser();
    const res = await save(userId, {
      url: "https://example.com/a",
      title: "  랜딩   모션 ",
      tags: ["모션", "Landing"],
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: "랜딩 모션",
      displayTitle: "랜딩 모션",
      thumbnail: { status: "pending", url: null, sourceUrl: null },
    });
    expect(res.body.tags.map((t: { name: string }) => t.name)).toEqual([
      "Landing",
      "모션",
    ]);
  });

  it("AC-02: 같은 이름(대소문자·공백 차이)은 하나로 묶고 다음 저장에서도 같은 태그를 쓴다", async () => {
    const userId = await newUser();
    const first = await save(userId, {
      url: "https://example.com/b1",
      tags: ["Reel", " reel ", "REEL"],
    });
    const second = await save(userId, {
      url: "https://example.com/b2",
      tags: ["reel"],
    });

    expect(first.body.tags).toHaveLength(1);
    expect(second.body.tags[0].id).toBe(first.body.tags[0].id);
    expect(await prisma.tag.count({ where: { userId } })).toBe(1);
  });

  it("AC-01: 제목 100자·태그 30자를 넘으면 400, 태그 10개를 넘으면 422로 거부하고 저장하지 않는다", async () => {
    const userId = await newUser();
    const longTitle = await save(userId, {
      url: "https://example.com/c",
      title: "가".repeat(101),
    });
    const longTag = await save(userId, {
      url: "https://example.com/c",
      tags: ["가".repeat(31)],
    });
    const tooMany = await save(userId, {
      url: "https://example.com/c",
      tags: Array.from({ length: 11 }, (_, i) => `t${i}`),
    });

    expect(longTitle.status).toBe(400);
    expect(longTitle.body).toMatchObject({
      code: "VALIDATION_FAILED",
      message: "제목은 100자, 태그는 30자까지 입력할 수 있어요.",
    });
    expect(longTag.status).toBe(400);
    expect(tooMany.status).toBe(422);
    expect(tooMany.body.code).toBe("BOOKMARK_TAG_LIMIT");
    expect(await prisma.bookmark.count({ where: { userId } })).toBe(0);
  });

  it("AC-02: 사용자 태그가 500개를 넘게 되면 422 TAG_LIMIT이고 링크도 저장하지 않는다", async () => {
    const userId = await newUser();
    await prisma.tag.createMany({
      data: Array.from({ length: 499 }, (_, i) => ({
        userId,
        name: `t${i}`,
        normalizedName: `t${i}`,
      })),
    });

    const res = await save(userId, {
      url: "https://example.com/d",
      tags: ["new-1", "new-2"],
    });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe("TAG_LIMIT");
    expect(await prisma.bookmark.count({ where: { userId } })).toBe(0);
    expect(await prisma.tag.count({ where: { userId } })).toBe(499);
  });

  it("AC-03: 이미 저장된 링크는 200으로 돌려주고 제목·태그를 덮어쓰지 않는다", async () => {
    const userId = await newUser();
    await save(userId, {
      url: "https://example.com/e",
      title: "처음",
      tags: ["a"],
    });
    const again = await save(userId, {
      url: "https://example.com/e",
      title: "바꿈",
      tags: ["b"],
    });

    expect(again.status).toBe(200);
    expect(again.body.title).toBe("처음");
    expect(again.body.tags.map((t: { name: string }) => t.name)).toEqual(["a"]);
  });

  it("AC-08: 같은 인스타 게시물을 다른 장으로 공유해도 하나로 묶는다", async () => {
    const userId = await newUser();
    const a = await save(userId, {
      url: "https://www.instagram.com/p/Df4Gbo2kYej/?img_index=4&jplx=abc",
    });
    const b = await save(userId, {
      url: "https://www.instagram.com/p/Df4Gbo2kYej/?img_index=1",
    });

    expect(b.status).toBe(200);
    expect(b.body.id).toBe(a.body.id);
    expect(a.body.normalizedUrl).toBe(
      "https://www.instagram.com/p/Df4Gbo2kYej/",
    );
  });

  it("AC-04·07·09: og:image를 받아 보관하고(점 폴더 아래여도), 서명 주소로만 이미지를 준다. 제목이 없으면 og:title을 보여 준다", async () => {
    fetcher.fetchPage.mockResolvedValue({
      html: OG_PAGE,
      finalUrl: "https://www.instagram.com/p/X/",
    });
    fetcher.fetchImage.mockResolvedValue(PNG);
    const userId = await newUser();

    await save(userId, { url: "https://www.instagram.com/p/X/" });
    await thumbnails.drain();
    const [item] = await list(userId);

    expect(fetcher.fetchImage).toHaveBeenCalledWith(
      "https://cdn.example.com/a.png",
    );
    expect(item.displayTitle).toBe('Studio on Instagram: "motion"');
    const thumb = item.thumbnail as {
      status: string;
      url: string;
      sourceUrl: string;
    };
    expect(thumb.status).toBe("ready");
    expect(thumb.sourceUrl).toBe("https://cdn.example.com/a.png");

    const image = await request(app.getHttpServer()).get(thumb.url);
    expect(image.status).toBe(200);
    expect(image.headers["content-type"]).toBe("image/png");
    expect(Buffer.compare(image.body as Buffer, PNG)).toBe(0);

    const tampered = await request(app.getHttpServer()).get(`${thumb.url}x`);
    expect(tampered.status).toBe(404);
    const unsigned = await request(app.getHttpServer()).get(
      thumb.url.split("?")[0],
    );
    expect(unsigned.status).toBe(404);
  });

  it("AC-16·17: 모바일·PC 스마트스토어 상품을 하나로 묶고, 제목을 못 받으면 www.·m.을 뺀 사이트 이름을 보여 준다", async () => {
    const userId = await newUser();
    const a = await save(userId, {
      url: "https://m.smartstore.naver.com/nvnutra/products/13646818252?fbclid=PAV",
    });
    const b = await save(userId, {
      url: "https://smartstore.naver.com/nvnutra/products/13646818252?NaPm=ct%3D1",
    });

    expect(a.status).toBe(201);
    expect(b.status).toBe(200);
    expect(b.body.id).toBe(a.body.id);
    expect(a.body.normalizedUrl).toBe(
      "https://smartstore.naver.com/nvnutra/products/13646818252",
    );
    expect(a.body.displayTitle).toBe("smartstore.naver.com");
  });

  it("AC-15: 대표 이미지가 없어도 페이지가 알려 준 아이콘 주소(apple-touch-icon 우선)를 남기고, 서버는 아이콘을 받지 않는다", async () => {
    fetcher.fetchPage.mockResolvedValue({
      html: `<head><title>문서</title>
        <link rel="icon" href="/favicon-32.png" sizes="32x32">
        <link rel="apple-touch-icon" href="/apple.png"></head>`,
      finalUrl: "https://example.com/icon",
    });
    const userId = await newUser();

    await save(userId, { url: "https://example.com/icon" });
    await thumbnails.drain();
    const [item] = await list(userId);

    expect(item.faviconUrl).toBe("https://example.com/apple.png");
    expect(item.thumbnail).toEqual({
      status: "failed",
      url: null,
      sourceUrl: null,
    });
    expect(fetcher.fetchImage).not.toHaveBeenCalled();
  });

  it("AC-15: 페이지에 아이콘 태그가 없으면 faviconUrl은 null(화면이 /favicon.ico로 대체)", async () => {
    fetcher.fetchPage.mockResolvedValue({
      html: OG_PAGE,
      finalUrl: "https://example.com/noicon",
    });
    fetcher.fetchImage.mockResolvedValue(PNG);
    const userId = await newUser();

    await save(userId, { url: "https://example.com/noicon" });
    await thumbnails.drain();
    const [item] = await list(userId);

    expect(item.faviconUrl).toBeNull();
  });

  it("AC-05: 페이지나 이미지를 못 받으면 failed. 링크·제목·태그는 그대로다", async () => {
    fetcher.fetchPage.mockResolvedValue({
      html: OG_PAGE,
      finalUrl: "https://example.com/f",
    });
    fetcher.fetchImage.mockResolvedValue(Buffer.from("<html>not image</html>"));
    const userId = await newUser();

    await save(userId, {
      url: "https://example.com/f",
      title: "유지",
      tags: ["x"],
    });
    await thumbnails.drain();
    const [item] = await list(userId);

    // 이미지는 못 받았어도 원본 주소는 남겨 화면이 바로 불러 볼 수 있다(AC-11)
    expect(item.thumbnail).toEqual({
      status: "failed",
      url: null,
      sourceUrl: "https://cdn.example.com/a.png",
    });
    expect(item.title).toBe("유지");
    expect((item.tags as unknown[]).length).toBe(1);
  });

  it("AC-14: 일시적 실패(5xx·시간 초과)는 한 번 다시 받아 썸네일을 만든다", async () => {
    fetcher.fetchPage
      .mockRejectedValueOnce(new LinkPreviewHttpError(503))
      .mockResolvedValue({ html: OG_PAGE, finalUrl: "https://example.com/r" });
    fetcher.fetchImage
      .mockRejectedValueOnce(new SafeFetchError("timeout"))
      .mockResolvedValue(PNG);
    const userId = await newUser();

    await save(userId, { url: "https://example.com/r" });
    await thumbnails.drain();
    const [item] = await list(userId);

    expect(fetcher.fetchPage).toHaveBeenCalledTimes(2);
    expect(fetcher.fetchImage).toHaveBeenCalledTimes(2);
    expect((item.thumbnail as { status: string }).status).toBe("ready");
  });

  it("AC-14: 차단(403)은 다시 시도하지 않고, 일시적 실패도 한 번만 다시 시도한다", async () => {
    fetcher.fetchPage.mockRejectedValue(new LinkPreviewHttpError(403));
    const blocked = await newUser();
    await save(blocked, { url: "https://example.com/blocked" });
    await thumbnails.drain();
    expect(fetcher.fetchPage).toHaveBeenCalledTimes(1);

    fetcher.fetchPage
      .mockReset()
      .mockRejectedValue(new LinkPreviewHttpError(503));
    const down = await newUser();
    await save(down, { url: "https://example.com/down" });
    await thumbnails.drain();
    expect(fetcher.fetchPage).toHaveBeenCalledTimes(2);
    const [item] = await list(down);
    expect((item.thumbnail as { status: string }).status).toBe("failed");
  });

  it("AC-06: 직접 올리면 ready가 되고, 늦게 끝난 자동 수집이 덮어쓰지 않는다", async () => {
    let releasePage!: () => void;
    fetcher.fetchPage.mockImplementation(
      () =>
        new Promise((resolve) => {
          releasePage = () =>
            resolve({ html: OG_PAGE, finalUrl: "https://example.com/g" });
        }),
    );
    fetcher.fetchImage.mockResolvedValue(PNG);
    const userId = await newUser();
    const saved = await save(userId, { url: "https://example.com/g" });

    const up = await upload(userId, saved.body.id, JPG, "capture.jpg");
    expect(up.status).toBe(200);
    expect(up.body.thumbnail.status).toBe("ready");

    releasePage();
    await thumbnails.drain();
    const row = await prisma.bookmark.findUniqueOrThrow({
      where: { id: saved.body.id },
    });
    expect(row.thumbnailSource).toBe("upload");
    expect(row.thumbnailKey?.endsWith(".jpg")).toBe(true);
    // 자동으로 받은 파일은 지워서, 보관 폴더에는 북마크가 가리키는 파일만 남는다
    await expectOnlyReferencedFiles();
  });

  it("AC-06: 다시 올리면 이전 파일을 지운다", async () => {
    const userId = await newUser();
    const saved = await save(userId, { url: "https://example.com/h" });
    await thumbnails.drain();

    await upload(userId, saved.body.id, PNG);
    const first = await prisma.bookmark.findUniqueOrThrow({
      where: { id: saved.body.id },
    });
    await upload(userId, saved.body.id, JPG, "b.jpg");

    const files = await readdir(path.join(storageDir, "thumbnails"));
    expect(files).not.toContain(first.thumbnailKey);
    await expectOnlyReferencedFiles();
  });

  it("AC-06: 이미지가 아니면 400 UNSUPPORTED_IMAGE, 10MB를 넘으면 413 IMAGE_TOO_LARGE", async () => {
    const userId = await newUser();
    const saved = await save(userId, { url: "https://example.com/i" });

    const svg = await upload(
      userId,
      saved.body.id,
      Buffer.from("<svg></svg>"),
      "a.png",
    );
    expect(svg.status).toBe(400);
    expect(svg.body).toMatchObject({
      code: "UNSUPPORTED_IMAGE",
      message: "JPG·PNG·WEBP·GIF 이미지만 올릴 수 있어요.",
    });

    const big = await upload(
      userId,
      saved.body.id,
      Buffer.concat([PNG, Buffer.alloc(10 * 1024 * 1024)]),
    );
    expect(big.status).toBe(413);
    expect(big.body).toMatchObject({
      code: "IMAGE_TOO_LARGE",
      message: "이미지는 10MB까지 올릴 수 있어요.",
    });
  });

  it("AC-09: 남의 북마크에는 올릴 수 없다(404)", async () => {
    const owner = await newUser();
    const other = await newUser();
    const saved = await save(owner, { url: "https://example.com/j" });

    const res = await upload(other, saved.body.id, PNG);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("BOOKMARK_NOT_FOUND");
  });
});
