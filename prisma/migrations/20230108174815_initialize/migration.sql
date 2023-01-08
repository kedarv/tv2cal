-- CreateTable
CREATE TABLE "Episodes" (
    "name" TEXT NOT NULL,
    "season_number" INTEGER NOT NULL,
    "episode_number" INTEGER NOT NULL,
    "show_id" INTEGER NOT NULL,
    "air_date" TEXT,
    "episode_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Lists" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "shows" TEXT,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Shows" (
    "name" TEXT NOT NULL,
    "seasons" INTEGER NOT NULL,
    "show_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WatchedEpisodes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "list_id" INTEGER NOT NULL,
    "episode_id" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WatchedEpisodes_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "Episodes" ("episode_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WatchedEpisodes_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "Lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_Lists_1" ON "Lists"("name", "email");
Pragma writable_schema=0;

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_WatchedEpisodes_1" ON "WatchedEpisodes"("list_id", "episode_id");
Pragma writable_schema=0;
