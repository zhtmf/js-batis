[![NPM Version][npm-version-image]][npm-url]
[![Node.js Version][node-image]][node-url]

# js-batis

## Table of Contents

- [Motivation](#motivation)
- [Install](#Install)
- [QuickStart](#QuickStart)
- [Database Configuration](#database-configuration)
  - [Configuration Options](#configuration-options)
  - [Supported Databases](#supported-databases)
  - [Multiple Data Sources](#multiple-data-sources)
- [Basic CRUD Operations](#basic-crud-operations)
  - [Template Engine](#template-engine)
  - [CRUD decorators](#crud-decorators)
- [The @Result decorator](#the-result-decorator)
  - [Disambiguation of different type of results](#disambiguation-of-different-type-of-results) 
  - [Handling nested results](#handling-nested-results) 
- [Transaction](#transaction)
  - [Nested Transaction](#nested-transaction)
  - [Inconsistent definition](#inconsistent-definition) 
- [Logging](#logging)
  - [Custom Logger](#custom-logger)
- [Additional Features](#additional-features)
  - [Camel case conversion](#camel-case-conversion)
  - [Automatic id-based sorting](#automatic-id-based-sorting)
  - [Disconnect from databases](#disconnect-from-databases)
- [Dependencies](#dependencies)
- [Guide For Running Test](#guide-for-running-test)
## Motivation
This library is initially designed to simulate the functionality of Java library [my-batis](https://mybatis.org/mybatis-3/) with some enhancements and intentional modifications.

It does not try to be an ORM library but acts as a lightweight abstract layer upon database driver libraries, much like what JDBC does in Java world. 

As I believe hand-written SQL queries always have best performance and maximum flexibility. What a library should do is to eliminate boiler-plate codes of different database driver libraries and provide a convenient way of constructing complex queries.

## Install
This is a [Node.js](https://nodejs.org/en/) module available through the [npm registry](https://www.npmjs.com/). 

Installation is done using
```sh
npm install js-batis
```
As this library utilizes [AsyncLocalStorage](https://nodejs.org/docs/latest-v16.x/api/async_context.html#class-asynclocalstorage) so at least Node.js ````13.10.0```` and preferably ````16.4.0```` or higher is required.

Though this library is not written in Typescript but a Typescript environment is necessary as it relies on [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html). So a compatible Typescript compiler should be installed in your project directory and use the following configuration to enable decorators:
````
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
````

## QuickStart
Given you have a MySQL instance running on your machine listening on ``3306`` and has a super user ``root`` identified  with the password ``root`` (please modify these configurations according to your local environment if there are any difference).

Create an empty project and put the following content in a file named ``tsconfig.json`` in the root directory:
````json
{
  "compilerOptions":{
    "target":"es6"
    ,"rootDir":"./"
    ,"noEmitOnError":true
    ,"module":"commonjs"
    ,"lib":["es6","dom"]
    ,"experimentalDecorators": true
    ,"emitDecoratorMetadata": true
  },
  "moduleResolution":"node"
}
````
Install this library and create the following ``demo.ts`` file:
````ts
const { Param, Select, Cleanup } = require('js-batis');
class InformationSchemaMapper {
  @Select(`
    SELECT
      TABLE_NAME,
      TABLE_TYPE,
      \`ENGINE\` 
    FROM
      information_schema.TABLES 
    {{#where}}
      {{#if type}}
        AND TABLE_TYPE = {{sql type}}
      {{/if}}
      {{#if engine}}
        AND \`ENGINE\` = {{sql engine}}
      {{/if}}
    {{/where}}
    {{#if limit}}
      LIMIT {{limit}}
    {{/if}}
  `)
  async queryTables(@Param("type") type: string
          , @Param("engine") engine: string
          , @Param("limit") limit: number): Promise<any[]> {
    return [];
  }
  @Cleanup()
  async destory() {}
}
let mapper = new InformationSchemaMapper();
mapper.queryTables('BASE TABLE', 'InnoDB', 10).then(function(res) {
  console.log(res);
  mapper.destory();
}).catch(function(e) {
  console.log(e);
  process.exit();
})
````
And finally execute the following one-liner:
````sh
npx cross-env BATIS_DB_host=127.0.0.1 BATIS_DB_port=3306 BATIS_DB_user=root BATIS_DB_password=root BATIS_DB_TYPE=mysql npx ts-node --project tsconfig.json demo.ts
````
A possible output would be:
````
>=== InformationSchemaMapper.queryTables statement:             SELECT                  TABLE_NAME,                     TABLE_TYPE,                     `ENGINE`                FROM                    information_schema.TABLES  WHERE TABLE_TYPE = ?                              AND `ENGINE` = ?                        LIMIT 10
>=== InformationSchemaMapper.queryTables parameters: BASE TABLE,InnoDB
<=== InformationSchemaMapper.queryTables result: 10 row(s)
[
  {
    TABLE_NAME: 'innodb_table_stats',
    TABLE_TYPE: 'BASE TABLE',
    ENGINE: 'InnoDB'
  },
  {
    TABLE_NAME: 'innodb_index_stats',
    TABLE_TYPE: 'BASE TABLE',
    ENGINE: 'InnoDB'
  },
  { TABLE_NAME: 'db', TABLE_TYPE: 'BASE TABLE', ENGINE: 'InnoDB' },
  { TABLE_NAME: 'user', TABLE_TYPE: 'BASE TABLE', ENGINE: 'InnoDB' },
  {
    TABLE_NAME: 'default_roles',
    TABLE_TYPE: 'BASE TABLE',
    ENGINE: 'InnoDB'
  },
  {
    TABLE_NAME: 'role_edges',
    TABLE_TYPE: 'BASE TABLE',
    ENGINE: 'InnoDB'
  },
  {
    TABLE_NAME: 'global_grants',
    TABLE_TYPE: 'BASE TABLE',
    ENGINE: 'InnoDB'
  },
  {
    TABLE_NAME: 'password_history',
    TABLE_TYPE: 'BASE TABLE',
    ENGINE: 'InnoDB'
  },
  { TABLE_NAME: 'func', TABLE_TYPE: 'BASE TABLE', ENGINE: 'InnoDB' },
  { TABLE_NAME: 'plugin', TABLE_TYPE: 'BASE TABLE', ENGINE: 'InnoDB' }
]
````
Hope this gives you an idea about how this library works. 

For busy people who start to write code after reading this quick start section, this library uses [HandleBars](https://www.npmjs.com/package/handlebars) under the hood for string templates.
## Database Configuration
This library does not need another dedicated "configuration file" but directly searches in ``process.env`` for database configuration. Environment variables can be set in command line as in the quick start section or through a separate ``.env`` file with a library like [dotenv](https://www.npmjs.com/package/dotenv).
### Configuration Options
Basically, names of variables used by this library take the following form:

``BATIS_DB_<DataSourceName_><VariableName>``

where ``DataSourceName_`` is optional. If this field is omitted, then this variable is considered to be part of the **default** datasource configuration. 

``DataSourceName``, ``VariableName`` and variable values are all **case sensitive**.

A ``TYPE`` variable is mandatory for the database type. Currently the value ``mysql`` is for MySQL database, ``pg`` is for PostgreSQL database and ``sqlite`` for SQLite.

Except for variables specific to this library (described in other sections) like ``TYPE``, other variables are passed **as-is** to the underlying database driver library. 

For example, the following is a valid configuration for a MySQL instance:
````
BATIS_DB_host=127.0.0.1
BATIS_DB_port=3306
BATIS_DB_user=root
BATIS_DB_password=root
BATIS_DB_database=sakila
BATIS_DB_TYPE=mysql
BATIS_DB_connectionLimit=10
````
Note that names like ``host`` and ``port`` are **not** standardized names and they happen to be called like this in the MySQL driver userd by this library.
### Supported Databases
Currently this library supports ``MySQL``, ``PostgreSQL`` and ``SQLite``. Support for other databases may be added in future releases.

For name and version of the underlying driver libraries please refer to the section [Dependencies](#dependencies).
### Multiple Data Sources
The feature of multiple data sources in the same application is supported by the ``@DataSource`` decorator. 

The only parameter of the decorator function is the data source name, as specified by the ``DataSourceName_`` field in envrionment variables. If this parameter is omitted, it defaults to the **default** data source.

It can be used either on **instance** methods or class definitions. As you may guess, declaration on class level applies to all methods in the same class and can be overriden by method level declarations, for example:
````ts
const { DataSource } = require('js-batis');
/*
 * by default all methods in this class queries the database defined by BATIS_DB_DS1_xxx=xxx variables
 * */
@DataSource("DS1")
class ExampleMapper{
  //but this method queries the default data source as defined by BATIS_DB_xxx=xxx variables
  @DataSource()
  @Select(`SELECT 1;`)
  async query(): Promise<any[]> {
    return [];
  }
}
````
## Basic CRUD Operations
The CRUD operations are supported also by decorators and they can only be used on instance methods. 

Under the hood, the  implementations of decorated methods will be replaced with real data base accessing codes so users only need to supply a "dummy" implementation like ``return {}`` or ``return []`` to satisfy the compiler.

As accessing to database is asynchronous, so the decorated methods should **always** return a ``Promise`` and optionally be marked as ``async``. The compiler will not complain if you forget to do this but at runtime this will very probably results in errors.
### Template Engine
A string template engine for constructing dynamic SQL is a must in Java which has very weak multi-line string and string interpolation support but also in JavaScript as I found Template Literals are still not good enough for this purpose.

Under the hood this library use a specific version of [HandleBars](https://www.npmjs.com/package/handlebars).  And additionally this library defines some custom helpers for common use cases of dynamic SQL:
- for: a simplified loop structure. In its body you can refer to ``item`` and ``index`` for each item in the iterable and index of current iteration respectively. And it also removes trailing comma. 
  For example, given ``array`` is ``["a", "b", "c"]``, the following template:
  ````
  {{#for array}}
    {{index}}-{{item}},
  {{/for}}
  ````
   evaluates to be ``(0-a,1-b,2-c)``.
 - where: represents the ``WHERE`` clause in SQL statements. It automatically removes preceding ``and`` (case insensitive) key word and eliminates the need to write dummy conditions like ``1=1`` at the beginning.
   For example, the following template:
   ````
   {{#where}}
     and a = 1
     and b = 2
   {{/where}}
   ````
   evaluates to be ``WHERE a=name1 and b = name1``.
 - $: A drawback of handlebars is that it can only dereference variable or object properties but cannot even evaluate simple statements like ``1+2``. This dollar helper evaluates (**using ``eval``**) a string in the current context and return its result.
   For example, given ``object`` is an object ``{name1: "name1"}`` and ``index`` is ``2``, the following template:
   ````
   {{$ 'object.name1.substring(0,3) + "abc" + index/2'}}
   ````
   evaluates to ``nameabc1``.
   Also this library adopts the pattern that all custom helpers beginning with ``$`` receive a string and use ``eval`` to evaluate its value, rather than leaving the evaluation to handlebars.
 - $if: An advanced version of the original ``if`` helper. It recieves a string and evaluates its value for the conditional rendering.
 - $trim: trims a specific value (coerced to a string, case insensitive) from the start and end of its body content.
   For example, the following template:
   ````
   {{#$trim 'UNION ALL'}}a from t1 UNION ALL b from t2 UNION ALL{{/$trim}}
   ````
   evaluates to ``a from t1 UNION ALL b from t2``.
 - sql: It is used to escape and insert a value into SQL string. It stands for a placeholder for SQL parameters and prevents SQL injection. 
   The escaping is done by underlying database driver library.
   There must be a correcponding ``@Param()`` declaration on one of the method parameters to make it work.
   For example, the following template:
   ````sql
   select 
     cola,colb 
   from table1 
   where 
     cola = {{sql name1}} 
   and colb = {{sql index}} 
   and colc = {{sql filter}}
   ````
   declares a query with three parameters ``name1``, ``index`` and ``filter``. And there must be ``@Param("name1")``, ``@Param("index")`` and ``@Param("filter")`` on method parameters to make it work properly as most database drivers complain about inserting ``undefined`` in SQL queries.

This library supports reusable SQL snippets through ``partials`` in handlebars. At runtime, this library will search for an object  property named ``partials`` and treat all properties of it as reusable partials.

For example, the following definition reuses the same template for both count and query statements:
````ts
class ExampleMapper{
  private partials = {
    list: `
      SELECT
        {{#if count }}
          count(1) as cnt
        {{/if}}
        {{#unless count }}
          cola, colb, colc
        {{/unless}}
      FROM
        table
      {{#unless count }}
        limit {{pageSize}} offset {{$ '(pageNumber - 1) * pageSize'}}
      {{/unless}}
    `
  };
  @Select(`{{> list}}`)
  async list(@Param("pageNumber") pageNumber: number
           , @Param("pageSize") pageSize: number): Promise<any[]> {
    return [];
  }
  @SelectOne(`{{> list count=true}}`)
  async count(): Promise<number> {
    return 0;
  }
}
````
### CRUD decorators
There are 5 basic decorators for database operations and they all receive a single parameter as the SQL string template: 

- @Select: select **multiple** rows. Always returns an array.
- @SelectOne: select a **single** row. It will throw an error if the query returns multiple rows. 
  Always returns a non-array scalar value.
- @Update: for updates. It returns an integer represents count of updated rows ("affected rows") returned from underlying database driver. Always returns an integer.
  It does **not** check whether the query is really an update and in most cases it will not throw an error but return 0 instead.
- @Insert: for insertions. It will return the auto generated key from the underlying database driver or, when no key is generated, return count of inserted rows instead. Note that for some databases like MySQL this is automatic but for others like PostgreSQL returning generated keys relies on manually adding a ``RETURNING`` statement in the query. 
  It lways returns an integer.
- @Delete: an alias for update. It is provided in case some people argue that using ``update`` for ``delete``s is not semantically right. It always returns an integer.

Note that these decorators have implications about their return value and it is your reponsibility to declare methods accordingly. For example, if a method decorated by @Update is declared to be returning ``Promise<any[]>`` then this will cause inconsistency between compiler and runtime type checking as @Update will replace its implementation with a method returning ``Promise<number>``. 

``@Param`` is for passing method arguments to SQL string templates and its single parameter is a string for name of parameter. Unlike the equivalent in MyBatis, the sole parameter **cannot** be omitted and must be a non-empty string as we cannot get parameter name in Typescript.

It is an error to decorate two parameters from the same method using same ``@Param`` declarations.

Undecorated method parameters will still be passed to SQL templates with the name ``arg<N>`` where ``N`` is its index in parameter list of method declaration.

For example, the following definition:
````
@Select(`...`)
async queryEmployee(
            @Param("name") name : string
          , @Param("employeeTitle") title : string
          , @Param("salary") salary: number
          , deptId : number) : Promise<any[]>{
     return [];
}
````
will at runtime make those 4 arguments be passed to the template engine as ``name``, ``employeeTitle``, ``salary`` and ``arg3``.

## The @Result decorator
Currently this library returns all results from the underlying database driver as-is without any type conversions. But it is still necessary to have a dedicated place for defining properties of the query result. 

The ``@Result`` decorator is exactly for this purpose. It is also decorated on instance methods and work together with basic CRUD decorators for delivering the final result.

It receives a single parameter which should be an object containing properties or child objects for various types of definitions of the query result, which we will discuss below.

### Disambiguation of different type of results
Suppose you have a table named ``film`` with only 1 column named ``title``, containing only 1 row of a string ``film title``. And you are about to run the following query:
````
select * from film
````
then I would argue that any sane database library should distinguish between the following possible outcomes:
Result A:
````json
[
   {
    "title":"film title"
   }
]
````
Result B:
````json
[
   "film title"
]
````
Result C:
````json
{
   "title":"film title"
}
````
Result D:
````json
"film title"
````
In this library it is done by using ``list`` and ``scalar`` properties. As their names imply, ``list`` is for wrapping the final result in an array, even a single object is converted to an array of length 1. While ``scalar`` does the opposite: if the result is an array of length 1, the first element is extracted from it. And if the single object has only one property, that property is again extracted and returns that scalar value instead.

For example, given the database definition as above, in the following definition:
````ts
class FilmMapper{
  @Select("select * from film")
  @Result({list:true,scalar:false})
  async queryA() : Promise<any>{return {};}
  @Select("select * from film")
  @Result({list:true,scalar:true})
  async queryB() : Promise<any>{return {};}
  @Select("select * from film")
  @Result({list:false,scalar:false})
  async queryC() : Promise<any>{return {};}
  @Select("select * from film")
  @Result({list:false,scalar:true})
  async queryD() : Promise<any>{return {};}
}
````
The method ``queryA``, ``queryB``, ``queryC`` and ``queryD`` will return Result A, Result B, Result C and Result D as shown above respectively.

As you may guess, ``@Select`` and ``@SelectOne`` are implemented using ``@Result``. ``@Select`` is the shorthand for specifying ``list:true,scalar:true`` and ``@SelectOne`` is the shorthand for specifying ``list:false,scalar:true``. When you want to manually specify values for ``list`` and ``scalar``, just use ``@Select`` for the database operation as default values will be overridden by what contained in ``@Result``.
### Handling nested results
Nested results are produced by joins when two database entities associate with each other in one-to-one or one-to-many relationship and should be represented as objects holding another object or array of objects as its properties.

In this library this is defined using ``sub``,  ``prefix``, ``list`` and ``id`` properties in ``@Result`` objects.

Consider the following example query:
````sql
SELECT
  f.film_id,
  f.film_title,
  f.release_year AS extra_release_year,
  f.category AS extra_cat,
  l.language_id AS lang_id,
  l.`name` AS lang_name 
FROM
  film f
  LEFT JOIN film_language fl ON f.film_id = fl.film_id
  LEFT JOIN `language` l ON fl.language_id = l.language_id 
ORDER BY
  f.film_id ASC,
  l.language_id ASC
````
which joins three tables (two entities actually) ``film``, ``film_language`` and ``language``. 

And it produces the following result set in my test database:
````
+---------+------------+--------------------+-----------+---------+-----------+
| film_id | film_title | extra_release_year | extra_cat | lang_id | lang_name |
+---------+------------+--------------------+-----------+---------+-----------+
|       1 | Film1      |               1001 | category1 |       1 | Language1 |
|       1 | Film1      |               1001 | category1 |       2 | Language2 |
|       2 | Film2      |               1002 | category1 |       1 | Language1 |
|       2 | Film2      |               1002 | category1 |       3 | Language3 |
|       3 | Film3      |               1003 | category2 |       2 | Language2 |
|       3 | Film3      |               1003 | category2 |       3 | Language3 |
+---------+------------+--------------------+-----------+---------+-----------+
````

If we want to store ``release_year`` and ``category`` in a separate object contained in a ``film`` object and in turn make them contain a list of languages, we can use the following ``@Result`` definition:

````ts
@Result({
    id: "film_id",
    sub: {
      "extra_info": {
        prefix: "extra_",
        list: false,
        sub: {
          "languages": {
            id: "id",
            prefix: "lang_",
            list: true
          }
        }
      }
    }
  })
````

The ``sub`` property is for defining child objects holding by the current ``@Result`` object. Every properties in it should be another ``@Result`` object. And ``sub`` objects can contain their own ``sub`` property. In this way you can define deeply nested results. 

In the definition above, ``release_year`` and ``category`` are stored in an object named ``extra_info`` in each film object and film language objects are stored in an array named ``languages``.

The ``prefix`` property is a mandatory field in definitions of child objects. As the result of a SQL query is a flat table, we need to distinguish between columns for the top level object and those for the child objects by prefixing columns for child objects with some unique value.

As what is shown above, columns prefixed with ``extra_`` are for the "extra_info" object and columns prefixed with ``lang_`` are for film language objects.

The ``list`` property is used here for distinguishing one-to-one and one-to-many relationships. From the definition above we know that every film has a single ``extra_info`` nested object but every ``extra_info`` object has an array of film language objects.

The ``id`` property is for name of the unique key column in the current set of columns. It is not mandatory but if it is absent, all rows in the current result set are considered distinct objects and the final result may not be what you want. 

It is OK to omit ``id`` for plain queries but for joins you should add an ``id`` in each  ``@Result`` object.

The ``id: "film_id"`` declaration in the example above instructs the library correctly aggregates the first row with the second row, the third with the fourth and the last two rows.

And the final result is like the following:
````json
[{
  "film_id": 1,
  "film_title": "Film1",
  "extra_info": {
    "release_year": 1001,
    "cat": "category1",
    "languages": [
      { "id": 1, "name": "Language1" },
      { "id": 2, "name": "Language2" },
    ]
  },
},
{
  "film_id": 2,
  "film_title": "Film2",
  "extra_info": {
    "release_year": 1002,
    "cat": "category1",
    "languages": [
      { "id": 1, "name": "Language1" },
      { "id": 3, "name": "Language3" },
    ]
  },
},
{
  "film_id": 3,
  "film_title": "Film3",
  "extra_info": {
    "release_year": 1003,
    "cat": "category2",
    "languages": [
      { "id": 2, "name": "Language2" },
      { "id": 3, "name": "Language3" },
    ]
  },
}]
````
## Transaction
Transaction is supported through the ``@Transactional`` decorator using ``AsyncLocalStorage``. 

It receives two parameters, the first one is a string representing the transaction level which takes the value ``SERIALIZABLE``, ``REPEATABLE READ``, ``READ COMMITTED`` or ``READ UNCOMMITTED``; The second one is the timeout of transaction in **seconds**.

It can only be used to decorate instance methods but not classes. It is meant to be used on methods of "service" classes which in turn calls methods decorated by CRUD decorators. 

It automatically uses the data source as specified by ``@DataSource`` decorator on the method or on the enclosing class and fallbacks to the default data source if no such decorators are present. 

Transactions are committed if the method it decorates completes normally and are rolled back if the method throws an error. For this purpose it also assumes the decorated method is async and returns a promise.
### Nested Transaction
It is not an error for a transactional method for data source A calling another transactional method for data source B, like in the following example:
````ts
@Transactional("READ COMMITTED")
async method1(): Promise<void> {
  await update1();
  await method2();
  await update2();
}

@Update("...")
async update1(): Promise<void> {
  //omitted
}

@Update("...")
async update2(): Promise<void> {
  //omitted
}

@DataSource("DS1")
@Transactional()
async method2(): Promise<void> {
  //omitted
}
````
Obviously ``method1`` , ``update1`` and ``update2`` are associated with the default data source while ``method2`` is associated with the data source ``DS1``. When method1 calls method2, this library will not create a new async context nor throw an error but start a new transaction for data source ``DS1``. 

If method2 completes normally, the "nested" transaction will commit by itself no matter ``update2`` executes sucessfully or not. But if method2 throws an error, the outer transaction on method1 **will** be rolled back.
### Inconsistent Definition
But it **is** an error calling another non-transactional method associated with a different data source, as in the following example:
````ts
@Transactional("READ COMMITTED")
async method1(): Promise<void> {
  await update1();
}

@Update("...")
@DataSource("DS1")
async update1(): Promise<void> {
  //omitted
}
````
As ``update1`` is associated with another data source from that of ``method1`` and it is not transactional, calling to update1 inside method1 will result in an error.
## Logging
This library does not create its own logging implementation but relies on existing logging libraries.

Logging implementation for a specific data source is specified by ``BATIS_DB_<DataSourceName_>LOGGER`` environment variable. Its value takes the following case **insensitive** values:
- winston: Use [winston](https://www.npmjs.com/package/winston).
- log4js: Use [log4js](https://www.npmjs.com/package/log4js).
- loglevel: Use [loglevel](https://www.npmjs.com/package/loglevel).
- none: disable logging.

And by default, when this environment variable is not specified, this library falls back to ``console.log`` for logging.

This library does not prefer one logging implementation to another. If the environment variable exists and its value is not ``none`` and this library failed to initiate the logger, either because there is an error or the value is not in the list above, it immediately falls back to ``console.log`` without searching for other possible implementations.

There is another environment ``BATIS_DB_<DataSourceName_>LEVEL`` which controls the logging level. If it is absent, it defaults to the ``info`` (or ``INFO`` for some libraries) level, otherwise it is passed as-is to underlying logging library.

In the logging message, this library will print the class name and the method name together with SQL statements.
### Custom Logger
Instead of making the library create a new logger object, users can also configure and provide with their own logger instance. Be sure to create a logger with the same name of that data source or under the name contained in the exported variable ``DEFAULT_CATEGORRY_NAME`` for the default data source **before** any decorator functions from this library are executed.

For example in the following example, two winston loggers for the default data source and data source ``DS1`` are configured and instantiated manually:
````ts
import { DEFAULT_CATEGORRY_NAME, Select, DataSource } from "js-batis"
import winston from 'winston';

winston.loggers.add(DEFAULT_CATEGORRY_NAME, {
  transports: [
    new winston.transports.Console()
  ]
});

winston.loggers.add("DS1", {
  transports: [
    new winston.transports.Console()
  ]
});

//then you can safely use @Select
````
## Additional Features
### Camel case conversion
By setting the ``BATIS_DB_<DataSourceName_>CAMELCASE`` environment variable to ``true``.  This library will automatically converts column names (properties names in the final output actually) from snake case to camel case. This does not affect the names used in ``@Result`` objects.

### Automatic id-based sorting
Consider the result set we saw in [Handling nested results](#handling-nested-results) , if the SQL lacks ``order by`` clauses and records are inserted randomly into the table. The database may return results not sorted according to their id.

For example if the result set is like:
````
+---------+------------+--------------------+-----------+---------+-----------+
| film_id | film_title | extra_release_year | extra_cat | lang_id | lang_name |
+---------+------------+--------------------+-----------+---------+-----------+
|       3 | Film3      |               1003 | category2 |       3 | Language3 |
|       1 | Film1      |               1001 | category1 |       1 | Language1 |
|       2 | Film2      |               1002 | category1 |       1 | Language1 |
|       1 | Film1      |               1001 | category1 |       2 | Language2 |
|       2 | Film2      |               1002 | category1 |       3 | Language3 |
|       3 | Film3      |               1003 | category2 |       2 | Language2 |
+---------+------------+--------------------+-----------+---------+-----------+
````
And we still use the ``@Result`` object as mentioned above. You may think this library will iterates result rows in this order and mistakenly return 6 objects as any two adjacent rows have different ``film_id``. But this is not the case.

As long as an ``id`` is present in the ``@Result`` object, this library will sort the rows again before processing them, grouping rows with same id together while preserving their relative order as in the original result set. In practice the result set above will be sorted as:
````
+---------+------------+--------------------+-----------+---------+-----------+
| film_id | film_title | extra_release_year | extra_cat | lang_id | lang_name |
+---------+------------+--------------------+-----------+---------+-----------+
|       3 | Film3      |               1003 | category2 |       3 | Language3 |
|       3 | Film3      |               1003 | category2 |       2 | Language2 |
|       1 | Film1      |               1001 | category1 |       1 | Language1 |
|       1 | Film1      |               1001 | category1 |       2 | Language2 |
|       2 | Film2      |               1002 | category1 |       1 | Language1 |
|       2 | Film2      |               1002 | category1 |       3 | Language3 |
+---------+------------+--------------------+-----------+---------+-----------+
````
And now the aggregation logic will correctly aggregates them into 3 objects.
### Disconnect from databases
The ``@Cleanup`` decorator can be used to decorate a method for globally disconnecting from and destroying all data sources. It receives no parameter and it can be used on instance or static methods.

It does not relate with specific ``@DataSource`` or ``@Transactional`` and you can decorate on any method you see fit.

## Dependencies
This library depends on ``handlebars`` and the version of it is fixed to ``4.7.7``.

It does not declare any logging library or database driver library as its production dependency. Instead it ``require``s them dynamically at runtime when necessary.

For ``MySQL`` this library uses [mysql2](https://www.npmjs.com/package/mysql2).
For ``PostgreSQL`` this library uses [pg](https://www.npmjs.com/package/pg).
For ``SQLite`` this library uses [sqlite3](https://www.npmjs.com/package/sqlite3).

## Guide For Running Test
Since this is a library about database and SQL, it definitely needs to be tested against various databases and test cases cannot be run without external dependencies. 

By default you should have the following database setup on your machine in order to run the test:
- A MySQL instance listening on port ``3306`` and has a user named ``root`` identified by the password ``root``.
- A PostgreSQL instance listening on port ``5431`` and has a user named ``postgres`` identified by the password ``postgres``.
- Your user account has the privilege to create, read and update file in the project directory, which is necessary for creating a SQLite database file.

The user account specified in the list above should have the privilege to create database and tables, execute queries and stored procedures.

If your local environment is different from those in the above list, you should modify configurations in various .env.* file under the ``test`` directory (number of such files may be reduced in future releases).

Then for ``MySQL`` and ``PostgreSQL`` databases, execute the SQL script ``mysql.sql`` and ``pg.sql`` respectively for table structure and data.

Then execute ``npm run test`` for test cases or ``npm run coverage`` for testing and a coverage output generated by [nyc](https://www.npmjs.com/package/nyc).

As you can see from the output, the ``ts-mocha`` program is repeatedly invoked and executed for every test case. This is because there are some global status, such as logger definitions and database configurations, which cannot be shared by different test cases and they must be run in separate processes.

If you see the error message ``find: missing argument to -exec`` in your terminal, please run ``npm run test2`` or ``npm run coverage2`` instead, as some terminals require escaping the final semi-colon.

