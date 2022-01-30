require('custom-env').env('winston1', 'test')

import { DEFAULT_CATEGORRY_NAME } from "../../index"
import { assert, expect, should } from 'chai'
import { Select, DataSource } from "../../index"
const sinon = require("sinon");
const winston = require('winston');

var winstonSpy = sinon.spy(winston, "log");

describe("winston", function() {

	class Mapper1 {
		@Select(`
	 		select 
	 		 1
	 		as result
	 	`)
		@DataSource("DS3")
		async query4(): Promise<any[]> {
			return [];
		}
	}

	let mapper1 = new Mapper1();

	it("fallback to default winston logger", async () => {
		await mapper1.query4();
		expect(winstonSpy.called).to.be.equals(true);
		expect(winstonSpy.callCount).to.be.equals(3);
	});
});