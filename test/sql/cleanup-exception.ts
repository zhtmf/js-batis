require('custom-env').env('sqlite', 'test')
require('rootpath')();

import { assert, expect, should } from 'chai'
import { Param, Select, SelectOne, Execute, Insert, Update, Delete, Result, DataSource, Transactional, Cleanup } from "index"

describe("cleanup-exception", function() {

	it("decorated on class", async () => {
		try{
			@Cleanup()
			class CleanupManager{
				doCleanUp() : void{

				}
			}
			should().fail("should throw error");
		}catch(e){
			expect(e.site).to.equals("decorators")
			expect(e.ordinal).to.equals(20)
		}
	});

	it("decorated on parameter", async () => {
		try{
			class CleanupManager{
				doCleanUp(@Cleanup()abc:number) : void{

				}
			}
			should().fail("should throw error");
		}catch(e){
			expect(e.site).to.equals("decorators")
			expect(e.ordinal).to.equals(20)
		}
	});
});