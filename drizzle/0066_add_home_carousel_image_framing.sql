ALTER TABLE `homeCarouselSlides`
  ADD COLUMN `imageScale` decimal(4,2) NOT NULL DEFAULT 1.00,
  ADD COLUMN `imagePositionX` int NOT NULL DEFAULT 50,
  ADD COLUMN `imagePositionY` int NOT NULL DEFAULT 50;
