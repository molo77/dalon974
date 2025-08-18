-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: dalon974
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('161e8275-174a-426b-973d-4a4802a17706','dd603e76379221ba91b84400f79b4f4140b7332e2643184572f54a373672def6','2025-08-17 11:19:00.465','20250817111900_user_password_optional',NULL,NULL,'2025-08-17 11:19:00.429',1),('1f1daf28-0338-40de-9769-7c249f94c570','cb82ec6a6fbe72f35b7aa224fdc3476cbefbfcbf7c2f836c7065bf232f3eba51','2025-08-17 11:21:10.906','20250817112110_add_provider_id_to_user',NULL,NULL,'2025-08-17 11:21:10.869',1),('479d8982-2deb-4749-bc8b-ce31de036cb1','25f731813e7301f833532cb6e71087bd8331cb721e6aaaf6d9e4e4789d592fad','2025-08-17 08:25:44.701','20250817082544_init',NULL,NULL,'2025-08-17 08:25:44.544',1),('853228df-a923-49ea-be06-a423d75d24fc','e498ee22788aa60833d0f593eaa690f04ff8f9ffa8957b61d7cc1085e685ec13','2025-08-17 11:15:58.886','20250817111558_add_main_photo_idx_to_annonce',NULL,NULL,'2025-08-17 11:15:58.862',1),('bba4974a-bbd9-49f0-806f-a0636860e954','08f8f7f721e1a2537645a16d9c6da9cf6af2968dc355e3b51acd68982b38df41','2025-08-17 11:18:01.475','20250817111801_add_user_model',NULL,NULL,'2025-08-17 11:18:01.457',1),('cd8a71cd-8063-4ecf-abc2-aa8a05354c96','c9e59a5e636fcf2a34deb8b9014b786832a4d39b484f7176c98fb0335620fc05','2025-08-17 11:23:02.243','20250817112302_add_display_name_to_user',NULL,NULL,'2025-08-17 11:23:02.216',1),('faf30791-b632-4577-8e7c-dcca4ef16272','6912fd1e190c7c449b6f023681a822186d0120c4ef63d3e55bc56969cf45e0de','2025-08-17 11:16:52.794','20250817111652_add_message_model',NULL,NULL,'2025-08-17 11:16:52.775',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;

--
-- Table structure for table `annonce`
--

DROP TABLE IF EXISTS `annonce`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `annonce` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `imageUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photos` json DEFAULT NULL,
  `createdAt` timestamp(6) NULL DEFAULT NULL,
  `updatedAt` timestamp(6) NULL DEFAULT NULL,
  `mainPhotoIdx` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `annonce`
--

/*!40000 ALTER TABLE `annonce` DISABLE KEYS */;
INSERT INTO `annonce` VALUES ('1Ejc2yp1jW4UuH3AeAWr',NULL,NULL,'Exemple d’annonce pour Salazie. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.239000',NULL,NULL),('1un9KqWKN6jAFqrL5rqv',NULL,NULL,'Exemple d’annonce pour Sainte-Marie. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.422000',NULL,NULL),('25fieTLQs1YxGjpGLx3e',NULL,NULL,'Exemple d’annonce pour Salazie. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.469000',NULL,NULL),('2F2Sd1SxjiSPErI4pleF',NULL,NULL,'Exemple d’annonce pour Cilaos. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.631000',NULL,NULL),('2H7S8j1q0FO1zcTmDPUZ',NULL,NULL,'Exemple d’annonce située à La Chaloupe (Saint-Leu). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.710000',NULL,NULL),('3Bh1CmkVn9ipNBrhgme4',NULL,NULL,'Exemple d’annonce située à La Saline-les-Hauts (Saint-Paul). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.347000',NULL,NULL),('5HUJdnbkXMdMl73ZYot0',NULL,NULL,'Exemple d’annonce pour Saint-Louis. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.150000',NULL,NULL),('6DiS3oPGwTN6R6hsJfRN',NULL,NULL,'Exemple d’annonce pour Saint-Louis. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.614000',NULL,NULL),('6Rv2YJtXrra8OFeiXAlr',NULL,NULL,'Exemple d’annonce pour Le Tampon. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.175000',NULL,NULL),('7nuUaLsOlTCPRHIxuEiC',NULL,NULL,'Exemple d’annonce située à La Plaine des Cafres (Le Tampon). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.430000',NULL,NULL),('7YjZaHGPUtdLHZi5eMVm',NULL,NULL,'Exemple d’annonce pour Saint-André. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.217000',NULL,NULL),('8nHHizzzYVNj2mpFqhGe','u2fDeHrfhaTWJmMiq4m4xLxF5Bw1',NULL,NULL,'/uploads/1755412992544-l9jgw7-20181214_100958.jpg','[\"/uploads/1755412992544-l9jgw7-20181214_100958.jpg\", \"/uploads/1755413002746-jw8q5o-tmp_a18f92de-2243-4a25-a5c4-fee44e52e529.jpeg\", \"/uploads/1755413002810-kf7yth-Title__1_.jpg\"]','2025-08-17 02:43:43.469000',NULL,NULL),('9wEt82HmPOLnY5vurcwk',NULL,NULL,'Exemple d’annonce pour Bras-Panon. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:34.954000',NULL,NULL),('Ab6LvXjebAwYF3GvFjr4',NULL,NULL,'Exemple d’annonce située à La Plaine des Cafres (Le Tampon). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.929000',NULL,NULL),('AIZNNH18oMj2Edlf7lm9',NULL,NULL,'Exemple d’annonce pour Saint-Paul. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.054000',NULL,NULL),('aLijxgMSJDNWFBDHNpoX',NULL,NULL,'Exemple d’annonce pour La Possession. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.542000',NULL,NULL),('aORjJODi6Szo0Yl3gNck',NULL,NULL,'Exemple d’annonce située à La Montagne (Saint-Denis). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.587000',NULL,NULL),('aoX0jpG83cQZTmDdrCDT',NULL,NULL,'Exemple d’annonce pour Sainte-Rose. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:34.995000',NULL,NULL),('AW9yCN85gMv6FNjf3uYq',NULL,NULL,'Exemple d’annonce pour Bras-Panon. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.457000',NULL,NULL),('az2ZncxNvYlfiCtu6WpZ',NULL,NULL,'Exemple d’annonce située à La Rivière (Saint-Louis). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.744000',NULL,NULL),('b7Va3BV0beL0rT02YjaY',NULL,NULL,'Exemple d’annonce pour La Plaine-des-Palmistes. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.493000',NULL,NULL),('BelBiGlfkU0yOO1K0uiD',NULL,NULL,'Exemple d’annonce pour Entre-Deux. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.677000',NULL,NULL),('Bh8gsEmpwBvseGvGyay7',NULL,NULL,'Exemple d’annonce pour Trois-Bassins. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.394000',NULL,NULL),('bVnbCzZLECYs1JcaKb8i',NULL,NULL,'Exemple d’annonce située à La Chaloupe (Saint-Leu). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.880000',NULL,NULL),('bW21M1MvPx9GllGJimSv',NULL,NULL,'Exemple d’annonce située à La Chaloupe (Saint-Leu). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.382000',NULL,NULL),('BwEBK3AMZOufPRZEOWRS',NULL,NULL,'Exemple d’annonce située à Saint-Gilles-les-Bains (Saint-Paul). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.299000',NULL,NULL),('c4CUijNBXnnElrtxTrMS',NULL,NULL,'Exemple d’annonce située à L\'Hermitage-les-Bains (Saint-Paul). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.802000',NULL,NULL),('cDabqS7GOeXpYgHhhx7v',NULL,NULL,'Exemple d’annonce pour Entre-Deux. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.529000',NULL,NULL),('CEhaHXvNnojQd6kcEBVJ',NULL,NULL,'Exemple d’annonce pour Sainte-Suzanne. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.206000',NULL,NULL),('cG0hszoGmR9tjAinqeDd',NULL,NULL,'Exemple d’annonce située à Sainte-Clotilde (Saint-Denis). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.261000',NULL,NULL),('cJTetlnsVuup1UMTARcY',NULL,NULL,'Exemple d’annonce située à Saint-Gilles-les-Hauts (Saint-Paul). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.814000',NULL,NULL),('cLIXbn7pgCkg38kiyLvZ',NULL,NULL,'Exemple d’annonce située à L\'Étang-Salé-les-Bains (L\'Étang-Salé). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.406000',NULL,NULL),('crJTeu7oYdYRWzxpDTA4',NULL,NULL,'Exemple d’annonce pour Bras-Panon. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.228000',NULL,NULL),('CSN5wh19qANuwajf8RqB',NULL,NULL,'Exemple d’annonce pour Saint-Pierre. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.688000',NULL,NULL),('cusTVG4RkPaeS4WwAHmh',NULL,NULL,'Exemple d’annonce pour Saint-Pierre. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.543000',NULL,NULL),('dY2Pc5hiGYNORjXJJz1w',NULL,NULL,'Exemple d’annonce pour Salazie. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:34.964000',NULL,NULL),('ehHUpr5PfeA6ofZX1kQ8',NULL,NULL,'Exemple d’annonce située à Saint-Gilles-les-Bains (Saint-Paul). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.611000',NULL,NULL),('EYXzguLFuo8KOiagOVJz',NULL,NULL,'Exemple d’annonce située à Plateau-Caillou (Saint-Paul). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.699000',NULL,NULL),('F8MEZpn579iyBABw5icr',NULL,NULL,'Exemple d’annonce située à La Plaine des Cafres (Le Tampon). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.755000',NULL,NULL),('Flh1Wijx8d9Ci46TOQDx',NULL,NULL,'Exemple d’annonce pour Les Avirons. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.128000',NULL,NULL),('fU4G5uSjWLQXK5DBeXxx',NULL,NULL,'Exemple d’annonce située à La Montagne (Saint-Denis). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.272000',NULL,NULL),('FzR6suO6Vi4DYj3BXQKX',NULL,NULL,'Exemple d’annonce pour Sainte-Rose. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.505000',NULL,NULL),('GAsm2FgfGBFJkUYympuA',NULL,NULL,'Exemple d’annonce pour Le Port. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.528000',NULL,NULL),('gPGq2HlVLkYn4B7izG5D',NULL,NULL,'Exemple d’annonce pour Saint-Denis. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.406000',NULL,NULL),('H3yglCJVd6VLIcJpGJlS',NULL,NULL,'Exemple d’annonce située à Dos d\'Âne (La Possession). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.287000',NULL,NULL),('H7M1YLG5d0aOV6diDJsl',NULL,NULL,'Exemple d’annonce pour Saint-Joseph. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.566000',NULL,NULL),('hsnGqLCUP8cKU61jb9ey',NULL,NULL,'Exemple d’annonce pour Saint-Paul. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.383000',NULL,NULL),('iB9CAGj5E0tmpAJZd4ms',NULL,NULL,'Exemple d’annonce pour Saint-Denis. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.177000',NULL,NULL),('IfvQ11vIA7aJBWZDNvQ3',NULL,NULL,'Exemple d’annonce pour Sainte-Rose. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.271000',NULL,NULL),('iG7e5Y2UlMsG307b0DUh',NULL,NULL,'Exemple d’annonce située à L\'Étang-Salé-les-Bains (L\'Étang-Salé). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.733000',NULL,NULL),('Iqjj6a3Itt6PfBP3af4U',NULL,NULL,'Exemple d’annonce située à La Montagne (Saint-Denis). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.768000',NULL,NULL),('IRzX311qn2tUy52xfw4X',NULL,NULL,'Exemple d’annonce pour Petite-Île. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.703000',NULL,NULL),('iym8fJRucAnQz4zhpiP2',NULL,NULL,'Exemple d’annonce pour La Possession. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.370000',NULL,NULL),('J4uDluwJcdet8OnQT5Am',NULL,NULL,'Exemple d’annonce pour Trois-Bassins. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.064000',NULL,NULL),('Jjgm5uQfHovxD3CFfTuN',NULL,NULL,'Exemple d’annonce pour Saint-Philippe. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.285000',NULL,NULL),('JPwaiuGSt84RA2XCGVQk',NULL,NULL,'Exemple d’annonce pour Le Tampon. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.517000',NULL,NULL),('K96ASdVMccZXK1PSCAlX',NULL,NULL,'Exemple d’annonce pour Saint-Benoît. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.249000',NULL,NULL),('Ki8pxdFDf1jhLa7ZPFOh',NULL,NULL,'Exemple d’annonce pour La Possession. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.044000',NULL,NULL),('kNlImt1KzfdlZkfc71DD',NULL,NULL,'Exemple d’annonce pour L\'Étang-Salé. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.139000',NULL,NULL),('KRNzPZ7G95SbXFNff2Rg',NULL,NULL,'Exemple d’annonce pour Trois-Bassins. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.564000',NULL,NULL),('KXPXW0LJ4mdMjZ0BMKtV',NULL,NULL,'Exemple d’annonce pour L\'Étang-Salé. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.603000',NULL,NULL),('L1F7YHaJDocmhD5t1yde',NULL,NULL,'Exemple d’annonce pour Saint-Pierre. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.196000',NULL,NULL),('ltAP47znkiw0PheKWdpG',NULL,NULL,'Exemple d’annonce pour Sainte-Marie. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:34.916000',NULL,NULL),('mAh2KVR7DOIX4dRwYXMJ',NULL,NULL,'Exemple d’annonce située à Piton Saint-Leu (Saint-Leu). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.722000',NULL,NULL),('mehauVMrq9U8sdMPXXLB',NULL,NULL,'Exemple d’annonce située à Sainte-Clotilde (Saint-Denis). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.576000',NULL,NULL),('mLkgNpSxmX53H5St7AYl',NULL,NULL,'Exemple d’annonce située à Bois-de-Nèfles Saint-Paul (Saint-Paul). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.688000',NULL,NULL),('MMRmGUTjoF9fh5mV2stp',NULL,NULL,'Exemple d’annonce située à Piton Saint-Leu (Saint-Leu). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.394000',NULL,NULL),('mXt60wgx3LZCAVVvaRtE',NULL,NULL,'Exemple d’annonce pour Saint-Leu. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.074000',NULL,NULL),('nEZqY25jNzOEgJsAqGFB',NULL,NULL,'Exemple d’annonce pour Saint-Paul. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.553000',NULL,NULL),('NXbCJp3JZ0O1RZt4s7mu',NULL,NULL,'Exemple d’annonce pour Sainte-Marie. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.194000',NULL,NULL),('nZHUCNPve5uMmuz4tKWU',NULL,NULL,'Exemple d’annonce pour Saint-Leu. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.575000',NULL,NULL),('oBGj6M5kBNH53ID39uQb',NULL,NULL,'Exemple d’annonce située à La Rivière (Saint-Louis). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.918000',NULL,NULL),('OhjOSkujIka8ZEcyaTIC',NULL,NULL,'Exemple d’annonce située à Piton Saint-Leu (Saint-Leu). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.895000',NULL,NULL),('Ojy24FSVbw49I6wNunJ2',NULL,NULL,'Exemple d’annonce située à La Rivière (Saint-Louis). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.419000',NULL,NULL),('oSEwRbjCuOQgPgGkqRaN',NULL,NULL,'Exemple d’annonce située à La Saline (Saint-Paul). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.335000',NULL,NULL),('pcI5k633jf04Z4LZkGBX',NULL,NULL,'Exemple d’annonce pour Les Avirons. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.586000',NULL,NULL),('PduNpS2qVi0wEU2BJhy7',NULL,NULL,'Exemple d’annonce pour La Plaine-des-Palmistes. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.260000',NULL,NULL),('pHjraZokdMOC8ck5Froc',NULL,NULL,'Exemple d’annonce située à Terre-Sainte (Saint-Pierre). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.939000',NULL,NULL),('PSlZmCUN8EMjo8a1UFGC',NULL,NULL,'Exemple d’annonce pour Entre-Deux. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.185000',NULL,NULL),('pVyLUOGo2jvpPHjUFPPp',NULL,NULL,'Exemple d’annonce située à Sainte-Clotilde (Saint-Denis). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.757000',NULL,NULL),('q5ddzJn6fNIwSwR4llL0',NULL,NULL,'Exemple d’annonce située à Saint-Gilles-les-Hauts (Saint-Paul). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.653000',NULL,NULL),('Q7CB4C5HigfoRQcaKSHg',NULL,NULL,'Exemple d’annonce pour Sainte-Suzanne. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.432000',NULL,NULL),('QhfRvQ2L4WP0dgNQ7IMe',NULL,NULL,'Exemple d’annonce située à Bois-de-Nèfles Saint-Paul (Saint-Paul). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.848000',NULL,NULL),('qHwoi7ZHy1gpQdUWn1hR',NULL,NULL,'Exemple d’annonce pour La Plaine-des-Palmistes. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:34.984000',NULL,NULL),('QlxzS8yOOjRhq7EanwNb',NULL,NULL,'Exemple d’annonce pour Saint-Philippe. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.517000',NULL,NULL),('R40sbcVBGJnrGZBJmPyr',NULL,NULL,'Exemple d’annonce pour Petite-Île. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.240000',NULL,NULL),('rCwYT9xt5dgiIM6afDO3',NULL,NULL,'Exemple d’annonce située à Plateau-Caillou (Saint-Paul). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.371000',NULL,NULL),('rKwvBK8Lukg6WYHslfaw',NULL,NULL,'Exemple d’annonce pour Saint-Joseph. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.251000',NULL,NULL),('rmF0rEb9QS1zp4Q0erPP',NULL,NULL,'Exemple d’annonce située à La Saline-les-Hauts (Saint-Paul). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.676000',NULL,NULL),('ruU45az3ibBzaudKyHo7',NULL,NULL,'Exemple d’annonce pour Saint-André. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:34.943000',NULL,NULL),('rzWbDL0HcVwK4xzW6A0n',NULL,NULL,'Exemple d’annonce située à Saint-Gilles-les-Bains (Saint-Paul). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.790000',NULL,NULL),('sAkGawYexHgJKvGUIUTF',NULL,NULL,'Exemple d’annonce pour Cilaos. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.457000',NULL,NULL),('sE8cTk2tJPPZBEq30e15',NULL,NULL,'Exemple d’annonce pour Le Port. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.032000',NULL,NULL),('sIRPqaLQj4gPw39s1RFm',NULL,NULL,'Exemple d’annonce pour Cilaos. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.163000',NULL,NULL),('sqWrEgkyYUcJEc4SMi5r',NULL,NULL,'Exemple d’annonce pour Saint-Benoît. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:34.974000',NULL,NULL),('sww3K2fxanT4YEIudB4N',NULL,NULL,'Exemple d’annonce située à La Saline (Saint-Paul). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.825000',NULL,NULL),('tqT6quLn7ijL0YsE9AED',NULL,NULL,'Exemple d’annonce pour Le Tampon. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.642000',NULL,NULL),('U3k2XwRVlLTGz1QGSX7u',NULL,NULL,'Exemple d’annonce pour Les Avirons. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.419000',NULL,NULL),('U6aRgIWjEStMxZqFCWjk',NULL,NULL,'Exemple d’annonce pour L\'Étang-Salé. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.433000',NULL,NULL),('UAIs4bQfAKbdOXixNkF9',NULL,NULL,'Exemple d’annonce pour Petite-Île. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.554000',NULL,NULL),('UgyDbSqggpy11Cs2rq9j',NULL,NULL,'Exemple d’annonce située à Saint-Gilles-les-Hauts (Saint-Paul). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.324000',NULL,NULL),('vGVv648n66UlbpGn3I4H',NULL,NULL,'Exemple d’annonce située à L\'Hermitage-les-Bains (Saint-Paul). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.312000',NULL,NULL),('w2zXv38uOyjDaPYSZeEz',NULL,NULL,'Exemple d’annonce pour Saint-Denis. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:34.904000',NULL,NULL),('WbJw0bkL4BS7CH9bQCaP',NULL,NULL,'Exemple d’annonce située à Terre-Sainte (Saint-Pierre). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.442000',NULL,NULL),('WwXoMoU14SUyLbJw5k2l',NULL,NULL,'Exemple d’annonce située à L\'Hermitage-les-Bains (Saint-Paul). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.622000',NULL,NULL),('wyBFs0vyiJhuJnqvWLqN',NULL,NULL,'Exemple d’annonce située à Dos d\'Âne (La Possession). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.779000',NULL,NULL),('XICcguJJidc7lWLqBAjt',NULL,NULL,'Exemple d’annonce pour Le Port. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.356000',NULL,NULL),('xNnBj7Xs9WlQZpB1Dk4o',NULL,NULL,'Exemple d’annonce située à Plateau-Caillou (Saint-Paul). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.869000',NULL,NULL),('XuzVOFPto2NzBI3n71Nv',NULL,NULL,'Exemple d’annonce pour Sainte-Suzanne. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:34.928000',NULL,NULL),('xV9xnWiwovsvQ5NM51xa',NULL,NULL,'Exemple d’annonce pour Saint-Louis. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.444000',NULL,NULL),('yjEOwcbZlKPHvtYPL18q',NULL,NULL,'Exemple d’annonce pour Saint-André. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.445000',NULL,NULL),('YMMs97yPjdDM7lzwAPDw',NULL,NULL,'Exemple d’annonce pour Saint-Joseph. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.746000',NULL,NULL),('YvsYarNIfjvAOtEUEhqe',NULL,NULL,'Exemple d’annonce située à La Saline (Saint-Paul). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.664000',NULL,NULL),('Z6PrBMCLMQHqfbza7yiw',NULL,NULL,'Exemple d’annonce située à Terre-Sainte (Saint-Pierre). Quartier agréable, bien desservi.','/uploads/1755404885768-mioer9-20181218_140500.jpg','[]','2025-08-16 13:03:36.785000',NULL,NULL),('ZAdtQwVbmQZBHsNgFKaE',NULL,NULL,'Exemple d’annonce pour Saint-Philippe. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.005000',NULL,NULL),('Zfvzo9I8cKs4mryQRmZ5',NULL,NULL,'Exemple d’annonce située à La Saline-les-Hauts (Saint-Paul). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.837000',NULL,NULL),('zgaJCDL8Kb3xNOqC5e5L',NULL,NULL,'Exemple d’annonce pour Saint-Benoît. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.481000',NULL,NULL),('zNGJ4nwBkmBqhc0Iurll',NULL,NULL,'Exemple d’annonce située à Dos d\'Âne (La Possession). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.598000',NULL,NULL),('zNWpiB3TPIZ9otnsDOFR',NULL,NULL,'Exemple d’annonce située à Bois-de-Nèfles Saint-Paul (Saint-Paul). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:35.359000',NULL,NULL),('zphYBRn9YruARheEaWJ7',NULL,NULL,'Exemple d’annonce pour Saint-Leu. Proche commodités, colocation conviviale.','/images/annonce-holder.svg','[]','2025-08-16 13:03:36.405000',NULL,NULL),('ZR4E4meUCBeWGvRC0F2W',NULL,NULL,'Exemple d’annonce située à L\'Étang-Salé-les-Bains (L\'Étang-Salé). Quartier agréable, bien desservi.','/images/annonce-holder.svg','[]','2025-08-16 13:03:33.906000',NULL,NULL);
/*!40000 ALTER TABLE `annonce` ENABLE KEYS */;

--
-- Table structure for table `annonceimage`
--

DROP TABLE IF EXISTS `annonceimage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `annonceimage` (
  `id` int NOT NULL AUTO_INCREMENT,
  `url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `filename` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` timestamp(6) NULL DEFAULT NULL,
  `uploadedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isMain` tinyint(1) NOT NULL DEFAULT '0',
  `size` int DEFAULT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `storagePath` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `annonceId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `AnnonceImage_annonceId_fkey` (`annonceId`),
  CONSTRAINT `AnnonceImage_annonceId_fkey` FOREIGN KEY (`annonceId`) REFERENCES `annonce` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `annonceimage`
--

/*!40000 ALTER TABLE `annonceimage` DISABLE KEYS */;
/*!40000 ALTER TABLE `annonceimage` ENABLE KEYS */;

--
-- Table structure for table `colocautosavequeue`
--

DROP TABLE IF EXISTS `colocautosavequeue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `colocautosavequeue` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` json NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `colocautosavequeue`
--

/*!40000 ALTER TABLE `colocautosavequeue` DISABLE KEYS */;
/*!40000 ALTER TABLE `colocautosavequeue` ENABLE KEYS */;

--
-- Table structure for table `colocimage`
--

DROP TABLE IF EXISTS `colocimage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `colocimage` (
  `id` int NOT NULL AUTO_INCREMENT,
  `url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `filename` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` timestamp(6) NULL DEFAULT NULL,
  `uploadedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isMain` tinyint(1) NOT NULL DEFAULT '0',
  `size` int DEFAULT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `storagePath` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `colocProfileId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ColocImage_colocProfileId_fkey` (`colocProfileId`),
  CONSTRAINT `ColocImage_colocProfileId_fkey` FOREIGN KEY (`colocProfileId`) REFERENCES `colocprofile` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `colocimage`
--

/*!40000 ALTER TABLE `colocimage` DISABLE KEYS */;
INSERT INTO `colocimage` VALUES (1,'/uploads/1755413144919-6zno5e-20181221_141209.jpg','20181221_141209.jpg','2025-08-17 02:45:44.968000',NULL,0,NULL,NULL,NULL,'u2fDeHrfhaTWJmMiq4m4xLxF5Bw1'),(2,'/uploads/1755413144835-tigtit-20181221_141237.jpg','20181221_141237.jpg','2025-08-17 02:45:44.961000',NULL,0,NULL,NULL,NULL,'u2fDeHrfhaTWJmMiq4m4xLxF5Bw1'),(3,'/uploads/1755413144901-p11jlm-20190107_113729.jpg','20190107_113729.jpg','2025-08-17 02:45:44.963000',NULL,1,NULL,NULL,NULL,'u2fDeHrfhaTWJmMiq4m4xLxF5Bw1'),(4,'/uploads/1755413144848-z7t9le-20181221_141144.jpg','20181221_141144.jpg','2025-08-17 02:45:44.966000',NULL,0,NULL,NULL,NULL,'u2fDeHrfhaTWJmMiq4m4xLxF5Bw1'),(5,'/uploads/1755413144810-dhn18q-7fb99ce3-b057-4133-a13d-1071f4948ec0.jpg','7fb99ce3-b057-4133-a13d-1071f4948ec0.jpg','2025-08-17 02:45:44.955000',NULL,0,NULL,NULL,NULL,'u2fDeHrfhaTWJmMiq4m4xLxF5Bw1');
/*!40000 ALTER TABLE `colocimage` ENABLE KEYS */;

--
-- Table structure for table `colocprofile`
--

DROP TABLE IF EXISTS `colocprofile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `colocprofile` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `imageUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photos` json DEFAULT NULL,
  `mainPhotoIdx` int DEFAULT NULL,
  `createdAt` timestamp(6) NULL DEFAULT NULL,
  `updatedAt` timestamp(6) NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `colocprofile`
--

/*!40000 ALTER TABLE `colocprofile` DISABLE KEYS */;
INSERT INTO `colocprofile` VALUES ('seed-1755363821191-0',NULL,NULL,'Je cherche une colocation à Saint-Denis. Étudiant(e), calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:40.254000','2025-08-16 13:03:40.254000'),('seed-1755363821191-1',NULL,NULL,'Je cherche une colocation à Sainte-Marie. Développeur(se), calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:40.271000','2025-08-16 13:03:40.271000'),('seed-1755363821191-10',NULL,NULL,'Je cherche une colocation à Le Port. Infirmier(ère), calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:40.449000','2025-08-16 13:03:40.449000'),('seed-1755363821191-11',NULL,NULL,'Je cherche une colocation à La Possession. Enseignant(e), calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:40.465000','2025-08-16 13:03:40.465000'),('seed-1755363821191-2',NULL,NULL,'Je cherche une colocation à Sainte-Suzanne. Infirmier(ère), calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:40.286000','2025-08-16 13:03:40.286000'),('seed-1755363821191-3',NULL,NULL,'Je cherche une colocation à Saint-André. Enseignant(e), calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:40.307000','2025-08-16 13:03:40.307000'),('seed-1755363821191-4',NULL,NULL,'Je cherche une colocation à Bras-Panon. Comptable, calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:40.321000','2025-08-16 13:03:40.321000'),('seed-1755363821191-5',NULL,NULL,'Je cherche une colocation à Salazie. Commercial(e), calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:40.337000','2025-08-16 13:03:40.337000'),('seed-1755363821191-6',NULL,NULL,'Je cherche une colocation à Saint-Benoît. Designer, calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:40.355000','2025-08-16 13:03:40.355000'),('seed-1755363821191-7',NULL,NULL,'Je cherche une colocation à La Plaine-des-Palmistes. Chef de projet, calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:40.400000','2025-08-16 13:03:40.400000'),('seed-1755363821191-8',NULL,NULL,'Je cherche une colocation à Sainte-Rose. Étudiant(e), calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:40.417000','2025-08-16 13:03:40.417000'),('seed-1755363821191-9',NULL,NULL,'Je cherche une colocation à Saint-Philippe. Développeur(se), calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:40.433000','2025-08-16 13:03:40.433000'),('seed-1755363822383-0',NULL,NULL,'Je cherche une colocation à Saint-Denis. Étudiant(e), calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:41.460000','2025-08-16 13:03:41.460000'),('seed-1755363822383-1',NULL,NULL,'Je cherche une colocation à Sainte-Marie. Développeur(se), calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:41.476000','2025-08-16 13:03:41.476000'),('seed-1755363822383-10',NULL,NULL,'Je cherche une colocation à Le Port. Infirmier(ère), calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:41.613000','2025-08-16 13:03:41.613000'),('seed-1755363822383-11',NULL,NULL,'Je cherche une colocation à La Possession. Enseignant(e), calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:41.628000','2025-08-16 13:03:41.628000'),('seed-1755363822383-2',NULL,NULL,'Je cherche une colocation à Sainte-Suzanne. Infirmier(ère), calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:41.493000','2025-08-16 13:03:41.493000'),('seed-1755363822383-3',NULL,NULL,'Je cherche une colocation à Saint-André. Enseignant(e), calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:41.508000','2025-08-16 13:03:41.508000'),('seed-1755363822383-4',NULL,NULL,'Je cherche une colocation à Bras-Panon. Comptable, calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:41.523000','2025-08-16 13:03:41.523000'),('seed-1755363822383-5',NULL,NULL,'Je cherche une colocation à Salazie. Commercial(e), calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:41.537000','2025-08-16 13:03:41.537000'),('seed-1755363822383-6',NULL,NULL,'Je cherche une colocation à Saint-Benoît. Designer, calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:41.552000','2025-08-16 13:03:41.552000'),('seed-1755363822383-7',NULL,NULL,'Je cherche une colocation à La Plaine-des-Palmistes. Chef de projet, calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:41.568000','2025-08-16 13:03:41.568000'),('seed-1755363822383-8',NULL,NULL,'Je cherche une colocation à Sainte-Rose. Étudiant(e), calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:41.583000','2025-08-16 13:03:41.583000'),('seed-1755363822383-9',NULL,NULL,'Je cherche une colocation à Saint-Philippe. Développeur(se), calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:41.597000','2025-08-16 13:03:41.597000'),('seed-1755363823356-0',NULL,NULL,'Je cherche une colocation à Saint-Denis. Étudiant(e), calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:42.445000','2025-08-16 13:03:42.445000'),('seed-1755363823356-1',NULL,NULL,'Je cherche une colocation à Sainte-Marie. Développeur(se), calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:42.463000','2025-08-16 13:03:42.463000'),('seed-1755363823356-10',NULL,NULL,'Je cherche une colocation à Le Port. Infirmier(ère), calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:42.608000','2025-08-16 13:03:42.608000'),('seed-1755363823356-11',NULL,NULL,'Je cherche une colocation à La Possession. Enseignant(e), calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:42.624000','2025-08-16 13:32:03.339000'),('seed-1755363823356-2',NULL,NULL,'Je cherche une colocation à Sainte-Suzanne. Infirmier(ère), calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:42.480000','2025-08-16 13:03:42.480000'),('seed-1755363823356-3',NULL,NULL,'Je cherche une colocation à Saint-André. Enseignant(e), calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:42.495000','2025-08-16 13:03:42.495000'),('seed-1755363823356-4',NULL,NULL,'Je cherche une colocation à Bras-Panon. Comptable, calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:42.512000','2025-08-16 13:03:42.512000'),('seed-1755363823356-5',NULL,NULL,'Je cherche une colocation à Salazie. Commercial(e), calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:42.531000','2025-08-16 13:03:42.531000'),('seed-1755363823356-6',NULL,NULL,'Je cherche une colocation à Saint-Benoît. Designer, calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:42.546000','2025-08-16 13:03:42.546000'),('seed-1755363823356-7',NULL,NULL,'Je cherche une colocation à La Plaine-des-Palmistes. Chef de projet, calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:42.561000','2025-08-16 13:03:42.561000'),('seed-1755363823356-8',NULL,NULL,'Je cherche une colocation à Sainte-Rose. Étudiant(e), calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:42.576000','2025-08-16 13:03:42.576000'),('seed-1755363823356-9',NULL,NULL,'Je cherche une colocation à Saint-Philippe. Développeur(se), calme et respectueux(se).','/images/coloc-holder.svg','[\"/images/coloc-holder.svg\"]',NULL,'2025-08-16 13:03:42.590000','2025-08-16 13:03:42.590000'),('u2fDeHrfhaTWJmMiq4m4xLxF5Bw1',NULL,NULL,NULL,'/uploads/1755413144901-p11jlm-20190107_113729.jpg','[\"/uploads/1755413144919-6zno5e-20181221_141209.jpg\", \"/uploads/1755413144835-tigtit-20181221_141237.jpg\", \"/uploads/1755413144901-p11jlm-20190107_113729.jpg\", \"/uploads/1755413144848-z7t9le-20181221_141144.jpg\", \"/uploads/1755413144810-dhn18q-7fb99ce3-b057-4133-a13d-1071f4948ec0.jpg\"]',NULL,'2025-08-17 02:45:29.688000','2025-08-17 03:00:18.985000');
/*!40000 ALTER TABLE `colocprofile` ENABLE KEYS */;

--
-- Table structure for table `message`
--

DROP TABLE IF EXISTS `message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `annonceId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `annonceOwnerId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `senderId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `senderEmail` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` timestamp(6) NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message`
--

/*!40000 ALTER TABLE `message` DISABLE KEYS */;
/*!40000 ALTER TABLE `message` ENABLE KEYS */;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` timestamp(6) NULL DEFAULT NULL,
  `providerId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `displayName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES ('a270b46a-0892-448c-bb86-1afa5cff85be','cedric.roddier@gmail.com','$2b$12$hcA/JVfQc7L2fZkCIlyQU.3zSP9m.vxrOrcOMfqK9exBqZbSbMgYO','cedric.roddier@gmail.com','user','2025-08-17 12:53:02.492000',NULL,NULL,NULL),('u2fDeHrfhaTWJmMiq4m4xLxF5Bw1','molo77@gmail.com',NULL,NULL,'admin','2025-08-17 07:31:17.808000',NULL,'google.com','Molo77 cedric');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;

--
-- Dumping routines for database 'dalon974'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-18 21:38:57
