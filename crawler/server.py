import pandas as pd
import re
import os
import googleapiclient
import googleapiclient.discovery
import json
from time import sleep

# pylint: disable=no-member
KEY = ''
YOUTUBE_API_SERVICE_NAME = 'youtube'
YOUTUBE_API_VERSION = 'v3'


def main():
    youtube = googleapiclient.discovery.build(
        YOUTUBE_API_SERVICE_NAME,
        YOUTUBE_API_VERSION,
        developerKey=KEY
    )
    # read excel data
    data = pd.read_excel('fetchcheckpoint/data.xlsx',
                         sheet_name='Mexico (Transfer)')
    data.dropna(subset=['Creator Name'], inplace=True)

    # start at row following stop
    with open('fetchcheckpoint/index.txt', 'r') as f:
        start = int(f.read()) + 1
        f.close()
    with open('fetchcheckpoint/dump.json', 'r') as f:
        juice = json.load(f)
        f.close()
    # get links and id of the most recent uploaded video
    for link in data['Link'][start:]:
        try:
            print(link)
            channel_id = link.split('/')[4]
            playlist_req = youtube.channels().list(
                part="contentDetails",
                id=channel_id
            ).execute()
            # get uploads playlist
            try:
                playlistid = playlist_req['items'][0]['contentDetails']['relatedPlaylists']['uploads']
                vid_req = youtube.playlistItems().list(
                    part='snippet',
                    playlistId=playlistid
                ).execute()
            except IndexError:
                print('playlist index err')
            try:
                # get video link
                vid_id = vid_req['items'][0]['snippet']['resourceId']['videoId']
                vid_link = f'https://www.youtube.com/watch?v={vid_id}'
                # add to collection
                juice.update({channel_id: vid_link})
                sleep(1)
                print(f'Collected juice, length {len(juice)}')
                print('At index %s' % {str(
                    data.loc[data['Link'] == f'http://www.youtube.com/channel/{channel_id}'].index[0])})
                # save stopping location and aggregate data
                with open('fetchcheckpoint/index.txt', 'w') as f:
                    f.write(str(
                        data.loc[data['Link'] == f'http://www.youtube.com/channel/{channel_id}'].index[0]))
                    f.close()
                with open('fetchcheckpoint/dump.json', 'w') as f:
                    json.dump(juice, f)
                    f.close()
            except IndexError:
                print('vid index err')
        except TypeError:
            print('link err')


if __name__ == '__main__':
    main()
