ALTER TABLE `cartItems`
  ADD COLUMN `selectedPaymentMethod` varchar(20) NOT NULL DEFAULT 'pix' AFTER `cardPriceAtCart`;
