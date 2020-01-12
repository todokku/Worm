from bs4 import BeautifulSoup, NavigableString
import pandas as pd
import requests
import re
from time import sleep
from channel import Channel
from channel import Channels

# special indexs from beautifulsoup
PAGESTART = 1
PAGEEND = 1009
SUCCESS = 200
ITEMS_INDEX = 1
NAME_INDEX = 1
COUNTRY_INDEX = 3
CATEGORY_INDEX = 3
LINK_INDEX = 6
INFO_INDEX = 8
SUBSCRIBER_COUNT_INDEX = 0
VIEW_COUNT_INDEX = 4
DATE_JOINED_INDEX = 6
VIDEO_COUNT_INDEX = 2

channels = Channels()
for page in range(PAGESTART, PAGEEND):
    url = "https://www.channelcrawler.com/eng/results/9048"
    if (page > 1):
        url = "https://www.channelcrawler.com/eng/results/9048/page:%s" % str(
            page)
    page = requests.get(url)
    if(page.status_code == SUCCESS):
        soup = BeautifulSoup(page.content, 'html.parser',
                             from_encoding='UTF-8')
        juice = soup.find_all('div',
                              class_='channel col-xs-12 col-sm-4 col-lg-3'
                              )
        print("New page %s\n" % str(page))
        for div in juice:
            items = div.contents
            # h4 tag
            name = items[ITEMS_INDEX].contents[NAME_INDEX]['title']
            country = items[ITEMS_INDEX].contents[COUNTRY_INDEX]['title']
            # small tag
            category = items[CATEGORY_INDEX].string
            # a tag
            link = items[LINK_INDEX ]['href']
            # p tag
            p_contents = items[INFO_INDEX].contents[1].contents
            lookup = re.compile(r"\S+")
            subscriber_count = lookup.search(p_contents[SUBSCRIBER_COUNT_INDEX]).group(0)
            view_count = lookup.search(p_contents[VIEW_COUNT_INDEX]).group(0)
            date_joined = "".join(
                [p_contents[DATE_JOINED_INDEX].string[match.start(0):match.end(0)]+' ' for i, match in enumerate(  # noqa
                    (list(lookup.finditer(p_contents[DATE_JOINED_INDEX])))) if i in [2, 3, 4]
                ]
            )
            video_count = lookup.search(p_contents[VIDEO_COUNT_INDEX]).group(0)
            channel = Channel(name,
                              link,
                              country,
                              subscriber_count,
                              view_count,
                              date_joined,
                              video_count,
                              category
                              )
            channels.addChannel(channel)
        print("Collected juice, current length %s" % str(len(channels)))
        df = channels.toDataFrame()
        print("Writing to file...")
        df.to_excel("data.xlsx", na_rep="Null")
        sleep(2)
