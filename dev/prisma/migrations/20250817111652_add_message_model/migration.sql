-- CreateTable
CREATE TABLE `Message` (
    `id` VARCHAR(191) NOT NULL,
    `annonceId` VARCHAR(191) NULL,
    `annonceOwnerId` VARCHAR(191) NULL,
    `senderId` VARCHAR(191) NULL,
    `senderEmail` VARCHAR(191) NULL,
    `content` TEXT NOT NULL,
    `createdAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updatedAt` TIMESTAMP(6) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
