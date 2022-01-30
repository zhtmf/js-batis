require('custom-env').env('test1', 'test')

const sinon = require("sinon");
const loggerSpy = sinon.spy(console, "log");

import { assert, expect, should } from 'chai'
import { Param, Select, SelectOne, Insert, Update, Delete, Result, DataSource, Transactional } from "../../index"
import { logStartsWith, logContains } from './test-util'
/**
 * mssql mssql @param ps.input('param', sql.Int)/ps.execute({param: 12345},...)
 * oracle node-oracledb :1, :0 ["Tonga", 90]
 */

//TODO: type conversion mechanism (for all types of pg, decimal types of mysql)

class Mapper1 {
	private partials = {
		title: "film_title as title1"
	}

	@Select(`
 		select 
 			film_id, {{> title}}, release_year
 		from 
 			js_batis_test_db.film
 		where film_id = {{sql id}}
 	`)
	async selectOneFilm(@Param("id") id: number): Promise<any[]> {
		return [];
	}

	@SelectOne(`
 		select 
 			film_id, {{> title}}, release_year
 		from 
 			js_batis_test_db.film
 		where film_id = {{sql id}}
 	`)
	async selectOneFilm2(@Param("id") id: number): Promise<any[]> {
		return [];
	}

	@Select(`
 		select 
 			*
 		from 
 			js_batis_test_db.film
 		{{#where}}
 			{{#$if 'title'}}
 				and film_title like concat('%', {{sql title}}, '%')
 			{{/$if}}
 		{{/where}}
 	`)
	async selectFilms(@Param("title") title: string): Promise<any[]> {
		return [];
	}

	@Select(`
 		select 
 			film_title
 		from 
 			js_batis_test_db.film
 		{{#where}}
 			{{#$if 'id !== undefined'}}
 				and film_id = {{sql id}}
 			{{/$if}}
 		{{/where}}
 	`)
	async selectTitles(@Param("id") id: number | undefined): Promise<any[]> {
		return [];
	}

	@SelectOne(`
 		select 
 			count(1)
 		from 
 			js_batis_test_db.film
 	`)
	async selectCount(): Promise<any> {
		return 0;
	}

	@Insert(`
 		insert into js_batis_test_db.insert_test 
 		({{#if id}}id,{{/if}}name)
 		values
 		({{#if id}}{{sql id}},{{/if}}{{sql name}})
 	`)
	async insertTest(@Param("id") id: number | undefined
		, @Param("name") name: string): Promise<number> {
		return 0;
	}

	@Insert(`
 		insert into js_batis_test_db.insert_test2 
 		({{#if id}}id,{{/if}}name)
 		values
 		({{#if id}}{{sql id}},{{/if}}{{sql name}})
 	`)
	async insertTest2(@Param("id") id: number | undefined
		, @Param("name") name: string): Promise<number> {
		return 0;
	}

	@Update(`
 		update js_batis_test_db.film
 		set 
 			film_title = {{sql film_title}}
 		where 
 			film_id = {{sql film_id}}
 	`)
	async updateFilm(@Param("film_id") id: number
		, @Param("film_title") name: string): Promise<number> {
		return 0;
	}

	@Update(`
 		update js_batis_test_db.film
 		set 
 			film_title = {{sql film_title}}
 		where 
 			film_id in (
	 			{{#for film_id}}
	 				{{item}},
	 			{{/for}}
 			)
 	`)
	async updateMultipleFilms(
		@Param("film_id") id: number[]
		, @Param("film_title") name: string): Promise<number> {
		return 0;
	}

	@Update(`
 		update js_batis_test_db.film
 		set 
 			film_title = {{sql film_title}}
 		where 
 			film_id in (
	 			{{#for film_id}}
	 				{{item}},
	 			{{/for}}
 			)
 	`)
	@DataSource("DS2")
	async updateMultipleFilms2(
		@Param("film_id") id: number[]
		, @Param("film_title") name: string): Promise<number> {
		return 0;
	}

	@Select(`
 		select 
 			f.film_id,
			f.film_title,
			f.release_year as extra_release_year,
			f.category as extra_category
 		from 
 			js_batis_test_db.film f
 	`)
	@Result({
		id: "film_id",
		sub: {
			"extra_info": {
				prefix: "extra_",
				list: false
			}
		}
	})
	async selectComplexObjects(): Promise<any[]> {
		return [];
	}

	@Select(`
 		SELECT
 			f.film_id,
 			f.film_title,
 			f.release_year as extra_release_year,
 			f.category as extra_cat,
 			l.language_id as lang_id,
 			l.name as lang_name
 		FROM
 			js_batis_test_db.film f
 			LEFT JOIN js_batis_test_db.film_language fl ON f.film_id = fl.film_id
 			LEFT JOIN js_batis_test_db.\`language\` l ON fl.language_id = l.language_id 
 		ORDER BY
 			f.film_id ASC,l.language_id asc
 	`)
	@Result({
		id: "film_id",
		sub: {
			"extra_info": {
				prefix: "extra_",
				list: false
			},
			"languages": {
				id: "id",
				prefix: "lang_",
				list: true
			}
		}
	})
	async selectComplexObjects2(): Promise<any[]> {
		return [];
	}

