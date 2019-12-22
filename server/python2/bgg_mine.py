import SimpleHTTPServer
import SocketServer
import BaseHTTPServer
from os import curdir, sep
import requests
from lxml import html
import urlparse
import json
import sys, traceback, os

import pdb

class RequestHandler(BaseHTTPServer.BaseHTTPRequestHandler):
    '''Handle HTTP requests by returning a fixed 'page'.'''

    staticPath = '../../client/'


    # Handle a GET request.
    def do_GET(self):
        path = self.path
        
        parsed = urlparse.urlparse(path)
        print parsed  # DEBUG
        path = parsed.path
    
        
        if path == '/':
            path = '/index.html'
            
        if path == '/bgg':
            mimetype = "application/json"            
            text = self.getBGGData(parsed)
        elif path.startswith('/bgg/boardgames/'):
            mimetype= 'text/xml'
            text = self.getBGGXMLAPI(parsed)
        else:
            f = open(curdir + sep + RequestHandler.staticPath + path);
            text = f.read();
            f.close();
        
        if path.endswith(".html"):
            mimetype='text/html'
        if path.endswith(".js"):
            mimetype='application/javascript'
        if path.endswith(".css"):
            mimetype='text/css'
        if path.endswith(".jpg"):
            mimetype = 'image/jpg'
        if path.endswith(".gif"):
            mimetype = 'image/gif'
        if path.endswith(".ico"):
            mimetype = 'image/gif'
        
        self.send_response(200)
        self.send_header("Content-Type", mimetype)
        # self.send_header("Content-Length", f.size)
        self.end_headers()
        self.wfile.write(text)
        
        return
    
    def getBGGXMLAPI(self, parsed):
        print "Get XMLAPI"
        
        parts = parsed.path.split('/');
        ids = parts[-1];
        
        r = requests.get(url = 'http://www.boardgamegeek.com/xmlapi/boardgame/' + ids)
        # pdb.set_trace()
        print r.content
        return r.text.encode('utf8')
    
    
    def getBGGData(self, parsed):
        print "Getting BGG Data"
        
        qs = urlparse.parse_qs(parsed.query)
        keys = qs.keys()
        if 'page' in keys:
            page = qs['page'][0] 
        else:
            page = '1'
        if 'xpath' in keys:
            xpath = qs['xpath'][0]
        else:
            xpath = '//table[@id="collectionitems"]//tr[@id="row_"]//td[@class="collection_thumbnail"]//a/@href'
        
        r = requests.get(url = 'http://www.boardgamegeek.com/browse/boardgame/page/' + page)
        # pdb.set_trace()
        tree = html.fromstring(r.content)
        table = tree.xpath(xpath)
        # table = tree.xpath('//table[@id="collectionitems"]')
        
        print table
        return json.dumps(table)


try: 
    PORT = 8080
    Handler = RequestHandler


    httpd = SocketServer.TCPServer(("", PORT), Handler) 

    print "serving at port", PORT
    httpd.serve_forever()

except KeyboardInterrupt:
    print '^C received'
    httpd.socket.close();

except Exception as e:
    print '-'*60
    traceback.extract_exc(file= sys.stdout)
    print '-'*60
    httpd.socket.close();