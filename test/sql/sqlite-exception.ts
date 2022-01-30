require('custom-env').env('sqlite2', 'test')

import { assert, expect, should } from 'chai'

describe("sqlite leftover", function() {

	it("no filename", async () => {
		try{
			let Select = require("../../index").Select;
			class Mapper1 {
				@Select(`
			 		select 
			 			abc,def
			 		from 
			 			non_exist
			 	`)
				async error1(): Promise<any[]> {
					return [];
				}
			}
			should().fail("should throw error");
		}catch(e){
			expect(e.site).to.equals("decorators")
			expect(e.ordinal).to.equals(0)
		}
	});
});