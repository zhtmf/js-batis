DROP SCHEMA IF EXISTS js_batis_test_db CASCADE;

CREATE SCHEMA IF NOT EXISTS js_batis_test_db;

DROP TABLE IF EXISTS js_batis_test_db.language;
CREATE TABLE IF NOT EXISTS js_batis_test_db.language (
	  language_id bigserial NOT NULL PRIMARY KEY,
	  name varchar(64) NOT NULL
);

DROP TABLE IF EXISTS js_batis_test_db.film_language;
CREATE TABLE IF NOT EXISTS js_batis_test_db.film_language (
  film_id bigint NOT NULL,
  language_id bigint NOT NULL,
  PRIMARY KEY (film_id,language_id)
);

DROP TABLE IF EXISTS js_batis_test_db.film_actor;
CREATE TABLE IF NOT EXISTS js_batis_test_db.film_actor (
  film_id bigint NOT NULL,
  actor_id bigint NOT NULL,
  PRIMARY KEY (film_id,actor_id)
);

DROP TABLE IF EXISTS js_batis_test_db.film;
CREATE TABLE IF NOT EXISTS js_batis_test_db.film (
  film_id bigserial NOT NULL PRIMARY KEY,
  film_title varchar(255) NOT NULL,
  release_year smallint NOT NULL,
  category varchar(32) NOT NULL
);

DROP TABLE IF EXISTS js_batis_test_db.actor;
CREATE TABLE IF NOT EXISTS js_batis_test_db.actor (
  actor_id bigserial NOT NULL PRIMARY KEY,
  first_name varchar(255) NOT NULL,
  last_name varchar(255) NOT NULL,
  active smallint NOT NULL DEFAULT '0'
); 

DROP TABLE IF EXISTS js_batis_test_db.insert_test;
CREATE TABLE js_batis_test_db.insert_test (
  id bigserial NOT NULL PRIMARY KEY,
  name varchar(255) NOT NULL
);

DROP TABLE IF EXISTS js_batis_test_db.insert_test2;
CREATE TABLE js_batis_test_db.insert_test2 (
  id bigserial NOT NULL PRIMARY KEY,
  name varchar(255) NOT NULL
);

INSERT INTO js_batis_test_db.language (language_id, name) VALUES (1, 'Language1') ON CONFLICT DO NOTHING;
INSERT INTO js_batis_test_db.language (language_id, name) VALUES (2, 'Language2') ON CONFLICT DO NOTHING;
INSERT INTO js_batis_test_db.language (language_id, name) VALUES (3, 'Language3') ON CONFLICT DO NOTHING;
INSERT INTO js_batis_test_db.film_language (film_id, language_id) VALUES (1, 1) ON CONFLICT DO NOTHING;
INSERT INTO js_batis_test_db.film_language (film_id, language_id) VALUES (1, 2) ON CONFLICT DO NOTHING;
INSERT INTO js_batis_test_db.film_language (film_id, language_id) VALUES (2, 3) ON CONFLICT DO NOTHING;
INSERT INTO js_batis_test_db.film_language (film_id, language_id) VALUES (3, 2) ON CONFLICT DO NOTHING;
INSERT INTO js_batis_test_db.film_language (film_id, language_id) VALUES (3, 3) ON CONFLICT DO NOTHING;
INSERT INTO js_batis_test_db.film_language (film_id, language_id) VALUES (2, 1) ON CONFLICT DO NOTHING;
INSERT INTO js_batis_test_db.film_actor (film_id, actor_id) VALUES (1, 1) ON CONFLICT DO NOTHING;
INSERT INTO js_batis_test_db.film_actor (film_id, actor_id) VALUES (2, 1) ON CONFLICT DO NOTHING;
INSERT INTO js_batis_test_db.film_actor (film_id, actor_id) VALUES (2, 2) ON CONFLICT DO NOTHING;
INSERT INTO js_batis_test_db.film_actor (film_id, actor_id) VALUES (2, 3) ON CONFLICT DO NOTHING;
INSERT INTO js_batis_test_db.film (film_id, film_title, release_year, category) VALUES (1, 'Film1', 1001, 'category1') ON CONFLICT DO NOTHING;
INSERT INTO js_batis_test_db.film (film_id, film_title, release_year, category) VALUES (2, 'Film2', 1002, 'category1') ON CONFLICT DO NOTHING;
INSERT INTO js_batis_test_db.film (film_id, film_title, release_year, category) VALUES (3, 'Film3', 1003, 'category2') ON CONFLICT DO NOTHING;
INSERT INTO js_batis_test_db.actor (actor_id, first_name, last_name, active) VALUES (1, 'First1', 'Last1', 0) ON CONFLICT DO NOTHING;
INSERT INTO js_batis_test_db.actor (actor_id, first_name, last_name, active) VALUES (2, 'First2', 'Last2', 1) ON CONFLICT DO NOTHING;
INSERT INTO js_batis_test_db.actor (actor_id, first_name, last_name, active) VALUES (3, 'First3', 'Last3', 0) ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION "js_batis_test_db"."test1_1"("in1" int2, "in2" int2)
  RETURNS int2 AS $BODY$BEGIN
  return in1 + in2;
