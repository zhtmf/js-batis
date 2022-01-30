require('custom-env').env('test1', 'test')
require('rootpath')();

import { assert, expect, should } from 'chai'

import { Param, Select, SelectOne, Execute, Insert, Update, Result, DataSource, Transactional } from "index"

describe("sql-decorator-exceptions", function() {

	it("misplaced @Result on static method", async () => {

		try{
			class Mapper1{

				@Result({})
				static func() : void{

				}
			}
		}catch(e){
			expect(e.site).to.equals("decorators")
			expect(e.ordinal).to.equals(14)
			return;
		}

		expect.fail('should throw error')
	});

	it("misplaced @Result on constructor", async () => {

		try{
			@Result({})
			class Mapper2{
				constructor(){

				}
			}
		}catch(e){
			expect(e.site).to.equals("decorators")
			expect(e.ordinal).to.equals(14)
			return;
		}

		expect.fail('should throw error')
	});

	it("misplaced @Result on properties", async () => {

		try{
			class Mapper3{
				@Result({})
				public type : string;
			}
		}catch(e){
			expect(e.site).to.equals("decorators")
			expect(e.ordinal).to.equals(14)
			return;
		}

		expect.fail('should throw error')
	});

	it("sub declarations without prefix property", async () => {

		try{
			class Mapper3{
				@Result({
					id:'id',
					sub:{
						abc:{
							list:true,
							id:"id2",
						}
					}
				})
				func() : void{

				}
			}
		}catch(e){
			expect(e.site).to.equals("decorators")
			expect(e.ordinal).to.equals(16)
			return;
		}

		expect.fail('should throw error')
	});

	it("misplaced sql decorators", async () => {
		try{
			@Select("sql")
			class Mapper3{
				func() : void{

				}
			}
		}catch(e){
			expect(e.site).to.equals("decorators")
			expect(e.ordinal).to.equals(11)
			return;
		}

		expect.fail('should throw error')
	});

	it("misplaced sql decorators 2", async () => {
		try{
			class Mapper3{
				@Select("sql")
				static func() : void{

				}
			}
		}catch(e){
			expect(e.site).to.equals("decorators")
			expect(e.ordinal).to.equals(11)
			return;
		}

		expect.fail('should throw error')
	});

	it("misplaced sql decorators 3", async () => {
		try{
			class Mapper3{
				@Select("sql")
				type : string = '';
			}
		}catch(e){
			expect(e.site).to.equals("decorators")
			expect(e.ordinal).to.equals(11)
			return;
		}

		expect.fail('should throw error')
	});

	it("misplaced sql decorators 4", async () => {
		try{
			class Mapper3{
				func(@Select("sql") param : number) : void{

				}
			}
		}catch(e){
			expect(e.site).to.equals("decorators")
			expect(e.ordinal).to.equals(11)
			return;
		}

		expect.fail('should throw error')
	});

	it("misplaced Transactional", async ()=>{

		try{
			class Mapper3{
				@Transactional("sql")
				static func( param : number) : void{

				}
			}
		}catch(e){
			expect(e.site).to.equals("decorators")
			expect(e.ordinal).to.equals(17)
			return;
		}

		expect.fail('should throw error')
	});
});