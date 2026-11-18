import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { BookmarkFilesController } from "./bookmark-files.controller.js";
import { BookmarkThumbnailsService } from "./bookmark-thumbnails.service.js";
import { BookmarksController } from "./bookmarks.controller.js";
import { BookmarksRepository } from "./bookmarks.repository.js";
import { BookmarksService } from "./bookmarks.service.js";
import {
  LinkPreviewFetcher,
  SafeLinkPreviewFetcher,
} from "./link-preview.fetcher.js";
import { ThumbnailStorage } from "./thumbnail.storage.js";

@Module({
  imports: [AuthModule],
  controllers: [BookmarksController, BookmarkFilesController],
  providers: [
    BookmarksService,
    BookmarksRepository,
    BookmarkThumbnailsService,
    ThumbnailStorage,
    { provide: LinkPreviewFetcher, useClass: SafeLinkPreviewFetcher },
  ],
})
export class BookmarksModule {}
