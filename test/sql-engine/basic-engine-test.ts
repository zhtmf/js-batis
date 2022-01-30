require('rootpath')();

const Engine = require("../../lib/dynamic_sql_engine")
import { assert, expect, should } from 'chai'

describe("for", function() {

	let engine = new Engine(function(n: number) { return n + ':' });

	it("for", () => {
		let ret = engine.generate(`({{#for array}}{{index}}-{{item}},{{/for}})`, {}, { array: ["a", "bb", "ccc"] })
		expect(ret.sql).to.equals("(0-a,1-bb,2-ccc)");
	});

	it("for-without-comma", () => {
		let ret = engine.generate(`({{#for array}}{{index}}-{{item}} {{/for}})`, {}, { array: ["a", "bb", "ccc"] })
		expect(ret.sql).to.equals("(0-a 1-bb 2-ccc)");
	});

	it("for-complex-statements", () => {
		let ret = engine.generate(`{{#for array}}({{index}},{{item}},1,2),{{/for}}`, {}, { array: ["a", "bb", "ccc"] })
		expect(ret.sql).to.equals("(0,a,1,2),(1,bb,1,2),(2,ccc,1,2)");
	});

	it("for-override-context", () => {
		let ret = engine.generate(`{{#for array}}({{index}},{{item}},1,2),{{/for}}`, {}, { array: ["a", "bb", "ccc"], item: "ddd", index: 'my-index' })
		expect(ret.sql).to.equals("(0,a,1,2),(1,bb,1,2),(2,ccc,1,2)");
	});

	it("for-repeated", () => {
		for (let i = 0; i < 10; ++i) {
			let ret = engine.generate(`{{#for array}}({{index}},{{item}},1,2),{{/for}}`, {}, { array: [i, i + 1, i + 2], item: "ddd", index: 'my-index' })
			expect(ret.sql).to.equals(`(0,${i},1,2),(1,${i + 1},1,2),(2,${i + 2},1,2)`);
		}
	});

	it("empty for", () => {
		for (let i = 0; i < 10; ++i) {
			let ret = engine.generate(`{{#for array}}({{index}},{{item}},1,2),{{/for}}`, {}, { array: [] })
			expect(ret.sql).to.equals(``);
		}
	});

	it("empty for 2", () => {
		for (let i = 0; i < 10; ++i) {
			let ret = engine.generate(`{{#for array}}({{index}},{{item}},1,2),{{/for}}`, {}, { array: undefined })
			expect(ret.sql).to.equals(``);
		}
	});

	it("empty for 3", () => {
		for (let i = 0; i < 10; ++i) {
			let ret = engine.generate(`{{#for array}}({{index}},{{item}},1,2),{{/for}}`, {}, { array: {} })
			expect(ret.sql).to.equals(``);
		}
	});
});

describe("where", function() {

	let engine = new Engine(function(n: number) { return n + ':' });

	it("where", () => {
		let ret = engine.generate(`{{#where}}a={{name1}}{{/where}}`, {}, { name1: "name1" })
		expect(ret.sql).to.equals(" WHERE a=name1");
	});

	it("where with and ", () => {
		let ret = engine.generate(`{{#where}}and a={{name1}}{{/where}}`, {}, { name1: "name1" })
		expect(ret.sql).to.equals(" WHERE a=name1");
	});

	it("where with AND", () => {
		let ret = engine.generate(`{{#where}}AND a={{name1}}{{/where}}`, {}, { name1: "name1" })
		expect(ret.sql).to.equals(" WHERE a=name1");
	});

	it("where with and in the middle", () => {
		let ret = engine.generate(`{{#where}}and a={{name1}} and b = {{name1}}{{/where}}`, {}, { name1: "name1" })
		expect(ret.sql).to.equals(" WHERE a=name1 and b = name1");
	});

	it("empty where", () => {
		let ret = engine.generate(`{{#where}}    {{/where}}`, {}, { name1: "name1" })
		expect(ret.sql).to.equals("");
	});
});

describe("$trim", function() {

	let engine = new Engine(function(n: number) { return n + ':' });

	it("trim right", () => {
		let ret = engine.generate(`{{#$trim 'UNION ALL'}}a from t1 UNION ALL b from t2 UNION ALL{{/$trim}}`, {}, { })
		expect(ret.sql).to.equals("a from t1 UNION ALL b from t2");
	});

	it("trim left", () => {
		let ret = engine.generate(`{{#$trim 'AND'}}AND a = 1 AND b = 2{{/$trim}}`, {}, { })
		expect(ret.sql).to.equals("a = 1 AND b = 2");
	});

	it("trim both", () => {
		let ret = engine.generate(`{{#$trim 'AND'}}AND a = 1 AND b = 2 AND{{/$trim}}`, {}, { })
		expect(ret.sql).to.equals("a = 1 AND b = 2");
	});

	it("case insensitive", () => {
		let ret = engine.generate(`{{#$trim 'aNd'}}AnD a = 1 anD b = 2 and{{/$trim}}`, {}, { })
		expect(ret.sql).to.equals("a = 1 anD b = 2");
	});

	it("nothing to trim", () => {
		let ret = engine.generate(`{{#$trim 'aNd'}}a=1{{/$trim}}`, {}, { })
		expect(ret.sql).to.equals("a=1");
	});

	it("empty", () => {
		let ret = engine.generate(`{{#$trim 'aNd'}} {{/$trim}}`, {}, { })
		expect(ret.sql).to.equals("");
	});
});

describe("$", function() {

	let engine = new Engine(function(n: number) { return n + ':' });

	it("evaluate expressions", () => {
		let ret = engine.generate(`{{$ 'name1.substring(0,3) + "abc"'}}`, {}, { name1: "name1" })
		expect(ret.sql).to.equals("namabc");
	});

	it("evaluate expressions repeatedly", () => {
		for(let i = 0;i<10;++i){
			let ret = engine.generate(`{{$ 'object.name1.substring(0,3) + "abc" + index/2'}}`
				, {}, { object:{name1: "name1"}, index : i })
			expect(ret.sql).to.equals("namabc" + i/2);
		}
	});

	it("exception", () => {
		try{
			let ret = engine.generate(`{{$ 'object.name1.substring(0,3) + "abc" + i/2'}}`
					, {}, { object:{name1: "name1"}, index : 10 })
			expect(ret.sql).to.equals("nameabc" + i/2);
		}catch(e){
			expect(e.site).to.equals("Engine")
			expect(e.ordinal).to.equals(0)
			return
		}
	});
});

describe("partials", function() {

	let engine = new Engine(function(n: number) { return n + ':' });

	it("basic", () => {
		let ret = engine.generate(`{{> partial1}}`, {"partial1":"abcdef"}, { })
		expect(ret.sql).to.equals("abcdef");
	});

	it("repeated", () => {
		let ret = engine.generate(`{{> partial1}}`, {"partial1":"12345"}, { })
		expect(ret.sql).to.equals("abcdef");
	});

});