END$BODY$
  LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION "js_batis_test_db"."test1_2"(IN "in1" int2, INOUT "in2" int2)
  RETURNS int2 AS $BODY$BEGIN
  select in1 + in2 into in2;
END$BODY$
  LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION "js_batis_test_db"."test1_3"(IN "in1" int2, INOUT "in2" int2, INOUT "in3" varchar, INOUT "in4" varchar, INOUT "in5" varchar, INOUT "in6" varchar, INOUT "in7" varchar)
  RETURNS record AS $BODY$BEGIN
  select in1 + in2 into in2;
  SELECT json_object_agg('abc,'',"""def', 1) into in3;
  SELECT '' into in4;
  SELECT '  ' into in5;
  SELECT NULL into in6;
  SELECT 'abcdef' into in7;
END$BODY$
  LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION "js_batis_test_db"."test1_4"("in1" int2, "in2" int2)
  RETURNS TABLE("col1" int2, "col2" int2) AS $BODY$
  DECLARE result record;
  BEGIN 
  return query select in1, in2;
  return query select (in1 + 1)::int2, (in2 + 1)::int2;
  return query select NULL::int2, (in2 + 2)::int2;
  return query select (in1 + 2)::int2, NULL::int2;
END$BODY$
  LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION "js_batis_test_db"."test1_5"()
  RETURNS void AS $BODY$
  BEGIN 
END$BODY$
  LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE PROCEDURE "js_batis_test_db"."test2_1"(IN "in1" int4, IN "in2" varchar, INOUT "inout1" int4)
 AS $BODY$BEGIN
  select in1 + length(in2) + inout1 into inout1;
END$BODY$
  LANGUAGE plpgsql;

CREATE OR REPLACE PROCEDURE "js_batis_test_db"."test2_2"(IN "in1" int4, IN "in2" varchar, INOUT "inout1" int4, INOUT "inout2" int4)
 AS $BODY$BEGIN
  select in1 + length(in2) + inout1 into inout1;
  select inout2 * inout2 into inout2;
END$BODY$
  LANGUAGE plpgsql; 

CREATE OR REPLACE PROCEDURE "js_batis_test_db"."test2_1"(IN "in1" int4, IN "in2" varchar, INOUT "inout1" int4)
 AS $BODY$BEGIN
  select in1 + length(in2) + inout1 into inout1;
END$BODY$
  LANGUAGE plpgsql;

CREATE OR REPLACE PROCEDURE "js_batis_test_db"."test2_2"(IN "in1" int4, IN "in2" varchar, INOUT "inout1" int4, INOUT "inout2" int4)
 AS $BODY$BEGIN
  select in1 + length(in2) + inout1 into inout1;
  select inout2 * inout2 into inout2;
END$BODY$
  LANGUAGE plpgsql;