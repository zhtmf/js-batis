require('rootpath')();

const Engine = require("../../lib/dynamic_sql_engine")
import { assert, expect, should } from 'chai'

describe("sql", function() {

	let engine = new Engine(function(n: number) { return ':' + n });

	it("placeholder", () => {
		let ret = engine.generate(`select cola,colb from table1 where cola = {{sql name1}} and colb = {{sql index}} and colc = {{sql filter}}`
			, {}
			, { name1: "name1", index: 3, filter: "ccc" })
		expect(ret.sql).to.equals(`select cola,colb from table1 where cola = :0 and colb = :1 and colc = :2`);
		expect(ret.parameters).to.deep.equal(["name1", 3, "ccc"])
	});

	it("repeated values", () => {
		let ret = engine.generate(`select cola,colb from table1 where cola = {{sql index}} and colb = {{sql name1}} and colc = {{sql name1}}`
			, {}
			, { name1: "name1", index: 3, filter: "ccc" })
		expect(ret.sql).to.equals(`select cola,colb from table1 where cola = :0 and colb = :1 and colc = :2`);
		expect(ret.parameters).to.deep.equal([3, "name1", "name1"])
	});

	it("conditional values", () => {
		let ret = engine.generate(`select cola,colb from table1 {{#where}}{{#$if 'name1.length > 10'}}cola = {{sql index}}{{/$if}} and colb = {{sql name1}} and colc = {{sql name1}}{{/where}}`
			, {}
			, { name1: "name1", index: 3, filter: "ccc" })
		expect(ret.sql).to.equals(`select cola,colb from table1  WHERE colb = :0 and colc = :1`);
		expect(ret.parameters).to.deep.equal(["name1", "name1"])
	});

	it("simple property accessor", () => {
		let ret = engine.generate(`select cola,colb from table1 where cola = {{sql name1.index}} and colb = {{sql name1.filter.title}}`
			, {}
			, { name1: { index: 3, filter: { title: "ccc" } } })
		expect(ret.sql).to.equals(`select cola,colb from table1 where cola = :0 and colb = :1`);
		expect(ret.parameters).to.deep.equal([3, "ccc"])
	});
});