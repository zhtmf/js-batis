require('custom-env').env('test1', 'test')
require('rootpath')();

import { assert, expect, should } from 'chai'
import { Param } from "index"
import { PARAM_NAME_REGISTRY_NAME } from "lib/decorators"

describe("param test", function() {

	it("basic", () => {
		class Dummy1 {
			func(@Param("name") name: string, @Param("num1") num: number) {
			}
		}
		expect(Dummy1.prototype[PARAM_NAME_REGISTRY_NAME]["func"])
			.to.deep.equal({ 0: "name", 1: "num1" });
	});

	it("missing some params", () => {
		class Dummy2 {
			func(name: string, @Param("num2") num: number) {
			}
		}
		expect(Dummy2.prototype[PARAM_NAME_REGISTRY_NAME]["func"])
			.to.deep.equal({ 1: "num2" });
	});

	it("misplaced", () => {
		try {
			class Dummy3 {
				static func(name: string, @Param("num") num: number) {
				}
			}
		} catch (e) {
			expect(e.site).to.equals("decorators")
			expect(e.ordinal).to.equals(9)
			return
		}
		expect.fail('should throw error')
	});

	it("duplicated names", () => {
		try {
			class Dummy4 {
				func(@Param("num") name: string, @Param("num") num: number) {
				}
			}
		} catch (e) {
			expect(e.site).to.equals("decorators")
			expect(e.ordinal).to.equals(8)
			return
		}
		expect.fail('should throw error')
	});

	it("empty name", () => {
		try {
			class Dummy4 {
				func(@Param("") name: string) {
				}
			}
		} catch (e) {
			expect(e.site).to.equals("decorators")
			expect(e.ordinal).to.equals(21)
			return
		}
		expect.fail('should throw error')
	});
});