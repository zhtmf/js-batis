require('custom-env').env('loglevel', 'test')

import { DEFAULT_CATEGORRY_NAME } from "../../index"
import { assert, expect, should } from 'chai'
import { Select, DataSource } from "../../index"
const sinon = require("sinon");
const loglevel = require('loglevel');

var defaultCategorySpy = sinon.spy(loglevel.getLogger(DEFAULT_CATEGORRY_NAME), "info");
var ds1CategorySpy = sinon.spy(loglevel.getLogger("DS1"), "info");
var ds4CategorySpy = sinon.spy(loglevel.getLogger("DS4"), "error");

describe("loglevel", function() {

	class Mapper1 {
		@Select(`
	 		select 
	 		 1
	 		as result
	 	`)
		async query(): Promise<any[]> {
			return [];
		}

		@Select(`
	 		select 
	 		 1
	 		as result
	 	`)
		@DataSource("DS1")
		async query2(): Promise<any[]> {
			return [];
		}

		@Select(`
	 		select 
	 		 1
	 		as result
	 	`)
		@DataSource("DS2")
		async query3(): Promise<any[]> {
			return [];
		}

		@Select(`
	 		select 
	 		 1
	 		as result
	 	`)
		@DataSource("DS4")
		async query4(): Promise<any[]> {
			return [];
		}
	}

	let mapper1 = new Mapper1();

	it("default category", async () => {
		await mapper1.query();
		expect(defaultCategorySpy.called).to.be.equals(true);
		expect(defaultCategorySpy.callCount).to.be.equals(3);
	});

	it("custom category, fallback to info level", async () => {
		await mapper1.query2();
		expect(ds1CategorySpy.called).to.be.equals(true);
		expect(ds1CategorySpy.callCount).to.be.equals(3);
	});

	it("fallback to default category", async () => {
		await mapper1.query3();
		expect(defaultCategorySpy.called).to.be.equals(true);
		expect(defaultCategorySpy.callCount).to.be.equals(6);
	});

	it("custom level", async () => {
		await mapper1.query4();
		expect(ds4CategorySpy.called).to.be.equals(true);
		expect(ds4CategorySpy.callCount).to.be.equals(3);
	});
});