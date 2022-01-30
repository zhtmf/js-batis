require('custom-env').env('test1', 'test')
import { assert, expect, should } from 'chai'
import { Param, Select, SelectOne, Execute, Insert, Update, Delete, Result, DataSource, Transactional } from "../../index"

class Mapper1 {

   @Select(`call js_batis_test_db.\`test_procedure1\`({{sql title}},{{sql id}})`)
   async callProcedure1(@Param("title", false) title: string, @Param("id", true) id: any): Promise<any> {
   }

   @Select(`call js_batis_test_db.\`test_procedure2\`({{sql title}},{{sql id1}},{{sql id2}})`)
   async callProcedure2(@Param("title", false) title: string, @Param("id1", true) id1: any, @Param("id2", true) id2: any): Promise<any> {
   }

   @Select(`call js_batis_test_db.\`test_procedure3\`({{sql title}})`)
   async callProcedure3(@Param("title") title: string): Promise<any> {
   }

   @Select(`call js_batis_test_db.\`test_procedure4\`(concat({{sql title}},"'??","\\\"",'"'))`)
   async callProcedure4(@Param("title") title: string): Promise<any> {
   }

   @Select(`call js_batis_test_db.\`test_procedure2\`({{sql arg0}},{{sql id1}},{{sql id2}})`)
   async callProcedure2X(title: string, @Param("id1", true) id1: any, @Param("id2", true) id2: any): Promise<any> {
   }

   // \t abc "" \" \\
   // "abc???\\tabc???\"\"\\\""
   // 'abc???\\tabc???\'\'\\\''
   @Select(`call js_batis_test_db.\`test_procedure2\`(concat("a???\\ta???""\\"\\\\",'a???\\ta???''\\''),{{sql id1}},{{sql id2}})`)
   async callProcedure2X2(@Param("id1", true) id1: any, @Param("id2", true) id2: any): Promise<any> {
   }

   @Select(`call js_batis_test_db.\`test_procedure5\`()`)
   @Result({ list: false })
   async callProcedure5(): Promise<any> {
   }

   @Select(`call js_batis_test_db.test_procedure6({{sql arg1}},{{sql arg2}},{{sql arg3}},{{sql arg4}})`)
   async callProcedure6(@Param("arg1") arg1, @Param("arg2", true) arg2, @Param("arg3", true) arg3, @Param("arg4", true) arg4): Promise<any> {

   }
}

let mapper1 = new Mapper1();

class Service {
   @Transactional("READ COMMITTED", 3)
   async callProcedure2X2() {
      return await mapper1.callProcedure2X2(0, 1);
   }
}

describe("mysql-sp", function() {

   it("call stored procedure with out parameter", async () => {
      let rows = await mapper1.callProcedure1('Film1', 0);
      expect(rows[0]).to.be.equals('?Film1@');
   });

   it("call stored procedure with multiple out parameters", async () => {
      let rows = await mapper1.callProcedure2('xxxxx', 0, 0);
      expect(rows[0].id1).to.be.equals(5);
      expect(rows[0].id2).to.be.equals(10);
   });

   it("call stored procedure with single return value/no out parameter", async () => {
      let rows = await mapper1.callProcedure3('abc');
      expect(rows[0]).to.be.equals('?abc@');
   });

   it("call stored procedure with multiple return values/no out parameter", async () => {
      let rows = await mapper1.callProcedure4('???title???');
      expect(rows[0]["concat('?',title,'@')"]).to.be.equals('????title???\'??""@', JSON.stringify(rows[0]));
      expect(rows[0]["514"]).to.be.equals(514);

      rows = await new Service().callProcedure2X2();
      expect(rows[0].id1).to.be.equals(23);
      expect(rows[0].id2).to.be.equals(28);
   });

   it("call stored procedure with parameter not decorated with @Param", async () => {
      let rows = await mapper1.callProcedure2X('???title???', 0, 1);
      expect(rows[0].id1).to.be.equals(11);
      expect(rows[0].id2).to.be.equals(16);
   });

   it("call stored procedure with out parameter and special characters in string literal", async () => {
      let rows = await mapper1.callProcedure2X2(0, 1);
      expect(rows[0].id1).to.be.equals(23);
      expect(rows[0].id2).to.be.equals(28);
   });

   it("call stored procedure with no return value", async () => {
      let rows = await mapper1.callProcedure5();
      expect(rows).to.be.equals(undefined);
   });

   it("inout parameter", async () => {
      let rows = await mapper1.callProcedure6(3, 4, 'abcdef', 5);
      expect(rows.length).to.be.equals(1);
      expect(rows[0]['arg4']).to.be.equals(13);
   });

   it("null inout parameter", async () => {
      let rows = await mapper1.callProcedure6(3, 4, null, 5);
      expect(rows.length).to.be.equals(1);
      expect(rows[0]['arg4']).to.be.equals(7);
   });

   it("undefined inout parameter", async () => {
      let rows = await mapper1.callProcedure6(3, 4, undefined, 5);
      expect(rows.length).to.be.equals(1);
      expect(rows[0]['arg4']).to.be.equals(7);
   });
});