	@Select(`
 		SELECT
 			f.film_id,
 			f.film_title,
 			f.release_year as release_year,
 			f.category as cat,
 			l.language_id as lang_id,
 			l.name as lang_name
 		FROM
 			js_batis_test_db.film f
 			LEFT JOIN js_batis_test_db.film_language fl ON f.film_id = fl.film_id
 			LEFT JOIN js_batis_test_db.\`language\` l ON fl.language_id = l.language_id 
 		order by lang_id asc, f.film_id asc
 	`)
	@Result({
		id: "film_id",
		sub: {
			"languages": {
				id: "id",
				prefix: "lang_",
				list: true
			}
		}
	})
	async selectComplexObjects3(): Promise<any[]> {
		return [];
	}

	@Select(`
 		SELECT
 			f.film_id,
 			f.film_title,
 			f.release_year as extra_release_year,
 			f.category as extra_cat,
 			l.language_id as lang_id,
 			l.name as lang_name
 		FROM
 			js_batis_test_db.film f
 			LEFT JOIN js_batis_test_db.film_language fl ON f.film_id = fl.film_id
 			LEFT JOIN js_batis_test_db.\`language\` l ON fl.language_id = l.language_id 
 		ORDER BY
 			f.film_id ASC,l.language_id asc
 	`)
	@Result({
		id: "film_id",
		sub: {
			"extra_info": {
				prefix: "extra_",
				list: false,
				sub: {
					"languages": {
						id: "id",
						prefix: "lang_",
						list: true
					}
				}
			}
		}
	})
	async selectComplexObjects4(): Promise<any[]> {
		return [];
	}

	@Select(`
 		SELECT
 			f.film_id,
 			f.film_title,
 			f.release_year,
 			f.category,
 			l.language_id as lang_id,
 			l.name as lang_name,
 			a.actor_id as actor_actor_id,
 			a.first_name as actor_first_name,
 			a.last_name as actor_last_name
 		FROM
 			js_batis_test_db.film f
 			LEFT JOIN js_batis_test_db.film_language fl ON f.film_id = fl.film_id
 			LEFT JOIN js_batis_test_db.\`language\` l ON fl.language_id = l.language_id
 			LEFT JOIN js_batis_test_db.film_actor fa ON f.film_id = fa.film_id
 			LEFT JOIN js_batis_test_db.actor a ON fa.actor_id = a.actor_id 
 		order by f.film_id asc, lang_id desc, actor_actor_id asc
 	`)
	@Result({
		id: "film_id",
		sub: {
			"languages": {
				id: "id",
				prefix: "lang_",
				list: true
			},
			"actors": {
				id: "actor_id",
				prefix: "actor_",
				list: true
			}
		}
	})
	async selectComplexObjects5(): Promise<any[]> {
		return [];
	}

	@Select(`
 		SELECT
 			f.film_title
 		FROM
 			js_batis_test_db.film f
 		order by f.film_id asc
 	`)
	@Result({
		scalar: true
	})
	async selectScalar(): Promise<any[]> {
		return [];
	}

	@Select(`
 		SELECT
 			f.film_id,
 			f.film_title,
 			f.release_year,
 			f.category,
 			l.name as lang_name,
 			a.actor_id as actor_actor_id
 		FROM
 			js_batis_test_db.film f
 			LEFT JOIN js_batis_test_db.film_language fl ON f.film_id = fl.film_id
 			LEFT JOIN js_batis_test_db.\`language\` l ON fl.language_id = l.language_id
 			LEFT JOIN js_batis_test_db.film_actor fa ON f.film_id = fa.film_id
 			LEFT JOIN js_batis_test_db.actor a ON fa.actor_id = a.actor_id 
 		order by f.film_id asc, l.language_id desc, actor_actor_id asc
 	`)
	@Result({
		id: "film_id",
		sub: {
			"languages": {
				//use name as the id is a trick to eliminate duplicated values
				id: "name",
				prefix: "lang_",
				list: true,
				scalar: true,
			},
			"actors": {
				id: "actor_id",
				prefix: "actor_",
				list: true
			}
		}
	})
	async selectScalar2(): Promise<any[]> {
		return [];
	}

	@Select(`
 		SELECT
 			f.film_id,
 			f.film_title,
 			f.release_year as extra_release_year,
 			f.category as extra_cat,
 			l.name as lang_name
 		FROM
 			js_batis_test_db.film f
 			LEFT JOIN js_batis_test_db.film_language fl ON f.film_id = fl.film_id
 			LEFT JOIN js_batis_test_db.\`language\` l ON fl.language_id = l.language_id 
 		ORDER BY
 			f.film_id ASC,l.language_id asc
 	`)
	@Result({
		id: "film_id",
		sub: {
			"extra_info": {
				prefix: "extra_",
				list: false,
				sub: {
					"languages": {
						prefix: "lang_",
						list: true,
						scalar: true
					}
				}
			}
		}
	})
	async selectScalar3(): Promise<any[]> {
		return [];
	}

