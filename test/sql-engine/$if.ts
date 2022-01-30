require('rootpath')();

const Engine = require("../../lib/dynamic_sql_engine")
import { assert, expect, should } from 'chai'

describe("$if", function() {

	let engine = new Engine(function(n: number) { return n + ':' });

	it("true", () => {
		let ret = engine.generate(`{{#$if 'name1.length > 3'}}true{{/$if}}`, {}, { name1: "name1" })
		expect(ret.sql).to.equals("true");
	});

	it("false", () => {
		let ret = engine.generate(`{{#$if 'name1.length > 13'}}true{{/$if}}`, {}, { name1: "name1" })
		expect(ret.sql).to.equals("");
	});

	it("falsey", () => {
		let ret = engine.generate(`{{#$if 'num / 10 - 1'}}true{{/$if}}`, {}, { num :10 })
		expect(ret.sql).to.equals("");
	});

	it("falsey2", () => {
		let ret = engine.generate(`{{#$if str}}true{{/$if}}`, {}, { str : '' })
		expect(ret.sql).to.equals("");
	});

	it("else", () => {
		let ret = engine.generate(`{{#$if str}}true{{else}}false{{/$if}}`, {}, { str : '' })
		expect(ret.sql).to.equals("false");
	});
});