require('custom-env').env('loglevel', 'test')

import { DEFAULT_CATEGORRY_NAME } from "../../index"
import { assert, expect, should } from 'chai'
import { Select, DataSource } from "../../index"
const sinon = require("sinon");
const loglevel = require('loglevel');

var loglevelSpy = sinon.spy(loglevel, "info");

describe("loglevel", function() {

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

	it("fallback to default loglevel logger", async () => {
		await mapper1.query4();
		expect(loglevelSpy.called).to.be.equals(true);
		expect(loglevelSpy.callCount).to.be.equals(3);
	});
});