	@Select(`
 		SELECT
 			f.film_id,
 			f.film_title,
 			SUBSTRING(film_title from length(film_title) for 1) as str_num,
 			f.release_year,
 			f.category,
 			a.actor_id as actor_actor_id,
 			a.first_name as actor_first_name,
 			a.last_name as actor_last_name,
 			a.active as actor_active,
 			a.active as actor_status 
 		FROM
 			js_batis_test_db.film f
 			LEFT JOIN js_batis_test_db.film_actor fa ON f.film_id = fa.film_id
 			LEFT JOIN js_batis_test_db.actor a ON fa.actor_id = a.actor_id 
 		order by f.film_id asc, actor_actor_id asc
 	`)
	@Result({
		id: "film_id",
		coerce: { release_year: String, str_num: Number },
		sub: {
			"actors": {
				id: "actor_id",
				prefix: "actor_",
				list: true,
				coerce: { actor_active: Boolean, status: Boolean /*supports both prefixed and unprefixed form*/ }
			}
		}
	})
	async typeCoercion(): Promise<any[]> {
		return [];
	}

	@Select(`
 		SELECT
 			a.actor_id,
 			a.active as actor_active,
 			a.active as actor_active2
 		FROM
 			js_batis_test_db.actor a
 		where a.actor_id in (
 			{{#for id_list}}
 				{{sql item}},
 			{{/for}}
 		)
 	`)
	@Result({
		coerce: { 
			actor_id: String,
			actor_active: Boolean,
			actor_active2: Number,
		},
	})
	async typeCoercion2(@Param("id_list") id_list: string[]): Promise<any[]> {
		return [];
	}

	@SelectOne(`
 		SELECT
 			1 as a_b,
 			2 as a_1,
 			3 as a_C,
 			4 as a__b,
 			5 as a___b,
 			6 as _a_b,
 			7 as __a_b,
 			8 as __a1234_b1212_,
 			9 as __a1234_b1212__,
 			10 as __tt_a1234_b1212__f,
 			11 as abc_def_ghi_lhk
 	`)
	@DataSource("DS2")
	async camelCaseTest(): Promise<any[]> {
		return [];
	}

	@Select(`
 		SELECT
 			1 as a_b,
 			2 as a_1,
 			3 as a_C,
 			4 as a__b,
 			5 as a___b,
 			6 as _a_b,
 			7 as __a_b,
 			8 as __a1234_b1212_,
 			9 as __a1234_b1212__,
 			10 as __tt_a1234_b1212__f,
 			11 as abc_def_ghi_lhk
 		from 
 			js_batis_test_db.film
 	`)
	@DataSource("DS2")
	async camelCaseTest2(): Promise<any[]> {
		return [];
	}

	//in fact any update/insert/delete SQL query will do
	@Delete(`
		delete 
		from js_batis_test_db.insert_test

	`)
	async deleteInsertTest(): Promise<number> {
		return 0;
	}

	@Select(`
 		SELECT
 			*
 		FROM
 			js_batis_test_db.insert_test
 	`)
	@Result({
		id: 'id'
	})
	async selectNoResult(): Promise<any[]> {
		return [];
	}
}

@DataSource("DS3")
class Mapper2 {
	@Delete(`
		delete 
		from js_batis_test_db.insert_test
	`)
	async deleteInsertTest(): Promise<number> {
		return 0;
	}

	@Delete(`
		delete 
		from js_batis_test_db.insert_test2
	`)
	async deleteInsertTest2(): Promise<number> {
		return 0;
	}
}

class TransactionService {

	private mapper: Mapper1 = new Mapper1();

	@Transactional()
	async transactionTest1(): Promise<void> {
		await this.mapper.updateMultipleFilms([1], "ChangedTitle1");
		throw 'rollback transaction';
	}

	@Transactional()
	async transactionTest2(): Promise<void> {
		await this.mapper.updateMultipleFilms([1], "ChangedTitle1");
		await this.mapper.updateMultipleFilms([2, 3], "ChangedTitle2");
		await this.mapper.updateMultipleFilms([3], "ChangedTitle3");
		await this.mapper.updateMultipleFilms([1], "ChangedTitle4");
		throw 'rollback transaction';
	}

	@Transactional("READ COMMITTED")
	async transactionTest3(): Promise<void> {
		await this.mapper.updateMultipleFilms([1], "ChangedTitle1");
		await this.mapper.updateMultipleFilms([2, 3], "ChangedTitle2");
		await this.mapper.updateMultipleFilms([3], "ChangedTitle3");
	}

	@Transactional("READ COMMITTED")
	async transactionTest4_1(): Promise<void> {
		await this.mapper.updateMultipleFilms([1], "ChangedTitle1");
		await this.transactionTest4_2();
	}

	@Transactional("READ COMMITTED")
	async transactionTest4_2(): Promise<void> {
		await this.mapper.updateMultipleFilms([2, 3], "ChangedTitle2");
		await this.transactionTest4_3();
	}

	@Transactional("READ COMMITTED")
	async transactionTest4_3(): Promise<void> {
		await this.mapper.updateMultipleFilms([3], "ChangedTitle3");
	}

