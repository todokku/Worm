from parse import parseSubCount, parseViewCount
import pandas as pd


class Channel:
    def __init__(self, name, link, country, subscribers, total_views, join_date, total_videos, category):  # noqa
        self.name = name
        self.link = link
        self.country = country
        self.subscribers = parseSubCount(subscribers)
        self.total_views = parseViewCount(total_views)
        self.join_date = join_date
        self.total_videos = int(total_videos)
        self.category = category

    def __str__(self):
        return self.name


class Channels:
    def __init__(self):
        self.channels = []
        self.names = []

    def addChannel(self, channel):
        self.channels.append(channel)
        self.names.append(channel.name)

    def __len__(self):
        return len(self.channels)

    # map names to other properties

    def toDict(self):
        channel_map = {}
        for channel in self.channels:
            channel_map[channel.name] = [channel.link,
                                         channel.country,
                                         channel.subscribers,
                                         channel.total_views,
                                         channel.join_date,
                                         channel.total_videos,
                                         channel.category
                                         ]
        return channel_map

    def toDataFrame(self):
        return pd.DataFrame.from_dict(
            self.toDict(),
            orient='index',
            columns=[
                'Links',
                'Countries',
                'Subscribers',
                'Total Views',
                'Join Dates',
                'Total Videos',
                'Categories'
            ]
        )
