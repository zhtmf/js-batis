require('custom-env').env('test1', 'test')
require('rootpath')();

import { assert, expect, should } from 'chai'
import { DataSourceClass } from 'index'

describe("misplaced", function() {
	it("placed on methods", () => {
		try {
			class Dummy {
				@DataSourceClass("FAKE2")
				func(){

				}
			}
			expect.fail('should throw error')
		} catch (e) {
			expect(e.site).to.equals("decorators")
			expect(e.ordinal).to.equals(10)
		}
	});

	it("placed on static methods", () => {
		try {
			class Dummy {
				@DataSourceClass("FAKE2")
				static func(){

				}
			}
			expect.fail('should throw error')
		} catch (e) {
			expect(e.site).to.equals("decorators")
			expect(e.ordinal).to.equals(10)
		}
	});
});