	@Transactional("READ COMMITTED")
	async transactionTest5_1(): Promise<void> {
		await this.mapper.updateMultipleFilms([1], "ChangedTitle1");
		await this.transactionTest5_2();
	}

	@DataSource("DS2")
	@Transactional("READ COMMITTED", 2)
	async transactionTest5_2(): Promise<void> {
		await this.mapper.updateMultipleFilms2([1, 2], "ChangedTitle2");
		await this.transactionTest5_3();
	}

	@Transactional("READ COMMITTED")
	async transactionTest5_3(): Promise<void> {
		await this.mapper.updateMultipleFilms([3], "ChangedTitle3");
	}

	@Transactional("READ COMMITTED")
	async transactionTest6_1(): Promise<void> {
		await this.mapper.updateMultipleFilms([1], "ChangedTitle1");
		await this.transactionTest6_2();
	}

	@DataSource("DS2")
	@Transactional("READ COMMITTED")
	async transactionTest6_2(): Promise<void> {
		await this.mapper.updateMultipleFilms2([2], "ChangedTitle2");
		await this.transactionTest6_3();
	}

	@Transactional("READ COMMITTED")
	async transactionTest6_3(): Promise<void> {
		await this.mapper.updateMultipleFilms([3], "ChangedTitle3");
		throw 'rollback transactionTest6_3';
	}

	@Transactional("READ COMMITTED")
	async transactionTest7_1(): Promise<void> {
		await this.mapper.updateMultipleFilms([1], "ChangedTitle1");
		await this.transactionTest7_2();
		await this.mapper.updateMultipleFilms([3], "ChangedTitle3");
		throw 'rollback transactionTest7_1';
	}

	@DataSource("DS2")
	@Transactional()
	async transactionTest7_2(): Promise<void> {
		await this.mapper.updateMultipleFilms2([2], "ChangedTitle2");
	}

	@DataSource()
	@Transactional()
	async transactionTest8(): Promise<void> {
		await this.mapper.updateMultipleFilms2([2], "ChangedTitle2");
	}

	async transactionTest9_1(): Promise<void> {
		await this.transactionTest9_2("name1");
		await this.mapper.updateMultipleFilms2([2], "ChangedTitle1");
		await this.transactionTest9_2("name2");
		await this.mapper.updateMultipleFilms2([2], "ChangedTitle2");
	}

	@DataSource("DS2")
	@Transactional()
	async transactionTest9_2(name: string): Promise<void> {
		await this.mapper.updateMultipleFilms2([2], name);
	}
}

