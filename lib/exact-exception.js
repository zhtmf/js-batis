
class ExactException{
	constructor(site,ordinal,msg){
		this.site = site;
		this.ordinal = ordinal;
		this.msg = msg;
	}
	toString(){
		return `ExactException[site:${this.site},ordinal:${this.ordinal},msg:${this.msg}`;
	}
}

module.exports = ExactException;