require('custom-env').env('none', 'test')
const sinon = require("sinon");
var consoleSpy = sinon.spy(console, "log");

import { DEFAULT_CATEGORRY_NAME } from "../../index"
import { assert, expect, should } from 'chai'
import { Select, DataSource } from "../../index"

describe("none", function() {

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
		async query1(): Promise<any[]> {
			return [];
		}
	}

	let mapper1 = new Mapper1();

	it("default category", async () => {
		await mapper1.query();
		await mapper1.query();
		await mapper1.query();
		await mapper1.query();
		expect(consoleSpy.called).to.be.equals(false);
	});

	it("unknown logger implementation name", async () => {
		await mapper1.query1();
		await mapper1.query1();
		expect(consoleSpy.called).to.be.equals(true);
		expect(consoleSpy.callCount).to.be.equals(6);
	});
});