describe("mysql", function() {

	let mapper1 = new Mapper1();
	let transactionalService = new TransactionService();

	after(function(done) {
		this.timeout(10000);
		//execute DML queries will implicit commit pending transactions
		let mapper2 = new Mapper2();
		mapper2.deleteInsertTest()
			.then(function() {
				return mapper2.deleteInsertTest2();
			})
			.then(function() {
				done();
			}).catch(function(e) {
				done(e);
			})
	})

	/*
	 * 1. select one row with @Select
	 * 2. select one row with @SelectOne
	 * 3. select a list (with sql parameters)
	 * 4. select rows with only one field
	 * 5. select single result
	 * 6. insert, return auto generated id
	 * 7. insert, no generated id
	 * 8. update, no affected rows
	 * 9. update, return affected rows
	 * 10.update, multiple rows
	 * 11.select a list, complex mapping - embedded object
	 * 12.select a list, complex mapping - embedded object and list of objects
	 * 13.select a list, complex mapping - list of objects
	 * 14.select a list, complex mapping - embedded object with list of objects as its property
	 * 15.select a list, complex mapping - multiple lists of objects
	 * 16.type coercion
	 * 17.underline to camel case conversion
	 * 18.no result
	 * 19.type coercion without id
	 * 20.scalar list
	 * 21.scalar list together with another object at the same level
	 * 22.scalar list as property in an embedded object
	 */

	it("select one row with @Select", async () => {
		let results = await mapper1.selectOneFilm(1);
		expect(results.length).to.be.equals(1);
		expect(results[0]["title1"]).to.be.equals("Film1");
		expect(results[0]["film_id"]).to.be.equals(1);
		expect(results[0]["release_year"]).to.be.equals(1001);
		logStartsWith(loggerSpy, "<=== Mapper1.selectOneFilm", -1);
		logStartsWith(loggerSpy, ">=== Mapper1.selectOneFilm", -2);
		logStartsWith(loggerSpy, ">=== Mapper1.selectOneFilm", -3);
	});

	it("select one row with @SelectOne", async () => {
		let results = await mapper1.selectOneFilm2(1);
		expect(results["title1"]).to.be.equals("Film1");
		expect(results["film_id"]).to.be.equals(1);
		expect(results["release_year"]).to.be.equals(1001);
	});

	it("select a list (with sql parameters)", async () => {

		{
			let results = await mapper1.selectFilms('');

			expect(results.length).to.be.equals(3);

			expect(results[0]["film_title"]).to.be.equals("Film1");
			expect(results[0]["film_id"]).to.be.equals(1);
			expect(results[0]["release_year"]).to.be.equals(1001);
			expect(results[0]["category"]).to.be.equals('category1');

			expect(results[1]["film_title"]).to.be.equals("Film2");
			expect(results[1]["film_id"]).to.be.equals(2);
			expect(results[1]["release_year"]).to.be.equals(1002);
			expect(results[1]["category"]).to.be.equals('category1');

			expect(results[2]["film_title"]).to.be.equals("Film3");
			expect(results[2]["film_id"]).to.be.equals(3);
			expect(results[2]["release_year"]).to.be.equals(1003);
			expect(results[2]["category"]).to.be.equals('category2');
		}

		{
			let results = await mapper1.selectFilms('Film2');

			expect(results.length).to.be.equals(1);

			expect(results[0]["film_title"]).to.be.equals("Film2");
			expect(results[0]["film_id"]).to.be.equals(2);
			expect(results[0]["release_year"]).to.be.equals(1002);
			expect(results[0]["category"]).to.be.equals('category1');
		}

		{
			//non-exist
			let results = await mapper1.selectFilms('Film22222');
			expect(results.length).to.be.equals(0);
		}
	});

	it("select rows with only one field", async () => {
		let results = await mapper1.selectTitles(1);
		expect(results.length).to.be.equals(1);
		expect(results[0]).to.be.equals("Film1");

		results = await mapper1.selectTitles(undefined);
		expect(results.length).to.be.equals(3);
		expect(results).to.deep.equal(["Film1", "Film2", "Film3"]);
	});

	it("select single result", async () => {
		let results = await mapper1.selectCount();
		expect(results.length).to.be.equals(undefined);
		expect(results).to.be.equals(3);
	});

	it("insert, return auto generated id", async function() {
		this.timeout(10000)
		let result = await mapper1.insertTest(undefined, 'name' + 0);
		expect(result).to.be.not.equals(undefined);
		for (let i = 1; i <= 5; ++i) {
			let result2 = await mapper1.insertTest(undefined, 'name' + i);
			expect(result2).to.be.equals(result + 1);
			logContains(loggerSpy, `generated key: ${result2}`);
			result = result2;
		}
	});

	it("insert, no generated id", async () => {
		let results2 = await mapper1.insertTest2(999, 'name999');
		expect(results2).to.be.equals(1);
		logContains(loggerSpy, `affected rows: 1`);
	});

	it("update, no affected rows", async () => {
		//CLIENT_FOUND_ROWS is default ON in mysql/mysql2, so a no-op update does not work
		let results2 = await mapper1.updateFilm(110, "Film1");
		expect(results2).to.be.equals(0);
		logContains(loggerSpy, `affected rows: 0`);
	});

	it("update, return affected rows", async () => {
		let results2 = await mapper1.updateFilm(1, "Film11");
		expect(results2).to.be.equals(1);
		results2 = await mapper1.updateFilm(1, "Film1");
		expect(results2).to.be.equals(1);
	});

	it("update, multiple rows", async function() {
		this.timeout(10000);
		let results2 = await mapper1.updateMultipleFilms([1, 2, 3], "FilmX");
		logContains(loggerSpy, `affected rows: 3`);
		expect(results2).to.be.equals(3);
		results2 = await mapper1.updateFilm(1, "Film1");
		expect(results2).to.be.equals(1);
		results2 = await mapper1.updateFilm(2, "Film2");
		expect(results2).to.be.equals(1);
		results2 = await mapper1.updateFilm(3, "Film3");
		expect(results2).to.be.equals(1);
	});

	it("select a list, complex mapping - embedded object", async () => {
		let result = await mapper1.selectComplexObjects();
		expect(result.length).to.be.equals(3);
		expect(result).to.deep.equal([
			{
				"film_id": 1,
				"film_title": "Film1",
				"extra_info": {
					"release_year": 1001,
					"category": "category1"
				}
			},
			{
				"film_id": 2,
				"film_title": "Film2",
				"extra_info": {
					"release_year": 1002,
					"category": "category1"
				}
			},
			{
				"film_id": 3,
				"film_title": "Film3",
				"extra_info": {
					"release_year": 1003,
					"category": "category2"
				}
			}
		]);
	});

	it("select a list, complex mapping - embedded object and list of objects", async () => {
		let result = await mapper1.selectComplexObjects2();
		expect(result.length).to.be.equals(3);
		expect(result).to.deep.equal([
			{
				"film_id": 1,
				"film_title": "Film1",
				"extra_info": {
					"release_year": 1001,
					"cat": "category1"
				},
				"languages": [
					{ "id": 1, "name": "Language1" },
					{ "id": 2, "name": "Language2" },
				]
			},
			{
				"film_id": 2,
				"film_title": "Film2",
				"extra_info": {
					"release_year": 1002,
					"cat": "category1"
				},
				"languages": [
					{ "id": 1, "name": "Language1" },
					{ "id": 3, "name": "Language3" },
				]
			},
			{
				"film_id": 3,
				"film_title": "Film3",
				"extra_info": {
					"release_year": 1003,
					"cat": "category2"
				},
				"languages": [
					{ "id": 2, "name": "Language2" },
					{ "id": 3, "name": "Language3" },
				]
			}
		]);
	});

	it("select a list, complex mapping - list of objects/deliberately shuffled", async () => {
		let result = await mapper1.selectComplexObjects3();
		expect(result.length).to.be.equals(3);
		expect(result).to.deep.equal([
			{
				"film_id": 1,
				"film_title": "Film1",
				"release_year": 1001,
				"cat": "category1",
				"languages": [
					{ "id": 1, "name": "Language1" },
					{ "id": 2, "name": "Language2" },
				]
			},
			{
				"film_id": 2,
				"film_title": "Film2",
				"release_year": 1002,
				"cat": "category1",
				"languages": [
					{ "id": 1, "name": "Language1" },
					{ "id": 3, "name": "Language3" },
				]
			},
			{
				"film_id": 3,
				"film_title": "Film3",
				"release_year": 1003,
				"cat": "category2",
				"languages": [
					{ "id": 2, "name": "Language2" },
					{ "id": 3, "name": "Language3" },
				]
			}
		]);
	});

	it("select a list, complex mapping - embedded object with list of objects as its property", async () => {
		let result = await mapper1.selectComplexObjects4();
		expect(result.length).to.be.equals(3);
		expect(result).to.deep.equal([
			{
				"film_id": 1,
				"film_title": "Film1",
				"extra_info": {
					"release_year": 1001,
					"cat": "category1",
					"languages": [
						{ "id": 1, "name": "Language1" },
						{ "id": 2, "name": "Language2" },
					]
				},
			},
			{
				"film_id": 2,
				"film_title": "Film2",
				"extra_info": {
					"release_year": 1002,
					"cat": "category1",
					"languages": [
						{ "id": 1, "name": "Language1" },
						{ "id": 3, "name": "Language3" },
					]
				},
			},
			{
				"film_id": 3,
				"film_title": "Film3",
				"extra_info": {
					"release_year": 1003,
					"cat": "category2",
					"languages": [
						{ "id": 2, "name": "Language2" },
						{ "id": 3, "name": "Language3" },
					]
				},
			}
		]);
	});

	it("select a list, complex mapping - multiple lists of objects/deliberately shuffled/empty list", async () => {
		let result = await mapper1.selectComplexObjects5();
		expect(result.length).to.be.equals(3);
		expect(result).to.deep.equal([
			{
				"film_id": 1,
				"film_title": "Film1",
				"release_year": 1001,
				"category": "category1",
				"languages": [
					{ "id": 2, "name": "Language2" },
					{ "id": 1, "name": "Language1" },
				],
				"actors": [
					{ "actor_id": 1, "first_name": "First1", last_name: "Last1" },
				]
			},
			{
				"film_id": 2,
				"film_title": "Film2",
				"release_year": 1002,
				"category": "category1",
				"languages": [
					{ "id": 3, "name": "Language3" },
					{ "id": 1, "name": "Language1" },
				],
				"actors": [
					{ "actor_id": 1, "first_name": "First1", last_name: "Last1" },
					{ "actor_id": 2, "first_name": "First2", last_name: "Last2" },
					{ "actor_id": 3, "first_name": "First3", last_name: "Last3" },
				]
			},
			{
				"film_id": 3,
				"film_title": "Film3",
				"release_year": 1003,
				"category": "category2",
				"languages": [
					{ "id": 3, "name": "Language3" },
					{ "id": 2, "name": "Language2" },
				],
				//sub lists with no matching results are initialized as empty array rather than undefined.
				"actors": []
			}
		]);
	});

	it("type coercion", async () => {
		let result = await mapper1.typeCoercion();
		expect(result.length).to.be.equals(3);
		expect(result).to.deep.equal([
			{
				"film_id": 1,
				"film_title": "Film1",
				"release_year": "1001",
				"category": "category1",
				str_num: 1,
				"actors": [
					{ "actor_id": 1, "first_name": "First1", last_name: "Last1", active: false, "status" : false },
				]
			},
			{
				"film_id": 2,
				"film_title": "Film2",
				"release_year": "1002",
				"category": "category1",
				str_num: 2,
				"actors": [
					{ "actor_id": 1, "first_name": "First1", last_name: "Last1", active: false, "status" : false },
					{ "actor_id": 2, "first_name": "First2", last_name: "Last2", active: true, "status" : true },
					{ "actor_id": 3, "first_name": "First3", last_name: "Last3", active: false, "status" : false },
				]
			},
			{
				"film_id": 3,
				"film_title": "Film3",
				"release_year": "1003",
				"category": "category2",
				str_num: 3,
				"actors": []
			}
		]);
	});

	it("underline to camel case conversion", async () => {
		{
			let result = await mapper1.camelCaseTest();
			expect(result.length).to.be.equals(undefined);
			expect(result["aB"]).to.be.equals(1);
			expect(result["a1"]).to.be.equals(2);
			expect(result["aC"]).to.be.equals(3);
			expect(result["a_B"]).to.be.equals(4);
			expect(result["a__B"]).to.be.equals(5);
			expect(result["AB"]).to.be.equals(6);
			expect(result["_AB"]).to.be.equals(7);
			expect(result["_A1234B1212_"]).to.be.equals(8);
			expect(result["_A1234B1212__"]).to.be.equals(9);
			expect(result["_TtA1234B1212_F"]).to.be.equals(10);
			expect(result["abcDefGhiLhk"]).to.be.equals(11);
		}

		{
			let result2 = await mapper1.camelCaseTest2();
			expect(result2.length).to.be.equals(3);
			for (let result of result2) {
				expect(result["aB"]).to.be.equals(1);
				expect(result["a1"]).to.be.equals(2);
				expect(result["aC"]).to.be.equals(3);
				expect(result["a_B"]).to.be.equals(4);
				expect(result["a__B"]).to.be.equals(5);
				expect(result["AB"]).to.be.equals(6);
				expect(result["_AB"]).to.be.equals(7);
				expect(result["_A1234B1212_"]).to.be.equals(8);
				expect(result["_A1234B1212__"]).to.be.equals(9);
				expect(result["_TtA1234B1212_F"]).to.be.equals(10);
				expect(result["abcDefGhiLhk"]).to.be.equals(11);
			}
		}
	});

	it("no result", async () => {
		let rows = await mapper1.deleteInsertTest();
		expect(rows).to.be.greaterThan(0);
		let result = await mapper1.selectNoResult()
		expect(result.length).to.be.equals(0);
		logContains(loggerSpy, `result: 0 row(s)`);
	});

	it("type coercion without id", async () => {
		let rows = await mapper1.typeCoercion2(["1"]);
		expect(rows.length).to.be.equals(1);
		expect(rows[0].actor_id).to.be.equals('1');
		expect(rows[0].actor_active).to.be.equals(false);
		expect(rows[0].actor_active2).to.be.equals(0);
		rows = await mapper1.typeCoercion2(["1", "2"]);
		expect(rows.length).to.be.equals(2);
		expect(rows[0].actor_id).to.be.equals('1');
		expect(rows[0].actor_active).to.be.equals(false);
		expect(rows[0].actor_active2).to.be.equals(0);
		expect(rows[1].actor_id).to.be.equals('2');
		expect(rows[1].actor_active).to.be.equals(true);
		expect(rows[1].actor_active2).to.be.equals(1);
	});

	it("scalar list", async () => {
		let rows = await mapper1.selectScalar();
		expect(rows.length).to.be.equals(3);
		expect(rows[0]).to.be.equals('Film1');
		expect(rows[1]).to.be.equals('Film2');
		expect(rows[2]).to.be.equals('Film3');
	});

	it("scalar list together with another object at the same level", async () => {
		let result = await mapper1.selectScalar2();
		expect(result.length).to.be.equals(3);
		expect(result).to.deep.equal([
			{
				"film_id": 1,
				"film_title": "Film1",
				"release_year": 1001,
				"category": "category1",
				"languages": [
					"Language2",
					"Language1",
				],
				"actors": [
					{ "actor_id": 1 },
				]
			},
			{
				"film_id": 2,
				"film_title": "Film2",
				"release_year": 1002,
				"category": "category1",
				"languages": [
					"Language3",
					"Language1",
				],
				"actors": [
					{ "actor_id": 1 },
					{ "actor_id": 2 },
					{ "actor_id": 3 },
				]
			},
			{
				"film_id": 3,
				"film_title": "Film3",
				"release_year": 1003,
				"category": "category2",
				"languages": [
					"Language3",
					"Language2",
				],
				"actors": []
			}
		]);
	});

	it("scalar list as property in an embedded object", async () => {
		let result = await mapper1.selectScalar3();
		expect(result.length).to.be.equals(3);
		expect(result).to.deep.equal([
			{
				"film_id": 1,
				"film_title": "Film1",
				"extra_info": {
					"release_year": 1001,
					"cat": "category1",
					"languages": [
						"Language1",
						"Language2",
					],
				},
			},
			{
				"film_id": 2,
				"film_title": "Film2",
				"extra_info": {
					"release_year": 1002,
					"cat": "category1",
					"languages": [
						"Language1",
						"Language3",
					],
				},
			},
			{
				"film_id": 3,
				"film_title": "Film3",
				"extra_info": {
					"release_year": 1003,
					"cat": "category2",
					"languages": [
						"Language2",
						"Language3",
					],
				},
			}
		]);
	});

	/**
	 * 1. rollback transaction at the end
	 * 2. rollback transaction with multiple statements
	 * 3. commit transaction
	 * 4. new transaction embedded in existing transaction for the same data source
	 * 5. new transaction embedded in existing transaction for a different data source
	 * 6. new transaction embedded in existing transaction for a different data source, rollback the new embedded transaction
	 * 7. embedded transaction, rollback utmost transaction
	 * 8. inconsistent data source names between Transactional on service function and that on mapper function
	 */

	it("rollback transaction at the end", async () => {
		try {
			await transactionalService.transactionTest1();
			should().fail("should throw error");
		} catch (e) {
			expect(e).to.be.equals("rollback transaction", e);
			let result1 = await mapper1.selectTitles(1);
			expect(result1[0]).to.be.equals("Film1");
		}
	});

	it("rollback transaction with multiple statements", async () => {
		try {
			await transactionalService.transactionTest2();
			should().fail("should throw error");
		} catch (e) {
			expect(e).to.be.equals("rollback transaction", e);
			expect((await mapper1.selectTitles(1))[0]).to.be.equals("Film1");
			expect((await mapper1.selectTitles(2))[0]).to.be.equals("Film2");
			expect((await mapper1.selectTitles(3))[0]).to.be.equals("Film3");
		}
	});

	it("commit transaction", async () => {
		await transactionalService.transactionTest3();
		expect((await mapper1.selectTitles(1))[0]).to.be.equals("ChangedTitle1");
		expect((await mapper1.selectTitles(2))[0]).to.be.equals("ChangedTitle2");
		expect((await mapper1.selectTitles(3))[0]).to.be.equals("ChangedTitle3");
		await mapper1.updateMultipleFilms([1], "Film1");
		await mapper1.updateMultipleFilms([2], "Film2");
		await mapper1.updateMultipleFilms([3], "Film3");
	});

	it("new transaction embedded in existing transaction for the same data source", async function() {
		this.timeout(4000);
		await transactionalService.transactionTest4_1();
		expect((await mapper1.selectTitles(1))[0]).to.be.equals("ChangedTitle1");
		expect((await mapper1.selectTitles(2))[0]).to.be.equals("ChangedTitle2");
		expect((await mapper1.selectTitles(3))[0]).to.be.equals("ChangedTitle3");
		await mapper1.updateMultipleFilms([1], "Film1");
		await mapper1.updateMultipleFilms([2], "Film2");
		await mapper1.updateMultipleFilms([3], "Film3");
	});

	it("new transaction embedded in existing transaction for a different data source", async function() {
		this.timeout(4000);
		try {
			try {
				await transactionalService.transactionTest5_1();
				should().fail("should throw error");
			} catch (e) {
				console.log(e);
			}
			expect((await mapper1.selectTitles(1))[0]).to.be.equals("Film1");
			expect((await mapper1.selectTitles(2))[0]).to.be.equals("Film2");
			expect((await mapper1.selectTitles(3))[0]).to.be.equals("Film3");
		} finally {
			await mapper1.updateMultipleFilms([1], "Film1");
			await mapper1.updateMultipleFilms([2], "Film2");
			await mapper1.updateMultipleFilms([3], "Film3");
		}
	});

	it("new transaction embedded in existing transaction for a different data source, rollback the new embedded transaction", async function() {
		this.timeout(3000);
		try {
			try {
				await transactionalService.transactionTest6_1();
				should().fail("should throw error");
			} catch (e) {
				console.log(e);
			}
			expect((await mapper1.selectTitles(1))[0]).to.be.equals("Film1");
			expect((await mapper1.selectTitles(2))[0]).to.be.equals("Film2");
			expect((await mapper1.selectTitles(3))[0]).to.be.equals("Film3");
		} finally {
			await mapper1.updateMultipleFilms([1], "Film1");
			await mapper1.updateMultipleFilms([2], "Film2");
			await mapper1.updateMultipleFilms([3], "Film3");
		}
	});

	it("embedded transaction, rollback utmost transaction", async function() {
		this.timeout(3000);
		try {
			try {
				await transactionalService.transactionTest7_1();
				should().fail("should throw error");
			} catch (e) {
				console.log(e);
			}
			expect((await mapper1.selectTitles(1))[0]).to.be.equals("Film1");
			//embedded transaction has been committed independently
			expect((await mapper1.selectTitles(2))[0]).to.be.equals("ChangedTitle2");
			expect((await mapper1.selectTitles(3))[0]).to.be.equals("Film3");
		} finally {
			await mapper1.updateMultipleFilms([1], "Film1");
			await mapper1.updateMultipleFilms([2], "Film2");
			await mapper1.updateMultipleFilms([3], "Film3");
		}
	});

	it("inconsistent data source names between Transactional on service function and that on mapper function",
		async function() {
			this.timeout(3000);
			try {
				try {
					await transactionalService.transactionTest8();
					should().fail("should throw error");
				} catch (e) {
					expect(e.site).to.equals("decorators")
					expect(e.ordinal).to.equals(19)
					return;
				}
			} finally {
				await mapper1.updateMultipleFilms([1], "Film1");
				await mapper1.updateMultipleFilms([2], "Film2");
				await mapper1.updateMultipleFilms([3], "Film3");
			}
		});

	it("mixed transaction and non-transaction queries", async function() {
		this.timeout(3000);
		try {
			await transactionalService.transactionTest9_1();
			let result1 = await mapper1.selectTitles(2);
			expect(result1[0]).to.be.equals("ChangedTitle2");
		} finally {
			await mapper1.updateMultipleFilms([1], "Film1");
			await mapper1.updateMultipleFilms([2], "Film2");
			await mapper1.updateMultipleFilms([3], "Film3");
		}
	});
});