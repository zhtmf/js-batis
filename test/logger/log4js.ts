require('custom-env').env('log4js1', 'test')

import { DEFAULT_CATEGORRY_NAME } from "../../index"
import { assert, expect, should } from 'chai'
import { Select, DataSource } from "../../index"
const log4js = require('log4js');

log4js.configure({
	appenders: {
		console: { type: 'console' },
	},
	categories: {
		default: { appenders: ['console'], level: 'debug' },
		DEFAULT_CATEGORRY_NAME: { appenders: ['console'], level: 'debug' },
		["DS1"]: { appenders: ['console'], level: 'debug' },
	}
});

/*
	getLogger returns new instance on every call, so sinon is useless here,
	moreover, log4js does not provide an API to tell whether a certain category is configured.
	so we cannot reliably fall back to default category if a category is not configured via log4js.configure call
 */
let counter = {};
let argsObj = {};
let _getLogger = log4js.getLogger;
log4js.getLogger = function(category){
	let ret = _getLogger.apply(this, [category]);
	let _log = ret.log;
	ret.log = function(...args){
		counter[category] = (counter[category] || 0) + 1;
		(argsObj[category] = argsObj[category] || []).push(args[0]);
		return _log.apply(this, args);
	}
	return ret;
}

describe("log4js", function() {

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
		expect(counter[DEFAULT_CATEGORRY_NAME]).to.be.equals(3);
	});

	it("custom category, fallback to info level", async () => {
		await mapper1.query2();
		expect(counter["DS1"]).to.be.equals(3);
		expect(argsObj["DS1"][0]).to.be.equals('INFO');
		expect(argsObj["DS1"][1]).to.be.equals('INFO');
		expect(argsObj["DS1"][2]).to.be.equals('INFO');
	});

	it("custom level", async () => {
		await mapper1.query4();
		expect(counter["DS4"]).to.be.equals(3);
		expect(argsObj["DS4"][0]).to.be.equals('error');
		expect(argsObj["DS4"][1]).to.be.equals('error');
		expect(argsObj["DS4"][2]).to.be.equals('error');
	});
});