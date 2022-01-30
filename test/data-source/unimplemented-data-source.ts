require('custom-env').env('test1','test')
require('rootpath')();

import { expect, should } from 'chai'
import { DataSource } from "../../index"

describe("unimplemented-data-source", function() {

	it("unimplemented-data-source", () => {
		try{
			class Mapper{
				@DataSource("unimplemented")
				static method1( name : string){
				}
			}
			const { DATA_SOURCES } = require("lib/decorators")
		}catch(e){
			expect(e.site).to.equals("decorators")
			expect(e.ordinal).to.equals(4)
			return
		}
		expect.fail('should throw error')
	});
});