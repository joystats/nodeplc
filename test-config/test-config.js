const _ = require('lodash')

let infom = [
{ m: "5526", ipaddr: "10.20.30.140", slot: 1 }, 
{ m: "5512", ipaddr: "10.20.30.141", slot: 2 }, 
{ m: "5528", ipaddr: "10.20.30.142", slot: 3 }, 
{ m: "5529", ipaddr: "10.20.30.143", slot: 4 }]

let ma = _.find(infom, (o) => { return o.m == "5512"; });
console.log(ma.m)
console.log(ma.ipaddr)
console.log(ma.slot)
