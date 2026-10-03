/*
SQLyog Community v13.3.1 (64 bit)
MySQL - 8.4.7 : Database - pharmacy
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`pharmacy` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `pharmacy`;

/*Table structure for table `batch` */

DROP TABLE IF EXISTS `batch`;

CREATE TABLE `batch` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `medicine_id` int unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `expiry_date` date NOT NULL,
  `cost` decimal(12,3) NOT NULL DEFAULT '0.000',
  `mrp` decimal(12,3) NOT NULL DEFAULT '0.000',
  `gst` decimal(6,2) NOT NULL DEFAULT '0.00',
  `is_active` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `medicine_id` (`medicine_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `batch` */

insert  into `batch`(`id`,`medicine_id`,`name`,`expiry_date`,`cost`,`mrp`,`gst`,`is_active`) values 
(1,1,'First B','2026-10-31',10.000,20.000,5.00,1),
(2,1,'q','2026-10-30',20.000,30.000,5.00,1),
(3,2,'w','2026-11-07',20.000,30.000,5.00,1),
(4,2,'qw','2026-10-15',20.000,30.000,5.00,1),
(5,1,'aq','2026-10-31',20.000,30.000,5.00,1),
(6,2,'sw','2026-11-07',20.000,30.000,5.00,1),
(7,3,'de','2026-11-07',20.000,30.000,5.00,1);

/*Table structure for table `company_details` */

DROP TABLE IF EXISTS `company_details`;

CREATE TABLE `company_details` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `shop_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `address` text,
  `gstin` varchar(255) DEFAULT NULL,
  `print_type` int NOT NULL DEFAULT '0',
  `printer_name` varchar(255) DEFAULT NULL,
  `bank_details` varchar(255) DEFAULT NULL,
  `barcode_printer` varchar(255) DEFAULT NULL,
  `billing_type` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `company_details` */

insert  into `company_details`(`id`,`shop_name`,`address`,`gstin`,`print_type`,`printer_name`,`bank_details`,`barcode_printer`,`billing_type`) values 
(2,'JASXBILL','Address','ASDFFD223SDDDDF',2,'','Bank Details','AP4909',2);

/*Table structure for table `generic_name` */

DROP TABLE IF EXISTS `generic_name`;

CREATE TABLE `generic_name` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `is_active` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `generic_name` */

insert  into `generic_name`(`id`,`name`,`is_active`) values 
(1,'First gen',1),
(2,'second gen',1),
(3,'third gen',1);

/*Table structure for table `medicine` */

DROP TABLE IF EXISTS `medicine`;

CREATE TABLE `medicine` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `generic_id` int unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `type_id` int unsigned NOT NULL,
  `hsn_code` varchar(20) DEFAULT NULL,
  `unit_id` int unsigned NOT NULL,
  `disc_type` int NOT NULL DEFAULT '2',
  `discount` decimal(12,3) NOT NULL DEFAULT '0.000',
  `is_active` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `generic_id` (`generic_id`),
  KEY `type_id` (`type_id`),
  KEY `unit_id` (`unit_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `medicine` */

insert  into `medicine`(`id`,`generic_id`,`name`,`type_id`,`hsn_code`,`unit_id`,`disc_type`,`discount`,`is_active`) values 
(1,1,'First med',2,'123',1,2,10.000,1),
(2,2,'second  med',1,'234',1,2,5.000,1),
(3,3,'Third Med',1,'345',1,2,0.000,1);

/*Table structure for table `medicine_type` */

DROP TABLE IF EXISTS `medicine_type`;

CREATE TABLE `medicine_type` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `is_active` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `medicine_type` */

insert  into `medicine_type`(`id`,`name`,`is_active`) values 
(1,'Medicine',1),
(2,'Liquid',1);

/*Table structure for table `purchase` */

DROP TABLE IF EXISTS `purchase`;

CREATE TABLE `purchase` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `pr_no` varchar(20) NOT NULL,
  `supplier_id` int unsigned NOT NULL,
  `po_id` int unsigned DEFAULT NULL,
  `invoice_no` varchar(40) NOT NULL,
  `invoice_date` date NOT NULL,
  `net_total` decimal(14,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`id`),
  KEY `supplier_id` (`supplier_id`),
  KEY `po_id` (`po_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `purchase` */

insert  into `purchase`(`id`,`pr_no`,`supplier_id`,`po_id`,`invoice_no`,`invoice_date`,`net_total`) values 
(1,'PE0001',2,3,'1','2026-10-03',630.000),
(2,'PE0002',2,3,'2','2026-10-03',210.000),
(3,'PE0003',1,2,'3','2026-10-03',6300.000);

/*Table structure for table `purchase_item` */

DROP TABLE IF EXISTS `purchase_item`;

CREATE TABLE `purchase_item` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `purchase_id` int unsigned NOT NULL,
  `medicine_id` int unsigned NOT NULL,
  `batch_id` int unsigned NOT NULL,
  `qty` decimal(12,3) NOT NULL,
  `free_qty` decimal(12,3) NOT NULL DEFAULT '0.000',
  `cost` decimal(12,3) NOT NULL DEFAULT '0.000',
  `mrp` decimal(12,3) NOT NULL DEFAULT '0.000',
  `gst` decimal(6,2) NOT NULL DEFAULT '0.00',
  `disc_per` decimal(6,2) NOT NULL DEFAULT '0.00',
  `net_total` decimal(14,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`id`),
  KEY `purchase_id` (`purchase_id`),
  KEY `batch_id` (`batch_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `purchase_item` */

insert  into `purchase_item`(`id`,`purchase_id`,`medicine_id`,`batch_id`,`qty`,`free_qty`,`cost`,`mrp`,`gst`,`disc_per`,`net_total`) values 
(1,1,1,2,20.000,0.000,20.000,30.000,5.00,0.00,420.000),
(2,1,2,3,10.000,0.000,20.000,30.000,5.00,0.00,210.000),
(3,2,2,4,10.000,0.000,20.000,30.000,5.00,0.00,210.000),
(4,3,1,5,100.000,0.000,20.000,30.000,5.00,0.00,2100.000),
(5,3,2,6,100.000,0.000,20.000,30.000,5.00,0.00,2100.000),
(6,3,3,7,100.000,0.000,20.000,30.000,5.00,0.00,2100.000);

/*Table structure for table `purchase_order` */

DROP TABLE IF EXISTS `purchase_order`;

CREATE TABLE `purchase_order` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `po_no` varchar(20) NOT NULL,
  `supplier_id` int unsigned NOT NULL,
  `po_date` date NOT NULL,
  `status` int NOT NULL DEFAULT '0',
  `note` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `supplier_id` (`supplier_id`),
  KEY `status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `purchase_order` */

insert  into `purchase_order`(`id`,`po_no`,`supplier_id`,`po_date`,`status`,`note`) values 
(1,'PO0001',1,'2026-10-03',2,''),
(2,'PO0002',1,'2026-10-03',3,''),
(3,'PO0003',2,'2026-10-03',3,''),
(4,'PO0004',1,'2026-10-03',1,'f');

/*Table structure for table `purchase_order_item` */

DROP TABLE IF EXISTS `purchase_order_item`;

CREATE TABLE `purchase_order_item` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `po_id` int unsigned NOT NULL,
  `medicine_id` int unsigned NOT NULL,
  `qty` decimal(12,3) NOT NULL,
  `received_qty` decimal(12,3) NOT NULL DEFAULT '0.000',
  `cost` decimal(12,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`id`),
  KEY `po_id` (`po_id`),
  KEY `medicine_id` (`medicine_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `purchase_order_item` */

insert  into `purchase_order_item`(`id`,`po_id`,`medicine_id`,`qty`,`received_qty`,`cost`) values 
(1,1,1,10.000,0.000,0.000),
(2,2,1,100.000,100.000,0.000),
(3,2,2,100.000,100.000,0.000),
(4,2,3,100.000,100.000,0.000),
(6,3,1,20.000,20.000,0.000),
(7,3,2,20.000,20.000,0.000),
(9,4,1,10.000,0.000,0.000);

/*Table structure for table `purchase_return` */

DROP TABLE IF EXISTS `purchase_return`;

CREATE TABLE `purchase_return` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `ret_no` varchar(20) NOT NULL,
  `supplier_id` int unsigned NOT NULL,
  `purchase_id` int unsigned DEFAULT NULL,
  `return_date` date NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `net_total` decimal(14,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`id`),
  KEY `supplier_id` (`supplier_id`),
  KEY `purchase_id` (`purchase_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `purchase_return` */

insert  into `purchase_return`(`id`,`ret_no`,`supplier_id`,`purchase_id`,`return_date`,`note`,`net_total`) values 
(1,'PR0001',2,1,'2026-10-03','',42.000);

/*Table structure for table `purchase_return_item` */

DROP TABLE IF EXISTS `purchase_return_item`;

CREATE TABLE `purchase_return_item` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `return_id` int unsigned NOT NULL,
  `purchase_item_id` int unsigned DEFAULT NULL,
  `medicine_id` int unsigned NOT NULL,
  `batch_id` int unsigned NOT NULL,
  `qty` decimal(12,3) NOT NULL,
  `cost` decimal(12,3) NOT NULL DEFAULT '0.000',
  `gst` decimal(6,2) NOT NULL DEFAULT '0.00',
  `net_total` decimal(14,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`id`),
  KEY `return_id` (`return_id`),
  KEY `batch_id` (`batch_id`),
  KEY `purchase_item_id` (`purchase_item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `purchase_return_item` */

insert  into `purchase_return_item`(`id`,`return_id`,`purchase_item_id`,`medicine_id`,`batch_id`,`qty`,`cost`,`gst`,`net_total`) values 
(1,1,1,1,2,2.000,20.000,5.00,42.000);

/*Table structure for table `stock` */

DROP TABLE IF EXISTS `stock`;

CREATE TABLE `stock` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `batch_id` int unsigned NOT NULL,
  `qty` decimal(12,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`id`),
  UNIQUE KEY `batch_id` (`batch_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `stock` */

insert  into `stock`(`id`,`batch_id`,`qty`) values 
(1,2,18.000),
(2,3,10.000),
(3,4,10.000),
(4,5,100.000),
(5,6,100.000),
(6,7,100.000);

/*Table structure for table `stock_transaction` */

DROP TABLE IF EXISTS `stock_transaction`;

CREATE TABLE `stock_transaction` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `batch_id` int unsigned NOT NULL,
  `medicine_id` int unsigned NOT NULL,
  `txn_date` date NOT NULL,
  `txn_type` varchar(30) NOT NULL,
  `ref_no` varchar(40) NOT NULL,
  `qty_in` decimal(12,3) NOT NULL DEFAULT '0.000',
  `qty_out` decimal(12,3) NOT NULL DEFAULT '0.000',
  `balance_qty` decimal(12,3) NOT NULL DEFAULT '0.000',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `batch_id` (`batch_id`),
  KEY `medicine_id` (`medicine_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `stock_transaction` */

insert  into `stock_transaction`(`id`,`batch_id`,`medicine_id`,`txn_date`,`txn_type`,`ref_no`,`qty_in`,`qty_out`,`balance_qty`,`created_at`) values 
(1,2,1,'2026-10-03','PURCHASE','PE0001',20.000,0.000,20.000,'2026-10-03 14:21:44'),
(2,3,2,'2026-10-03','PURCHASE','PE0001',10.000,0.000,10.000,'2026-10-03 14:21:44'),
(3,4,2,'2026-10-03','PURCHASE','PE0002',10.000,0.000,10.000,'2026-10-03 14:27:56'),
(4,5,1,'2026-10-03','PURCHASE','PE0003',100.000,0.000,100.000,'2026-10-03 14:28:47'),
(5,6,2,'2026-10-03','PURCHASE','PE0003',100.000,0.000,100.000,'2026-10-03 14:28:47'),
(6,7,3,'2026-10-03','PURCHASE','PE0003',100.000,0.000,100.000,'2026-10-03 14:28:47'),
(7,2,1,'2026-10-03','PURCHASE_RETURN','PR0001',0.000,2.000,18.000,'2026-10-03 14:40:06');

/*Table structure for table `supplier` */

DROP TABLE IF EXISTS `supplier`;

CREATE TABLE `supplier` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `is_active` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `supplier` */

insert  into `supplier`(`id`,`name`,`phone`,`address`,`is_active`) values 
(1,'new','','',1),
(2,'s','','',1);

/*Table structure for table `unit` */

DROP TABLE IF EXISTS `unit`;

CREATE TABLE `unit` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `is_active` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `unit` */

insert  into `unit`(`id`,`name`,`is_active`) values 
(1,'NOS',1),
(2,'ML',1),
(3,'MG',1),
(4,'GM',1);

/*Table structure for table `user_modules` */

DROP TABLE IF EXISTS `user_modules`;

CREATE TABLE `user_modules` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `module_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=latin1;

/*Data for the table `user_modules` */

insert  into `user_modules`(`id`,`module_name`) values 
(1,'User management'),
(2,'Admin'),
(3,'Master'),
(4,'Purchase'),
(5,'Stock Report');

/*Table structure for table `user_permission` */

DROP TABLE IF EXISTS `user_permission`;

CREATE TABLE `user_permission` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `module_id` int NOT NULL,
  `uid` int NOT NULL,
  `date` date DEFAULT NULL,
  `time` time DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `mod` (`module_id`),
  KEY `uid` (`uid`)
) ENGINE=InnoDB AUTO_INCREMENT=128 DEFAULT CHARSET=latin1;

/*Data for the table `user_permission` */

insert  into `user_permission`(`id`,`module_id`,`uid`,`date`,`time`) values 
(123,1,1,'2026-10-03','12:15:49'),
(124,2,1,'2026-10-03','12:15:49'),
(125,3,1,'2026-10-03','12:15:49'),
(126,4,1,'2026-10-03','12:15:49'),
(127,5,1,NULL,NULL);

/*Table structure for table `users` */

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `is_active` int DEFAULT '1',
  `fullName` varchar(255) DEFAULT NULL,
  `disc_per` int DEFAULT '100',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=latin1;

/*Data for the table `users` */

insert  into `users`(`id`,`user_name`,`password`,`is_active`,`fullName`,`disc_per`) values 
(1,'admin','aecbf9a63cec1e93327dfc212f31acdb31c4f5d10bedccf8fbb8b042a6f0f39155797bdd04517905ae5d98b69fdc452cdb61b018e10939740ec96f36e133d639',1,'admin',50),
(22,'demo','3c9909afec25354d551dae21590bb26e38d53f2173b8d3dc3eee4c047e7ab1c1eb8b85103e3be7ba613b31bb5c9c36214dc9f14a42fd7a2fdb84856bca5c44c2',1,'demo',100),
(23,'hi','3c9909afec25354d551dae21590bb26e38d53f2173b8d3dc3eee4c047e7ab1c1eb8b85103e3be7ba613b31bb5c9c36214dc9f14a42fd7a2fdb84856bca5c44c2',1,'hi',100),
(24,'saran','3c9909afec25354d551dae21590bb26e38d53f2173b8d3dc3eee4c047e7ab1c1eb8b85103e3be7ba613b31bb5c9c36214dc9f14a42fd7a2fdb84856bca5c44c2',1,'saran',100),
(25,'check','3c9909afec25354d551dae21590bb26e38d53f2173b8d3dc3eee4c047e7ab1c1eb8b85103e3be7ba613b31bb5c9c36214dc9f14a42fd7a2fdb84856bca5c44c2',1,'check',100);

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
