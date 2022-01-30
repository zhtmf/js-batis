require('custom-env').env('test1','test')
require('rootpath')();

import { expect, should } from 'chai'
import { DataSource } from "../../index"

describe("illegal-static-member-decorator", function() {

	it("illegal-static-member-decorator", () => {
		try{
			class Mapper{
				@DataSource()
				static method1( name : string){
				}
			}
			const { DATA_SOURCES } = require("lib/decorators")
		}catch(e){
			expect(e.site).to.equals("decorators")
			expect(e.ordinal).to.equals(5)
			return
		}
		expect.fail('should throw error')
	});
});