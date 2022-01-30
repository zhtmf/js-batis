require('custom-env').env('test1','test')
require('rootpath')();

import { expect, should } from 'chai'
import { DataSource } from "index"

describe("illegal-param-decorator", function() {

	it("illegal-param-decorator", () => {
		try{
			class Mapper{
				method1(@DataSource() name : string){
				}
			}
			const { DATA_SOURCES } = require("lib/decorators")
		}catch(e){
			expect(e.site).to.equals("decorators")
			expect(e.ordinal).to.equals(6)
			expect(e + '').to.equals('ExactException[site:decorators,ordinal:6,msg:@DataSource decorator can only be used on instance methods')
			return
		}
		expect.fail('should throw error')
	});
});