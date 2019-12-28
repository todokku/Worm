from bs4 import BeautifulSoup, NavigableString
import pandas as pd
import requests
import re
from time import sleep
from channel import Channel
from channel import Channels


channels = Channels()
for page in range(1, 1009):
    url = "https://www.channelcrawler.com/eng/results/9048"
    if (page > 1):
        url = "https://www.channelcrawler.com/eng/results/9048/page:%s" % str(
            page)
    page = requests.get(url)
    if(page.status_code == 200):
        soup = BeautifulSoup(page.content, 'html.parser',
                             from_encoding='UTF-8')
        juice = soup.find_all('div',
                              class_='channel col-xs-12 col-sm-4 col-lg-3'
                              )
        print("New page %s\n" % str(page))
        for div in juice:
            items = div.contents
            # h4 tag
            name = items[1].contents[1]['title']
            country = items[1].contents[3]['title']
            # small tag
            category = items[3].string
            # a tag
            link = items[6]['href']
            # p tag
            p_contents = items[8].contents[1].contents
            lookup = re.compile(r"\S+")
            subscriber_count = lookup.search(p_contents[0]).group(0)
            view_count = lookup.search(p_contents[4]).group(0)
            date_joined = "".join(
                [p_contents[6].string[match.start(0):match.end(0)]+' ' for i, match in enumerate(  # noqa
                    (list(lookup.finditer(p_contents[6])))) if i in [2, 3, 4]
                ]
            )
            video_count = lookup.search(p_contents[2]).group(0)
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
