import gevent
from gevent import monkey
monkey.patch_all()
import json
import requests
import time
from bs4 import BeautifulSoup as BS
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from pymongo import ReplaceOne
from datetime import datetime

LOGINKEY = "<hidden for github>"

class State():
    def __init__(self):
        self.fetched_pages_ctr_global = 0
        self.global_updates = []
    def getUpdates(self):
        return self.global_updates
    def getNumPages(self):
        return self.fetched_pages_ctr_global
    def fetchedOnePg(self):
        self.fetched_pages_ctr_global += 1
    def addUpdates(self, update):
        self.global_updates.append(update)

class timer():
    def __init__(self, mark="default", report=False):
        self.time = None
        self.mark = mark
        self.report = report
    def reset(self):
        self.time = time.time()
    def elapsed(self):
        cur_time = time.time()
        if self.report:
            print("[{}] time elapsed: {}".format(self.mark, cur_time-self.time))

def dateFormat(date):
    slist = date.split("-")
    y = slist[0]
    m = int(slist[1])
    d = int(slist[2])
    if m < 10:
        m = "0" + str(m)
    if d < 10:
        d = "0" + str(d)
    return "{}-{}-{}".format(y, m ,d)

def fetchPage(url):
    TIMEOUT = 1.
    HDR = {
        'User-agent' : 'neutrinoliu/prevPost_spider'
    }
    try:
        res = requests.get(url=url, headers=HDR, timeout=TIMEOUT)
        if res.status_code == 503:
            return None
    except:
        return None
    return res

def main(event, context):
    with open("target.json", "r") as tf:
        config = json.load(tf)
    GROUPS = config["groups"]
    MAX_PAGE = config["max_page"]
    UPDATE = config["update"]
    print("- fetching {}, max_page {}, with update flag {}".format(GROUPS, MAX_PAGE, UPDATE))

    SLEEP = .5
    CONCURRENT = 5
    CATEGORY = "group"


    def extract(res, myState: State):
        def getId(path):
            return path.split("/")[-1]
        dom = BS(res.content,features="html.parser")
        topics = dom.select('tr.topic')
        if topics == None or len(topics) == 0:
            return False
        for t in topics:
            subject = t.find('td', {"class":'subject'})
            id = getId(subject.find('a').attrs['href'])
            title = subject.text
            author = t.attrs['data-item-user']
            lastpost = t.find('td', {"class":'lastpost'}).text
            myState.addUpdates(ReplaceOne(
                {
                    "id": int(id),
                },
                {
                    "id": int(id),
                    "type": CATEGORY,
                    "tag": TAG,
                    "title": title,
                    "poster": author,
                    "lastpost": dateFormat(lastpost),
                }, upsert=True))
        
        return True
        

    URL = "mongodb+srv://neutrino:{}@bgmposts.amrllog.mongodb.net/?retryWrites=true&w=majority".format(LOGINKEY)
    client = MongoClient(URL, server_api=ServerApi('1'))
                            
    try:
        client.admin.command('ping')
        print("Connection Established")
    except Exception as e:
        print(e)
        return("Connection Fails, function aborts at ", datetime.now().strftime("%d/%m/%Y %H:%M:%S"))

    myCollection = client['topics']['group_topics']
    totalTimer = timer("total", report=False)

    for TAG in GROUPS:
        print("- start fetching <{}>".format(TAG))
        URL_PREFIX = "https://bgm.tv/group/" + TAG + "/forum?page="

        myState = State()
        all_pages = [URL_PREFIX + str(tid+1) for tid in range(MAX_PAGE)]

        while len(all_pages) > 0:
            failed_urls = []
            nIters = int(len(all_pages)/CONCURRENT) + 1

            def process(url, myState: State):
                res = fetchPage(url)
                if res: # when not timeout or 503
                    myState.fetchedOnePg()
                    return extract(res, myState) # early stop if page has no tr.topic element
                else:
                    failed_urls.append(url)
                    return True

            totalTimer.reset()
            for gId in range(nIters):
                jobs = [gevent.spawn(process, url, myState) for url in all_pages[gId * CONCURRENT: min(len(all_pages), (gId+1) * CONCURRENT)]]
                gevent.joinall(jobs)
                continue_flag = True
                for j in jobs:
                    continue_flag = continue_flag and j.value
                if not continue_flag:
                    break
                time.sleep(SLEEP)
            totalTimer.elapsed()
            all_pages = failed_urls
            print("fetched {} pages, timeout {}".format(myState.getNumPages(), len(failed_urls)))
        #print("uploading total {} documents".format(len(myState.getUpdates())))
        ret = myCollection.bulk_write(myState.getUpdates())
        print("{} documents modified, {} documents upserted".format(ret.modified_count, ret.upserted_count))
    return("run succeed at " + datetime.now().strftime("%d/%m/%Y %H:%M:%S"))

# match the input of google cloud function
main(None, None)
