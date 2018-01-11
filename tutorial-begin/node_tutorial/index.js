var http = require('http');

http.get("http://www.google.com",function(response){
    var body = '';
    response.on('data',function(chunk){
        console.log("======================\n");
        console.log("\n" + chunk)
        console.log("======================\n");
        body += chunk;
    })

    response.on('end',function(){
       // console.log(body);
    })
});