require('custom-env').env('fallback1', 'test')

const sinon = require("sinon");
var consoleSpy = sinon.spy(console, "log");

var Module = require('module');
Module.prototype.require = new Proxy(Module.prototype.require, {
    apply(target, thisArg, argumentsList){
    	if(argumentsList[0].indexOf('winston') >=0 || argumentsList[0].indexOf('log4js') >= 0 || argumentsList[0].indexOf('loglevel') >= 0){
    		throw new Error('not available');
    	}
        return Reflect.apply(target, thisArg, argumentsList)
    }
});

import { assert, expect, should } from 'chai'
import { Select, DataSource } from "../../index"

describe("LOGGER implementation cannot be resolved", function() {

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

		@Select(`
	 		select 
	 		 1
	 		as result
	 	`)
	 	@DataSource("DS2")
		async query2(): Promise<any[]> {
			return [];
		}
	}

	let mapper1 = new Mapper1();

	it("LOGGER is winston but winston cannot be resolved", async () => {
		await mapper1.query();
		await mapper1.query();
		expect(consoleSpy.called).to.be.equals(true);
		expect(consoleSpy.callCount).to.be.equals(6);
	});

	it("LOGGER is log4js but log4js cannot be resolved", async () => {
		await mapper1.query1();
		await mapper1.query1();
		expect(consoleSpy.called).to.be.equals(true);
		expect(consoleSpy.callCount).to.be.equals(12);
	});

	it("LOGGER is loglevel but loglevel cannot be resolved", async () => {
		await mapper1.query2();
		await mapper1.query2();
		expect(consoleSpy.called).to.be.equals(true);
		expect(consoleSpy.callCount).to.be.equals(18);
	});
});