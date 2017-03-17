var http = require('http'),
    url = require('url'),
    fs = require('fs'),
    mime = require('mime');
function readBook(callback) {
    fs.readFile('./book.json', function (err, data) {
        if (err || data == '') {
            data = '[]';
        }
        data = JSON.parse(data);
        callback(data)
    })
}
function writeBook(data, callback) {
    fs.writeFile('./book.json', JSON.stringify(data), callback)
}
http.createServer(function (req, res) {
    var objUrl = url.parse(req.url, true),
        pathname = objUrl.pathname;
    if (pathname == '/') {
        res.setHeader('content-type', 'text/html');
        fs.createReadStream('./index.html').pipe(res);
    }
    if (/^\/book(\/\d+)?$/.test(pathname)) {
        var id = /^\/book(\/\d+)?$/.exec(pathname)[1];
        switch (req.method) {
            case 'GET':
                if (id) {
                    id = id.slice(1);
                    readBook(function (data) {
                        var book = data.find(function (item) {
                            return item.id == id;
                        });
                        res.end(JSON.stringify(book))
                    })
                } else {
                    readBook(function (data) {
                        res.end(JSON.stringify(data))
                    })
                }
                break;
            case 'POST':
                var str = '';
                req.on('data', function (data) {
                    str += data;
                });
                req.on('end', function () {
                    var book = JSON.parse(str);
                    readBook(function (data) {
                        book.id = data.length ? data[data.length - 1].id + 1 : 1;
                        data.push(book);
                        writeBook(data, function () {
                            res.end(JSON.stringify(book))
                        })
                    })
                });
                break;
            case 'PUT':
                if (id) {
                    id = id.slice(1);
                    var str = '';
                    req.on('data', function (data) {
                        str += data;
                    });
                    req.on('end', function () {
                        var book = JSON.parse(str);
                        readBook(function (data) {
                           data= data.map(function (item) {
                                if(item.id==id){
                                    return book
                                }
                                return item
                            });
                            writeBook(data,function () {
                                res.end(JSON.stringify(book))
                            })
                        })
                    });
                }
                break;
            case 'DELETE':
                if (id) {
                    id = id.slice(1);
                    readBook(function (data) {
                        data = data.filter(function (item) {
                            return item.id != id;
                        });
                        writeBook(data, function () {
                            res.end(JSON.stringify({}))
                        })
                    })
                }
                break;
        }
    } else {
        fs.exists('.' + pathname, function (flag) {
            if (flag) {
                res.setHeader('content-type', mime.lookup(pathname));
                fs.createReadStream('.' + pathname).pipe(res);
            } else {
                res.statusCode = 404;
                res.end();
            }
        })
    }
}).listen(8088);