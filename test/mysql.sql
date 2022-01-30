DROP DATABASE IF EXISTS `js_batis_test_db`;

CREATE DATABASE IF NOT EXISTS `js_batis_test_db`;

CREATE TABLE IF NOT EXISTS `js_batis_test_db`.`language` (
  `language_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`language_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `js_batis_test_db`.`film_language` (
  `film_id` bigint(20) NOT NULL,
  `language_id` bigint(20) NOT NULL,
  PRIMARY KEY (`film_id`,`language_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `js_batis_test_db`.`film_actor` (
  `film_id` bigint(20) NOT NULL,
  `actor_id` bigint(20) NOT NULL,
  PRIMARY KEY (`film_id`,`actor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `js_batis_test_db`.`film` (
  `film_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `film_title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `release_year` smallint(255) unsigned NOT NULL,
  `category` varchar(32) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`film_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `js_batis_test_db`.`actor` (
  `actor_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `last_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `active` smallint(6) NOT NULL DEFAULT '0',
  PRIMARY KEY (`actor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci; 

CREATE TABLE `js_batis_test_db`.`insert_test` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `js_batis_test_db`.`insert_test2` (
  `id` bigint(20) NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `js_batis_test_db`.`language` (`language_id`, `name`) VALUES (1, 'Language1') ON DUPLICATE KEY UPDATE language_id=language_id;
INSERT INTO `js_batis_test_db`.`language` (`language_id`, `name`) VALUES (2, 'Language2') ON DUPLICATE KEY UPDATE language_id=language_id;
INSERT INTO `js_batis_test_db`.`language` (`language_id`, `name`) VALUES (3, 'Language3') ON DUPLICATE KEY UPDATE language_id=language_id;
INSERT INTO `js_batis_test_db`.`film_language` (`film_id`, `language_id`) VALUES (1, 1) ON DUPLICATE KEY UPDATE language_id=language_id;
INSERT INTO `js_batis_test_db`.`film_language` (`film_id`, `language_id`) VALUES (1, 2) ON DUPLICATE KEY UPDATE language_id=language_id;
INSERT INTO `js_batis_test_db`.`film_language` (`film_id`, `language_id`) VALUES (2, 3) ON DUPLICATE KEY UPDATE language_id=language_id;
INSERT INTO `js_batis_test_db`.`film_language` (`film_id`, `language_id`) VALUES (3, 2) ON DUPLICATE KEY UPDATE language_id=language_id;
INSERT INTO `js_batis_test_db`.`film_language` (`film_id`, `language_id`) VALUES (3, 3) ON DUPLICATE KEY UPDATE language_id=language_id;
INSERT INTO `js_batis_test_db`.`film_language` (`film_id`, `language_id`) VALUES (2, 1) ON DUPLICATE KEY UPDATE language_id=language_id;
INSERT INTO `js_batis_test_db`.`film_actor` (`film_id`, `actor_id`) VALUES (1, 1) ON DUPLICATE KEY UPDATE film_id=film_id;
INSERT INTO `js_batis_test_db`.`film_actor` (`film_id`, `actor_id`) VALUES (2, 1) ON DUPLICATE KEY UPDATE film_id=film_id;
INSERT INTO `js_batis_test_db`.`film_actor` (`film_id`, `actor_id`) VALUES (2, 2) ON DUPLICATE KEY UPDATE film_id=film_id;
INSERT INTO `js_batis_test_db`.`film_actor` (`film_id`, `actor_id`) VALUES (2, 3) ON DUPLICATE KEY UPDATE film_id=film_id;
INSERT INTO `js_batis_test_db`.`film` (`film_id`, `film_title`, `release_year`, `category`) VALUES (1, 'Film1', 1001, 'category1') ON DUPLICATE KEY UPDATE film_id=film_id;
INSERT INTO `js_batis_test_db`.`film` (`film_id`, `film_title`, `release_year`, `category`) VALUES (2, 'Film2', 1002, 'category1') ON DUPLICATE KEY UPDATE film_id=film_id;
INSERT INTO `js_batis_test_db`.`film` (`film_id`, `film_title`, `release_year`, `category`) VALUES (3, 'Film3', 1003, 'category2') ON DUPLICATE KEY UPDATE film_id=film_id;
INSERT INTO `js_batis_test_db`.`actor` (`actor_id`, `first_name`, `last_name`, `active`) VALUES (1, 'First1', 'Last1', 0) ON DUPLICATE KEY UPDATE actor_id=actor_id;
INSERT INTO `js_batis_test_db`.`actor` (`actor_id`, `first_name`, `last_name`, `active`) VALUES (2, 'First2', 'Last2', 1) ON DUPLICATE KEY UPDATE actor_id=actor_id;
INSERT INTO `js_batis_test_db`.`actor` (`actor_id`, `first_name`, `last_name`, `active`) VALUES (3, 'First3', 'Last3', 0) ON DUPLICATE KEY UPDATE actor_id=actor_id;

DROP PROCEDURE IF EXISTS js_batis_test_db.test_procedure1;
CREATE PROCEDURE js_batis_test_db.test_procedure1(IN title varchar(40),OUT id varchar(40))
BEGIN
select concat('?',title,'@') into id;
END;
  
DROP PROCEDURE IF EXISTS js_batis_test_db.test_procedure2;
CREATE PROCEDURE js_batis_test_db.test_procedure2(IN title varchar(40),OUT id1 BIGINT,OUT id2 BIGINT)
BEGIN
select length(title) into id1;
select length(title) + 5 into id2;
END;
  
DROP PROCEDURE IF EXISTS js_batis_test_db.test_procedure3;
CREATE PROCEDURE js_batis_test_db.test_procedure3(IN `title` varchar(40))
BEGIN
select concat('?',title,'@') as title;
END;
  
DROP PROCEDURE IF EXISTS js_batis_test_db.test_procedure4;
CREATE PROCEDURE js_batis_test_db.test_procedure4(IN `title` varchar(40))
BEGIN
select concat('?',title,'@'), 514;
END;

DROP PROCEDURE IF EXISTS js_batis_test_db.test_procedure5;
CREATE PROCEDURE js_batis_test_db.`test_procedure5`()
BEGIN
declare a int;
END;

DROP PROCEDURE IF EXISTS js_batis_test_db.test_procedure6;
CREATE PROCEDURE js_batis_test_db.`test_procedure6`(IN in1 integer, INOUT inout1 integer, INOUT inout2 varchar(20), OUT inout3 integer)
BEGIN
select inout1 + coalesce(length(inout2), 0) + in1 into inout3;
END;